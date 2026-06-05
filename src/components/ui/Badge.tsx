import clsx from 'clsx'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'position'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  size?: 'xs' | 'sm' | 'md'
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-night-700 text-night-300',
  success:  'bg-accent-green/20 text-accent-green',
  warning:  'bg-accent-orange/20 text-accent-orange',
  danger:   'bg-accent-red/20 text-accent-red',
  info:     'bg-accent-blue/20 text-accent-blue',
  gold:     'bg-accent-gold/20 text-accent-gold',
  position: 'bg-night-600 text-night-100 font-mono font-semibold',
}

const sizes = {
  xs: 'text-2xs px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded font-body font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * Badge específico para posição de jogador
 */
export function PositionBadge({ position }: { position: string }) {
  const isGoalkeeper = position === 'GK'
  const isDefender   = ['CB', 'LB', 'RB'].includes(position)
  const isMidfielder = ['CDM','CM','CAM','LM','RM'].includes(position)

  return (
    <Badge
      variant="position"
      size="xs"
      className={clsx({
        'text-amber-400':  isGoalkeeper,
        'text-sky-400':    isDefender,
        'text-emerald-400':isMidfielder,
        'text-rose-400':   !isGoalkeeper && !isDefender && !isMidfielder,
      })}
    >
      {position}
    </Badge>
  )
}

/**
 * Badge de rating numérico (0–10 ou 1–20)
 */
export function RatingBadge({ value, max = 20 }: { value: number; max?: number }) {
  const pct = value / max
  const variant =
    pct >= 0.8 ? 'gold' :
    pct >= 0.65 ? 'success' :
    pct >= 0.45 ? 'default' : 'danger'

  return (
    <Badge variant={variant} size="xs" className="font-mono tabular-nums">
      {value}
    </Badge>
  )
}
