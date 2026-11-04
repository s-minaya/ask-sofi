import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Contrato de licencias de los efectos sonoros (spec 008 §9, plan §11.1): cada archivo de audio de
// `src/assets/sofi/effects/` tiene su licencia registrada en `licenses.json`, compatible con
// publicar el proyecto (el repositorio es público y MIT), y no procede de Myinstants ni de Nintendo.
// Aquí NO se elige ningún sonido: el manifiesto empieza vacío y solo se rellena al integrar los
// aprobados (T099). Lo que sí se prueba es que, cuando haya entradas, el contrato las exige.
//
// Cada entrada de `effects`: `file` (nombre en esta carpeta), `title`, `author`, `source` (URL https
// de donde se obtuvo), `license`, `licenseUrl` (URL https del texto de la licencia),
// `attribution` (texto de atribución, obligatorio con CC-BY) y `verifiedOn` (fecha ISO de la
// verificación de T097). Los sonidos creados por la autora llevan `LicenseRef-AskSofi-Original`.

// Vitest se ejecuta desde la raíz del repositorio (como `reducedMotion.test.ts`).
const EFFECTS_DIR = `${process.cwd()}/src/assets/sofi/effects/`
const MANIFEST = 'licenses.json'
const AUDIO_EXTENSIONS = [
  '.mp3',
  '.ogg',
  '.oga',
  '.opus',
  '.wav',
  '.flac',
  '.m4a',
  '.aac',
  '.webm',
]

// Licencias admitidas: política del proyecto (plan §11.4, D-29), que solo se amplía con aprobación.
// Quedan fuera las que no permiten redistribuir el archivo en un repositorio público (NC, ND), las
// licencias propias de un sitio («gratis para uso personal», «royalty-free» sin redistribución) y
// las desconocidas. SA queda fuera por política del proyecto, no por una incompatibilidad jurídica
// general con MIT.
const ALLOWED_LICENSES = [
  'CC0-1.0',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'MIT',
  'Apache-2.0',
  'LicenseRef-AskSofi-Original',
]
const FORBIDDEN_ORIGINS = /myinstants|nintendo/i
const REQUIRED_TEXT = ['file', 'title', 'author', 'source', 'license']

type Entry = Record<string, unknown>

