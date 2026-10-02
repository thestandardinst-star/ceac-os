import {
  Button,
  DataPanel,
  QueueRow,
  Skeleton,
  StatePanel,
  StatTile,
  StatusBadge,
  Surface,
} from "../components";
import { CeacIcon } from "../icons";
import { dueLabel, isOverdue } from "../../lib/time";

function money(minor, currency) {
  return `${currency} ${(Number(minor || 0) / 100).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value, options = {}) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "numeric",
    month: "short",
    ...options,
  });
}

function workTone(item) {
  if (!item) return "neutral";
  if (item.status === "returned" || isOverdue(item.due_at)) return "danger";
  if (item.status === "waiting_on") return "warning";
  if (["completed", "self_certified"].includes(item.status)) return "success";
  return "action";
}

function Count({ value, tone = "neutral" }) {
  return <span className={`managerv2-count is-${tone}`}>{value}</span>;
}

function Quiet({ icon = "checkCircle", children }) {
  return <div className="managerv2-quiet">
    <CeacIcon name={icon} size="row" decorative />
    <span>{children}</span>
  </div>;
}

function PulseFact({ label, value, meta, tone = "neutral", onClick }) {
  return <button
    type="button"
    className={`managerv2-pulse-fact is-${tone}`}
    onClick={onClick}
  >
    <strong>{value}</strong>
    <span>{label}</span>
    {meta ? <small>{meta}</small> : null}
  </button>;
}

function DecisionRow({ icon, title, meta, note, status, statusTone = "warning", actions }) {
  return <div className="managerv2-decision-row">
    <span className="managerv2-row-icon"><CeacIcon name={icon} size="row" decorative /></span>
    <span className="managerv2-decision-copy">
      <span className="managerv2-decision-title">{title}</span>
      {meta ? <span className="managerv2-decision-meta">{meta}</span> : null}
      {note ? <span className="managerv2-decision-note">{note}</span> : null}
    </span>
    {status ? <StatusBadge tone={statusTone}>{status}</StatusBadge> : null}
    {actions ? <div className="managerv2-decision-actions">{actions}</div> : null}
  </div>;
}

function ProjectRow({ project, onOpen, onDrill }) {
  const facts = [];
  if (project.atRisk?.length) facts.push(`${project.atRisk.length} objective${project.atRisk.length === 1 ? "" : "s"} need attention`);
  if (project.objectivesWithoutActiveWork?.length) facts.push(`${project.objectivesWithoutActiveWork.length} active objective${project.objectivesWithoutActiveWork.length === 1 ? "" : "s"} with no active work`);
  if (project.openDeliverables?.length) facts.push(`${project.openDeliverables.length} open deliverable${project.openDeliverables.length === 1 ? "" : "s"}`);
  if (project.closesThisWeek) facts.push("Ends this week");

  return <div className="managerv2-project-row">
    <button type="button" className="managerv2-project-main" onClick={() => onOpen?.(project.id)}>
      <span className="managerv2-row-icon"><CeacIcon name="projects" size="row" decorative /></span>
      <span>
        <strong>{project.name}</strong>
        <small>{facts.length ? facts.join(" · ") : "Open project context"}</small>
      </span>
      <CeacIcon name="chevronRight" size="meta" decorative />
    </button>
    {project.taskCount > 0 ? <button
      type="button"
      className="managerv2-progress-link"
      onClick={() => onDrill?.({ zone: "project", title: `${project.name} tasks`, rows: project.tasks })}
    >
      <span>{project.completedTasks} of {project.taskCount} tasks completed</span>
      <span className="managerv2-progress" aria-hidden="true"><span style={{ width: `${Math.round((project.completedTasks / project.taskCount) * 100)}%` }} /></span>
    </button> : null}
  </div>;
}

function FinancePosition({ row, onOpen }) {
  const hasBudget = Number(row.budget_minor || 0) > 0;
  return <div className="managerv2-finance-row">
    <div className="managerv2-finance-head">
      <div><span>Currency</span><strong>{row.currency}</strong></div>
      <StatusBadge tone={hasBudget ? "action" : "neutral"}>{hasBudget ? "Budget recorded" : "No budget recorded"}</StatusBadge>
    </div>
    <div className="managerv2-finance-facts">
      <span><strong>{hasBudget ? money(row.budget_minor, row.currency) : "—"}</strong><small>Planned</small></span>
      <span><strong>{money(row.spent_minor, row.currency)}</strong><small>Spent</small></span>
      <span><strong>{money(row.committed_minor, row.currency)}</strong><small>Committed</small></span>
      <span><strong>{hasBudget ? money(row.remaining_minor, row.currency) : "—"}</strong><small>Remaining</small></span>
    </div>
    <Button variant="quiet" size="compact" onClick={onOpen}>Open Finance</Button>
  </div>;
}

export default function ManagerOverviewV2({
  me,
  greeting,
  dateLabel,
  loading,
  loadFailed,
  error,
  busy,
  decisionRows = [],
  reviewFollowupByWork,
  blockers = [],
  leaveLimit,
  team,
  projects = [],
  incomingRequests = [],
  financePositions = [],
  serviceDayData = [],
  mine = [],
  delegated = [],
  week,
  upcomingMeetings = [],
  upcomingProjects = [],
  routines = [],
  recentMovement = [],
  drill,
  drillRows = [],
  onRetry,
  onGiveOutWork,
  onOpenWork,
  onOpenItem,
  onOpenProject,
  onOpenMeeting,
  onScheduleMeeting,
  onOpenPerson,
  onOpenReview,
  onLeaveDecision,
  onBlockerDisagree,
  onBlockerAcknowledge,
  onResolveBlocker,
  onOpenFinance,
  onDrill,
}) {
  const actionableBlockers = blockers
    .filter((blocker) => blocker.direction === "incoming" && blocker.state === "claimed")
    .map((item) => ({ type: "blocker", since: item.since, item }));
  const decisions = [...decisionRows, ...actionableBlockers]
    .sort((left, right) => new Date(left.since || 0) - new Date(right.since || 0));
  const decisionCount = decisions.length;
  const deliveryBlockers = blockers.filter((blocker) => !(blocker.direction === "incoming" && blocker.state === "claimed"));
  const serviceDayHasData = serviceDayData.some((row) => Number(row.sunday) > 0 || Number(row.midweek) > 0);

  return <div className="body manager-home">
    <div className="managerv2">
      <header className="managerv2-intro">
        <div className="managerv2-context"><span>{me.unit_name}</span><time>{dateLabel}</time></div>
        <div className="managerv2-intro-row">
          <div>
            <h1>{greeting}, {me.full_name.split(" ")[0]}</h1>
            <p>{decisionCount
              ? `${decisionCount} decision${decisionCount === 1 ? "" : "s"} need your attention. Oldest first.`
              : "No decision is waiting on you right now. Keep delivery context close."}</p>
          </div>
          <Button icon="create" onClick={onGiveOutWork}>Give out work</Button>
        </div>
      </header>

      {loadFailed ? <StatePanel
        state="error"
        title="Manager Overview could not finish loading"
        description={error || "Some manager context could not be loaded."}
        actionLabel="Try again"
        onAction={onRetry}
      /> : null}

      {!loadFailed && error ? <Surface variant="soft" padding="standard" className="managerv2-notice" role="alert">
        <CeacIcon name="error" size="row" decorative />
        <div><strong>Could not complete that</strong><span>{error}</span></div>
      </Surface> : null}

      {loading ? <div className="managerv2-loading" role="status" aria-live="polite" aria-busy="true" aria-label="Loading Manager Overview">
        <Surface variant="plain" padding="standard"><Skeleton width="32%" /><Skeleton width="88%" /><Skeleton width="72%" /></Surface>
        <Surface variant="plain" padding="standard"><Skeleton width="28%" /><Skeleton width="100%" /><Skeleton width="82%" /></Surface>
        <Surface variant="plain" padding="standard"><Skeleton width="36%" /><Skeleton width="94%" /><Skeleton width="76%" /></Surface>
      </div> : null}

      {!loading && !loadFailed ? <main className="managerv2-main">
        <section className="managerv2-command-grid" aria-label="Manager decisions and delegation">
          <DataPanel
            className="managerv2-panel managerv2-decisions"
            eyebrow="Decisions first"
            title="Needs your decision"
            supporting="Only records that require your authority appear here."
            action={<Count value={decisionCount} tone={decisionCount ? "attention" : "success"} />}
          >
            {decisionCount === 0 ? <Quiet>Nothing needs your decision right now.</Quiet> : decisions.map((decision) => {
              if (decision.type === "submission") {
                const submission = decision.item;
                const followup = reviewFollowupByWork?.get(submission.work_items.id);
                return <DecisionRow
                  key={`submission-${submission.id}`}
                  icon="work"
                  title={submission.work_items.title}
                  meta={`${submission.work_items.ref || ""} · ${submission.profiles?.full_name || "Team member"} · submitted ${formatDate(submission.submitted_at)}`}
                  note={followup
                    ? `Follow-up received ${formatDate(followup.last_seen_at)}`
                    : submission.note || undefined}
                  status="Review"
                  statusTone="warning"
                  actions={<>
                    <Button variant="quiet" size="compact" onClick={() => onOpenItem?.(submission.work_items.id)}>Open</Button>
                    <Button variant="secondary" size="compact" onClick={() => onOpenReview?.(submission)}>Review</Button>
                    <Button variant="secondary" size="compact" onClick={() => onOpenReview?.(submission, "returned")}>Send back</Button>
                    <Button size="compact" onClick={() => onOpenReview?.(submission, "completed")}>Approve</Button>
                  </>}
                />;
              }
              if (decision.type === "leave") {
                const request = decision.item;
                const escalates = Number(request.days) > leaveLimit;
                return <DecisionRow
                  key={`leave-${request.id}`}
                  icon="time"
                  title={`${request.profiles?.full_name || "Team member"} · ${request.days} day${Number(request.days) === 1 ? "" : "s"} ${request.kind} leave`}
                  meta={`${request.start_date} → ${request.end_date}`}
                  note={request.reason || (escalates ? `Over ${leaveLimit} days — approval escalates to Administration.` : undefined)}
                  status={escalates ? "Escalates" : "Decision"}
                  statusTone={escalates ? "warning" : "action"}
                  actions={<>
                    <Button variant="secondary" size="compact" onClick={() => onLeaveDecision?.(request, "declined")}>Decline</Button>
                    <Button size="compact" onClick={() => onLeaveDecision?.(request, "approved")}>{escalates ? "Escalate" : "Approve"}</Button>
                  </>}
                />;
              }
              if (decision.type === "blocker") {
                const blocker = decision.item;
                return <DecisionRow
                  key={`blocker-${blocker.id}`}
                  icon="warning"
                  title={blocker.work_items?.title || "Dependency claim"}
                  meta={`${blocker.profiles?.full_name || "Someone"} says they are waiting on your unit`}
                  note={blocker.note || blocker.party_text}
                  status="Reply needed"
                  statusTone="warning"
                  actions={<>
                    <Button variant="quiet" size="compact" onClick={() => onOpenItem?.(blocker.work_item_id)}>Open</Button>
                    <Button variant="secondary" size="compact" onClick={() => onBlockerDisagree?.(blocker)}>Disagree</Button>
                    <Button size="compact" onClick={() => onBlockerAcknowledge?.(blocker)}>Acknowledge</Button>
                  </>}
                />;
              }
              const alert = decision.item;
              const blocker = blockers.find((row) => row.id === alert.subject_id);
              return <DecisionRow
                key={`followup-${alert.id}`}
                icon="notification"
                title={alert.message}
                meta={`Dependency follow-up · ${formatDate(alert.last_seen_at)}`}
                status="Follow-up"
                statusTone="warning"
                actions={blocker ? <Button variant="secondary" size="compact" onClick={() => onOpenItem?.(blocker.work_item_id)}>Open</Button> : null}
              />;
            })}
          </DataPanel>

          <DataPanel
            className="managerv2-panel managerv2-delegated"
            eyebrow="Delegation"
            title="Work you gave out"
            supporting="Open work you assigned. Recorded states only — no productivity score."
            action={<div className="managerv2-panel-actions"><Count value={delegated.length} /><Button variant="quiet" size="compact" onClick={onOpenWork}>Open Work</Button></div>}
          >
            {delegated.length ? delegated.slice(0, 2).map((item) => <QueueRow
              key={item.id}
              icon="work"
              title={item.title}
              meta={`${item.ref} · ${item.profiles?.full_name || "Unassigned"}${item.due_at ? ` · ${dueLabel(item.due_at)}` : ""}`}
              status={item.status?.replaceAll("_", " ")}
              statusTone={workTone(item)}
              onClick={() => onOpenItem?.(item.id)}
            />) : <Quiet>No open work you assigned needs tracking.</Quiet>}
            {delegated.length > 2 ? <div className="managerv2-more-note">+{delegated.length - 2} more open item{delegated.length - 2 === 1 ? "" : "s"} in Work.</div> : null}
          </DataPanel>
        </section>

        <section className="managerv2-context-grid">
          <DataPanel
            className="managerv2-panel managerv2-team"
            eyebrow="Today"
            title="Team context"
            supporting="Availability is context, not a performance measure."
          >
            <div className="managerv2-pulse-grid" aria-label="Team operating context">
              <PulseFact label="Present" value={team.present.length} meta="Today" tone="success" onClick={() => onDrill?.({ zone: "team", title: "Present today", people: true, rows: team.present })} />
              <PulseFact label="Working now" value={team.working.length} meta="Open sessions" tone="action" onClick={() => onDrill?.({ zone: "team", title: "Working now", people: true, rows: team.working })} />
              <PulseFact label="Approved leave" value={team.leave.length} meta="Today" onClick={() => onDrill?.({ zone: "team", title: "On approved leave today", people: true, rows: team.leave })} />
              <PulseFact label="No session yet" value={team.notStarted.length} meta="Today" onClick={() => onDrill?.({ zone: "team", title: "No work session recorded today", people: true, rows: team.notStarted })} />
              <PulseFact label="Completed" value={team.completed.length} meta="Today" tone="success" onClick={() => onDrill?.({ zone: "team", title: "Work completed today", rows: team.completed })} />
              <PulseFact label="Awaiting review" value={decisionRows.filter((row) => row.type === "submission").length} meta="Needs manager" tone="warning" onClick={() => onDrill?.({ zone: "team", title: "Awaiting your review", rows: decisionRows.filter((row) => row.type === "submission").map((row) => row.item.work_items) })} />
            </div>
            {drill?.zone === "team" ? <div className="managerv2-drill">
              <div className="managerv2-drill-head"><strong>{drill.title}</strong><Count value={drillRows.length} /></div>
              {drill.people
                ? drillRows.length
                  ? drillRows.map((person) => <QueueRow key={person.id} icon="person" title={person.name} meta={`${person.completed} completed today · ${person.submitted} submitted today`} onClick={() => onOpenPerson?.(person.id, "current")} />)
                  : <Quiet>No people are in this group.</Quiet>
                : drillRows.length
                  ? drillRows.map((item) => <QueueRow key={item.id} icon="work" title={item.title} meta={`${item.ref} · ${dueLabel(item.due_at)}`} status={item.status?.replaceAll("_", " ")} statusTone={workTone(item)} onClick={() => onOpenItem?.(item.id)} />)
                  : <Quiet>No work is in this group.</Quiet>}
            </div> : null}
          </DataPanel>

          <DataPanel
            className="managerv2-panel managerv2-delivery"
            eyebrow="Delivery risk"
            title="Projects and dependencies"
            supporting="Only recorded project and dependency facts appear here."
            action={<Count value={projects.length + deliveryBlockers.length} tone={projects.length + deliveryBlockers.length ? "attention" : "success"} />}
          >
            {projects.length === 0 && deliveryBlockers.length === 0 ? <Quiet>No project or dependency needs attention right now.</Quiet> : null}
            {projects.map((project) => <ProjectRow key={project.id} project={project} onOpen={onOpenProject} onDrill={onDrill} />)}
            {deliveryBlockers.length ? <div className="managerv2-subhead in-panel">Dependencies</div> : null}
            {deliveryBlockers.map((blocker) => <div className="managerv2-dependency-row" key={blocker.id}>
              <button type="button" className="managerv2-dependency-main" onClick={() => onOpenItem?.(blocker.work_item_id)}>
                <span className="managerv2-row-icon"><CeacIcon name="warning" size="row" decorative /></span>
                <span>
                  <strong>{blocker.work_items?.title || "Dependency"}</strong>
                  <small>{blocker.direction === "incoming"
                    ? `${blocker.profiles?.full_name || "Someone"} is waiting on your unit`
                    : `Your unit is waiting on ${blocker.units?.name || blocker.party_text}`}</small>
                </span>
                <StatusBadge tone={blocker.state === "acknowledged" ? "action" : "warning"}>{blocker.state === "acknowledged" ? "Acknowledged" : "Waiting reply"}</StatusBadge>
              </button>
              <Button variant="quiet" size="compact" disabled={busy} onClick={() => onResolveBlocker?.(blocker)}>Mark resolved</Button>
            </div>)}
            {drill?.zone === "project" ? <div className="managerv2-drill">
              <div className="managerv2-drill-head"><strong>{drill.title}</strong><Count value={drillRows.length} /></div>
              {drillRows.length
                ? drillRows.map((item) => <QueueRow key={item.id} icon="work" title={item.title} meta={`${item.ref} · ${dueLabel(item.due_at)}`} status={item.status?.replaceAll("_", " ")} statusTone={workTone(item)} onClick={() => onOpenItem?.(item.id)} />)
                : <Quiet>No records are in this group.</Quiet>}
            </div> : null}
          </DataPanel>
        </section>

        <section className="managerv2-operational-grid">
          <DataPanel
            className="managerv2-panel managerv2-schedule"
            eyebrow="Commitments"
            title="Schedule"
            supporting="Meetings and project dates already recorded in CEAC OS."
            action={onScheduleMeeting ? <Button variant="quiet" size="compact" onClick={() => onScheduleMeeting?.({ scope: "unit", unitId: me.unit_id, unitName: me.unit_name })}>Schedule</Button> : null}
          >
            {upcomingMeetings.length ? upcomingMeetings.slice(0, 3).map((meeting) => <QueueRow
              key={meeting.id}
              icon="meeting"
              title={meeting.title}
              meta={`${formatDate(meeting.starts_at, { weekday: "short", hour: "2-digit", minute: "2-digit" })} · ${meeting.scope === "project" && meeting.projects?.name ? meeting.projects.name : meeting.scope === "unit" ? me.unit_name : "CEAC"}`}
              status={meeting.provider === "zoom" ? "Zoom" : "Meeting"}
              statusTone="action"
              onClick={() => onOpenMeeting?.(meeting.id)}
            />) : <Quiet icon="calendar">No meeting invitation is recorded in the next 14 days.</Quiet>}
            {upcomingProjects.slice(0, 2).map((project) => <QueueRow
              key={`date-${project.id}`}
              icon="projects"
              title={project.name}
              meta={`Ends ${new Date(`${project.ends_on}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
              status="Project date"
              onClick={() => onOpenProject?.(project.id)}
            />)}
          </DataPanel>

          {incomingRequests.length ? <DataPanel
            className="managerv2-panel"
            eyebrow="Other units are waiting"
            title="Requests to your unit"
            action={<Count value={incomingRequests.length} tone="attention" />}
          >
            {incomingRequests.map((request) => <QueueRow
              key={request.work_item_id}
              icon="work"
              title={request.work_items.title}
              meta={`${request.work_items.ref}${request.work_items.due_at ? ` · ${dueLabel(request.work_items.due_at)}` : ""}`}
              status={request.request_state === "clarification" ? "Clarification" : "Waiting"}
              statusTone="warning"
              onClick={() => onOpenItem?.(request.work_item_id)}
            />)}
          </DataPanel> : null}

          <DataPanel
            className="managerv2-panel managerv2-finance"
            eyebrow="Unit position"
            title="Finance snapshot"
            supporting="Budget planning records only. This is not a bank balance."
            action={<Button variant="quiet" size="compact" onClick={onOpenFinance}>Open Finance</Button>}
          >
            {financePositions.length
              ? financePositions.map((row) => <FinancePosition key={row.currency} row={row} onOpen={onOpenFinance} />)
              : <Quiet icon="finance">No unit budget position is recorded.</Quiet>}
          </DataPanel>

          <DataPanel
            className="managerv2-panel managerv2-coming"
            eyebrow="This week"
            title="Work horizon"
          >
            <div className="managerv2-pulse-grid is-horizon" aria-label="This week work horizon">
              <PulseFact label="Due" value={week.due.length} meta="This week" tone="action" onClick={() => onDrill?.({ zone: "week", title: "Tasks due this week", rows: week.due })} />
              <PulseFact label="Completed" value={week.completed.length} meta="This week" tone="success" onClick={() => onDrill?.({ zone: "week", title: "Tasks completed this week", rows: week.completed })} />
              <PulseFact label="Overdue" value={week.overdue.length} meta="Open work" tone="danger" onClick={() => onDrill?.({ zone: "week", title: "Tasks overdue", rows: week.overdue })} />
            </div>
            {drill?.zone === "week" ? <div className="managerv2-drill">
              <div className="managerv2-drill-head"><strong>{drill.title}</strong><Count value={drillRows.length} /></div>
              {drillRows.length
                ? drillRows.map((item) => <QueueRow key={item.id} icon="work" title={item.title} meta={`${item.ref} · ${dueLabel(item.due_at)}`} status={item.status?.replaceAll("_", " ")} statusTone={workTone(item)} onClick={() => onOpenItem?.(item.id)} />)
                : <Quiet>No work is in this group.</Quiet>}
            </div> : null}
          </DataPanel>
        </section>

        {serviceDayHasData ? <DataPanel
          className="managerv2-panel managerv2-movement"
          eyebrow="Recorded movement"
          title="Sunday vs midweek"
          supporting="Factual work movement only. This is not a performance score."
        >
          <div className="managerv2-movement-table" role="table" aria-label="Sunday versus midweek recorded work movement">
            <div className="managerv2-movement-head" role="row">
              <span role="columnheader">Record</span><span role="columnheader">Sunday</span><span role="columnheader">Midweek</span>
            </div>
            {serviceDayData.map((row) => <div className="managerv2-movement-row" role="row" key={row.label}>
              <strong role="cell">{row.label}</strong><span role="cell">{row.sunday}</span><span role="cell">{row.midweek}</span>
            </div>)}
          </div>
        </DataPanel> : null}

        <section className="managerv2-secondary-grid">
          <DataPanel
            className="managerv2-panel"
            eyebrow="Personal focus"
            title="Your own work"
            action={<Count value={mine.length} />}
          >
            {mine.length ? mine.map((item) => <QueueRow
              key={item.id}
              icon="work"
              title={item.title}
              meta={`${item.ref} · ${dueLabel(item.due_at)}`}
              status={item.status?.replaceAll("_", " ")}
              statusTone={workTone(item)}
              onClick={() => onOpenItem?.(item.id)}
            />) : <Quiet>No due, overdue, returned or waiting work.</Quiet>}
          </DataPanel>

          {routines.length ? <DataPanel
            className="managerv2-panel"
            eyebrow="Recurring operations"
            title="Routines"
            action={<Count value={routines.length} />}
          >
            {routines.map((routine) => <QueueRow
              key={routine.id}
              icon="time"
              title={routine.name}
              meta={!routine.schedule_kind
                ? "Schedule needs to be set"
                : routine.schedule_kind === "daily" ? "Daily"
                  : routine.schedule_kind === "monthly" ? `Monthly · day ${routine.day_of_month}`
                    : `${routine.schedule_kind === "weekly" ? "Weekly" : "Selected weekdays"} · ${(routine.weekdays || []).map((day) => ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][day - 1]).join(", ")}`}
              status={routine.active ? "Active" : "Paused"}
              statusTone={routine.active ? "success" : "neutral"}
              onClick={() => onOpenItem?.(routine.work_item_id)}
            />)}
          </DataPanel> : null}

          {recentMovement.length ? <DataPanel
            className="managerv2-panel"
            eyebrow="Last seven days"
            title="Recent movement"
          >
            {recentMovement.map((movement) => <QueueRow
              key={movement.key}
              icon={movement.type === "completed" ? "checkCircle" : "work"}
              title={movement.title}
              meta={`${movement.detail} · ${formatDate(movement.at, { hour: "2-digit", minute: "2-digit" })}`}
              onClick={() => onOpenItem?.(movement.itemId)}
            />)}
          </DataPanel> : null}
        </section>
      </main> : null}
    </div>
  </div>;
}
