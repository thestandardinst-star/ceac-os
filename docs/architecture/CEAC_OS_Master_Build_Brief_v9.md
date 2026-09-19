# CEAC OS — Master Build Brief v9

**Client:** CEAC (church office, Ghana) · about 30 staff · 16 units · 4 levels
**First unit:** Media and Technical
**Built by:** The Standard Institute — The Standard Solution

> This replaces every earlier version and the four separate panel documents. This is the only current one.

### What changed from v8

| # | Change | Why |
|---|---|---|
| 1 | **A simple return form for churches and groups** (§7) | Every target CEAC sets depends on numbers the network sends in. There was nowhere for them to land. |
| 2 | **Alerts when a number is falling** (§12.4) | The system could tell you a unit had gone quiet. It could not tell you a unit was slowly declining — which is the more common failure. |
| 3 | **Written in plain language throughout** | The people using this are not software people. Neither should the document be. |

---

## 0. A few words you will see

Only six technical words appear in this document. Everything else is plain English.

| Word | What it means |
|---|---|
| **Supabase** | Where the information is stored. A database in CEAC's name. |
| **Lovable** | The tool used to build the screens. |
| **Edge Function** | A small piece of code that runs on the server, not on someone's phone. |
| **Migration** | A written, saved change to the database. Kept as a file so nothing is lost or done by accident. |
| **RLS** | The database rule that decides who is allowed to see which rows. Not a screen setting — enforced at the storage level. |
| **PWA** | An app installed from a link rather than an app store. Works on any phone, works without internet. |

---

# PART 1 — WHAT THE SYSTEM IS

## 1. In one sentence

> **One place where CEAC's office staff do their work, send it in, and get it checked — so the record builds itself, and leadership sees what was actually achieved instead of what people remember.**

**The second promise, just as important:** CEAC runs this without TSI, permanently. If the administrator cannot do the month's work without asking anyone, the work is not finished.

### Not in the first version

The fellowship leaders' portal · tithes, offerings and member giving · a general chat app · managers entering money · a training video library · following people around during the day · Administration assessing herself · payroll approving itself · volunteers · **camp registration, payment and room screens** (the storage is built, the screens come later — §8).

---

## 2. The rules we do not break

1. **Nothing is made up.** Every figure comes from something a named person sent in on a recorded date.
2. **Every number can be opened**, and can explain itself in plain words.
3. **Being present, being available, and getting work done are three different things.** None of them proves another.
4. **Show a problem, never block a person.**
5. **Presence is always shown next to output.**
6. **Nobody reports the same thing twice.**
7. **The platform holds the record.** It is not where every conversation happens.
8. **The Telegram bot never saves anything final.** It creates drafts to be confirmed.
9. **Staff are never compared with each other.**
10. **Nobody gets one overall score.**
11. **Nothing is kept about a person that they cannot see — and they can always reply to it.**
12. **Going quiet is never how this system fails.** It tells you when it breaks.
13. **One reminder, one follow-up, then it stops.**
14. **The platform only ever changes things it created.**
15. **The information belongs to CEAC.**
16. **Every piece of work is checked by a human somewhere.**
17. **Assume nobody has done HR before.**
18. **Every mistake can be undone.**
19. **Not all work is a task.**
20. **Saying you are blocked is a claim, not a fact.** The other side gets to answer.
21. **Quiet by default.** Nothing pings unless it must.
22. **The system says when it does not know.**
23. **Structure is set up by CEAC, never fixed in the code.**
24. **A target and its result are never shown apart.**
25. **A number that is falling is as important as a number that has stopped.** — NEW (§12.4)

---

## 3. Built for someone doing this for the first time

**This section beats every other section when they disagree.**

1. Every screen says what it is for, in one line, always visible.
2. The system suggests; the person confirms. Never a blank page.
3. Anything longer than three steps is a walk-through, not a form.
4. Before anything important happens, the screen says what will happen.
5. Nothing is a one-way door, and the way back is written on the screen that does the thing.
6. Plain English only.
7. Show what is needed now. Hide the rest behind *Add more details*.
8. Never a dead end. Every empty screen says what to do next.
9. Explain when asked, not by default. A quiet **Why?** on every figure.
10. Calm, not congratulatory. No confetti, no streaks.

**Walk-throughs to build:** set up your team · give someone work · start a project, campaign or event · run pay · add a staff member · someone is leaving · set up leave · change a tax rate · open a review period · close the month · cover for me while I am away.

**First time someone opens it:** they do one real job from start to finish, about three minutes. One tip at a time, only the first time. A **Show me how** button on every screen that never goes away.

---

## 4. The words on screen

### 4.1 What things are called

Taken from what CEAC already says.

| Word | Meaning |
|---|---|
| **Not started** | Given out, not begun |
| **In progress** | Being worked on |
| **In review** | Sent in, waiting on the manager |
| **Completed** | Approved by the manager |
| **Waiting on** | Stuck on someone else — their "On Hold", **with the reason attached and a right to reply** |

Also fixed: Start work · End work · Things to do · Completion checklist · Send for review · Sent back · Weekly return · Closing a project · Ministry objective · Needs you · Gone quiet · Falling · Hours on the platform (*a record of activity, not a basis for pay*) · My record · Target · Achieved.

### 4.2 Words never to use on screen

