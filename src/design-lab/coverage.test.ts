import { describe, expect, it } from 'vitest'

// El Design Lab es un playground de los componentes reales: ningún componente
// exportado por la biblioteca puede quedarse sin un ejemplo en el laboratorio.
const components = import.meta.glob<string>('/src/components/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const labSources = import.meta.glob<string>('/src/design-lab/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Piezas que solo se dibujan dentro de otro componente que sí tiene ejemplo.
const COVERED_BY_PARENT: Record<string, string> = {
  Pips: 'Badge',
  TickerPauseIcon: 'TickerPauseButton',
  TickerPlayIcon: 'TickerPauseButton',
}

function exportedComponents(): Array<{ name: string; file: string }> {
  const found: Array<{ name: string; file: string }> = []
  for (const [file, source] of Object.entries(components)) {
    if (/\.test\./.test(file)) continue
    for (const match of source.matchAll(/^export function ([A-Z]\w*)\(/gm)) {
      found.push({ name: match[1], file })
    }
  }
  return found
}

describe('Design Lab coverage', () => {
  it('shows every exported production component in at least one example', () => {
    const lab = Object.entries(labSources)
      .filter(([file]) => !/\.test\./.test(file))
      .map(([, source]) => source)
      .join('\n')
    const missing = exportedComponents()
      .map(({ name, file }) => ({
        name: COVERED_BY_PARENT[name] ?? name,
        file,
      }))
      .filter(({ name }) => !new RegExp(`\\b${name}\\b`).test(lab))
      .map(({ name, file }) => `${name} (${file})`)
    expect(missing).toEqual([])
  })

  it('does not keep parent exceptions for components that no longer exist', () => {
    const names = new Set(exportedComponents().map(({ name }) => name))
    const stale = Object.keys(COVERED_BY_PARENT).filter(
      (name) => !names.has(name),
    )
    expect(stale).toEqual([])
  })
})
