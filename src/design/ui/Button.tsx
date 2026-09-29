import type { ButtonHTMLAttributes } from 'react'

const pressable = 'active:translate-y-1 active:shadow-none'
const variants = {
  primary: `bg-brand text-on-brand shadow-[0_4px_0_0_var(--color-brand-deep)] hover:bg-brand-strong hover:glow active:bg-brand-press ${pressable}`,
  secondary: `bg-raised text-ink border-2 border-line shadow-press hover:border-muted ${pressable}`,
  ghost: 'bg-transparent text-ink hover:bg-raised',
  danger: `bg-danger text-on-brand shadow-[0_4px_0_0_#6B2418] ${pressable}`,
}
const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-12 px-5 text-base', lg: 'h-14 px-6 text-lg' }

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-control font-extrabold uppercase tracking-wider
        transition-[translate,background-color,box-shadow] duration-[var(--duration-fast)] focus-visible:outline-3
        focus-visible:outline-offset-3 focus-visible:outline-ink disabled:opacity-60 disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <span className="size-2.5 animate-spin bg-current" aria-hidden />}
      {children}
    </button>
  )
}
