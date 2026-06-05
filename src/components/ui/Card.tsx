import { type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'flat' | 'highlight'
  padding?:  'none' | 'sm' | 'md' | 'lg'
}

const variants = {
  default:   'bg-night-800 border border-night-700',
  elevated:  'bg-night-700 border border-night-600 shadow-card',
  flat:      'bg-night-800/50',
  highlight: 'bg-night-800 border border-accent-gold/30 shadow-glow',
}

const paddings = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl overflow-hidden',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between mb-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      className={clsx(
        'font-display font-semibold text-night-100 uppercase tracking-wide text-sm',
        className
      )}
    >
      {children}
    </h3>
  )
}
