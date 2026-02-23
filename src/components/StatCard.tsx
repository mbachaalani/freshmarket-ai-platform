export default function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card space-y-2">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
      {hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
