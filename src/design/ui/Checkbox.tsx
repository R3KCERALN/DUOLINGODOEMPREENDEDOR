import { useId } from 'react'

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }

export function Checkbox({ checked, onChange, label, disabled }: Props) {
  const id = useId()
  return (
    <label htmlFor={id} className="relative flex min-h-12 cursor-pointer items-center gap-3 rounded-card px-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <input id={id} type="checkbox" checked={checked} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer size-7 shrink-0 appearance-none rounded-lg border-2 border-line bg-surface
          checked:border-success checked:bg-success focus-visible:outline-3 focus-visible:outline-brand" />
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute ml-[5px] hidden size-[18px] text-white peer-checked:block">
        <path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="peer-checked:text-muted peer-checked:line-through">{label}</span>
    </label>
  )
}