| Never write | Write instead |
|---|---|
| Accrual | Leave that builds up each month |
| Pro-rata | Worked out for part of the year |
| Statutory deductions | SSNIT and income tax |
| Gross / net | Before deductions / what they take home |
| Termination | When someone leaves |
| Onboarding | Adding a new staff member |
| Headcount | Number of staff |
| Attrition | Staff who left |
| Reconciliation | Checking two sets of figures match |
| Variance | The difference from last month |
| Appraisal cycle | Review period |

**Also banned:** score · ranking · leaderboard · streak · badge · points · any percentage attached to a person · "you missed" · "failed" · "violation" · anything hinting at dishonesty · any comparison between two staff.

Percentages only against a stated total: *12 of 14 on time*, *383 of 500 hours*.

---

## 5. How CEAC is set up

**The chain:** Group Pastor → Administration & HR → Unit heads → Sub-team leads → Staff

**The sixteen units:** PFCC · Cell Ministry · Church Ministry · HR & Admin · **Media and Technical** · OFTGP Secretariat · Children's Ministry · Welfare · Foundation School · Partnership · Sacrament and Ceremonies · Facility, Procurement and Logistics · Programs · First Timers and Salvation · Ministry Material · Front Desk · Finance

Several units are one or two people. Every screen must look right for a unit of one.

**Different kinds of day.** Normal · **Wednesday** (work ends 5:15pm for service — an early finish is not a short day) · **Sunday** (quiet for most units, but **Media, Programs and Sacrament and Ceremonies are working**, and it is their busiest day) · camp or campaign weeks.

**Signing in.** By work email. Confirmed — CEAC staff use work email.

**Someone in two units.** A person can head one unit and work in another. They switch at the top of the screen. Their own work always sits under *My work*.

### 5.1 Sub-teams are jobs, not groups of people

Media and Technical has Graphics, Photography, Videography, Social Media, Technical, Procurement and Welfare. The Healing School department has eight units and **two members of staff.**

**So a sub-team is a lane of work, not a set of people.** It can have nobody in it and still exist, still be given work, still hold objectives. Much of what happens inside them is done by church coordinators who are not in this system at all.

The manager sets them up, renames them, reorders them and removes them — with no help from us, ever. A person can be in more than one. Removing a sub-team asks where its work should go first.

### 5.2 No volunteers

Volunteers are not in this system. Not named, not counted, not measured, not invited. Where a volunteer helps, the staff member responsible writes it in the notes and stays the owner.

### 5.3 How a unit's work gets checked

A unit with two or more people: **the manager checks each piece of work.**
A unit of one: the person marks their own work done, but **sends a short weekly return to Administration.**

**No unit only checks itself.**

---

## 6. How work is described

### 6.1 Not everything is a task

| Kind of work | How it finishes |
|---|---|
| **Task** | Checklist, then sent in and checked |
| **Routine job** | Logs that it happened, **sometimes with a number** |
| **Case** | A note saying how it ended. Can be private. |
| **Request** | Ends when the other unit answers |
| **Decision** | What was decided, by whom, when |
| **Meeting outcome** | What came out of it, and who owns each part |
| **Deliverable** | Something produced, with the file attached |

Only Tasks need a checklist. **Only Tasks and Deliverables are counted as "completed"** — otherwise "closed nine welfare cases" becomes a number people chase.

### 6.2 Two kinds of work

**Planned work** — ministry objective → project → objective → work. Needs an objective.

**Routine work** — the unit's responsibilities → routine jobs → each time it happens. **Needs no objective.** A finance officer processing payments should not have to invent a strategic goal.

Media's routine jobs: Sunday production · livestream · online prayer meetings · the weekly social calendar.

### 6.3 Routine jobs can carry a number

Communion attendance ran about 920 in August and about 1,310 in November. Logging that it happened is not enough — **the number matters.**

So each time a routine job happens, it can record a figure. Leadership then gets a trend line on ordinary ministry without anyone writing a report.

**The manager decides this, not us.** When she sets up a routine job, she is asked one extra question:

```
Sunday production

Does this record a number each time?     ( ) No, just that it happened
                                          (•) Yes

What is the number called?                [ People attending        ]
```

That is all. Nobody has to tell us in advance which jobs carry numbers — **the person who runs the job decides when they set it up**, and can change their mind later.

Any job with a number is automatically watched for decline (§12.4). That is how the Children's Church fall would have been caught.

### 6.4 Projects, campaigns and events are one thing with three settings

All three have an objective, an owner, units taking part, dates, work and a closing report. Building three separate versions would mean three of everything to build and fix.

| Setting | What it is | Example |
|---|---|---|
| **Project** | Ongoing work toward a goal | Studio reorganisation |
| **Campaign** | A push across the whole ministry, often called from outside | **Healing Streams**, every quarter |
| **Event** | Something with people attending and logistics | Mid-Year and End-of-Year Camp |

**A "special event" is not a fourth thing.** It is an event the Group Pastor called. That is a tick box, not a separate build — so when he calls something unusual next year, it already fits.

**More than one unit is normal.** A camp involves Media, Programs, Facility, Partnership, Welfare and Sacrament. Each manager sees only their own part. The Group Pastor and Administration see the whole thing, unit by unit.

**Next year's copies from last year's** — the structure, the stages, the objectives, and last time's closing report for reference. Healing Streams happens four times a year. Nobody should rebuild it four times.

