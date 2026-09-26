import { useState } from "react";

function initialsFor(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

export function Avatar({
  src,
  alt = "",
  name = "",
  size = "md",
  className = "",
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={`ev2c-avatar ev2c-avatar-${size} ${className}`.trim()}
      aria-label={!showImage && name ? name : undefined}
      role={!showImage && name ? "img" : undefined}
    >
      {showImage ? (
        <img src={src} alt={alt} onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initialsFor(name)}</span>
      )}
    </span>
  );
}
