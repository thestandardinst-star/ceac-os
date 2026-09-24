# Questions for CEAC

Six answers block work that cannot start without them. Nobody should
guess these — every one is a decision about how CEAC actually runs, and
inventing an answer bakes a rule nobody agreed to into the system.

Print this, or read it out. Write the answers straight into this file and
commit, and the blocked stages can start.

---

## 1. Which numbers does each department report, and how often?

**Blocks:** the ministry layer (Stage 3), and therefore the Group Pastor's
whole view.

**Why it matters.** The system currently reports on itself — tasks done,
sessions started. It knows nothing about what the church actually did.
Pastor Claude opening it sees office activity, not his church.

The tables to hold this already exist (`recurring_operations`,
`operation_occurrences`) and have never been used. This is wiring, not
building — but only once somebody says what goes in them.

**What we need.** For each department, the numbers it owes and how often.

| Department | What it reports | How often |
|---|---|---|
| Cell Ministry | e.g. cells that met, cells expected | weekly |
| PFCC | e.g. fellowships held | weekly |
| _(add every department)_ | | |

Also: **who types the number in**, and **by when each week**.

---

## 2. Who records the service scores, and when?

**Blocks:** service performance reporting (Stage 3).

CEAC already scores serving departments 1–5 on personnel present,
punctuality, coordination, appearance, set-up and teamwork, per service.
The August sheet shows this working.

**What we need:**
- One person from the Service Department scoring every department, or
  each department head scoring their own?
- Recorded during the service, straight after, or later in the week?
- Which services are scored — Sunday, midweek, special programmes?

---

## 3. Are the growth levels allowed?

**Blocks:** the SOP-driven part of Stage 3.

The Service Departments SOP defines seven levels a person moves through:
Brefos, Nepios, Paidion, Teknon, Neaniskos, Huios, Pater.

The original brief said **nothing that scores or ranks a person**. This
looks like a discipleship ladder rather than a performance score, which
is a different thing — but it is still a level recorded against a named
person, so CEAC must decide rather than the system assuming.

**Answer: yes / no.** If yes: who sets a person's level, and can that
person see their own?

---

## 4. Awards — departments or individuals?

**Blocks:** nothing yet, but it shapes Stage 3.

The SOP asks for award systems for high achievers, innovators and
punctual personnel. The brief forbids badges and gamification.

**Recommendation: recognise departments, never rank individuals.** A
department award celebrates without turning colleagues into competitors,
and nothing in the system then holds a league table of people.

**Answer: departments only / individuals too / none.**

---

## 5. If departments record their own spending, who checks it?

**Blocks:** the finance corrections (Stage 6).

Today only Finance can record spending. That is wrong — a department that
cannot record what it spent cannot manage itself, and cannot see where
its own money came from.

But the reason it was built that way still stands: **the person who
records money should not be the only person who sees it.**

**What we need.** When Frank records GHS 300 on cables:
- Does it need anyone's approval, or is recording it enough?
- Does Finance confirm it afterwards, the way a transfer is confirmed?
- Is there an amount above which someone else must agree?

---

## 6. Are there report shapes beyond the three we have seen?

**Blocks:** nothing immediately; prevents designing the wrong thing twice.

Three shapes have been identified from CEAC's own workbooks:
1. **Office task reporting** — weekly tasks, owners, status, % complete.
   Already supported.
2. **Service performance** — departments scored per service.
3. **Event register** — registration, payments, arrears, rooms.

**Is there a fourth?** Anything a department produces monthly or
quarterly that looks like none of the above.

---

## Answers

_Write them here and commit. Date each one._
