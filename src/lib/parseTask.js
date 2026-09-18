// Turn a spoken sentence into a rough task: title, due date, assignee.
// Simple pattern matching, not AI.
export function parseTask(text, people = []) {
  if (!text || !text.trim()) return { title: "", due_at: null, assignee_id: null };
  let title = text.trim();
  let due_at = null;
  let assignee_id = null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let hours = 17, minutes = 0;
  const tm = title.match(/\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (tm) {
    hours = parseInt(tm[1], 10); minutes = tm[2] ? parseInt(tm[2], 10) : 0;
    const ap = (tm[3] || "").toLowerCase();
    if (ap === "pm" && hours < 12) hours += 12;
    if (ap === "am" && hours === 12) hours = 0;
    if (!ap && hours <= 6) hours += 12;
    title = title.replace(tm[0], " ").trim();
  }
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  let due = null;
  const lc = title.toLowerCase();
  if (/\btomorrow\b/i.test(lc)) { due = new Date(today); due.setDate(due.getDate()+1); title = title.replace(/\btomorrow\b/gi," ").trim(); }
  else if (/\btoday\b/i.test(lc)) { due = new Date(today); title = title.replace(/\btoday\b/gi," ").trim(); }
  else if (/\bnext week\b/i.test(lc)) { due = new Date(today); due.setDate(due.getDate()+7); title = title.replace(/\bnext week\b/gi," ").trim(); }
  else {
    for (let i = 0; i < 7; i++) {
      const re = new RegExp("\\b(by |on |this |next )?" + days[i] + "\\b", "i");
      const m = title.match(re);
      if (m) {
        due = new Date(today);
        const cur = due.getDay(); let diff = i - cur;
        const isNext = m[1] && /next/i.test(m[1]);
        if (diff < 0 || (diff === 0 && !m[1]) || isNext) diff += 7;
        due.setDate(due.getDate() + diff);
        title = title.replace(m[0], " ").trim();
        break;
      }
    }
  }
  if (due) { due.setHours(hours, minutes, 0, 0); due_at = due.toISOString(); }
  const pats = [/@(\w+)/i, /\btell (\w+)/i, /\bask (\w+)/i, /\bassign to (\w+)/i, /\bfor (\w+)/i];
  for (const p of pats) {
    const m = title.match(p);
    if (m) {
      const hint = m[1].toLowerCase();
      const person = people.find(pp => {
        const name = ((pp.profiles && pp.profiles.full_name) || "").toLowerCase();
        return name.startsWith(hint) || name.split(" ").some(w => w === hint);
      });
      if (person) { assignee_id = person.profile_id; title = title.replace(m[0], " ").trim(); break; }
    }
  }
  title = title.replace(/\s+/g, " ").replace(/^to\s+/i, "").trim();
  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);
  return { title, due_at, assignee_id };
}
