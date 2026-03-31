export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-highest ${className ?? ""}`}
      style={style}
    />
  );
}
