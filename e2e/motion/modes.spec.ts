import { expect, test, type Locator, type Page } from '@playwright/test'
import { applyMode, MODES, modeName, type Mode } from './support.ts'

// Plan 008 §4, D-1 y D-9 con la implementación (VT4): en el Design Lab, los anfitriones que ya
// existen obedecen a los seis modos de movimiento (sistema normal o reducido × sin atributo,
// `reduce` o `full`), también con `full` cuando el sistema pide reducir. Corre en Chromium,
// Firefox y WebKit (D-10). Se compara cada motor consigo mismo; no hay capturas de referencia.
type Host = {
  name: string
  url: string
  locate: (page: Page) => Locator
  // Antes de medir (p. ej. elegir un fotograma fijo).
  prepare?: (page: Page) => Promise<void>
  // Animaciones vivas del anfitrión en un modo animado.
  live: number
  // Instante (ms) al que se congela la animación para fotografiarla: uno en que se distinga de
  // la pose reducida (parpadeo cerrado, un punto atenuado, las celdas dentro del medidor).
  freezeAt: number
  // Un fotograma fijo no se anima en ningún modo.
  fixed?: boolean
}

const sofiPortrait = (page: Page) =>
  page.locator('[class*="sofi-blink"]').first()

const HOSTS: Host[] = [
  {
    name: 'SofiPortrait · parpadeo',
    url: '/design-lab?s=sofi',
    locate: sofiPortrait,
    live: 1,
    // El segundo fotograma cerrado del primer parpadeo (bucle de 4,2 s; _sofi-blink.scss).
    freezeAt: 1950,
  },
  {
    name: 'SofiPortrait · fotograma fijo',
    url: '/design-lab?s=sofi',
    locate: sofiPortrait,
    prepare: (page) => page.getByText('F1', { exact: true }).click(),
    live: 0,
    freezeAt: 0,
    fixed: true,
  },
  {
    name: 'Spinner',
    url: '/design-lab?s=ui',
    locate: (page) => page.locator('[class*="_spinner_"]').first(),
    live: 3,
    // 0,9 s por vuelta: a 0,5 s el primer punto está atenuado y el resto aún no ha empezado.
    freezeAt: 500,
  },
  {
    name: 'Loader',
    url: '/design-lab?s=ui',
    locate: (page) => page.locator('[class*="_loader_"]').first(),
    live: 1,
    // 1,6 s por vuelta: a la mitad las celdas están dentro del medidor.
    freezeAt: 800,
  },
  {
    name: 'Ticker',
    url: '/design-lab?s=ui',
    // La ventana de titulares, que es donde se mueve el texto. Con todo el Ticker, la primera
    // captura difería de las demás solo en los píxeles de la etiqueta, que no se anima.
    locate: (page) => page.locator('[class*="_window_"]').first(),
    live: 1,
    // 46 s por vuelta: a una cuarta parte el texto ya se ha desplazado.
    freezeAt: 11_500,
  },
]

const runningCount = (host: Locator) =>
  host.evaluate(
    (element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === 'running').length,
  )

// Lo que define una animación, sin su instante: dos modos animados deben dar lo mismo.
const describeAnimations = (host: Locator) =>
  host.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .filter((animation) => animation.playState === 'running')
      .map((animation) => {
        const timing = animation.effect?.getComputedTiming()
        return {
          name: (animation as CSSAnimation).animationName,
          duration: timing?.duration,
          delay: timing?.delay,
          iterations: timing?.iterations,
        }
      }),
  )

// Congela el anfitrión a la misma altura de la animación para poder fotografiarlo, y lo suelta
// después: una animación CSS que sigue igual en el modo siguiente no se recrea, y seguiría quieta.
const freeze = (host: Locator, at: number) =>
  host.evaluate((element, time) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.pause()
      animation.currentTime = time
    }
  }, at)

const thaw = (host: Locator) =>
  host.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true }))
      animation.play()
  })

