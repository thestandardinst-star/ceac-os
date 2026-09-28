# CEAC OS Experience V2 — Stage 10 Family G Work Brief

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: G — My Hub / Account
Substage: 10G1 — Audit and contract
Status: AUDIT COMPLETE — IMPLEMENTATION CONTRACT

## 1. Purpose

Family G turns the existing personal/account surfaces into one coherent Experience V2 personal workspace without moving authority away from the domain systems that already own workforce, performance, learning, assets, compliance or account security.

Binding Family G scope from `IMPLEMENTATION_SEQUENCE.md`:
- profile;
- leave;
- development;
- learning;
- assets/compliance;
- account activity.

The family is a personal workspace over existing authoritative contracts. It is not a new employee database, a second workforce module, a second learning system, a second compliance system or a new security authority layer.

## 2. Current route and role inventory

### My Hub

Shell destination:
- key: `me`;
- label: `My Hub`;
- group: Account;
- available in Staff, Manager, Administration and Executive shell navigation.

App rendering:
- My Hub is the default personal fallback surface rendered by `src/screens/Me.jsx`;
- all four roles can reach it;
- Staff/Manager receive links to personal domain views where the existing route contract permits them;
- Administration/Executive do not receive Staff/Manager-only domain links from My Hub.

Current My Hub content:
- work history link;
- development link for non-Admin/non-Executive roles;
- Time & Leave link for non-Admin/non-Executive roles;
- Learning link for non-Admin/non-Executive roles;
- Equipment link for non-Admin/non-Executive roles;
- Policies & requirements link for non-Admin/non-Executive roles;
- private personal goals/reminders;
- personal leave requests and supported balance display;
- ordinary personal profile/employment display and self-edit action;
- sign-out action.

### Your account

Shell destination:
- key: `account`;
- label: `Your account`;
- group: Account;
- available in Staff, Manager, Administration and Executive shell navigation.

App rendering:
- explicit `tab === "account"` route;
- renders `src/screens/AccountActivity.jsx`;
- all roles use the same self-only account surface.

Current account content:
- signed-in sessions returned by `my_sessions()`;
- recent self-related audit activity returned by `my_account_activity(50)`;
- current-device marker;
- self-visible session IP/device/timestamps;
- local sign-out;
- global sign-out with confirmation;
- phishing/account-safety guidance.

## 3. Existing data and mutation contracts

### Profile / ordinary personal details

Reads:
- `profiles` ordinary fields;
- `profile_personal_details`.

Self mutation:
- `update_my_personal_details(...)` RPC.

Protected rule:
- employees may change only the explicitly approved ordinary self-service fields;
- official employment/access fields remain Administration-owned;
- self changes are attributable through personal-detail history;
- protected HR information remains outside ordinary profile details.

Protected HR remains separate:
- Ghana Card;
- SSNIT;
- tax;
- banking;
- contracts;
- payslips;
- private documents.

Family G must not move those records into My Hub ordinary profile state.

### Personal goals and reminders

Tables:
- `personal_goals`;
- `goal_steps`;
- `personal_reminders`.

Ownership:
- owner-only RLS;
- personal goals are private to the person;
- they are not CEAC report inputs.

Family G may redesign the personal presentation but must not convert goals into employee performance evidence or management scoring.

### Leave

My Hub reads:
- own `leave_requests`;
- active `leave_policy_versions`;
- matching `leave_policy_rules`.

Self actions:
- request through `workforce_request_leave`;
- cancel through `workforce_leave_action` using the existing employee cancellation action.

Accepted Family D remains authoritative for:
- schedule/work-session context;
- decision routes;
- Manager/Admin approval authority;
- correction history;
- workforce administration.

Family G must not recreate Manager/Admin leave decision controls inside My Hub.

Balance truth:
- My Hub may calculate a remaining balance only when the confirmed rule is explicit and supported by the existing safe calculation contract;
- missing, incomplete, unsupported accrual/carry-over/opening-balance information remains unavailable;
- legacy seeded defaults are not policy.

### Development

Authoritative implementation:
- `src/screens/Performance.jsx`;
- Stage 7 Performance & Development contract.

Personal rights preserved:
- employee can see own review/evidence;
- employee can record/revise own reflection through the established append-only contract;
- manager narrative is visible according to the existing contract;
- employee can add right of reply;
- development-plan history remains visible;
- continuous feedback responses remain attributable.

No score/rating/ranking/potential inference is permitted.

