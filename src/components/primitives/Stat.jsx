// A figure with a label, and ALWAYS a link.
//
// There is no such thing in this system as a number you cannot open. The
// component enforces it: onOpen is required, and a Stat without one
// refuses to render rather than shipping a dead figure. That was the most
// common defect found in the page-by-page review.
import Icon from "./Icon";

export default function Stat({ value, label, sub, icon, tone = "ink", onOpen }) {
  if (typeof onOpen !== "function") {
    if (typeof console !== "undefined") {
      console.error("Stat needs onOpen — every figure must open its rows. Label:", label);
    }
    return null;
  }
  return (
    <button type="button" className="stat" onClick={onOpen}>
      <span className="stat-l">
        {icon && <Icon name={icon} size={15} />}
        {label}
      </span>
      <span className={"stat-v tone-" + tone}>
        {value}
        {sub && <span className="stat-sub"> {sub}</span>}
      </span>
    </button>);
}

export function StatRow({ children }) {
  return <div className="stat-row">{children}</div>;
}