### 6.5 Stages

Healing Streams is a **three-day event inside a fourteen-week campaign**: preparation, then three days, then **ten weeks afterwards** — reviewing, reporting, following up with people, visiting patients, starting cells, making videos for next time.

Treat it as finishing on the last day and you lose two-thirds of the work, **including the part that produces the real result.**

Stages fill in automatically and can be edited:

| Kind | Stages |
|---|---|
| **Campaign** | Before · During · After |
| **Event** | Planning · Running it · Wrapping up |
| **Project** | None |

**A campaign cannot be closed until the "After" stage ends.** Otherwise it gets marked finished on the day the event ends, which is exactly what happens now.

### 6.6 Who can start what

Not fixed in the code. **Administration ticks a box** to let someone create projects, campaigns, events or announcements. Right now that is the Group Pastor, Administration, and the Head of Programs. When that person changes, nobody calls us.

**The plus button** shows only what that person is allowed to start. Managers see Project. The three above see everything.

Announcements are separate — a message to everyone, with no objectives, no work, no closing report.

### 6.7 Objectives — usually words, sometimes numbers

Most CEAC objectives are sentences, and that is fine. **Never turn a sentence into a percentage.**

But some carry real numbers. Healing Streams set prayer at 500 hours, centres at 1,000, partnership at GHS 100,000. It reached 383 hours, 372 reported centres, and about GHS 65,100 — **and the report never said so.** The targets were on one page and the results fifteen pages later. Then the next target was set six times higher.

**So:** an objective can carry a target. Where it does, **the result is shown next to it everywhere the objective appears** — the unit's screen, leadership's screen, the closing report, the period report. Never one without the other.

Where there is no target, progress is simply work finished — *8 of 10* — labelled as such.

**And when the next target is being set, last period's result sits beside it.** So a six-fold jump is at least seen while someone is typing it.

### 6.8 Saying you are stuck

```
I am waiting on Finance  →  Finance says yes, it is with us
                         →  or Finance says no, and gives a reason
                         →  someone resolves it
```

The named unit gets a one-tap **yes** or **no, because…**, and it lands in their *Needs you* — not as an accusation.

**Only agreed blockers count in the totals that go upward.** Unanswered ones show as *waiting for Finance to reply*. Disagreements go to the manager to decide, and count as neither.

Both sides stay visible, permanently.

### 6.9 Work that keeps moving

The system keeps the date something was **first** due, alongside the date it is due **now**, and how many times it moved.

**Something moved three times is a planning problem. Something two days late is a different problem.** Show them differently.

### 6.10 Every piece of work has a short name

`MED-GFX-014` — unit, sub-team, number. Never reused, shown everywhere including Telegram. **People need to say it out loud in a meeting.**

### 6.11 Busy is not the same as achieving

Work finished is always shown **next to** whether the objective was met. Closing a project records objectives met, not tasks done.

Healing Streams recorded 2,133 attending, 136 saved, 137 testimonies. **The real result was in weeks 3 to 7** — following up and starting cells. The system must make that stage as visible as the event.

### 6.12 Closing a project

What was produced · each objective, met or not, **with target and result** · what it cost · what got in the way · what to do differently. Filled in already from work that was approved, from routine job records, and from unit spending. One closing per unit taking part, plus an overall one from the lead unit.

### 6.13 When nothing moves

```
Day 0  work sent in
Day 1  one reminder to the manager
Day 3  one follow-up, then reminders stop
Day 5  appears on Administration's list, naming the manager and how long
Day 10 appears on the Group Pastor's list as a unit-wide pattern
```

**It gets more visible, never noisier.**

---

## 7. Numbers coming in from the churches — NEW

Almost every target CEAC sets depends on figures that come from outside the office: centres held, prayer hours, attendance, registrations, cell meetings.

v8 could show a target but had **nowhere for the result to arrive.** That made half the objectives impossible to fill in.

### What this is

**A link. Not a portal, not an account, not a login.**

The office sets up a short return — say six numbers — and the system sends a link to each church's contact by WhatsApp or Telegram. They tap it, type the numbers, and send. Under two minutes.

```
Healing Streams — March edition
PFCC 1

Centres held              [    ]
Total attendance          [    ]
Souls saved               [    ]
Testimonies               [    ]
Anything worth noting     [                    ]

                          [ Send ]
```

### The church list is set up by Administration

We do not need to know the churches or their contacts in advance. **Administration builds the list herself**, in Settings, and edits it whenever it changes:

```
Churches and groups                              29 listed

PFCC 1          Kwesi Amankwah      024 xxx xxxx    ✓ sends returns
OFCC            Adwoa Sarpong       020 xxx xxxx    ✓ sends returns
Firebrand       —                   —               not set up yet
```

Each entry needs a name, a contact person and a phone number. **A church with no contact simply gets no link**, and shows as *not set up yet* — so the gaps are visible instead of silent.

One name, one entry. `GLORIOUS` and `GLORIOUUS` cannot both exist.

### The rules

- **No account, ever.** One link, tied to one church and one period. It expires when the period closes.
- **The office can enter on a church's behalf** — recorded as entered by the office, not by them.
- **Editable until the period closes**, then locked.
- **Missing returns are named**, exactly as the Healing Streams report did on its last page.
- **These figures fill in the "achieved" side of objectives automatically.**

