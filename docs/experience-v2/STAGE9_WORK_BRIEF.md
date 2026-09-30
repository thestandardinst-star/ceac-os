# CEAC OS Experience V2 — Stage 9 Work Brief

Date: 27 September 2026
Status: ACTIVE
Stage: 9 — Keystone Quality Gate and System Ratification

## 1. Purpose

Stage 9 ratifies the four accepted Experience V2 keystones as one coherent system before redesign work propagates to operational screen families.

This is a quality-gate and hardening stage, not a new feature stage.

Keystones under review:
- Staff Today — accepted implementation `69eb0ca509f9b15047e4277667ea3016150b726e`;
- Manager Overview — accepted implementation `da586a16d6aacd7101879928a97b6f3b53e05956`;
- Administration Overview — accepted implementation `1e55846f9f65f084f850efc2dae57bd0e1ef6f63`;
- Executive Overview — accepted implementation `6b555613bde7f2d9b257f9c417af1cc11514a81a`.

Stage 9 does not reopen those keystones generically. It may change an accepted keystone only when current exact-head evidence identifies a concrete cross-keystone defect.

## 2. Canonical entry state

Stage 9 starts from exact branch HEAD:
`21f1c18ba1f1c1fa149accebdc598ce6b3168af9`.

At entry:
- PR #72 is OPEN, DRAFT and mergeable;
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Complete Quality Gate PASS on the successful third attempt of run `36314474308`, 179 passed;
- PR #71 remains frozen;
- Stage 13 Payroll remains blocked pending confirmed CEAC payroll rules;
- Chat is the sole active writer.

The first two attempts of Quality Gate run `36314474308` intermittently failed the existing Stage 6 Workload planning-capacity visibility scenario. The third attempt passed on the exact same HEAD without any product or test change. Stage 9 treats that as an unresolved reliability defect until root-caused and hardened.

## 3. Binding Stage 9 audit

The canonical sequence requires:
- side-by-side screenshot review of all four keystones;
- typography audit;
- icon audit;
- spacing/geometry audit;
- responsive audit;
- information-density audit;
- accessibility/focus audit;
- performance check;
- cross-role consistency review;
- product-owner review.

If evidence finds a defect, fix the lowest correct shared or local layer. Do not propagate a known defect into Stage 10.

## 4. Exact-head visual evidence reviewed at entry

Exact-head Quality Gate artifact:
- workflow run `36314474308`;
- artifact `redesign-r7-product-inspection`;
- artifact ID `10931055910`;
- exact HEAD `21f1c18ba1f1c1fa149accebdc598ce6b3168af9`.

Reviewed keystone evidence covers:
- 320px phone;
- approximately 390×844 phone;
- 1366×768 laptop;
- 1440×900 desktop.

The four laptop keystones are visually coherent as one system while retaining role character. First-viewport 390px evidence is also coherent.

## 5. Confirmed Stage 9 defects at entry

### S9-01 — Manager populated decision row collapses at 320px

Exact-head 320px Manager Overview evidence shows a populated “Needs your decision” row compressed into an unnecessarily narrow text track with a large dead gap between the icon and copy.

This is a real responsive composition defect. It is not to be fixed by shrinking text.

Likely correction boundary:
- `src/experience-v2/manager-overview/manager-overview.css`;
- only expand to component code if inspection proves the defect is shared.

Acceptance:
- populated Manager decision row reads naturally at 320, 390, 1366 and 1440;
- action buttons wrap/stack deliberately;
- 12px operational text floor remains intact;
- no page-level horizontal overflow;
- no regression to Staff, Administration or Executive.

### S9-02 — Stage 6 Workload acceptance is intermittently non-deterministic

On the final Stage 8 documentation-only HEAD, the Stage 6 Workload test twice failed while waiting for the newly recorded planning-capacity reason after reload, then passed on the exact same HEAD on the third run.

This is not considered resolved merely because a retry passed.

Stage 9 must:
- inspect write → confirmation → refresh → reload sequencing;
- distinguish application persistence/read-state instability from test synchronization;
- fix the actual cause;
- preserve the assertion that the recorded reason survives reload and remains visible in planning-capacity history.

Prohibited “fixes”:
- increasing the timeout without evidence;
- adding test retries;
- skipping the scenario;
- weakening or removing the persisted-history assertion.

## 6. Protected boundaries

Do not change:
- database schema or migrations unless a proven Stage 9 defect truly requires it;
- RLS/RPC/auth/session authority;
- protected HR boundaries;
- no-score/no-ranking rules;
- data ownership or auditability;
- frozen PR #71;
- Stage 13 Payroll policy;
- accepted visual baselines except where an intentional, directly inspected Stage 9 correction genuinely changes that role’s accepted image.

No invented data. No new global parity stylesheet. No increase in the `!important` ceiling. No third icon language.

## 7. Stage 9 verification plan

For each correction:
1. make the smallest correct change;
2. add or strengthen deterministic regression coverage where needed;
3. run relevant focused checks;
4. run full exact-head CI, Migration Replay, Account Security and Quality Gate;
5. verify Vercel exact-head deployment;
6. inspect all four keystones again at required phone/laptop/desktop widths;
7. compare against the persistent CEAC and quality references;
8. persist exact-head evidence;
9. obtain product-owner acceptance before Stage 10.

## 8. Exit gate

Stage 9 is complete only when:
- all known Stage 9 defects are resolved or explicitly accepted by the product owner with rationale;
- exact-head engineering gates are green;
- the Workload persistence scenario is deterministic without retry/timeout weakening;
- all four keystones pass cross-role visual, responsive, typography, icon, density, accessibility/focus and performance review;
- product owner accepts the keystone quality direction.

Do not start Stage 10 before this gate is satisfied.
