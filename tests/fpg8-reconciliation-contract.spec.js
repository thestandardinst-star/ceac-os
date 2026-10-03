import { test, expect } from "@playwright/test";
import {
  normalizePersonName,
  classifyOrganisationText,
  matchIdentity,
  buildReconciliationPlan,
} from "../scripts/final-product/fpg8-reconciliation.mjs";

test("FPG8 normalises honorifics without changing identity words", () => {
  expect(normalizePersonName("Ps. Sample Person")).toBe("sample person");
  expect(normalizePersonName("Bro. Example-Name")).toBe("example name");
});

test("FPG8 maps approved organisation terms without turning programmes or responsibilities into departments", () => {
  const liveUnits = [
    "PFCC",
    "Cell Ministry",
    "Church Ministry",
    "Administration & HR",
    "Media and Technical",
    "OFTGP Secretariat",
    "Facility, Procurement and Logistics",
    "First Timers and Salvation",
    "Ministry Material",
    "Programs",
    "Welfare",
    "Foundation School",
    "Partnership",
    "Sacrament and Ceremonies",
  ];

  const result = classifyOrganisationText(
    "Media, Technical, Staff Development, Leadership Academy, Healing Streams, Model Church PFCC, OFGP-Action Manger, Complaince",
    liveUnits
  );

  expect(result.units).toEqual(expect.arrayContaining([
    "Media and Technical",
    "Staff Development",
    "PFCC",
    "OFTGP Secretariat",
    "Compliance",
  ]));
  expect(result.units).not.toContain("Leadership Academy");
  expect(result.units).not.toContain("Healing Streams");
  expect(result.units).not.toContain("Model Church");
  expect(result.units).not.toContain("OFGP Action Manager");

  expect(result.contexts).toEqual(expect.arrayContaining([
    { type: "programme", label: "Leadership Academy" },
    { type: "programme", label: "Healing Streams" },
    { type: "branch_responsibility", label: "Model Church" },
    { type: "role_responsibility", label: "OFGP Action Manager" },
  ]));
  expect(result.approvedNewUnits).toEqual(expect.arrayContaining(["Staff Development", "Compliance"]));
});

test("FPG8 identity matching prefers exact names and only flags possible surname collisions for review", () => {
  const profiles = [
    { id: "1", full_name: "Example Person" },
    { id: "2", full_name: "Different Person" },
    { id: "3", full_name: "Another Worker" },
  ];

  expect(matchIdentity("Ps. Example Person", profiles)).toMatchObject({ status: "exact" });
  expect(matchIdentity("Alternate Person", profiles)).toMatchObject({ status: "possible_duplicate" });
  expect(matchIdentity("No Match", profiles)).toEqual({ status: "unmatched", matches: [] });
});

test("FPG8 dry run never derives authority from job-title wording and never enables production apply", () => {
  const plan = buildReconciliationPlan({
    sourceRows: [
      {
        name: "Sample Existing",
        department: "Technical & Staff Development",
        position: "Manager",
        email: "",
      },
      {
        name: "Sample New",
        department: "Leadership Academy",
        position: "Supervisor",
        email: "",
      },
    ],
    productionProfiles: [{ id: "profile-existing", full_name: "Sample Existing" }],
    liveUnits: [{ name: "Media and Technical" }],
  });

  expect(plan.applyAllowed).toBe(false);
  expect(plan.rows[0].identityStatus).toBe("exact");
  expect(plan.rows[0].authAction).toBe("reconcile_existing");
  expect(plan.rows[0].authorityAction).toBe("no_automatic_authority_change");
  expect(plan.rows[0].sourcePositionContext).toBe("Manager");
  expect(plan.rows[0].approvedNewUnits).toContain("Staff Development");

  expect(plan.rows[1].authAction).toBe("roster_only");
  expect(plan.rows[1].authorityAction).toBe("no_automatic_authority_change");
  expect(plan.rows[1].blockers).toEqual(expect.arrayContaining([
    "missing_real_email",
    "primary_office_unit_unresolved",
  ]));
  expect(plan.summary.proposedInvitationsNow).toBe(0);
});
