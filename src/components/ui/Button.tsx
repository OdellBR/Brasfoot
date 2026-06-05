import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  icon?:     ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-accent-green text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-sm',
  secondary: 'bg-night-700 text-night-100 hover:bg-night-600 active:bg-night-500 border border-night-600',
  ghost:     'text-night-300 hover:text-night-100 hover:bg-night-700/50',
  danger:    'bg-accent-red text-white hover:bg-red-500 active:bg-red-700',
  gold:      'bg-accent-gold text-night-900 font-semibold hover:bg-amber-400 active:bg-amber-600',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        disabled={disabled || loading}
        className={clsx(
          // Base
          'inline-flex items-center justify-center rounded-lg font-body font-medium',
          'transition-colors duration-150 focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-accent-green/50',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          // Variant
          variants[variant],
          // Size
          sizes[size],
          // Width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
        {children}
        {!loading && iconRight}
      </button>
    )
  }
)

Button.displayName = 'Button'
