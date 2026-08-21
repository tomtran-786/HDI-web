/** A single pulsing placeholder block, sized by `className`. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-tint ${className}`} />;
}
