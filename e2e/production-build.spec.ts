import { expect, test } from '@playwright/test'
import postcss from 'postcss'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join, relative } from 'node:path'
import { entryAssets, gzipSize } from '../scripts/loadMetrics.ts'

// Lo que se publica es solo lo que emite `vite build`: lo que importa `src/` más
// `public/`. Este contrato impide que material de trabajo llegue a producción.
const ALLOWED_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.css',
  '.webp',
  '.woff2',
  '.mp3',
])

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(directory, entry.name))
      : [join(directory, entry.name)],
  )
}

// --- Recursos visuales de Sofi (plan 008 §7 y §10) ---------------------------------------

const SPRITES_DIR = 'src/styles/sprites'
const OWNERS_DIR = 'src/components/sofi/sprites'
const REGISTRY = 'src/components/sofi/visual/registry.ts'

// Plan §7: `sofi-blink` es el único recurso estático (la pantalla lo necesita al montarse).
const STATIC_IDS = ['sofi-blink']

// Objetivos provisionales de plan §7 (D-5): se registran en cada build y NO son umbral hasta
// que la autora los apruebe (EX4). La referencia es la línea base de EX1.
const PROVISIONAL_ENTRY_CSS_GZIP_BASELINE = 9780
const PROVISIONAL_ENTRY_CSS_GZIP_MARGIN = 2000

const ownerIds = readdirSync(OWNERS_DIR)
  .filter((file) => file.endsWith('.module.scss'))
  .map((file) => file.slice(0, -'.module.scss'.length))
// Los recursos diferidos son los que el registro carga con `import()`: no se repiten aquí.
const deferredIds = [
  ...readFileSync(REGISTRY, 'utf8').matchAll(
    /load:\s*\(\)\s*=>\s*import\('\.\.\/sprites\/([\w-]+)'\)/g,
  ),
].map((match) => match[1])
// Los que ni son estáticos ni tienen cargador solo los pinta el Lab.
const labOnlyIds = ownerIds.filter(
  (id) => !STATIC_IDS.includes(id) && !deferredIds.includes(id),
)

// A qué recurso pertenece una tira: su nombre empieza por el id (el prefijo más largo).
function idOfStrip(file: string): string {
  const stem = file.slice(0, -'.webp'.length)
  return ownerIds
    .filter((id) => stem === id || stem.startsWith(`${id}-`))
    .sort((a, b) => b.length - a.length)[0]
}

const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex')

const strips = readdirSync(SPRITES_DIR)
  .filter((file) => file.endsWith('.webp'))
  .map((file) => {
    const bytes = readFileSync(join(SPRITES_DIR, file))
    return {
      file,
      id: idOfStrip(file),
      sha: sha256(bytes),
      // El principio en base64 basta para reconocer la tira incrustada.
      inlined: bytes.toString('base64').slice(0, 240),
    }
  })