// Lo que aún no ha cargado se fotografía distinto de lo que se verá después: una tira sin
// decodificar sale en blanco y una fuente sin cargar cambia el texto. Se espera a las fuentes y a
// las imágenes de fondo del anfitrión, y a un fotograma.
const waitForRender = (host: Locator) =>
  host.evaluate(async (element) => {
    await document.fonts.ready
    const urls = new Set<string>()
    for (const node of [element, ...element.querySelectorAll('*')]) {
      for (const pseudo of [null, '::before', '::after']) {
        const image = getComputedStyle(node, pseudo).backgroundImage
        for (const match of image.matchAll(/url\("?([^")]+)"?\)/g))
          urls.add(match[1])
      }
    }
    await Promise.all(
      [...urls].map((url) => {
        const image = new Image()
        image.src = url
        return image.decode()
      }),
    )
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })

type Capture = { mode: Mode; animations: unknown[]; image: Buffer }

test.describe('anfitriones del Design Lab · los seis modos', () => {
  for (const host of HOSTS) {
    test(host.name, async ({ page }) => {
      // El servidor de desarrollo sigue sirviendo módulos del Lab después del evento `load`
      // (medido: decenas, hasta más de 0,5 s después, con el anfitrión ya visible) y, hasta que
      // acaban, el texto del Ticker se rasteriza distinto: sin esperar a que cese la red, la
      // primera captura salía con el texto más grueso en 8 de 25 repeticiones en Chromium, con
      // cualquier modo y orden. Con `networkidle`, 0 de 3 (sin ningún modo aplicado).
      await page.goto(host.url, { waitUntil: 'networkidle' })
      const element = host.locate(page)
      await expect(element).toBeVisible()
      await host.prepare?.(page)

      const captures: Capture[] = []
      for (const mode of MODES) {
        await test.step(modeName(mode), async () => {
          await applyMode(page, mode)
          const animated = mode.animated && !host.fixed
          await expect
            .poll(() => runningCount(element), { message: modeName(mode) })
            .toBe(animated ? host.live : 0)

          const animations = await describeAnimations(element)
          if (animated) await freeze(element, host.freezeAt)
          await waitForRender(element)
          captures.push({
            mode,
            animations,
            image: await element.screenshot(),
          })
          if (animated) await thaw(element)
        })
      }

      // Equivalencia: los tres modos que animan se ven y se definen igual, y los tres que
      // reducen también. Un fotograma fijo es un único grupo.
      const animated = captures.filter((c) => c.mode.animated && !host.fixed)
      const reduced = captures.filter((c) => !c.mode.animated || host.fixed)
      for (const group of [animated, reduced]) {
        const [first, ...rest] = group
        for (const other of rest) {
          const versus = `${modeName(other.mode)} frente a ${modeName(first.mode)}`
          expect
            .soft(other.animations, `animaciones: ${versus}`)
            .toEqual(first.animations)
          expect
            .soft(other.image.equals(first.image), `captura: ${versus}`)
            .toBe(true)
        }
      }

      // Control: la comparación distingue. Animado y reducido no pueden verse igual.
      if (animated.length > 0 && reduced.length > 0) {
        expect(
          animated[0].image.equals(reduced[0].image),
          'control: la captura animada y la reducida deberían diferir',
        ).toBe(false)
      }
    })
  }
})

// Plan §4.2 y §4.3: ninguno de los dos prefijos de `u.reduced-motion` añade especificidad. La
// rama forzada pierde el (0,1,0) que aportaba el atributo, y la del sistema nunca lo tuvo. Se
// mide con las reglas reales de la hoja: una regla posterior con el selector del consumidor, sin
// prefijo, tiene que ganarle a la reducida. Control: una regla anterior con `:root` delante (un
// prefijo que sí suma) le gana a esa misma regla posterior; así la medida distingue.
type SpecificityHost = {
  name: string
  token: string
  // Propiedad que fija la regla reducida del anfitrión y su valor.
  property: string
  reduced: string
  probe: string
  control: string
}