function isHttpsUrl(value: unknown) {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function isIsoDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function checkEntry(entry: unknown, index: number): string[] {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
    return [`La entrada ${index} no es un objeto`]
  const e = entry as Entry
  const name = typeof e.file === 'string' ? e.file : `entrada ${index}`
  const problems: string[] = []

  for (const field of REQUIRED_TEXT) {
    if (typeof e[field] !== 'string' || e[field].trim() === '')
      problems.push(`${name}: falta «${field}»`)
  }
  if (typeof e.file === 'string' && /[\\/]/.test(e.file))
    problems.push(
      `${name}: «file» debe ser un nombre de esta carpeta, sin ruta`,
    )
  if (!isHttpsUrl(e.source))
    problems.push(`${name}: «source» no es una URL https`)
  if (!isIsoDate(e.verifiedOn))
    problems.push(`${name}: «verifiedOn» no es una fecha ISO (AAAA-MM-DD)`)

  const license = e.license
  if (typeof license === 'string' && !ALLOWED_LICENSES.includes(license))
    problems.push(
      `${name}: la licencia «${license}» no es compatible con publicar el proyecto`,
    )
  if (license !== 'LicenseRef-AskSofi-Original' && !isHttpsUrl(e.licenseUrl))
    problems.push(`${name}: «licenseUrl» no es una URL https`)
  if (
    typeof license === 'string' &&
    license.startsWith('CC-BY') &&
    (typeof e.attribution !== 'string' || e.attribution.trim() === '')
  )
    problems.push(`${name}: la licencia ${license} exige «attribution»`)

  for (const value of Object.values(e)) {
    if (typeof value === 'string' && FORBIDDEN_ORIGINS.test(value))
      problems.push(`${name}: procede de Myinstants o de Nintendo («${value}»)`)
  }
  return problems
}

// `filesInFolder`: los nombres de todos los archivos de la carpeta (el manifiesto incluido).
function checkManifest(manifest: unknown, filesInFolder: string[]): string[] {
  const effects = (manifest as { effects?: unknown } | null)?.effects
  if (!Array.isArray(effects))
    return ['El manifiesto debe ser un objeto con una lista «effects»']

  const problems = effects.flatMap(checkEntry)
  const listed = effects.flatMap((entry) =>
    typeof entry?.file === 'string' ? [entry.file as string] : [],
  )
  for (const file of new Set(listed)) {
    if (listed.filter((other) => other === file).length > 1)
      problems.push(`${file}: está registrado más de una vez`)
    if (!filesInFolder.includes(file))
      problems.push(
        `${file}: está en el manifiesto pero no existe en la carpeta`,
      )
  }
  for (const file of filesInFolder) {
    const isAudio = AUDIO_EXTENSIONS.some((extension) =>
      file.toLowerCase().endsWith(extension),
    )
    if (isAudio && !listed.includes(file))
      problems.push(`${file}: no tiene su licencia registrada en ${MANIFEST}`)
  }
  return problems
}

const valid: Entry = {
  file: 'pop.ogg',
  title: 'Pop',
  author: 'Alguien',
  source: 'https://example.org/sounds/pop',
  license: 'CC-BY-4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  attribution: '«Pop» de Alguien, CC BY 4.0',
  verifiedOn: '2026-11-04',
}

describe('licencias de los efectos sonoros', () => {
  it('el manifiesto existe junto a los archivos y es JSON válido', () => {
    const files = readdirSync(EFFECTS_DIR)

    expect(files).toContain(MANIFEST)
    expect(() =>
      JSON.parse(readFileSync(`${EFFECTS_DIR}${MANIFEST}`, 'utf8')),
    ).not.toThrow()
  })

  it('cada archivo de audio de la carpeta tiene su licencia registrada y es compatible con publicar', () => {
    const manifest = JSON.parse(
      readFileSync(`${EFFECTS_DIR}${MANIFEST}`, 'utf8'),
    )

    expect(checkManifest(manifest, readdirSync(EFFECTS_DIR))).toEqual([])
  })

  describe('el contrato detecta lo que debe', () => {
    const folder = ['licenses.json', 'pop.ogg']

    it('acepta una entrada completa con su archivo', () => {
      expect(checkManifest({ effects: [valid] }, folder)).toEqual([])
    })

    it.each<[string, Entry]>([
      ['CC0-1.0', { license: 'CC0-1.0', attribution: undefined }],
      ['MIT', { license: 'MIT', attribution: undefined }],
      [
        'creado por la autora',
        {
          license: 'LicenseRef-AskSofi-Original',
          licenseUrl: undefined,
          attribution: undefined,
        },
      ],
    ])('acepta la licencia %s', (_name, change) => {
      expect(
        checkManifest({ effects: [{ ...valid, ...change }] }, folder),
      ).toEqual([])
    })

    it('rechaza un manifiesto sin lista «effects»', () => {
      expect(checkManifest({}, folder)).toHaveLength(1)
      expect(checkManifest(null, folder)).toHaveLength(1)
    })

    it('rechaza un archivo de audio sin licencia registrada', () => {
      expect(checkManifest({ effects: [] }, folder)).toEqual([
        expect.stringContaining('pop.ogg: no tiene su licencia registrada'),
      ])
    })

    it('rechaza un archivo registrado que no existe', () => {
      expect(checkManifest({ effects: [valid] }, ['licenses.json'])).toEqual([
        expect.stringContaining(
          'pop.ogg: está en el manifiesto pero no existe',
        ),
      ])
    })

    it('rechaza un archivo registrado dos veces', () => {
      expect(checkManifest({ effects: [valid, valid] }, folder)).toEqual([
        expect.stringContaining('pop.ogg: está registrado más de una vez'),
      ])
    })

    it.each([
      'CC-BY-NC-4.0',
      'CC-BY-ND-4.0',
      'CC-BY-SA-4.0',
      'All rights reserved',
      'Gratis para uso personal',
    ])('rechaza la licencia %s', (license) => {
      expect(
        checkManifest({ effects: [{ ...valid, license }] }, folder),
      ).toEqual([expect.stringContaining('no es compatible con publicar')])
    })

    it.each(['file', 'title', 'author', 'source', 'license'])(
      'rechaza una entrada sin «%s»',
      (field) => {
        expect(
          checkManifest({ effects: [{ ...valid, [field]: '' }] }, folder),
        ).not.toEqual([])
      },
    )

    it('rechaza una licencia CC-BY sin atribución', () => {
      expect(
        checkManifest(
          { effects: [{ ...valid, attribution: undefined }] },
          folder,
        ),
      ).toEqual([expect.stringContaining('exige «attribution»')])
    })

    it.each([
      ['una fuente que no es https', { source: 'http://example.org/pop' }],
      ['una fuente que no es una URL', { source: 'mi disco duro' }],
      ['una licencia sin URL', { licenseUrl: undefined }],
      ['una fecha que no es ISO', { verifiedOn: '04/11/2026' }],
      ['una fecha imposible', { verifiedOn: '2026-02-30' }],
    ])('rechaza %s', (_name, change) => {
      expect(
        checkManifest({ effects: [{ ...valid, ...change }] }, folder),
      ).not.toEqual([])
    })

    it('rechaza un nombre de archivo con ruta', () => {
      expect(
        checkManifest({ effects: [{ ...valid, file: '../pop.ogg' }] }, [
          'licenses.json',
          '../pop.ogg',
        ]),
      ).toEqual([expect.stringContaining('sin ruta')])
    })

    it.each([
      ['la fuente es Myinstants', { source: 'https://www.myinstants.com/pop' }],
      ['el autor es Nintendo', { author: 'Nintendo' }],
      ['el título menciona a Nintendo', { title: 'Nintendo coin' }],
      ['la atribución menciona Myinstants', { attribution: 'vía MyInstants' }],
    ])('rechaza el audio si %s', (_name, change) => {
      expect(
        checkManifest({ effects: [{ ...valid, ...change }] }, folder),
      ).toEqual([expect.stringContaining('Myinstants o de Nintendo')])
    })

    it('no confunde los formatos que no son audio', () => {
      expect(
        checkManifest({ effects: [] }, ['licenses.json', 'LEEME.md']),
      ).toEqual([])
    })
  })
})
