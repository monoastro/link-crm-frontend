// components/atoms/StatusDot.jsx
export function StatusDot({ show, title = "Deployment pending" }) {
  if (!show) return <span className="inline-block h-2 w-2" />;
  return (
    <span
      title={title}
      className="inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500 ring-2 ring-blue-100"
    />
  );
}
