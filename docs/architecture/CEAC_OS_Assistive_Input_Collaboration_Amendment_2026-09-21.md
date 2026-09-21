# CEAC OS — Assistive Input & Collaboration Amendment

**Date:** 21 September 2026  
**Status:** APPROVED PRODUCT DECISION — binding  
**Applies to:** all prior CEAC OS architecture, product-experience, Rooms, meetings, Staff/Manager collaboration and input behaviour  
**Decision owner:** CEAC product owner  
**Implementation rule:** this amendment supersedes prior architecture only where it explicitly changes AI/input/collaboration behaviour. Existing security, evidence, no-ranking, Work Engine and protected-HR rules remain binding.

## 1. Product direction

The current visual foundation is retained.

The next product phase is not another aesthetic reset. CEAC OS must now behave as intelligently and fluidly as it looks.

The governing interaction model is:

**speak or type → understand context → resolve known CEAC objects → show what CEAC understood → user confirms → write the attributable record.**

The user remains the decision-maker. CEAC may assist input and interpretation, but it may not silently create consequential records or personnel judgments.

## 2. AI rule — amended

The previous blanket prohibition on generative/inference services is replaced by a narrower boundary.

### 2.1 Permitted assistive AI

When configured through an approved server-side provider, CEAC may use inference for:

- speech-to-text transcription;
- extracting structured fields from natural-language input;
- suggesting known CEAC people, sub-teams, projects, work items and dates from the user's words;
- summarising user-authored meeting notes or Room context for review before saving;
- turning spoken or typed instructions into a proposed work/meeting/announcement form;
- rewriting the user's own text for clarity when explicitly requested.

### 2.2 Prohibited AI

CEAC must not use AI to:

- score, rank or rate a person;
- infer competence, honesty, effort, loyalty, motive or performance;
- make HR, payroll, disciplinary, leave, finance or access decisions;
- approve work;
- assign work without explicit human confirmation;
- publish an announcement without explicit human confirmation;
- create a meeting or invite audience without explicit human confirmation;
- silently alter institutional records;
- bypass RLS or role permissions.

### 2.3 Provider and security boundary

- Provider credentials must never be exposed to the browser.
- AI/inference calls must run through an approved server-side boundary.
- The client must remain usable when inference is unavailable.
- The UI must distinguish transcript/proposal from saved record.
- Every consequential write still uses the same authoritative CEAC database/RPC permission model.
- Provider migration (for example Vercel → Cloudflare) must not require rewriting product flows.

## 3. Universal Input Composer

CEAC gains one reusable input capability instead of isolated microphone buttons.

Supported modes:

- keyboard;
- voice recording;
- browser/native speech recognition fallback when available;
- future server-side transcription;
- context-aware structured extraction.

### 3.1 Interaction

A voice-capable field must support:

1. tap microphone;
2. visible recording/listening state;
3. stop/cancel;
4. transcript appears as editable text;
5. where structured interpretation is useful, CEAC shows a review state;
6. user confirms before CEAC creates/changes the record.

No decorative or non-functional microphone is allowed.

### 3.2 Initial adoption

The composer should be usable for:

- Give out work;
- Room messages;
- meeting notes;
- meeting decisions;
- announcements;
- project updates;
- blockers/dependencies;
- feedback;
- other substantial text-entry surfaces where voice materially improves use.

## 4. Contextual communication — no general direct messages

CEAC OS does **not** add unrestricted person-to-person DMs.

Communication remains attached to work context:

- Unit Room;
- Sub-team Room;
- Project Room;
- Meeting thread/workspace;
- mentions of specific people inside those contexts.

Mentioning a person targets their attention but does not create a private conversation.

Protected HR/private matters continue through protected HR workflows, not ordinary Rooms.

## 5. Rooms 2.0

Rooms become a work-aware coordination surface rather than a basic chat screen.

### 5.1 Room scopes

- Unit Room — all authorised active unit members;
- Sub-team Room — relevant sub-team members plus the unit manager/head as authorised;
- Project Room — authorised project collaborators across participating units.

### 5.2 Composer

The Room composer uses a single rich input area with:

- **+** contextual actions;
- text input;
- microphone;
- send;
- reply context;
- selected mentions/references.

The **+** menu may expose, according to role/context:

- switch/select sub-team conversation;
- link a project;
- link a work item;
- reference a dependency/blocker;
- make an announcement where authorised;
- schedule a meeting;
- attach an allowed CEAC link/record.

It does not expose “DM person”.

### 5.3 Inline resolution

Typing **@** must resolve real eligible people in the current Room.

The system may also expose explicit context search for:
- sub-teams;
- projects;
- work items.

A visible string such as `@Nana` is not a valid mention unless a real CEAC identity is resolved and stored.

### 5.4 Notifications

High-value Room events should surface through existing CEAC attention surfaces:
- mentions;
- replies to the user's message;
- meeting invitations arising from that context.

Do not create noisy notifications for every Room message.

## 6. Meetings 2.0

Meetings are CEAC operational objects around an external conferencing provider.

### 6.1 Participants

Meetings must support explicit participants/audience:

- organisation;
- unit;
- sub-team;
- project collaborators;
- selected authorised people;
- selected unit managers where permitted.

No unrestricted browsing of people outside the scheduler's existing authorised People visibility.

### 6.2 Distribution

When a meeting is scheduled and confirmed:

- eligible participants automatically see it in CEAC;
- it appears on relevant Home/Calendar surfaces;
- the meeting workspace already contains the join link;
- no manual copy/paste to WhatsApp is required for CEAC users.

External provider invitation/email automation is a separate integration and must not be falsely implied until implemented.

### 6.3 Operational lifecycle

Before:
- title;
- agenda;
- participants;
- project/unit context;
- join location.

During:
- join meeting;
- factual notes;
- attributable decisions;
- contextual references.

After:
- create/link actions;
- record meeting outcomes;
- unresolved follow-ups;
- permanent attributable record.

## 7. Calendar interaction redesign

Mobile Calendar must not display every filter as an equally weighted control.

Phone hierarchy:

1. Month / Week segmented switch;
2. one compact **Filter** control showing current view;
3. filter sheet with Meetings, Projects, Tasks, Leave, Ministry/Unit activities;
4. date navigation;
5. calendar/event content.

Desktop may expose tasteful persistent filter chips where space allows.

## 8. Motion and interaction quality

Motion must clarify state change, not decorate.

Use restrained motion for:
- sheets/drawers;
- composer expansion;
- Month/Week transition;
- Room scope change;
- loading → content;
- confirmation/proposal states.

Respect `prefers-reduced-motion`.

## 9. Demonstration data

For presentation/demo purposes CEAC may seed clearly identifiable demonstration records.

Rules:
- never fabricate demo rows that can be mistaken for historical operational truth;
- demo fixtures must be attributable to designated fixture accounts and documented;
- use realistic examples that exercise announcements, meetings, Rooms, work, dependencies and Home attention;
- demo fixtures must be removable without touching real records.

## 10. Acceptance

Before this phase is complete:

- voice controls are functional, not decorative;
- Room @mentions resolve real identities;
- Unit/Sub-team/Project Rooms are usable;
- no general DM surface exists;
- meeting audiences/participants persist and control visibility;
- relevant meeting participants see meetings automatically;
- Calendar mobile controls are simplified;
- Rooms and meeting flows remain zero-horizontal-overflow at 320/360/375/390/414/430px;
- RLS tests cover sub-team Rooms and meeting participant visibility;
- account/security gate remains green;
- no AI/provider secret exists in browser code;
- no consequential AI-assisted action writes without confirmation.