Manager reviewer authority and organisation-scoped `performance.admin` remain outside My Hub personal authority.

### Learning

Authoritative implementation:
- `src/screens/Learning.jsx`;
- Stage 8 Learning contract.

Personal rights preserved:
- published catalogue access;
- own assignments;
- own module completion through `learning_complete_module`;
- own current/historical completion records.

Manager team-learning visibility and `learning.manage` administration remain domain authority, not My Hub authority.

No learning, skill, competence, potential or performance score may be inferred.

### Assets

Authoritative implementation:
- `src/screens/Assets.jsx`;
- Stage 10 Assets & Devices enterprise contract.

Personal context:
- non-managers of the asset domain see assets within their authorised custody scope;
- My Hub describes CEAC equipment currently in the person's custody and recorded custody history.

Management authority:
- inventory/custody/lifecycle mutation remains gated by `asset.manage`;
- My Hub must not introduce create, assign, transfer, return, repair, warranty or retire authority.

No ownership is inferred from mere visibility or a historical record.

### Compliance

Authoritative implementation:
- `src/screens/Compliance.jsx`;
- Stage 11 Compliance enterprise contract.

Personal actions already supported by the domain contract:
- acknowledge an applicable policy;
- submit/revise own evidence through the reviewed RPC;
- request own exception.

Management authority:
- policy publishing/revision/retirement;
- evidence review;
- exception decision;
- organisation-wide compliance management
remain behind the existing `compliance.manage` and managed-scope contracts.

No employee compliance score or inferred compliance status is permitted beyond authoritative policy/evidence/exception records.

### Account activity

RPCs:
- `my_sessions()`;
- `my_account_activity(p_limit)`.

Security contract:
- both bind identity to `auth.uid()`;
- no caller-supplied target person exists;
- anonymous/public execution is revoked;
- only authenticated users may execute;
- account activity includes self-acted or self-subject audit events;
- session information is self-only.

Auth actions:
- local sign-out ends the current device session;
- global sign-out ends all sessions and requires destructive confirmation in the UI.

Family G must not add another-person session inspection, session termination authority, password visibility or account impersonation.

## 4. Current product/presentation audit

### What is already correct

- My Hub and Your account are distinct destinations with distinct purposes.
- My Hub is personal/productivity context; Your account is security/session context.
- private goals/reminders are correctly separated from organisational reporting.
- leave balances already refuse to invent unsupported policy math.
- protected HR boundary is explicitly explained.
- Development, Learning, Assets and Compliance link to established authoritative domain surfaces instead of duplicating their underlying systems.
- Account Activity uses self-only RPCs and explicit global sign-out confirmation.
- the Experience V2 shell already provides My Hub/Your account navigation for every role.

### Presentation debt

My Hub currently mixes V2 shell quality with legacy page primitives/classes:
- `staff-page-intro`;
- `personal-entry-stack`;
- legacy `btn`, `Sheet`, `info-row`, `quiet-empty` and related personal-page geometry.

The current desktop surface is usable but its internal visual language is less consistent than accepted Stage 10 families:
- six large destination cards dominate before the person's immediate private context;
- goals/leave/personal tabs and internal section hierarchy use legacy personal-page geometry;
- loading is not presented as a deliberate Family G state while personal datasets resolve;
- the sequential load path can collapse the whole page onto the first dataset error rather than identifying the affected personal dataset.

Account Activity is almost entirely legacy presentation:
- legacy `row`, `card`, `flag`, `pill` and inline styles;
- no shared Family G page/state primitives;
- current `load()` handles the sessions RPC error explicitly but does not independently surface a `my_account_activity` RPC error.

These are product/presentation defects to correct without changing database authority.

## 5. Ownership boundaries

Family G owns:
- personal workspace composition;
- ordinary self profile presentation/editing;
- private goals/reminders presentation;
- personal leave request/balance presentation inside My Hub;
- personal entry/navigation into development, learning, equipment and compliance;
- personal/self mode presentation where a Family G substage explicitly migrates that mode;
- account session/activity presentation and self sign-out controls.

Family G does NOT own:
- Manager/Admin workforce decision authority;
- workforce policy administration;
- Performance Administration or reviewer authority;
- Learning Administration/course assignment authority;
- asset inventory/custody/lifecycle administration;
- compliance policy/review/decision administration;
- protected HR administration;
- organisation audit browsing;
- authentication provider configuration.