test.describe('production build', () => {
  // Una sola compilación compartida por las tres comprobaciones.
  test.describe.configure({ mode: 'serial' })

  let outDir = ''
  let files: string[] = []

  test.beforeAll(() => {
    outDir = mkdtempSync(join(tmpdir(), 'ask-sofi-build-'))
    execFileSync(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'build',
        '--outDir',
        outDir,
        '--emptyOutDir',
      ],
      { stdio: 'pipe' },
    )
    files = listFiles(outDir).map((file) => relative(outDir, file))
  })

  test.afterAll(() => {
    rmSync(outDir, { recursive: true, force: true })
  })

  test('only publishes the web file types the application needs', () => {
    const unexpected = files.filter(
      (file) => !ALLOWED_EXTENSIONS.has(extname(file)),
    )
    expect(unexpected).toEqual([])
  })

  test('does not publish the art direction, the logo master or the MSW worker', () => {
    const forbidden = files.filter((file) =>
      /art-direction|logo-master|approved-screens|design-lab-c|mockServiceWorker/i.test(
        file,
      ),
    )
    expect(forbidden).toEqual([])
  })

  test('does not ship the Design Lab, the mocks or their copy in the bundle', () => {
    const code = files
      .filter((file) => file.endsWith('.js') || file.endsWith('.html'))
      .map((file) => readFileSync(join(outDir, file), 'utf8'))
      .join('\n')

    for (const marker of [
      'Design Lab',
      'Experience Preview',
      'Demo · datos simulados',
      'mockServiceWorker',
      'setupWorker',
    ]) {
      expect(code, marker).not.toContain(marker)
    }
  })

  // --- Recursos visuales de Sofi ---

  const read = (list: string[]) =>
    list.map((file) => readFileSync(join(outDir, file), 'utf8')).join('\n')
  const bundleCode = () =>
    read(files.filter((file) => /\.(js|css)$/.test(file)))
  const emitted = (pattern: RegExp) =>
    files.filter((file) => pattern.test(basename(file)))
  const chunkOf = (ids: string[], ext: string) =>
    new RegExp(`^(${ids.join('|')})-[\\w-]{8}\\.${ext}$`)
  const emittedShas = () =>
    new Set(
      files
        .filter((file) => file.endsWith('.webp'))
        .map((file) => sha256(readFileSync(join(outDir, file)))),
    )
  // Nombre local de los `@keyframes` de un CSS (los CSS Modules los dejan `_<local>_<hash>_<n>`).
  const keyframeNames = (css: string) =>
    [...css.matchAll(/@keyframes\s+_([\w-]+?)_[a-z0-9]{4,6}_\d+/g)].map(
      (match) => match[1],
    )
  // Los de un recurso son suyos: a diferencia de sus clases (`.error` existe en la aplicación),
  // nadie más los llama igual. Un parcial duplicado cambia de hash pero no de nombre local.
  const keyframesOf = (ids: string[]) =>
    emitted(chunkOf(ids, 'css')).flatMap((file) => keyframeNames(read([file])))
  // Lo que carga el documento: el resto se pide después.
  const entry = () => {
    const assets = entryAssets(readFileSync(join(outDir, 'index.html'), 'utf8'))
    const local = (urls: string[]) => urls.map((url) => url.replace(/^\//, ''))
    return {
      scripts: local(assets.scripts),
      stylesheets: local(assets.stylesheets),
      preloads: local(assets.preloads),
    }
  }
  // Nombre emitido de las tiras de un recurso, por contenido (Vite las renombra con un hash).
  const emittedStripFiles = (id: string) => {
    const shas = new Set(strips.filter((s) => s.id === id).map((s) => s.sha))
    return files
      .filter((file) => file.endsWith('.webp'))
      .filter((file) => shas.has(sha256(readFileSync(join(outDir, file)))))
  }

  test('the ids of the sprite resources match the plan', () => {
    expect(STATIC_IDS.every((id) => ownerIds.includes(id))).toBe(true)
    expect([...labOnlyIds].sort()).toEqual(['eureka', 'suspicious'])
    expect(deferredIds).not.toContain('sofi-blink')
    expect(strips.every((strip) => strip.id)).toBe(true)
  })

  test('emits the strips of Sofi as files and never inlines them in CSS or JS', () => {
    const shas = emittedShas()
    const inlined = strips
      .filter((strip) => bundleCode().includes(strip.inlined))
      .map((strip) => strip.file)
    const missing = strips
      .filter((strip) => !labOnlyIds.includes(strip.id))
      .filter((strip) => !shas.has(strip.sha))
      .map((strip) => strip.file)

    expect(inlined).toEqual([])
    expect(missing).toEqual([])
  })

  test('nothing of the Lab-only resources is in the build', () => {
    const shas = emittedShas()
    const code = bundleCode()
    const labStrips = strips.filter((strip) => labOnlyIds.includes(strip.id))

    expect(labStrips.length).toBeGreaterThan(0)
    expect(labStrips.filter((strip) => shas.has(strip.sha))).toEqual([])
    expect(labStrips.filter((strip) => code.includes(strip.inlined))).toEqual(
      [],
    )
    expect(
      emitted(new RegExp(`^(${labOnlyIds.join('|')})-[\\w-]{8}\\.(js|css)$`)),
    ).toEqual([])
  })

  test('each deferred resource has its own JS and CSS chunk, and the entry loads none of them', () => {
    for (const id of deferredIds) {
      expect(
        emitted(chunkOf([id], '(js|css)'))
          .map((file) => extname(file))
          .sort(),
        id,
      ).toEqual(['.css', '.js'])
    }
    const { scripts, stylesheets, preloads } = entry()
    const loaded = [...scripts, ...stylesheets, ...preloads].map((file) =>
      basename(file),
    )
    for (const id of deferredIds)
      expect(
        loaded.filter((file) => file.startsWith(`${id}-`)),
        id,
      ).toEqual([])
    // `sofi-blink` es estático: vive en la entrada, no en un chunk propio.
    expect(emitted(chunkOf(STATIC_IDS, '(js|css)'))).toEqual([])
  })

  test('the entry only references the strips of the static resources', () => {
    const { scripts, stylesheets } = entry()
    const entryCode = read([...scripts, ...stylesheets])

    for (const id of STATIC_IDS) {
      const referenced = emittedStripFiles(id).filter((file) =>
        entryCode.includes(basename(file)),
      )
      expect(referenced.length, id).toBeGreaterThan(0)
    }
    const stray = strips
      .filter((strip) => !STATIC_IDS.includes(strip.id))
      .flatMap((strip) =>
        emittedStripFiles(strip.id).map((file) => ({ id: strip.id, file })),
      )
      .filter(({ file }) => entryCode.includes(basename(file)))
    expect(stray).toEqual([])
  })

  test('the entry CSS carries only the static resource: nothing defined by a deferred chunk', () => {
    const entryCss = read(entry().stylesheets)
    const deferredCss = read(emitted(chunkOf(deferredIds, 'css')))
    // Los CSS Modules de Vite dan `_<local>_<hash>_<n>`: el hash es propio de cada módulo.
    const definedByDeferred = new Set(
      deferredCss.match(/_[\w-]+?_[a-z0-9]{4,6}_\d+/g) ?? [],
    )

    expect(definedByDeferred.size).toBeGreaterThan(0)
    expect(
      [...definedByDeferred].filter((name) => entryCss.includes(name)),
    ).toEqual([])
    // Un parcial importado además desde otro módulo de la entrada tendría otro hash, pero
    // seguiría llamando a su clase como el recurso.
    const inEntry = keyframeNames(entryCss)
    expect(
      keyframesOf(deferredIds).filter((name) => inEntry.includes(name)),
    ).toEqual([])
    expect(entryCss).toMatch(/_sofi-blink_[a-z0-9]+_\d+/)
  })

  test('every keyframes name is defined once across all the CSS', () => {
    const names = files
      .filter((file) => file.endsWith('.css'))
      .flatMap((file) =>
        [
          ...readFileSync(join(outDir, file), 'utf8').matchAll(
            /@keyframes\s+([\w-]+)/g,
          ),
        ].map((match) => match[1]),
      )
    const repeated = names.filter((name, i) => names.indexOf(name) !== i)

    expect(names.length).toBeGreaterThan(0)
    expect(repeated).toEqual([])
  })

  // Con CSS Modules el hash distingue los nombres aunque un parcial se empaquete dos veces
  // (por ejemplo, importado desde dos módulos): por eso se agrupa por el nombre local. Se lee
  // de la build y no de los parciales porque el mixin genera algún `@keyframes` (sofi-blink).
  test('the keyframes of each sprite resource are in the build once, and none of the Lab-only ones', () => {
    // Los de los recursos diferidos viven en su chunk; los de `sofi-blink`, en el CSS de entrada
    // junto a los de la aplicación. (Los nombres no siguen el id: `are-u-still-here` anima
    // `still-here-*`.)
    const sprite = [
      ...emitted(chunkOf(deferredIds, 'css')).flatMap((file) =>
        keyframeNames(read([file])),
      ),
      ...keyframeNames(read(entry().stylesheets)).filter((name) =>
        STATIC_IDS.some((id) => name === id || name.startsWith(`${id}-`)),
      ),
    ]
    const repeated = sprite.filter((name, i) => sprite.indexOf(name) !== i)
    const everything = keyframeNames(
      read(files.filter((file) => file.endsWith('.css'))),
    )

    expect(sprite.length).toBeGreaterThan(0)
    expect(repeated).toEqual([])
    // Cada keyframes de sprite está definido una sola vez en toda la build.
    expect(
      sprite.filter(
        (name) => everything.filter((n) => n === name).length !== 1,
      ),
    ).toEqual([])
    expect(
      everything.filter((name) =>
        labOnlyIds.some((id) => name === id || name.startsWith(`${id}-`)),
      ),
    ).toEqual([])
  })

  // Plan §4.4: la cascada pone los gags tras el parpadeo por construcción. El parpadeo está en el
  // CSS del documento y los gags llegan después, en chunks que el documento no enlaza.
  test('the CSS of the gags comes after the one of sofi-blink', () => {
    const { stylesheets } = entry()

    expect(read(stylesheets)).toMatch(/_sofi-blink_[a-z0-9]+_\d+/)
    for (const id of ['poking', 'are-u-still-here', 'i-see-you']) {
      expect(deferredIds, id).toContain(id)
      expect(
        keyframesOf([id]).filter((name) =>
          keyframeNames(read(stylesheets)).includes(name),
        ),
        id,
      ).toEqual([])
      expect(
        stylesheets.filter((file) => basename(file).startsWith(`${id}-`)),
        id,
      ).toEqual([])
    }
  })

  test('the controllers of the gags are not in the entry chunk', () => {
    // Las capas las crea el controlador con estos atributos: son su huella.
    const entryJs = read(entry().scripts)
    for (const marker of [
      'data-poking-layer',
      'data-still-here-layer',
      'data-i-see-you-layer',
    ])
      expect(entryJs, marker).not.toContain(marker)
  })

  // D-1 y D-9 en lo que se publica: el minificador no puede deshacer los prefijos de movimiento.
  // Cada regla bajo `prefers-reduced-motion` lleva el prefijo que excluye al modo contrario, y la
  // forzada va fuera de la media. Los cuatro prefijos son los de plan §4.2 y §4.3.
  test('every reduced-motion rule in the built CSS keeps its prefix excluding the opposite mode', () => {
    const SYSTEM_REDUCE = ':where(:root:not([data-motion=full])) '
    const SYSTEM_FULL = ':where(:root:not([data-motion=reduce])) '
    const FORCED = [
      ':where(:root[data-motion=reduce]) ',
      ':where(:root[data-motion=full]) ',
    ]
    const bare: string[] = []
    const forced: string[] = []
    let systemReduce = 0
    let systemFull = 0

    for (const file of files.filter((name) => name.endsWith('.css'))) {
      postcss.parse(read([file])).walkRules((rule) => {
        const parent = rule.parent
        const media =
          parent?.type === 'atrule' && 'params' in parent
            ? parent.params.replace(/\s+/g, '')
            : ''
        const own = media.includes('prefers-reduced-motion')
        for (const selector of rule.selectors) {
          if (own && media === '(prefers-reduced-motion:reduce)') {
            if (selector.startsWith(SYSTEM_REDUCE)) systemReduce++
            else bare.push(selector)
          } else if (
            own &&
            media === '(prefers-reduced-motion:no-preference)'
          ) {
            if (selector.startsWith(SYSTEM_FULL)) systemFull++
            else bare.push(selector)
          } else if (own) {
            bare.push(
              `@media ${parent && 'params' in parent ? parent.params : ''} ${selector}`,
            )
          } else if (selector.includes('data-motion')) {
            if (FORCED.some((prefix) => selector.startsWith(prefix)))
              forced.push(selector)
            else bare.push(selector)
          }
        }
      })
    }

    // Nada reducido sin prefijo (con él, «full» no lo anularía) y no vacío.
    expect(bare).toEqual([])
    expect(systemReduce).toBeGreaterThan(0)
    expect(systemFull).toBeGreaterThan(0)
    // Cada regla del sistema tiene su clon forzado.
    expect(forced).toHaveLength(systemReduce + systemFull)
  })

  // Plan §7: las cifras se registran en cada build y no son umbral hasta que las apruebe la autora.
  test('records the provisional load targets of the build without enforcing them', () => {
    const { scripts, stylesheets } = entry()
    const css = readFileSync(join(outDir, stylesheets[0]))
    const js = readFileSync(join(outDir, scripts[0]))
    const cssGzip = gzipSize(css)
    const delta = cssGzip - PROVISIONAL_ENTRY_CSS_GZIP_BASELINE

    const record = [
      `CSS de entrada: ${css.length} B, gzipSync ${cssGzip} B (EX1: ${PROVISIONAL_ENTRY_CSS_GZIP_BASELINE} B; ${delta >= 0 ? '+' : ''}${delta} B)`,
      `Objetivo provisional (no es umbral): como mucho +${PROVISIONAL_ENTRY_CSS_GZIP_MARGIN} B`,
      `JS de entrada: ${js.length} B, gzipSync ${gzipSize(js)} B`,
      `Archivos .webp emitidos: ${files.filter((file) => file.endsWith('.webp')).length}`,
    ].join('\n')
    test.info().annotations.push({
      type: 'provisional-targets',
      description: record,
    })
    console.log(record)

    expect(cssGzip).toBeGreaterThan(0)
  })
})
