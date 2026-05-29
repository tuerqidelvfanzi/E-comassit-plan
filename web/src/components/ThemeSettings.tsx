import { type ThemeId, useTheme } from '../lib/theme';

export function ThemeSettings() {
  const { theme, setTheme, options } = useTheme();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`cursor-pointer rounded-xl border p-4 transition ${
            theme === opt.id
              ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-focus-ring)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
          } bg-[var(--color-surface)]`}
        >
          <input
            type="radio"
            name="theme"
            className="sr-only"
            checked={theme === opt.id}
            onChange={() => setTheme(opt.id as ThemeId)}
          />
          <div className="theme-preview mb-3">
            {opt.preview.map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
          <p className="font-medium">{opt.label}</p>
          <p className="mt-1 text-xs text-muted">{opt.description}</p>
        </label>
      ))}
    </div>
  );
}
