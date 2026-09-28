# CEAC OS Experience V2 — Stage 10 Family E Finance Work Brief

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: E — Finance
Substage: 10E1 — audit and contract
Status: LOCKED FOR IMPLEMENTATION

## Entry state

Family D — Time & Leave / Workforce is accepted and complete.

Family E opens from exact-green Family D documentation head:

`f9cf9ddb3264d0b0c192cab3b1fc673575890db7`

Entry-head status:
- CI PASS — run `36391568514`;
- Migration Replay PASS — run `36391568558`;
- Account Security PASS — run `36391568593`;
- Complete Quality Gate PASS — run `36391568547` (#1013);
- Vercel PASS.

PR #72 remains OPEN + DRAFT.
PR #71 remains OPEN + DRAFT + FROZEN at `bf068f32958134319ea32ecf833748879a163fd2`.
Stage 13 Payroll remains blocked pending confirmed CEAC payroll rules.

## Scope

Family E migrates the existing Finance presentation into Experience V2 without changing the established finance authority model.

Covered surfaces:
- Manager Finance;
- Finance-handler Manager context;
- Administration Finance;
- Executive Finance;
- shared finance request / decision / fulfilment queue;
- factual request, expense, budget, transfer and currency contexts.

Not in Family E:
- new bank integrations;
- exchange-rate conversion;
- payroll or salary;
- forecasting;
- predictive finance scoring;
- invented cash/bank balance;
- new chart capability beyond existing factual presentation;
- schema/RLS/RPC/auth changes unless a separate proven defect requires them.

Stage 11 remains responsible for the dedicated chart/data-visualisation pass after operational families are complete.

## Canonical finance behaviour to preserve

### Currency truthfulness

Currencies remain separate.

Do not:
- convert currencies;
- add unlike currencies together;
- present recorded in minus out as a bank balance;
- infer opening balances or unrecorded activity;
- treat missing budget as zero.

### Manager / managed-unit authority

The Stage 10 sequence phrase “Manager finance read-only” does **not** remove accepted Manager workflows.

The accepted product already proves:
- Managers may submit finance requests for their own unit;
- Managers may append actual spend for units they manage;
- Managers may inspect factual operating and budget position for their own unit;
- Managers may inspect their visible project, transfer and request context;
- a Manager belonging to a unit marked `handles_finance` may act as the explicit Finance authority where the configured request path requires it and may fulfil approved requests.

Therefore Family E interprets the intended boundary as:
- no destructive ledger editing;
- no organisation-wide Finance administration for ordinary Managers;
- no bypass of RLS or the configured approval path;
- no new budget-administration authority;
- accepted request and append-only own-unit expense capture remain intact.

Protected Stage 6 browser proof:
- Manager records own-unit spend;
- the record is append-only;
- the page keeps the explicit “not a bank balance” semantics.

Protected Stage 6 SQL proof:
- `spend_lines` Manager insert remains managed-unit scoped;
- `spend_lines` has no UPDATE/DELETE path;
- `unit_operating_position(uuid)` remains SECURITY INVOKER;
- operating position uses confirmed incoming transfers, reversal-aware spend and approved commitments;
- authenticated execution remains allowed while anonymous execution remains denied.

### Finance request authority path

Preserve the existing server-enforced path.

`decide_finance_request`:
- accepts only the authority required at the current stage;
- can route through Administration, Finance and Group Pastor according to the configured rule;
- defaults to Finance then Group Pastor when no currency-specific rule exists;
- does not let the same person decide twice on one request;
- decline is final;
- later authority is reached only after the preceding authority records its decision.

The client must continue to treat the server as authoritative. Visual availability must not imply permission.

### Request versus actual spend

A request is not spend.

Preserve:
- submitted;
- approved commitment;
- fulfilled actual spend;
- declined/cancelled where established.

`fulfil_finance_request` remains the approved-request-to-spend path:
- only Administration or a Finance handler may fulfil;
- the created spend row remains linked to the approved request;
- source/evidence reference remains required by the accepted browser journey;
- evidence reference is a traceable record reference and does not imply an uploaded receipt file;
- fulfilled request and spend remain distinct auditable records.

### Spend corrections and append-only ledger behaviour

Preserve reversal-based correction semantics.

Do not:
- overwrite or delete spend history;
- visually collapse the original and reversal into a fictional edited row;
- hide the audit relationship.

### Budget integrity

Preserve:
- budget records per currency;
- Administration insert/update authority where already established;
- no destructive budget delete path;
- approved but unspent requests count as commitments in the accepted budget-position logic;
- missing budget remains “not recorded,” not zero.

### Internal transfers

Preserve two-sided transfer truth:
- sender records;
- receiving side confirms or disputes;
- unconfirmed transfer is not treated as confirmed money in;
- both sides remain visible;
- organisation/unit scope remains governed by existing RLS.

### Income

Preserve existing Administration/Finance entry behaviour and correction/audit semantics. Family E does not introduce direct editing/deletion of money-received history.

## Existing browser journey that must continue to pass

The cumulative acceptance journey currently proves:
1. Manager submits a request.
2. Administration can approve a request within Administration authority.
3. An approved request can be fulfilled as actual spend with an evidence reference.
4. Manager sees the fulfilled state.
5. A larger request can require Finance first.
6. Finance records its decision and the request moves to Group Pastor.
7. Group Pastor records the required Executive decision.
8. Finance can fulfil the approved request.
9. Administration Money out shows both resulting spend entries.

This journey is binding during Family E migration.

## Current product audit

### Shared Finance family

Current Finance surfaces have solid domain logic but still use several legacy visual systems:
- legacy `.row`, `.card`, `.sec`, `.btn`, `.metric` and hand-composed tab/button patterns;
- role-specific card geometries instead of one Finance family;
- request decision rows use older queue primitives;
- loading/empty/success/error states do not yet read as one coherent family.

Family E should establish a shared Finance presentation layer rather than copy separate redesigns into three screens.

### Manager Finance

Current strengths:
- operating position is separated from budget planning;
- confirmed money in, recorded spend and approved commitments are factual;
- missing budget is explicitly not zero;
- request and expense actions are clear;
- project, transfer and request drill-downs are available;
- Finance-handler queue appears only when the unit handles finance.

Observed design issues:
- laptop composition is substantially too narrow and leaves large unused canvas;
- currency fact cards are visually legacy and weakly grouped;
- projects/transfers use collapsed legacy detail blocks disconnected from the main hierarchy;
- request history becomes a long generic row list;
- action hierarchy, operating truth and budget planning do not yet feel like one premium unit-finance workspace.

Recommended Manager hierarchy:
1. unit Finance identity;
2. Request funds / Record expense actions;
3. actual operating position;
4. budget planning position;
5. items requiring Finance authority, only for Finance handlers;
6. requests/history;
7. project cost context;
8. internal transfer context;
9. factual footnotes/audit semantics.

### Administration Finance

Current strengths:
- organisation-wide factual ledger context;
- Administration request decisions and fulfilment;
- separate Money in / Money out / Between departments views;
- organisation budgets, spend and confirmed transfer context;
- income and transfer recording;
- factual no-conversion / no-bank-balance wording.

Observed design issues:
- request queues, currency position and department movement read as disconnected stacked modules;
- the first view does not clearly distinguish urgent Administration actions from financial context;
- legacy pill tabs and legacy tables/rows remain;
- one-currency states underuse laptop width;
- operational actions are buried inside tabs rather than composed as an Administration finance console;
- Money in / Money out / transfer states do not share a strong family scan pattern.

Recommended Administration hierarchy:
1. organisation Finance identity;
2. requests requiring Administration decision;
3. approved requests awaiting fulfilment;
4. unresolved/disputed transfers;
5. factual position by currency;
6. department movement;
7. Money in;
8. Money out;
9. Between departments;
10. source/evidence and correction context.

### Executive Finance

Current strengths:
- Group Pastor sees only requests that require Executive authority;
- currencies remain separate;
- budget, actual spend, approved requests and waiting requests are factual;
- no bank-balance claim is made.

Observed design issues:
- hierarchy is sparse and leaves excessive unused canvas;
- the Executive card language is not yet the shared Finance family;
- spending-by-unit bar presentation is basic and should not be expanded into a new chart system before Stage 11;
- financial attention and factual context need a clearer leadership briefing order.

Recommended Executive hierarchy:
1. leadership Finance identity;
2. requests requiring Group Pastor decision;
3. factual currency context;
4. recorded spend by unit/context;
5. traceable finance footnote.

Executive remains a leadership context/decision surface, not a ledger administration screen.

## Experience V2 presentation contract

Use:
- Instrument Sans;
- Experience V2 semantic tokens;
- CEAC Lucide semantic icon registry;
- V2 Button/field/status/state/surface patterns;
- a shared Finance family layer under `src/experience-v2/`;
- at least 12px operational text;
- at least 44px practical touch targets;
- deliberate 1366×768 density;
- phone recomposition instead of squeezed desktop cards;
- explicit currency labels on every monetary amount where ambiguity is possible;
- traceable labels around requests, commitments, spend, reversals and transfers.

Do not:
- add a new global override stylesheet;
- increase `!important` debt;
- shrink text to solve density;
- add hidden financial-health scores or rankings;
- add predictive/forecast language;
- create fake cash/bank balances;
- add currency conversion;
- add decorative charts;
- touch payroll;
- touch frozen PR #71.

## Family E implementation sequence

### 10E1 — audit and contract
- lock this work brief;
- verify entry head is exact-head green;
- inspect Manager, Administration and Executive Finance renders;
- reconcile “Manager read-only” wording with accepted Stage 6 request/expense authority;
- identify shared Finance family primitives;
- no Finance product-code migration before this contract is persisted and exact-head green.

### 10E2 — Manager Finance
- establish shared V2 Finance-family presentation primitives;
- migrate Manager unit Finance first;
- preserve Request funds and append-only own-unit Record expense;
- preserve Finance-handler decision/fulfilment path;
- preserve factual operating/budget semantics;
- prove ordinary Manager scope and Finance-handler authority separately;
- prove supported phone widths plus laptop/desktop.

### 10E3 — Administration Finance
- migrate organisation Finance;
- place actionable Administration request/fulfilment work before context;
- preserve income, spend, transfer and request workflows;
- preserve organisation scope and transfer confirmation/dispute semantics;
- preserve current expense/export integration;
- prove full viewport matrix.

### 10E4 — Executive Finance
- migrate Group Pastor Finance briefing;
- keep only required Executive request authority;
- preserve factual currency/budget/spend/request context;
- do not create Administration/Finance fulfilment authority;
- avoid introducing Stage 11 chart work early;
- prove full viewport matrix.

### 10E5 — Family acceptance
- run complete engineering/security gates;
- re-run Experience Stage 6 finance SQL gate;
- re-run closure finance request → authority → evidence → actual-spend browser journey;
- inspect required widths across Manager, Finance handler, Administration and Executive;
- persist exact-head Family E evidence;
- commit Family E acceptance record;
- update BUILD_STATE.

Do not begin Family F — Reports before Family E is accepted.

## Required verification

Functional/security:
- ordinary Manager remains managed-unit scoped;
- Manager own-unit spend insert still works;
- Manager cannot edit/delete spend;
- Finance handler receives only the Finance authority step when required;
- Group Pastor receives only the Executive step when required;
- Administration receives only the Administration step when required;
- the same person cannot decide twice on one request;
- approved commitment remains distinct from actual spend;
- fulfilment links actual spend to the request and preserves evidence reference;
- spend corrections remain reversal-based;
- unconfirmed transfer is not counted as confirmed money in;
- currencies remain separate;
- missing budget is not treated as zero;
- no bank-balance claim is introduced;
- no schema/RLS/RPC/auth/capability change unless separately justified.

Viewport proof:
- 320;
- 360;
- 375;
- approximately 390×844;
- 414;
- 430;
- representative intermediate/tablet width;
- 1366×768;
- 1440×900.

At each required role state verify:
- no page-level horizontal overflow;
- minimum 12px operational text;
- practical 44px targets;
- no clipped monetary values or authority actions;
- action hierarchy remains understandable;
- long request titles/evidence references do not break layout;
- empty/no-budget/no-record states remain truthful.
