import type { SVGProps } from 'react'
import { rem } from '../../../utils/rem'

// Iconos de trazo (2 px sobre 24) e iconos pixel (crispEdges). Siempre decorativos:
// el nombre accesible lo pone el control que los contiene. Los de trazo acompañan
// a texto y crecen con él (rem); los pixel se quedan en px para no perder la rejilla.
type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function strokeProps({ size = 20, ...props }: IconProps) {
  return {
    width: rem(size),
    height: rem(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true,
    focusable: false,
    ...props,
  } as const
}

export function SoundOnIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)} strokeLinejoin="round">
      <path d="M3.5 9.5h3.5l4.5-4v13l-4.5-4H3.5z" />
      <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" />
    </svg>
  )
}

export function SoundOffIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)} strokeLinejoin="round">
      <path d="M3.5 9.5h3.5l4.5-4v13l-4.5-4H3.5z" />
      <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
    </svg>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </svg>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z" />
    </svg>
  )
}

export function SystemIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="5" y="10.5" width="14" height="10" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function ScissorsIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.2 7.8L20 18M8.2 16.2L20 6" />
    </svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)} strokeLinejoin="round">
      <path d="M7 4.5l12 7.5-12 7.5z" />
    </svg>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M8 5v14M16 5v14" />
    </svg>
  )
}

export function RetryIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M19 12a7 7 0 1 1-2.05-4.95" />
      <path d="M19 4v4h-4" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

// Controles del ticker: macizos, a 16 px.
export function TickerPauseIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      focusable={false}
      {...props}
    >
      <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
      <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
    </svg>
  )
}

export function TickerPlayIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path d="M4 2l10 6-10 6z" fill="currentColor" />
    </svg>
  )
}

// --- Iconos pixel ---

export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path fill="currentColor" d="M3 0h2v3h3v2H5v3H3V5H0V3h3z" />
    </svg>
  )
}

// Flecha «sigue leyendo» del diálogo de novela visual.
export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 10 6"
      shapeRendering="crispEdges"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path fill="currentColor" d="M0 0h10v2H8v2H6v2H4V4H2V2H0z" />
    </svg>
  )
}

export function ErrorPixelIcon({
  size = 16,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M0 0h8v8H0z M3 1h2v4H3z M3 6h2v1H3z"
      />
    </svg>
  )
}

export function LiveSquareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 2 2"
      shapeRendering="crispEdges"
      aria-hidden
      focusable={false}
      {...props}
    >
      <rect width="2" height="2" fill="var(--tone-pink)" />
    </svg>
  )
}
