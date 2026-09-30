const BRAND_MARK_SIZES = Object.freeze({
  sm: 32,
  md: 36,
  lg: 42,
});

export function BrandMark({
  size = "md",
  className = "",
  decorative = true,
  label = "CEAC OS",
}) {
  const pixels = BRAND_MARK_SIZES[size] ?? BRAND_MARK_SIZES.md;

  return (
    <img
      src="/ceac-icon-192.png"
      width={pixels}
      height={pixels}
      className={`ev2c-brand-mark ev2c-brand-mark-${size} ${className}`.trim()}
      alt={decorative ? "" : label}
      aria-hidden={decorative ? "true" : undefined}
      decoding="async"
      fetchPriority="high"
      draggable="false"
    />
  );
}

export default BrandMark;