const SPECIFICITY_HOSTS: SpecificityHost[] = [
  {
    name: 'Spinner',
    token: '_spinner_',
    property: 'animation-name',
    reduced: 'none',
    probe: 'probe-specificity',
    control: 'control-specificity',
  },
  {
    name: 'Loader',
    token: '_loader_',
    property: 'display',
    reduced: 'none',
    // Con `position: absolute` un `inline-block` se calcula como `block`: el control es otro.
    probe: 'block',
    control: 'flex',
  },
  {
    name: 'Ticker',
    token: '_track_',
    property: 'animation-name',
    reduced: 'none',
    probe: 'probe-specificity',
    control: 'control-specificity',
  },
]

// Las dos ramas de la regla reducida: la del sistema (sin atributo) y la forzada.
const BRANCHES = [
  {
    name: 'sistema',
    mode: MODES[1],
    prefix: ':root:not([data-motion="full"])',
  },
  {
    name: 'forzada',
    mode: MODES[2],
    prefix: ':root[data-motion="reduce"]',
  },
] as const

test.describe('especificidad de los prefijos de movimiento reducido', () => {
  for (const host of SPECIFICITY_HOSTS) {
    test(host.name, async ({ page }) => {
      await page.goto('/design-lab?s=ui')
      await expect(
        page.locator(`[class*="${host.token}"]`).first(),
      ).toBeVisible()

      for (const branch of BRANCHES) {
        await applyMode(page, branch.mode)
        const outcome = await page.evaluate(
          ({ branchPrefix, ...spec }) => {
            const found: { selector: string; consumer: string }[] = []
            const walk = (rules: CSSRuleList) => {
              for (const rule of rules) {
                if ('cssRules' in rule) walk(rule.cssRules as CSSRuleList)
                if (!(rule instanceof CSSStyleRule)) continue
                // Se localiza también con `:is()` o sin envoltorio: si el prefijo sumara
                // especificidad, lo que debe fallar es la medida, no la búsqueda de la regla.
                const text = rule.selectorText.replaceAll("'", '"')
                const wrapped = /^:(?:where|is)\((.+?)\)\s+(.+)$/.exec(text)
                const consumer =
                  wrapped?.[1] === branchPrefix
                    ? wrapped[2]
                    : text.startsWith(`${branchPrefix} `)
                      ? text.slice(branchPrefix.length + 1)
                      : undefined
                if (
                  consumer?.includes(spec.token) &&
                  rule.style.getPropertyValue(spec.property) === spec.reduced
                )
                  found.push({ selector: rule.selectorText, consumer })
              }
            }
            for (const sheet of document.styleSheets) {
              try {
                walk(sheet.cssRules)
              } catch {
                // Hoja de otro origen: no es de la aplicación.
              }
            }
            if (found.length === 0) return { found: 0 }

            const consumer = found[0].consumer
            const target = document.querySelector(consumer)
            if (!target) return { found: found.length, missing: consumer }
            const read = () =>
              getComputedStyle(target).getPropertyValue(spec.property)
            const inject = (css: string) => {
              const style = document.createElement('style')
              style.textContent = css
              document.head.append(style)
              return style
            }

            const before = read()
            const control = inject(
              `:root ${consumer} { ${spec.property}: ${spec.control} }`,
            )
            const probeAfterControl = inject(
              `${consumer} { ${spec.property}: ${spec.probe} }`,
            )
            const withControl = read()
            control.remove()
            const withProbe = read()
            probeAfterControl.remove()
            return {
              found: found.length,
              before,
              withControl,
              withProbe,
              after: read(),
            }
          },
          { branchPrefix: branch.prefix, ...host },
        )

        const label = `${host.name} · rama ${branch.name}`
        expect(
          outcome.found,
          `${label}: no hay regla reducida`,
        ).toBeGreaterThan(0)
        expect(outcome).toMatchObject({
          // La regla reducida del anfitrión manda en este modo.
          before: host.reduced,
          // Control: con un selector que suma especificidad, la regla posterior pierde.
          withControl: host.control,
          // La regla del consumidor, posterior y sin prefijo, le gana: el prefijo no suma.
          withProbe: host.probe,
          // Al quitar las pruebas vuelve la regla real.
          after: host.reduced,
        })
      }
    })
  }
})
