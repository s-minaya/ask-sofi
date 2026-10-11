// Valores que documenta Foundations. Repiten a propósito los de los SCSS: un test de
// contrato comprueba que coinciden, para que la documentación no se quede atrás.

export type Theme = 'light' | 'dark'

export const TONES = {
  ink: '#100819',
  cream: '#fff5e8',
  white: '#ffffff',
  pink: '#ff5c8d',
  pinkSoft: '#fc99aa',
  butter: '#ffe36e',
  lilac: '#c9a7f5',
  cherry: '#c8173f',
} as const

export type SemanticToken = {
  name: string
  role: string
  // Valor CSS tal cual aparece en _themes.scss.
  light: string
  dark: string
  // Para los valores con transparencia, cómo se leen en la tabla.
  lightLabel?: string
  darkLabel?: string
}

export const SEMANTIC_TOKENS: ReadonlyArray<SemanticToken> = [
  {
    name: '--color-bg',
    role: 'Fondo de página',
    light: '#fff5e8',
    dark: '#100819',
  },
  {
    name: '--color-bg-alt',
    role: 'Escenarios y laboratorio',
    light: '#fce6d6',
    dark: '#1d1128',
  },
  {
    name: '--color-surface',
    role: 'Papel: campos, diálogos, pegatinas',
    light: '#ffffff',
    dark: '#22152e',
  },
  {
    name: '--color-on-surface',
    role: 'Texto sobre papel',
    light: '#100819',
    dark: '#fff5e8',
  },
  {
    name: '--color-on-surface-subtle',
    role: 'Ayudas y marcadores sobre papel',
    light: '#66576a',
    dark: '#b9a7b6',
  },
  {
    name: '--color-text',
    role: 'Texto principal y reglas',
    light: '#100819',
    dark: '#fff5e8',
  },
  {
    name: '--color-border',
    role: 'Contorno de estructura: tarjetas, cabeceras y controles',
    light: 'var(--color-text)',
    dark: 'var(--color-text)',
    lightLabel: 'alias de --color-text',
    darkLabel: 'alias de --color-text',
  },
  {
    name: '--color-text-muted',
    role: 'Texto secundario',
    light: '#47394a',
    dark: '#dccbd6',
  },
  {
    name: '--color-text-subtle',
    role: 'Texto terciario y contadores',
    light: '#66576a',
    dark: '#b3a1b0',
  },
  {
    name: '--color-rule-soft',
    role: 'Reglas suaves entre filas',
    light: 'rgb(16 8 25 / 16%)',
    dark: 'rgb(255 245 232 / 18%)',
    lightLabel: 'tinta al 16 %',
    darkLabel: 'crema al 18 %',
  },
  {
    name: '--color-accent',
    role: 'Acción principal y destacados',
    light: '#ff5c8d',
    dark: '#ff6f9a',
  },
  {
    name: '--color-focus',
    role: 'Anillo de foco',
    light: '#100819',
    dark: '#ffe36e',
  },
  {
    name: '--color-ring',
    role: 'Anillo interior de pegatina',
    light: '#ffffff',
    dark: '#fff5e8',
  },
  {
    name: '--color-bubble-border',
    role: 'Borde de la burbuja pixel',
    light: '#100819',
    dark: '#fff5e8',
  },
  {
    name: '--color-danger',
    role: 'Texto y borde de error',
    light: '#c8173f',
    dark: '#ff8fa3',
  },
  {
    name: '--color-dot',
    role: 'Trama de puntos, decorativa',
    light: 'rgb(255 92 141 / 55%)',
    dark: 'rgb(255 111 154 / 34%)',
    lightLabel: 'rosa al 55 %',
    darkLabel: 'rosa al 34 %',
  },
  {
    name: '--color-cell-on',
    role: 'Celda encendida del medidor',
    light: '#100819',
    dark: '#fff5e8',
  },
  {
    name: '--color-cell-off',
    role: 'Celda apagada del medidor',
    light: 'rgb(16 8 25 / 14%)',
    dark: 'rgb(255 245 232 / 18%)',
    lightLabel: 'tinta al 14 %',
    darkLabel: 'crema al 18 %',
  },
  {
    name: '--color-badge-warn-border',
    role: 'Borde de la insignia de aviso',
    light: '#100819',
    dark: '#fff5e8',
  },
  {
    name: '--color-control-accent',
    role: 'Casillas y controles nativos',
    light: '#100819',
    dark: '#ffe36e',
  },
]

export function themeValue(name: string, theme: Theme): string {
  const token = SEMANTIC_TOKENS.find((item) => item.name === name)
  if (!token) throw new Error(`Token sin documentar: ${name}`)
  return token[theme]
}

export function displayValue(token: SemanticToken, theme: Theme): string {
  const label = theme === 'light' ? token.lightLabel : token.darkLabel
  return label ?? token[theme].toUpperCase()
}

export type PaletteColor = {
  name: string
  hex: string
  tokens: ReadonlyArray<string>
  note: string
  // Franja con el valor en tema oscuro, cuando cambia.
  dark?: { background: string; color: string; label: string }
  isNew?: boolean
}

