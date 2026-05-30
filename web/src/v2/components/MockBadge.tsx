export function MockBadge({ label = 'Mock 演示' }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
      {label}
    </span>
  );
}