### Why this is not the fellowship portal we dropped

That portal asked volunteers to live in a workspace every week. **This asks a church contact for six numbers, a few times a year.** Completely different ask.

**But the risk is real**, and worth saying out loud: if churches do not send returns, targets stay empty. Their own report shows four churches failing to submit even with a link from headquarters. **The office still has to chase.** What changes is that the system knows exactly who has not sent, and can remind them without anyone making a list.

### What it holds

```
return_forms     what is being asked, and how often
return_requests  one per church, per period, with its own link and due date
returns          what came back — the numbers, who sent it, when
```

---

## 8. Camps — the storage now, the screens later

CEAC's biggest operation is a camp. End of Year 2024: **GHS 880,315 taken, 6,241 registered, 2,677 paid, 37 churches, five price levels.** Dormitory alone shows GHS 378,119 claimed and GHS 334,126 handed in — **GHS 43,993 unaccounted for.** The master sheet shows **178 places sold that did not exist.**

That is real, and it is not the first version.

**Build the storage now, the screens later.** Adding a foundation underneath live information is expensive. Empty tables cost an afternoon.

```
network_groups   the 29 churches and PFCCs. Names and contacts only.
participants     who registered, which church, which stage they are at
allocations      rooms and places, with how many each holds
payments         what was paid, in full or in part
remittances      what a church claimed, what it handed in, what is outstanding
```

**Protections built in from day one:** you cannot allocate more places than exist · a church name cannot be spelled two ways · every money figure is a number, never typed text.

**The same shape appears everywhere at CEAC** — 6,241 registered against 2,677 paid, 389 families registered against 266 confirmed, Foundation School enrolled → graduated → baptised, 443 centres held against 372 reported. **One way of recording stages serves all of them.**

---

## 9. Being at work

**Start work / End work.** You cannot send work in without starting. **Asking for leave is never blocked** — a sick person cannot start work in order to report being sick.

> **Starting work is proof of activity, not permission to work.** Sending something in without starting is accepted and flagged, never refused.

**At the office:** location taken once, at the moment of starting. **Somewhere else:** you choose which job you are on, and the location belongs to that job, not to you. **No internet:** location still works, and everything syncs later.

**If someone goes idle**, the system asks *still working?* If there is no answer it closes the session **at the last thing they did** — it never quietly signs them out. A video editor inside Premiere for three hours is not idle.

**Hours are a record of activity, not a basis for pay.** That sentence appears in the app, not just in the proposal.

**Media works Sundays.** The day settings must be right before the first week or their record will be wrong from the start.

---

## 10. Sending work in, and Google Drive

The platform holds the record. **Drive holds the file.** Small files upload through the app into CEAC's own Drive; large ones — video, mostly — are pasted as a link.

Folders are made automatically: `Unit → Year → Project → Job`.

**The platform only ever touches folders it made.** It never changes, moves, renames or deletes a file it did not create. One badly aimed delete on a ministry's files is not recoverable.

**Work done elsewhere still counts** — closed with a note saying *agreed with Finance on WhatsApp, 3 September*. The platform is the record, not the place every conversation happens.

---

## 11. Telegram

The office already uses it. And because the app installs from a link rather than an app store, **iPhones will not send reliable notifications** — Telegram will, on every phone, at no cost per message.

**What it does:** tells people what needs them, with buttons · answers plain questions from real records · turns a voice note into a draft to confirm in the app · sends a short Monday summary · lets someone say yes or no to a blocker in one tap.

**What it will not do:** read everything in a group chat (it cannot tell a decision from a joke, and it would mean quietly recording every message staff send) · carry large files.

**Nothing the bot receives is saved as final.** It always becomes a draft.

### How loud things are

| Level | Where it goes | Examples |
|---|---|---|
| **Must act** | Telegram straight away, and in the app | Something waiting for your approval · a leave decision · pay awaiting sign-off · someone saying they are stuck on you |
| **Should know** | In the app now, Telegram on Monday | Work sent back · feedback · your blocker answered |
| **Weekly** | Monday only | The week's summary, who has reported |
| **Silent** | Recorded, never sent | Background activity |

**Silent is the starting point.** Something only gets louder if there is a reason. Nothing fires on a Sunday for a unit that does not work Sundays. Everyone can see, in Settings, exactly what reaches them.

**If Telegram fails**, everything still appears in the app, and the system reports the failure.

---

## 12. Knowing when something is wrong

### 12.1 The system checks on itself

Every scheduled job writes down that it ran. Every half hour, something checks the others. **If a job is fifteen minutes late or has failed, a plain message names it on Telegram.**

Their departmental dashboards currently show *Total Tasks: 0* while the week sheets are full of work — built once, never connected, failing quietly. **That is what this prevents.**

### 12.2 Gone quiet

Units that have not reported. Projects nothing has happened on. Objectives with no activity for weeks. The office does not usually fail loudly — it goes quiet first.

The thresholds are set by Administration in plain words, and visible:

```
Tell me when…
  a unit has not reported for            [ 14 ] days
  a project has not moved for            [ 6 ] weeks
  work has waited for a manager for      [ 5 ] working days
  someone has been waiting on someone    [ 5 ] working days
  someone's pay changes by more than     [ 20 ] %
```

### 12.3 Every number explains itself

