export function Surface({
  as: Component = "div",
  variant = "plain",
  padding = "standard",
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={`ev2c-surface ev2c-surface-${variant} ev2c-surface-${padding} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
