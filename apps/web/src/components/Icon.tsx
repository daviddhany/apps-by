/** Thin wrapper around the Material Symbols Outlined icon font used throughout
 * the Stitch-derived design system (see tailwind.config.ts header comment). */
export function Icon({
  name,
  size = 20,
  filled = false,
  className = "",
}: {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "icon-fill" : ""} ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