Tap **Why?** on any figure and get three things, in order: what it means in one sentence · how it was worked out · **the actual records behind it.**

### 12.4 Falling — NEW

> **Rule 25: a number that is falling matters as much as a number that has stopped.**

Children's Church went from 149 members to 93, and average Sunday attendance from 80 to 58. First-timer retention fell from 28% to 19%. **Every one of those was visible month by month, and nobody was told until the December review.**

v8 would have recorded all of it and still said nothing, because it only watched for silence.

**So the system also watches direction:**

```
Tell me when…
  a number has fallen for                [ 3 ] periods in a row
  a number is more than                  [ 20 ] % below the same period last year
  a target is behind where it should be by this point in the period
```

Two blocks now sit side by side on the manager's, Administration's and the Group Pastor's screens:

**Gone quiet** — nothing is coming in.
**Falling** — things are coming in, and they are getting worse.

Worded plainly, never accusingly:
> *Children's Church Sunday attendance has fallen for four months running. It was 80, it is now 58.*

**This is the single change most likely to prevent the thing that already happened.**

---

## 13. Reports

One way of reporting, four levels: a person's own record · a unit · the whole office · leadership. Any period from a week to a year.

**Reports arrive already written** from what the period contains. The author confirms it, corrects it, and adds what the numbers cannot say. Charts open to the records behind them.

**Weeks are numbered the way the media team already numbers them** — *Week 34 — 17 Aug – 22 Aug*.

**Targets are always shown with results.** Next period's proposed target sits beside this period's achievement.

**Asking the system to explain a month:** one button. It reads only what people actually sent in, and it says how sure it is:

- *Finance is the most common hold-up this month: five agreed blockers across four units.*
- *Five jobs name Finance, but three have not been answered yet, so this may not be the whole picture.*
- *I do not have enough recorded information to answer that. Four units have not reported.*
- *This project was last updated 27 days ago, so this may be out of date.*

**Never a confident answer from thin information.** A well-written wrong answer is worse than none, because someone acts on it.

---

## 14. Pay

**CEAC runs pay alone, permanently.**

The tax and SSNIT rates are **information Administration owns and edits**, not something fixed in the code. Every run shows which rates were used, when they started, and who confirmed them.

**The run walks through five screens**, prepared automatically on the 25th: who is being paid → what changed since last month, with the reason where the system knows it → things to check → see one payslip in full → approve.

Where it cannot explain a change it says so: **"We do not know why. Please check."**

**A practice run** does everything except pay anyone. That is how she learns it, and how whoever comes after her learns it.

**Mistakes are fixed by her.** An approved run stays locked, but she adds a correction. The original stays exactly as it was, both are visible, and it appears on the next payslip. **This is what removes us from the monthly loop** — more than any automation.

**A person still approves.** The draft prepares itself; issuing thirty payslips does not.

---

## 15. Nothing is a one-way door

| Thing | How it is undone |
|---|---|
| Approved pay run | A correction, or a reversing entry. Original untouched. |
| A rate change | Replaced, never deleted |
| Approved work | Reopened with a reason |
| A closed project | Reopened; the closing report is kept as a version |
| Someone removed | Brought back; records were never deleted |
| Approved leave | Cancelled, days restored |
| Something deleted | Recoverable for 30 days |
| An announcement sent | Withdrawn |
| A blocker resolved | Reopened by either side |
| A sub-team removed | Its work is moved first |

**Two things cannot be changed backwards:** the record of who did what, and a pay run at the moment it was approved. Both can be corrected forwards.

---

## 16. The rest of HR

People, attendance, leave, documents, contracts, welfare, review periods.

**Reviews are built from what happened** — work finished, on time, approved first time, **time spent stuck excluded from lateness**, how often work slipped, objectives met, weeks reported, feedback, training.

**No overall score.** The parts are shown; the humans judge.

**Every review has a reply box for the staff member**, kept permanently. When Kwame's two thin months were caused by nine jobs stuck on Finance, that belongs beside the numbers.

**CEAC already scores its service departments** on people present by cut-off, punctuality, coordination, appearance, set-up and teamwork — one to five, with meanings written down, and **blanks left out of the average.** Use those same headings for **units and services**, never as a ranked list of people.

---

## 17. Someone joining, someone leaving

**Joining:** six questions. Everything else later.

**Leaving:** last day → part-month pay shown before it is applied → leave settled → **where their open work goes** (their manager; **Administration if the person leaving was the only one in their unit**, otherwise the work vanishes) → access removed, Telegram unlinked → **record kept, marked as left, never deleted.**

**Cover while away:** Administration names someone, sets the dates, and ticks what they may do. It ends by itself.

---

# PART 2 — WHAT EACH PERSON SEES

## 18. A staff member

**Five tabs:** Home · Work · My record · Team · Me. Phone first.

**Home** — what needs them (work sent back, **someone saying they are stuck on you**, messages, overdue, a leave answer) · due today · this week · announcements · birthdays. **When there is nothing, the block disappears entirely.**

**Work** — Active · Waiting on · In review · Completed · **Kept moving** · Private. Grouped by project or by routine job. Every item shows its short name.

**A job** — its name · what it is part of · why it matters · what to do · the checklist or a note · *first due 18 Aug, moved twice* · files to help · the conversation · **Send for review** · **I'm waiting on someone** · everything that has happened to it.

