import { CeacIcon } from "../icons";

const DEFAULT_ICONS = {
  action: "info",
  success: "checkCircle",
  warning: "warning",
  danger: "error",
};

export function StatusBadge({
  tone = "neutral",
  icon,
  children,
  className = "",
}) {
  const resolvedIcon = icon === false ? null : icon || DEFAULT_ICONS[tone];

  return (
    <span className={`ev2c-status ev2c-status-${tone} ${className}`.trim()}>
      {resolvedIcon ? <CeacIcon name={resolvedIcon} size="meta" decorative /> : null}
      <span>{children}</span>
    </span>
  );
}
