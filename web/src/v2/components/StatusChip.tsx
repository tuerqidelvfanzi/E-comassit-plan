const styles: Record<string, string> = {
  done: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  completed: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  ready: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  running: 'bg-sky-500/15 text-sky-800',
  filling: 'bg-sky-500/15 text-sky-800',
  pending: 'bg-amber-500/15 text-amber-900',
  draft: 'bg-zinc-500/15 text-zinc-700',
  failed: 'bg-red-500/15 text-red-800',
  idle: 'bg-zinc-500/15 text-zinc-600',
  queued: 'bg-violet-500/15 text-violet-800',
};

export function StatusChip({ status }: { status: string }) {
  const cls = styles[status] ?? styles.idle;
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
