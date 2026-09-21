function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9 ]/g, " ");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
}

function bestEntity(text, entities, getName) {
  const haystack = normalize(text);
  let best = null;
  for (const entity of entities || []) {
    const name = cleanText(getName(entity));
    if (!name) continue;
    const normalized = normalize(name);
    const tokens = normalized.split(" ").filter(Boolean);
    const matched = haystack.includes(normalized)
      || tokens.some((token) => token.length > 2 && new RegExp("\\b" + escapeRegex(token) + "\\b", "i").test(haystack));
    if (!matched) continue;
    const tokenScore = tokens.reduce((score, token) => Math.max(score, haystack.includes(token) ? token.length : 0), 0);
    const score = haystack.includes(normalized) ? normalized.length + 100 : tokenScore;
    if (!best || score > best.score) best = { entity, score, name };
  }
  return best;
}

function parseDue(text) {
  let working = text;
  let dueAt = null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let hours = 17;
  let minutes = 0;

  const timeMatch = working.match(/\b(?:at|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    hours = Number(timeMatch[1]);
    minutes = timeMatch[2] ? Number(timeMatch[2]) : 0;
    const suffix = (timeMatch[3] || "").toLowerCase();
    if (suffix === "pm" && hours < 12) hours += 12;
    if (suffix === "am" && hours === 12) hours = 0;
    if (!suffix && hours <= 6) hours += 12;
    working = working.replace(timeMatch[0], " ");
  }

  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  let due = null;

  if (/\btomorrow\b/i.test(working)) {
    due = new Date(today);
    due.setDate(due.getDate() + 1);
    working = working.replace(/\btomorrow\b/gi, " ");
  } else if (/\btoday\b/i.test(working)) {
    due = new Date(today);
    working = working.replace(/\btoday\b/gi, " ");
  } else if (/\bnext week\b/i.test(working)) {
    due = new Date(today);
    due.setDate(due.getDate() + 7);
    working = working.replace(/\bnext week\b/gi, " ");
  } else {
    for (let i = 0; i < days.length; i += 1) {
      const match = working.match(new RegExp("\\b(?:by |on |this |next )?" + days[i] + "\\b", "i"));
      if (!match) continue;
      due = new Date(today);
      let diff = i - due.getDay();
      if (diff < 0 || diff === 0 || /next/i.test(match[0])) diff += 7;
      due.setDate(due.getDate() + diff);
      working = working.replace(match[0], " ");
      break;
    }
  }

  if (due) {
    due.setHours(hours, minutes, 0, 0);
    dueAt = due.toISOString();
  }

  return { text: cleanText(working), due_at: dueAt };
}

function inferKind(text) {
  const value = normalize(text);
  if (/\b(decide|decision|approve whether|choose whether)\b/.test(value)) return "decision";
  if (/\b(request|need .* from|ask .* to provide|provide .* for us)\b/.test(value)) return "request";
  if (/\b(deliverable|produce|deliver|final output|finished file|final video|final document)\b/.test(value)) return "deliverable";
  if (/\b(every day|every week|weekly|daily|monthly|routine|each sunday|each monday)\b/.test(value)) return "routine";
  if (/\b(case|issue stays open|follow up until resolved|matter)\b/.test(value)) return "case";
  if (/\b(meeting outcome|agreed in the meeting|we agreed|meeting action)\b/.test(value)) return "meeting_outcome";
  return "task";
}

export function parseWorkInput(text, {
  people = [],
  projects = [],
  subTeams = [],
} = {}) {
  const original = cleanText(text);
  if (!original) return {
    transcript: "",
    title: "",
    due_at: null,
    assignee_id: null,
    project_id: null,
    sub_team_id: null,
    kind: "task",
    resolved: [],
  };

  const due = parseDue(original);
  let working = due.text;
  const resolved = [];

  const personMatch = bestEntity(working, people, (row) => row.profiles?.full_name || row.full_name || "");
  if (personMatch) {
    resolved.push({ type: "person", id: personMatch.entity.profile_id || personMatch.entity.id, label: personMatch.name });
    working = working.replace(new RegExp(escapeRegex(personMatch.name), "ig"), " ");
  }

  const projectMatch = bestEntity(working, projects, (row) => row.name || "");
  if (projectMatch) {
    resolved.push({ type: "project", id: projectMatch.entity.id, label: projectMatch.name });
    working = working.replace(new RegExp(escapeRegex(projectMatch.name), "ig"), " ");
  }

  const subTeamMatch = bestEntity(working, subTeams, (row) => row.name || "");
  if (subTeamMatch) {
    resolved.push({ type: "sub_team", id: subTeamMatch.entity.id, label: subTeamMatch.name });
    working = working.replace(new RegExp(escapeRegex(subTeamMatch.name), "ig"), " ");
  }

  working = working
    .replace(/\b(assign|please|can you|could you|i need|we need|tell|ask|for|to)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!working) working = original;
  const title = working.charAt(0).toUpperCase() + working.slice(1);

  return {
    transcript: original,
    title,
    due_at: due.due_at,
    assignee_id: personMatch?.entity.profile_id || personMatch?.entity.id || null,
    project_id: projectMatch?.entity.id || null,
    sub_team_id: subTeamMatch?.entity.id || null,
    kind: inferKind(original),
    resolved,
  };
}

export function parseTask(text, people = []) {
  const parsed = parseWorkInput(text, { people });
  return {
    title: parsed.title,
    due_at: parsed.due_at,
    assignee_id: parsed.assignee_id,
  };
}