**Private items** — theirs alone. In no total, on no screen, readable by nobody else. If the app only holds work their manager gave them, they will keep a second list on paper.

**Receipts** — sent 4:12, seen 5:03, approved 6:40.

**My record** — everything they have done, split between given to them and added themselves, on time, approved first time, **time spent stuck**, days worked, hours with the note about pay, objectives, feedback, and **where their sessions started and who can see it.** Every count opens. **Nothing compares them to anyone.**

**Team** — who's who · who is away this week · the unit's five most-used files · birthdays. Nothing here measures anyone.

**Me** — profile, employment, documents, policies, leave (never blocked), welfare, payslips, what pings them, Telegram, install.

## 19. A unit head

**Home, in this order:** waiting on you → your team today → **stuck, both ways** → your own work → projects needing attention.

**Approvals sit above your own work on purpose.** When you are slow to approve, someone else cannot move.

**Team** — grouped by sub-team. Present next to output, plus **waiting on others** and **kept moving**, so a stuck person is never mistaken for an idle one.

**Projects** — the plus button, showing only what they may start. Objectives with target and result. Stages where they apply. For shared work, only their unit's part.

**Giving out work** — what kind, which project, which stage, which objective, which sub-team, why it matters, the checklist or expected result, when, resources, who.

**Also:** the queue to check · calendar · unit spending (view only) · messages on work · reports already written.

**Reviewing, approving, giving out work and messaging are never blocked** by whether they have started work. Their own submissions are, like everyone's.

## 20. Administration & HR

**Home** — needs you (leave sent up, contracts ending, pay to approve, **work sitting with a manager over five days, named**, **disagreements about blockers**) · **which units have not reported, by name** · the office today · **Gone quiet** and **Falling**.

**Units** — all sixteen: head, people, sub-teams, projects, objectives, work finished, routine jobs kept up, how often work slips, reporting, cost.

**People** — the heart of it. Everything about one person, built from work that already happened. Every figure opens.

**Attendance and leave** — the whole office, a map of where people started, anything unusual shown quietly and never as an accusation.

**Pay · Reviews · Cost · Reports.**

**Settings** — people and access · units and sub-teams · responsibilities · **who may start projects, campaigns and events** · **the churches and their contacts** · **return forms** · tax rates · leave rules · report templates · **when to tell me** (quiet and falling) · what pings whom · **what ran last night** · Telegram · Drive · cover.

## 21. The Group Pastor

**Telegram first. The screen second — and it has to earn the visit.**

**He sets the ministry's objectives. He starts campaigns and events**, names the objective, and picks which units take part. Each manager then builds their own part.

**He gives work to managers and Administration only.** Never to a staff member. It goes straight there, marked as from him, and Administration always sees it — because today that instruction is a phone call and nothing anywhere records it.

**He approves** spending above a limit, senior hires, sign-off on big projects, and anything he started. **Never more than five things waiting.**

**One screen:** the month in a sentence, with work finished and objectives met together · needs you · objectives with targets and results · **Gone quiet** · **Falling** · the office today as numbers, not a name list · **stuck between units** · delivery and cost side by side · post an announcement.

**Campaigns and events** — every unit taking part, side by side, **with the stages shown so the follow-up period is as visible as the event itself.**

**What has been achieved** — the last six months as projects and milestones, not tasks.

**People and pay** — read only. Named individuals only if he looks someone up deliberately, never on the screen he opens each morning.

**Nothing is called a profit and loss.** The office spends money; it does not earn it. What is shown is cost next to what was delivered.

**He messages managers and Administration.** Not individual staff — otherwise a manager learns her editor's priorities changed from the editor.

---

# PART 3 — BUILDING IT

## 22. What is stored

Everything carries the organisation it belongs to.

**Who's who:** organisations · units · responsibilities · sub-teams · sub-team members · profiles · memberships and roles · employment · day settings · ministry objectives · setup checklist · **who may create what** · cover arrangements · **churches and their contacts**

**The work:** projects (kind, lead unit, called by, dates, follow-up end) · units taking part · stages · objectives (with optional target and result) · work items (short name, kind, project, stage, objective, responsibility, sub-team, owner, why, expected result, first due, due now, times moved, estimate, actual, where it came from, private, confidential, status) · routine jobs · each time one happens **with an optional number** · checklists · every tick as its own record · blockers with both sides · submissions and files · receipts · reviews · project closings · weekly returns · unit files

**Coming in from churches:** return forms · return requests · returns

**Camps (storage only for now):** participants · stages · allocations · allocation lines · payments · remittances

**Being at work:** sessions (started, ended, how it ended, location, phone time, server time, anything unusual) · session events

**HR and pay:** leave types, requests and balances · salary records · tax rates · pay runs · pay lines · payslips · corrections · things to check · reviews · replies · feedback · documents

**Talking and telling:** conversations · messages · announcements · what pings whom · reports · Telegram links · drafts · everything that happened · **what ran and whether it worked** · the permanent record of changes · imports · deleted items · **when to tell me** settings

### Three storage rules, learned from their own files

**Every date is stored as a date** — never a number, never text.
**Every money figure is a number** — never typed text.
**Every church name points to one entry** — so `GLORIOUS` and `GLORIOUUS` cannot both exist.