Do not duplicate those controls into My Hub.

## 6. Exact Family G substage sequence

### 10G1 — Audit and contract

This document.

Exit:
- actual routes/data/security/product debt mapped;
- exact substages persisted;
- no product code changed.

### 10G2 — My Hub foundation, profile, private goals and reminders

Work:
- establish shared Experience V2 personal-family primitives;
- migrate `src/screens/Me.jsx` core composition;
- preserve profile reads and `update_my_personal_details`;
- preserve protected-HR boundary;
- preserve owner-only goals/reminders;
- improve loading/error/empty/busy/success states;
- keep domain destination cards purposeful and responsive;
- do not change domain/security contracts.

### 10G3 — Personal leave in My Hub

Work:
- migrate the My Hub Leave area only;
- preserve `workforce_request_leave` and employee cancellation path;
- preserve existing confirmed-policy truth rules;
- preserve missing/unconfigured balance semantics;
- keep Manager/Admin leave decisions in accepted Family D;
- keep deep link to personal Time & Leave context rather than copying Workforce history.

### 10G4 — Personal development

Work:
- migrate the employee/self experience of Performance & Development into the Family G visual language;
- preserve evidence-first, append-only reflection/right-of-reply/development history;
- preserve reviewer/Admin authority exactly;
- no score/rating/ranking/potential inference;
- do not redesign non-personal reviewer/Administration authority beyond what is necessary to keep the shared screen coherent.

### 10G5 — Personal learning

Work:
- migrate personal learning/own assignment/catalogue/history experience into the Family G visual language;
- preserve own-module completion RPC and factual completion;
- preserve Manager team view and Learning Administration authority;
- no skill/competence/potential/performance inference.

### 10G6 — Personal assets and compliance

Work:
- migrate self/custody and personal compliance presentation into the Family G visual language;
- preserve asset `asset.manage` mutation boundary;
- preserve compliance acknowledgement/evidence/exception self actions;
- preserve Manager/Administration domain authority;
- no inferred ownership or compliance score.

### 10G7 — Account activity and session security

Work:
- migrate `AccountActivity.jsx` to the Family G/V2 presentation;
- preserve `my_sessions()` and `my_account_activity()` exactly;
- preserve local/global sign-out semantics and destructive confirmation;
- show sessions-RPC and activity-RPC failures truthfully and independently;
- preserve self-only privacy.

### 10G8 — Family G final acceptance

Work:
- verify My Hub + account as one coherent personal family across authorised roles;
- verify links into personal domain contexts preserve authority;
- run complete Family G Level B;
- inspect exact-head evidence;
- record final family acceptance before Family H begins.

## 7. Verification requirements

Use `VERIFICATION_PROTOCOL.md`.

Implementation commits:
- Level A affected-scope verification.

Every substage acceptance boundary:
- Level B complete acceptance gate;
- exact-head evidence inspection;
- acceptance record/checkpoint.

Documentation-only 10G1 may use the documentation fast path because it changes no application code and immediately follows an already accepted Level B application state.

Required viewport evidence for redesigned Family G surfaces:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- representative intermediate/tablet width;
- 1366×768;
- 1440×900 or larger.

Required states as applicable:
- loading;
- empty;
- populated;
- partial/unconfigured;
- error/dataset error;
- busy/submitting;
- success;
- destructive confirmation;
- long names/content;
- permission-limited;
- mobile/laptop/large desktop.

## 8. Protected acceptance rules

Family G must preserve:
- RLS;
- RPC authority;
- auth/session boundaries;
- capability grants;
- privacy boundaries;
- attributable history;
- append-only/versioned history where defined;
- protected HR separation;
- owner-only personal goals/reminders;
- accepted Family D leave/workforce authority;
- existing Performance, Learning, Assets and Compliance domain authority.

Do not:
- invent leave entitlement;
- silently show missing balances as zero;
- infer employee scores or rankings;
- infer learning skill/competence;
- infer asset ownership;
- infer compliance;
- expose another person's account sessions/activity;
- add schema/migration/RLS/RPC/auth/capability changes without a separately proven defect.

## 9. 10G1 exit decision

The audit found no CEAC business-rule or security ambiguity requiring owner input.

10G1 is ready for documentation verification.

After its documentation checkpoint is green:
- mark 10G1 ACCEPTED AND COMPLETE;
- open 10G2 — My Hub foundation, profile, private goals and reminders;
- begin 10G2 implementation immediately.
