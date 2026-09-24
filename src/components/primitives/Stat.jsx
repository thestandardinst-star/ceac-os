// A figure with a label, and ALWAYS a link.
//
// There is no such thing in this system as a number you cannot open.
// onOpen remains mandatory: a Stat without a route to its records is not
// an operational figure.
import Icon from "./Icon";

export default function Stat({
  value,
  label,
  sub,
  icon,
  tone = "ink",
  size = "sm",
  delta,
  onOpen,
}) {
  if (typeof onOpen !== "function") {
    if (typeof console !== "undefined") {
      console.error("Stat needs onOpen — every figure must open its rows. Label:", label);
    }
    return null;
  }

  return (
    <button type="button" className={"stat stat-" + size} onClick={onOpen}>
      <span className="stat-l">
        {icon && <Icon name={icon} size={15} />}
        {label}
      </span>
      <span className={"stat-v tone-" + tone}>
        {value}
        {sub && <span className="stat-sub"> {sub}</span>}
      </span>
      {delta && <span className="stat-delta">{delta}</span>}
    </button>
  );
}

export function StatRow({ children }) {
  return <div className="stat-row">{children}</div>;
}