> Their rollup shows *Days Remaining: -20699* because one column holds 38 numbers, 5 dates and 4 pieces of text. **Worth showing them. It is the clearest possible argument for a proper database.**

## 23. Who can see what

| | Sees |
|---|---|
| Staff | Their own record and work, their unit's projects, conversations they are in, the directory, unit files, who is away |
| Sub-team lead | The above, plus their sub-team's work to check. **Not** pay, unit money, or other sub-teams' people |
| Unit head | Plus everyone in the unit and all its work, sub-team setup, spending (view only), where their team started |
| Administration & HR | Everything: all units, HR, pay, reporting, weekly returns, who may create what |
| Cover | Only what was ticked, only for the dates set |
| Group Pastor | The whole organisation with the ability to open anything; the pay register, view only |

**Private items belong to their owner alone** — nobody else, at any level. **Confidential cases** go to their owner, Administration and the Group Pastor only.

These rules live in the database itself, written by hand and saved as files. Not switched on in a menu.

## 24. Working without internet

Installed from a link. Starting work, ticking things off, finishing a job and drafting a report all **save on the phone** and send up when the signal returns. The person sees *saved — will sync*, never an error.

Ticks are saved individually, so two phones offline on the same job do not overwrite each other.

**iPhones do not sync in the background**, so everything syncs when the app is opened — and Telegram carries anything that must arrive.

All times stored in one standard and shown in Ghana time. Ghana has no clock changes, which removes a whole class of problem.

## 25. Who builds what

| Part | Built where |
|---|---|
| The database, its rules and protections | Supabase, saved as files |
| Who can see what | Supabase, saved as files |
| Anything running on the server | Supabase |
| Scheduled jobs | Supabase |
| Working without internet | By hand, in the code |
| Screens, walk-throughs, charts | Lovable, one instruction at a time |

**Lovable will claim to have built things it has not** — particularly the see-what-you-may rules, the offline part, and anything involving a password or key. **Check by reading the files, never by its summary.**

**The code lives in a repository TSI owns**, from day one. **Keys are never pasted into a chat instruction.**

**One instruction at a time. Test after each one.** Never re-run an earlier instruction to fix something — ask it to look at what is there first.

**Attach to every screen instruction:**

```
Rules:
- Never show: score, ranking, leaderboard, streak, badge, points.
- Never show a percentage against a person. Use "12 of 14".
- Never compare one staff member with another.
- Where an objective has a target, always show the result beside it.
- Plain English. No HR words — see the word list.
- Every screen says what it is for, in one line, always visible.
- Every greyed-out button says why it is greyed out.
- Every button that removes something says how to undo it.
- Every figure has a quiet "Why?".
- Offline is normal, not an error: "saved — will sync".
- New alerts start silent.
- Sub-teams, roles, responsibilities and who-can-create are always
  set up by CEAC. Never fix them in the code.
- Do not add menus, settings, search or notifications unless asked.
- Do not write the see-what-you-may rules, the offline part, or
  anything that runs on the server.
```

## 26. The order of building

> A staff screen cannot be tested with nothing in it. But building the whole manager screen first means six screens showing nothing for two weeks. **Build the loop across both, then widen each.**

**Groundwork.** The database with everything including the camp storage. Signing in by invitation. Units, sub-teams, responsibilities, day settings **including Sunday for Media**, when-to-tell-me settings, who may create what, the church list. Keys stored. The repository set up.

**The loop — Media only.** Team setup → give out work → receive, start work, tick, send in → check and approve or send back → **saying you are stuck, both sides** → Telegram, and the system checking on itself.

**Two weeks of just using it.** Media only. Fix bugs, change nothing else. Watch: do people start work · are checklists ticked or skipped · does the manager clear her queue · **are blockers answered** · **how many seconds does it take to tick something and send it** · what did people do instead.

**Widen.** The full manager screen — team, projects with kinds and stages, stuck, calendar, reports, messages. The full staff screen — record, team tab, private items, receipts. Routine jobs with numbers. **Return forms for the churches. Gone quiet and Falling.**

**Administration.** People, attendance, leave, pay, cover, cost, reviews with replies, search. **Practise restoring a backup before pay goes live.**

**The Group Pastor.** His screen, ministry objectives, campaigns and events with stages, what has been achieved, quiet and falling, reports for any period, asking questions on Telegram.

> **From the loop onward, he gets the Monday Telegram summary** — three lines, Media only at first. He should not wait months to see anything. He is the one approving payment.

**Rolling out.** Four units every two weeks, **introduced by Administration, not by TSI.**

**Camps — priced separately.** Registration, payment, money handed in, rooms, distribution. This is where the GHS 880,000 and the GHS 44,000 gap sit.

### Handing over — the test

Administration does all of this **alone**, with Gabriel present and silent:

1. Adds a staff member and invites them
2. Approves a leave request
3. Changes a tax rate and sees the effect before confirming
4. Runs a **practice** pay run
5. Runs a **real** pay run
6. Makes a deliberate mistake and fixes it herself
7. Handles someone leaving, including their last pay
8. Sets up cover for a week away
9. Settles a disagreement about a blocker between two units
10. Starts a campaign with stages and a target
11. **Sets up a return form and sends it to three churches**
12. Checks whether last night's jobs ran

**If she cannot do all twelve without help, it is not finished.** This goes in the contract as the test of completion.

## 27. Looking after it

