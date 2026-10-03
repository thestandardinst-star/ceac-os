const TITLE_PREFIX = /^(ps|pst|pastor|bro|brother|sis|sister)\.?\s+/i;

export function normalizePersonName(value) {
  return String(value || "")
    .trim()
    .replace(TITLE_PREFIX, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTerm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TERM_RULES = [
  { test: /\bpartnership\b/, unit: "Partnership" },
  { test: /\bcell ministry\b/, unit: "Cell Ministry" },
  { test: /\bstaff chapl(?:aincy|iancy)\b/, unit: "Staff Chaplaincy", approvedNewUnit: true },
  { test: /\bstaff development\b/, unit: "Staff Development", approvedNewUnit: true },
  { test: /\bchurch ministry\b/, unit: "Church Ministry" },
  { test: /\bsacrament\b/, unit: "Sacrament and Ceremonies" },
  { test: /\bcompl(?:iance|aince)\b/, unit: "Compliance", approvedNewUnit: true },
  { test: /\badministration\b.*\bhr\b/, unit: "Administration & HR" },
  { test: /\bmedia\b/, unit: "Media and Technical" },
  { test: /\btechnical(?: support)?\b/, unit: "Media and Technical" },
  { test: /\boverall group pfcc\b|\bpfcc\b/, unit: "PFCC" },
  { test: /\bleadership academy\b/, context: { type: "programme", label: "Leadership Academy" } },
  { test: /\bhealing streams\b/, context: { type: "programme", label: "Healing Streams" } },
  { test: /\bfacility\b/, unit: "Facility, Procurement and Logistics" },
  { test: /\bfirst timers?\b/, unit: "First Timers and Salvation" },
  { test: /\bministry materials?\b/, unit: "Ministry Material" },
  { test: /\bprograms?\b/, unit: "Programs" },
  { test: /\bmodel church\b/, unit: "PFCC", context: { type: "branch_responsibility", label: "Model Church" } },
  { test: /\bwonder church\b/, unit: "PFCC", context: { type: "branch_responsibility", label: "Wonder Church" } },
  { test: /\bofgp\b.*\baction\b.*\bman(?:ager|ger)\b/, unit: "OFTGP Secretariat", context: { type: "role_responsibility", label: "OFGP Action Manager" } },
  { test: /\bwelfare\b/, unit: "Welfare" },
  { test: /\bfoundation school\b/, unit: "Foundation School" },
];

export function classifyOrganisationText(value, liveUnitNames = []) {
  const normalized = normalizeTerm(value);
  const units = [];
  const contexts = [];
  const approvedNewUnits = [];
  const live = new Set((liveUnitNames || []).map(normalizeTerm));

  for (const rule of TERM_RULES) {
    if (!rule.test.test(normalized)) continue;
    if (rule.unit && !units.includes(rule.unit)) units.push(rule.unit);
    if (rule.context && !contexts.some((item) => item.type === rule.context.type && item.label === rule.context.label)) {
      contexts.push(rule.context);
    }
    if (rule.approvedNewUnit && rule.unit && !live.has(normalizeTerm(rule.unit)) && !approvedNewUnits.includes(rule.unit)) {
      approvedNewUnits.push(rule.unit);
    }
  }

  return { units, contexts, approvedNewUnits };
}

function surname(value) {
  const tokens = normalizePersonName(value).split(" ").filter(Boolean);
  return tokens.length ? tokens[tokens.length - 1] : "";
}

export function matchIdentity(sourceName, productionProfiles = []) {
  const normalized = normalizePersonName(sourceName);
  const exact = productionProfiles.filter((profile) => normalizePersonName(profile.full_name) === normalized);
  if (exact.length === 1) return { status: "exact", matches: exact };
  if (exact.length > 1) return { status: "ambiguous_exact", matches: exact };

  const sourceSurname = surname(sourceName);
  const possible = sourceSurname.length >= 4
    ? productionProfiles.filter((profile) => surname(profile.full_name) === sourceSurname)
    : [];

  if (possible.length) return { status: "possible_duplicate", matches: possible };
  return { status: "unmatched", matches: [] };
}

export function buildReconciliationPlan({ sourceRows = [], productionProfiles = [], liveUnits = [] } = {}) {
  const liveUnitNames = liveUnits.map((unit) => typeof unit === "string" ? unit : unit.name).filter(Boolean);
  const rows = sourceRows.map((source, index) => {
    const identity = matchIdentity(source.name, productionProfiles);
    const org = classifyOrganisationText(source.department, liveUnitNames);
    const sourceEmail = String(source.email || "").trim().toLowerCase();
    const blockers = [];

    if (!sourceEmail) blockers.push("missing_real_email");
    if (identity.status === "possible_duplicate" || identity.status === "ambiguous_exact") blockers.push("identity_review");
    if (!org.units.length) blockers.push("primary_office_unit_unresolved");
    if (org.approvedNewUnits.length) blockers.push("new_unit_review");

    const authAction =
      identity.status === "exact" ? "reconcile_existing" :
      identity.status === "possible_duplicate" || identity.status === "ambiguous_exact" ? "hold_for_identity_review" :
      sourceEmail ? "eligible_for_invitation_after_review" : "roster_only";

    return {
      sourceIndex: index + 1,
      identityStatus: identity.status,
      matchedProfileIds: identity.matches.map((profile) => profile.id).filter(Boolean),
      proposedUnitMemberships: org.units,
      programmeAndResponsibilityContext: org.contexts,
      approvedNewUnits: org.approvedNewUnits,
      sourceHasEmail: Boolean(sourceEmail),
      authAction,
      authorityAction: "no_automatic_authority_change",
      sourcePositionContext: String(source.position || "").trim() || null,
      blockers,
      readyForReviewedApply: blockers.length === 0,
    };
  });

  const approvedNewUnits = [...new Set(rows.flatMap((row) => row.approvedNewUnits))];
  return {
    rows,
    summary: {
      sourceRows: rows.length,
      exactMatches: rows.filter((row) => row.identityStatus === "exact").length,
      possibleDuplicates: rows.filter((row) => row.identityStatus === "possible_duplicate" || row.identityStatus === "ambiguous_exact").length,
      unmatched: rows.filter((row) => row.identityStatus === "unmatched").length,
      sourceRowsWithEmail: rows.filter((row) => row.sourceHasEmail).length,
      proposedInvitationsNow: rows.filter((row) => row.authAction === "eligible_for_invitation_after_review" && row.readyForReviewedApply).length,
      approvedNewUnits,
      blockedRows: rows.filter((row) => row.blockers.length).length,
    },
    applyAllowed: false,
    applyReason: "Dry run only. Production mutation requires a reviewed apply step outside this module.",
  };
}
