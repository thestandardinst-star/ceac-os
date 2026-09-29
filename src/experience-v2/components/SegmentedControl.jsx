import { useId } from "react";
import { motion } from "motion/react";
import { CeacIcon } from "../icons";
import { EV2_TRANSITIONS } from "../motion";

export function SegmentedControl({
  items = [],
  value,
  onChange,
  ariaLabel = "View",
  className = "",
}) {
  const instanceId = useId().replace(/:/g, "");

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
            {selected ? (
              <motion.span
                className="ev2c-segmented-indicator"
                layoutId={`ev2c-segmented-${instanceId}`}
                transition={EV2_TRANSITIONS.reflow}
                aria-hidden="true"
              />
            ) : null}
            <span className="ev2c-segmented-content">
              {item.icon ? <CeacIcon name={item.icon} size="meta" decorative /> : null}
              <span>{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