**Backups** — confirm what the plan includes, decide whether more is needed, and **practise restoring one before going live.** An untested backup is a belief.

**A practice copy of everything**, with names removed, for trying changes. **Required before pay goes live.**

**A permanent record** of pay changes, role changes, sign-offs, dismissed warnings and the reasons, rate changes, leave adjustments, people leaving, cover arrangements, blocker decisions, sub-team changes and who was allowed to create things. **It can be added to and never edited.**

**A written manual for someone who is not Gabriel** — running pay, restoring a backup, resetting an account, reconnecting Telegram, changing a key. Plus an agreed arrangement covering uptime, backups and how fast someone responds.

## 28. Protecting people's information

Ghana's Data Protection Act requires registration before handling personal information, and it applies to **both** the organisation holding it and anyone processing it for them. Registration is needed within 20 days and renewed every two years. Not registering is an offence.

**CEAC holds the information. TSI processes it.** Confirm TSI's registration before starting. Confirm CEAC's — carefully; most churches have not. Put a written agreement in the contract, agree how long things are kept, and tell staff what is collected when they join.

> **Two live examples worth raising gently.** The coordinators list holds dates of birth, home areas, marital status and number of children in an open spreadsheet. The Healing Streams report contains detailed medical information about named patients in a deck that circulates freely. **Both are reasons to store this properly, not reasons to criticise anyone.**

## 29. Moving off the spreadsheets

**Keep:** the short-name convention · the week numbering and how it is displayed · the status words · tracking when something was first due · the service assessment headings and leaving blanks out of the average · the three-stage campaign shape · the departmental sheets as a guide to real sub-teams.

**Leave behind:** ranking named people by a percentage · "on hold" with no reason · marking work done with nothing attached · figures that quietly go stale when a sync fails · mixed types in one column · unedited template slides in leadership reports.

**The people who maintain these sheets matter most in the rollout.** The media assistant who compiles the task rollup, and whoever compiles the camp and campaign reports. Their manual work is what disappears. **Give them the setup and introduction role in their own units.**

**Do not bring history across.** Start clean at a stated week. The old sheets stay as reference for one month, then stop.

## 30. What could go wrong

| Risk | What we do about it |
|---|---|
| Structure fixed from an out-of-date document | Sub-teams and permissions are set up by CEAC, never coded |
| Sub-teams assumed to need members | They can hold nobody |
| Work forced into fake checklists | Seven kinds of work; only Tasks need one |
| "Waiting on" becomes blame | Both sides answer; only agreed ones count upward |
| Targets set and never checked against | Result always shown beside target |
| Targets stay empty because churches do not report | **Return forms, and the system names who has not sent** |
| A slow decline goes unnoticed | **Falling alerts, not just quiet ones** |
| Campaign called finished on the day | Cannot close until the follow-up stage ends |
| Busy mistaken for achieving | Work finished always shown with objectives met |
| People chasing easy numbers | Cases and decisions not counted; given vs self-added shown separately; no overall score |
| Too many notifications | Four levels, silent by default |
| The system sounding certain when it is not | It says how sure it is |
| Routine work forced into objectives | Two kinds of work |
| Sunday-working units look absent | Day settings before the first week |
| Camp information added later | Storage built at the start |
| The sheet maintainers resist | Give them the setup role |
| A pay mistake she cannot fix | Corrections she makes herself |
| Work sits with a manager | It becomes visible one level up |
| Ticks lost offline | Each tick saved separately |
| Launch support all falling on TSI | Administration introduces each group |
| Information lost | Practise restoring before going live |
| Locked into Lovable | The code is in TSI's repository |
| Registration exposure | Register, and put an agreement in the contract |
| Nobody uses it, quietly | The two-week pause exists to find that out |

## 31. Still to find out

Headcount per unit · who counts as a manager, and anyone in two units · a real example of what a unit sends Administration · how work is given out today · what a review looks like now · what happens when someone is late · whether the office has a fixed internet address · who owns the ministry calendar · whether CEAC has its own Google Workspace · whether Finance keeps budgets and income digitally · the spending limit needing his approval · leave days, how they build up, what carries over · how salaries are structured · what allowances and deductions exist · which units work Sundays and when · what PCF and PFCC stand for · where leave balances are today and as at when · **who at CEAC does the first data entry, and by when** · whether CEAC is registered · who covers pay · how much pay experience Administration has · whether part-months count calendar or working days · each unit's routine jobs · what work is not a task · Media's sub-team leads by name · whether the media assistant takes the setup role · who is Head of Programs · the camp report

**Settled:** signing in by work email · sub-teams are set up by CEAC and can be empty · volunteers are out · the `Time` column is a due time · the campaign has three stages · targets exist and must be checked against results · **which routine jobs carry a number — the manager chooses when setting the job up (§6.3)** · **the church list and contacts — Administration builds it in Settings (§7)**.

## 32. Money

The consultancy role is agreed at GHS 4,000 a month. **The build is a separate piece of work** and must be contracted separately, or it quietly becomes part of the retainer.

The contract needs: what is included, stage by stage · the information-protection agreement · the support arrangement · who owns the information and what happens at handover · **the twelve-item test as the definition of finished** · what is explicitly not included · **camps named and priced separately.**

---

*CEAC OS — Master Build Brief v9. Replaces every earlier version.*
