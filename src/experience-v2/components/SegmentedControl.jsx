import { CeacIcon } from "../icons";

export function SegmentedControl({
  items = [],
  value,
  onChange,
  ariaLabel = "View",
  className = "",
}) {
  return (
    <div className={`ev2c-segmented ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={item.disabled}
            className={`ev2c-segmented-item ${selected ? "is-selected" : ""}`}
            onClick={() => onChange?.(item.value)}
          >
            {item.icon ? <CeacIcon name={item.icon} size="meta" decorative /> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
