import type { ButtonHTMLAttributes } from 'react'

const variants = {
  primary: 'bg-brand-strong text-white shadow-press active:translate-y-1 active:shadow-none',
  secondary: 'bg-surface text-ink border-2 border-line shadow-press active:translate-y-1 active:shadow-none',
  ghost: 'bg-transparent text-ink hover:bg-line/50',
  danger: 'bg-danger text-white shadow-press active:translate-y-1 active:shadow-none',
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
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-extrabold uppercase tracking-wide
        transition-transform duration-[var(--duration-fast)] focus-visible:outline-3 focus-visible:outline-offset-2
        focus-visible:outline-brand disabled:opacity-60 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  )
}
