import { useId } from 'react'
import { PixelIcon } from './PixelIcon'

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }

export function Checkbox({ checked, onChange, label, disabled }: Props) {
  const id = useId()
  return (
    <label htmlFor={id} className="relative flex min-h-12 cursor-pointer items-center gap-3 rounded-control px-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <input id={id} type="checkbox" checked={checked} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer size-7 shrink-0 appearance-none rounded-[4px] border-2 border-line bg-bg
          checked:border-brand checked:bg-brand checked:glow
          focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink" />
      <PixelIcon name="check" className="pointer-events-none absolute ml-[7px] hidden size-[14px] text-on-brand peer-checked:block" />
      <span className="peer-checked:text-muted peer-checked:line-through">{label}</span>
    </label>
  )
}
