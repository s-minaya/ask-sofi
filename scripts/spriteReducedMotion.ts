import type { AtRule, Plugin, Rule } from 'postcss'

// Plugin PostCSS en línea y sin dependencias (plan 008 §4.3). Los parciales de los ZIP
// condicionan sus animaciones con `prefers-reduced-motion`, que no puede obedecer al
// modo forzado `data-motion` de <html>. Aquí, solo en los módulos dueños, cada bloque
// pasa a depender también de ese atributo, sin tocar el parcial ni sumar especificidad:
//
//   @media (… : reduce)        →  en el sitio: :where(:root:not([data-motion='full'])) X
//                                 clon detrás: :where(:root[data-motion='reduce']) X
//   @media (… : no-preference) →  en el sitio: :where(:root:not([data-motion='reduce'])) X
//                                 clon detrás: :where(:root[data-motion='full']) X
//
// El clon ocupa la posición de su bloque en la cascada. Lo que el plan no cubre
// rompe el build: otra media, `html`/`:root`/`body` en un selector, reglas anidadas.

const SCOPE = '/src/components/sofi/sprites/'

const PREFIXES = {
  reduce: {
    system: ":where(:root:not([data-motion='full']))",
    forced: ":where(:root[data-motion='reduce'])",
  },
  'no-preference': {
    system: ":where(:root:not([data-motion='reduce']))",
    forced: ":where(:root[data-motion='full'])",
  },
} as const

type Motion = keyof typeof PREFIXES

function motionOf(media: AtRule): Motion {
  // Mayúsculas y espacios no cambian la condición.
  const condition = media.params.toLowerCase().replace(/\s+/g, '')
  if (condition === '(prefers-reduced-motion:reduce)') return 'reduce'
  if (condition === '(prefers-reduced-motion:no-preference)')
    return 'no-preference'
  throw media.error(
    `Parcial de sprite: solo se admite @media (prefers-reduced-motion: reduce | no-preference), no «@media ${media.params}».`,
  )
}

// Sin los corchetes de atributos ni las cadenas: `[data-x='html']` o `.html` no son `html`.
function rootsInSelector(selector: string): boolean {
  const bare = selector.replace(/\[[^\]]*\]/g, '[]').replace(/(['"]).*?\1/g, '')
  return /(^|[\s>+~,(])(html|body|:root)(?![\w-])/i.test(bare)
}

function checkRule(rule: Rule): void {
  if (rule.parent?.type === 'rule') {
    throw rule.error(
      `Parcial de sprite: reglas anidadas no admitidas («${rule.selector}»).`,
    )
  }
  if (rootsInSelector(rule.selector)) {
    throw rule.error(
      `Parcial de sprite: un selector no puede apuntar a html, :root ni body («${rule.selector}»); el ámbito de movimiento lo pone el plugin.`,
    )
  }
}

export function spriteReducedMotion(): Plugin {
  return {
    postcssPlugin: 'ask-sofi:sprite-reduced-motion',
    Once(root) {
      const file = root.source?.input.file?.replaceAll('\\', '/')
      if (!file?.includes(SCOPE)) return

      root.walkRules((rule) => {
        // Los pasos de @keyframes (from, 50 %…) no son selectores de elementos.
        if (
          rule.parent?.type === 'atrule' &&
          /keyframes$/i.test((rule.parent as AtRule).name)
        )
          return
        checkRule(rule)
      })

      root.walkAtRules('media', (media) => {
        if (media.parent?.type !== 'root') {
          throw media.error(
            'Parcial de sprite: @media anidada en una regla o en otro grupo; solo se admite al nivel de la hoja.',
          )
        }
        const motion = motionOf(media)
        const rules: Rule[] = []
        media.each((child) => {
          if (child.type !== 'rule') {
            throw child.error(
              'Parcial de sprite: un bloque de movimiento solo puede contener reglas.',
            )
          }
          rules.push(child)
        })

        const { system, forced } = PREFIXES[motion]
        const prefix = (rule: Rule, by: string) =>
          rule.clone({ selectors: rule.selectors.map((s) => `${by} ${s}`) })
        const clones = rules.map((rule) => prefix(rule, forced))
        for (const rule of rules) rule.replaceWith(prefix(rule, system))
        media.after(clones)
      })
    },
  }
}
