import { CeacIcon } from "../icons";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  size = "default",
  icon,
  iconPosition = "start",
  busy = false,
  children,
  className,
  disabled,
  type = "button",
  ...props
}) {
  const isDisabled = disabled || busy;

  return (
    <button
      type={type}
      className={joinClasses(
        "ev2c-button",
        `ev2c-button-${variant}`,
        `ev2c-button-${size}`,
        className,
      )}
      disabled={isDisabled}
      aria-busy={busy || undefined}
      {...props}
    >
      {icon && iconPosition === "start" ? (
        <CeacIcon name={busy ? "pending" : icon} size="control" decorative />
      ) : null}
      <span>{children}</span>
      {icon && iconPosition === "end" ? (
        <CeacIcon name={busy ? "pending" : icon} size="control" decorative />
      ) : null}
    </button>
  );
}

export function IconButton({
  label,
  icon,
  variant = "secondary",
  size = "default",
  className,
  disabled,
  type = "button",
  ...props
}) {
  if (!label && import.meta.env.DEV) {
    console.warn("Experience V2 IconButton requires an accessible label.");
  }

  return (
    <button
      type={type}
      className={joinClasses(
        "ev2c-icon-button",
        `ev2c-icon-button-${variant}`,
        `ev2c-icon-button-${size}`,
        className,
      )}
      aria-label={label}
      disabled={disabled}
      {...props}
    >
      <CeacIcon name={icon} size="nav" decorative />
    </button>
  );
}
