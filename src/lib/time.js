export function since(iso) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  return h > 0 ? h + "h " + (mins % 60) + "m" : mins + "m";
}
export function dueLabel(iso) {
  if (!iso) return "No date";
  const d = new Date(iso), now = new Date();
  const t = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  if (d.toDateString() === now.toDateString()) return "Due today, " + t;
  const days = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (days < 0) return "Overdue " + Math.abs(days) + " day" + (Math.abs(days) === 1 ? "" : "s");
  if (days === 1) return "Due tomorrow, " + t;
  return "Due " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
export const isOverdue = (iso) => !!iso && new Date(iso).getTime() < Date.now();
export function dateOnly(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
