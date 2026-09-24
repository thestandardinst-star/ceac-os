export default function Skeleton({ lines = 3, block = false, label = "Loading" }) {
  if (block) {
    return <div className="ceac-skeleton ceac-skeleton-block" role="status" aria-label={label} />;
  }
  return (
    <div className="ceac-skeleton-stack" role="status" aria-label={label}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <span key={index} className={"ceac-skeleton ceac-skeleton-line" + (index === lines - 1 ? " short" : "")} />
      ))}
    </div>
  );
}