export const PALETTE: ReadonlyArray<PaletteColor> = [
  {
    name: 'Tinta',
    hex: TONES.ink,
    tokens: ['--tone-ink', '--color-text'],
    note: 'Texto, reglas de 2,5 px y el contorno de todas las pegatinas. En oscuro pasa a ser el fondo.',
    dark: { background: TONES.cream, color: TONES.ink, label: 'oscuro: texto' },
  },
  {
    name: 'Crema',
    hex: TONES.cream,
    tokens: ['--tone-cream', '--color-bg'],
    note: 'Fondo de página. Nunca blanco puro de fondo: el blanco se reserva para el papel.',
    dark: { background: TONES.ink, color: TONES.cream, label: 'oscuro: fondo' },
  },
  {
    name: 'Rosa exclusiva',
    hex: TONES.pink,
    tokens: ['--tone-pink', '--color-accent'],
    note: 'Acción principal, destacados y la versión más probable. Siempre de fondo, con tinta encima.',
    dark: {
      background: themeValue('--color-accent', 'dark'),
      color: TONES.ink,
      label: themeValue('--color-accent', 'dark').toUpperCase(),
    },
  },
  {
    name: 'Mantequilla',
    hex: TONES.butter,
    tokens: ['--tone-butter'],
    note: 'Hover y pulsado, avisos de atención, pistas e insignias de confianza. Foco en tema oscuro.',
  },
  {
    name: 'Lila',
    hex: TONES.lilac,
    tokens: ['--tone-lilac'],
    note: 'Información y todo lo que sea demo o laboratorio. Nunca en degradado.',
  },
  {
    name: 'Rosa chicle',
    hex: TONES.pinkSoft,
    tokens: ['--tone-pink-soft'],
    note: 'Superficies secundarias: el consejo de Sofi y los fondos del fotomatón.',
  },
  {
    name: 'Papel',
    hex: TONES.white,
    tokens: ['--tone-white', '--color-surface', '--color-ring'],
    note: 'Campos, cuadros de diálogo y el anillo interior de las pegatinas.',
    dark: {
      background: themeValue('--color-surface', 'dark'),
      color: TONES.cream,
      label: themeValue('--color-surface', 'dark').toUpperCase(),
    },
  },
  {
    name: 'Cereza',
    hex: TONES.cherry,
    tokens: ['--tone-cherry', '--color-danger'],
    note: 'Solo errores: fallos del servicio y validación. Siempre con icono y texto, nunca solo el color.',
    dark: {
      background: themeValue('--color-danger', 'dark'),
      color: TONES.ink,
      label: `texto: ${themeValue('--color-danger', 'dark').toUpperCase()}`,
    },
    isNew: true,
  },
]

export type ContrastPair = {
  label: string
  foreground: string
  background: string
}

// Parejas de texto permitidas. La última se muestra para dejar claro que no lo es.
export const CONTRAST_PAIRS: ReadonlyArray<ContrastPair> = [
  {
    label: 'Tinta sobre crema',
    foreground: themeValue('--color-text', 'light'),
    background: themeValue('--color-bg', 'light'),
  },
  {
    label: 'Texto secundario sobre crema',
    foreground: themeValue('--color-text-muted', 'light'),
    background: themeValue('--color-bg', 'light'),
  },
  {
    label: 'Texto terciario sobre crema',
    foreground: themeValue('--color-text-subtle', 'light'),
    background: themeValue('--color-bg', 'light'),
  },
  { label: 'Tinta sobre rosa', foreground: TONES.ink, background: TONES.pink },
  {
    label: 'Tinta sobre mantequilla',
    foreground: TONES.ink,
    background: TONES.butter,
  },
  { label: 'Tinta sobre lila', foreground: TONES.ink, background: TONES.lilac },
  {
    label: 'Tinta sobre rosa chicle',
    foreground: TONES.ink,
    background: TONES.pinkSoft,
  },
  {
    label: 'Blanco sobre cereza',
    foreground: TONES.white,
    background: TONES.cherry,
  },
  {
    label: 'Cereza sobre crema',
    foreground: themeValue('--color-danger', 'light'),
    background: themeValue('--color-bg', 'light'),
  },
  {
    label: 'Oscuro · crema sobre fondo',
    foreground: themeValue('--color-text', 'dark'),
    background: themeValue('--color-bg', 'dark'),
  },
  {
    label: 'Oscuro · texto terciario sobre fondo',
    foreground: themeValue('--color-text-subtle', 'dark'),
    background: themeValue('--color-bg', 'dark'),
  },
  {
    label: 'Oscuro · rosa sobre fondo',
    foreground: themeValue('--color-accent', 'dark'),
    background: themeValue('--color-bg', 'dark'),
  },
  {
    label: 'Oscuro · error sobre fondo',
    foreground: themeValue('--color-danger', 'dark'),
    background: themeValue('--color-bg', 'dark'),
  },
  {
    label: 'Oscuro · ayuda sobre papel',
    foreground: themeValue('--color-on-surface-subtle', 'dark'),
    background: themeValue('--color-surface', 'dark'),
  },
  {
    label: 'Rosa sobre crema',
    foreground: TONES.pink,
    background: TONES.cream,
  },
]

// Escala de espacio: --space-1 … --space-11.
export const SPACE_SCALE: ReadonlyArray<number> = [
  4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80,
]

// Umbrales estructurales del diseño aprobado, en px.
export const THRESHOLDS = { header: 760, stage: 960, columns: 1080 } as const

// Duraciones de los tokens de movimiento, en ms.
export const DURATIONS_MS = {
  ui: 120,
  caret: 1000,
  spin: 900,
  loader: 1600,
  ticker: 46000,
  blink: 4200,
} as const

// Línea de tiempo de _sofi-blink.scss: un parpadeo, una pausa y un parpadeo doble.
export type BlinkFrame = 0 | 1 | 2
export const BLINK_TIMELINE: ReadonlyArray<readonly [BlinkFrame, number]> = [
  [0, 1800],
  [1, 100],
  [2, 100],
  [1, 100],
  [0, 1400],
  [1, 100],
  [2, 100],
  [1, 100],
  [0, 100],
  [1, 100],
  [2, 100],
  [1, 100],
]

// «120 ms», «1 s», «4,2 s»: milisegundos por debajo del segundo y coma decimal.
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  return `${String(ms / 1000).replace('.', ',')} s`
}
