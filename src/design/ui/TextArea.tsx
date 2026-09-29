import { useId } from 'react'

type Props = { label: string; value: string; onChange: (v: string) => void; minChars?: number; disabled?: boolean }

export function TextArea({ label, value, onChange, minChars, disabled }: Props) {
  const id = useId()
  const count = value.trim().length
  const invalid = minChars !== undefined && count < minChars
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-bold">{label}</label>
      <textarea id={id} value={value} disabled={disabled} rows={3}
        aria-invalid={invalid} aria-describedby={minChars ? `${id}-count` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-card border-2 border-line bg-surface p-3 focus:border-brand focus:outline-none disabled:opacity-60" />
      {minChars !== undefined && (
        <span id={`${id}-count`} className={`self-end text-sm ${invalid ? 'text-muted' : 'text-success font-bold'}`}>
          {Math.min(count, minChars)}/{minChars}
        </span>
      )}
    </div>
  )
}
