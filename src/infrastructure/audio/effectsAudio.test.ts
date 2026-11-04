import { describe, expect, it, vi } from 'vitest'
import { fakeAudio, fakeAudioContext } from '../../test/fakeAudio'
import { createEffectsAudio, type EffectsSituation } from './effectsAudio'
import type { AudioContextLike } from './speechAudio'

// Efectos de mentira: no hay ningún sonido elegido (spec §9). `wipe` hace de efecto de `memory-wipe`.
const EFFECTS = {
  pop: { src: '/effects/pop.ogg' },
  chime: { src: '/effects/chime.ogg' },
  wipe: { src: '/effects/wipe.ogg', afterErasure: true },
}

function setup({
  running = false,
  allowResume = true,
  fetchData = vi.fn<(src: string) => Promise<ArrayBuffer>>(() =>
    Promise.resolve(new ArrayBuffer(8)),
  ),
} = {}) {
  const fake = fakeAudioContext({ running, allowResume })
  const borrow = vi.fn(() => fake.context as unknown as AudioContextLike)
  // La voz de Sofi: `fakeAudio().set('playing')` es que está sonando.
  const voice = fakeAudio()
  const effects = createEffectsAudio({
    context: borrow,
    effects: EFFECTS,
    voice,
    fetchData,
  })
  return { ...fake, borrow, voice, effects, fetchData }
}

async function setupReady(options?: Parameters<typeof setup>[0]) {
  const all = setup({ running: true, ...options })
  await all.effects.prepare()
  return all
}

// Una fuente suena mientras ha empezado y nadie la ha parado ni ha terminado.
const audible = (sources: ReturnType<typeof fakeAudioContext>['sources']) =>
  sources.filter(
    (source) =>
      source.start.mock.calls.length > 0 &&
      source.stop.mock.calls.length === 0 &&
      source.disconnect.mock.calls.length === 0,
  )

describe('createEffectsAudio', () => {
  describe('con el contexto prestado (D-11)', () => {
    it('no lo pide hasta que se prepara, y entonces lo reanuda en el gesto', async () => {
      const { effects, borrow, context } = setup()

      expect(borrow).not.toHaveBeenCalled()

      const prepared = effects.prepare()
      // Sin esperar: reanudar tiene que pedirse ya, mientras el gesto sigue en curso.
      expect(borrow).toHaveBeenCalledTimes(1)
      expect(context.resume).toHaveBeenCalledTimes(1)
      await prepared
    })

    it('dispose() no lo cierra', async () => {
      const { effects, context } = await setupReady()

      effects.dispose()

      expect(context.close).not.toHaveBeenCalled()
    })

    it('tras dispose() vuelve a pedirlo en lugar de reutilizar el anterior', async () => {
      const first = fakeAudioContext({ running: true })
      const second = fakeAudioContext({ running: true })
      const contexts = [first, second]
      const borrow = vi.fn(
        () => contexts.shift()!.context as unknown as AudioContextLike,
      )
      const effects = createEffectsAudio({
        context: borrow,
        effects: EFFECTS,
        voice: fakeAudio(),
        fetchData: () => Promise.resolve(new ArrayBuffer(8)),
      })
      await effects.prepare()
      effects.dispose()

      await effects.prepare()
      effects.play('pop')

      expect(borrow).toHaveBeenCalledTimes(2)
      expect(first.sources).toHaveLength(0)
      expect(second.sources).toHaveLength(1)
    })
  })

  describe('al prepararse', () => {
    it('carga cada archivo una sola vez, aunque se prepare varias veces', async () => {
      const { effects, fetchData } = setup({ running: true })

      await effects.prepare()
      await effects.prepare()

      expect(fetchData).toHaveBeenCalledTimes(3)
      expect(fetchData).toHaveBeenCalledWith('/effects/pop.ogg')
    })

    it('un archivo que no carga no impide los demás', async () => {
      const { effects, sources } = await setupReady({
        fetchData: vi.fn((src: string) =>
          src.includes('chime')
            ? Promise.reject(new Error('404'))
            : Promise.resolve(new ArrayBuffer(8)),
        ),
      })

      effects.play('chime')
      expect(sources).toHaveLength(0)

      effects.play('pop')
      expect(sources).toHaveLength(1)
    })
  })

  describe('sin sonido activado no suena nada', () => {
    it('antes de prepararse', () => {
      const { effects, sources } = setup({ running: true })

      effects.play('pop')

      expect(sources).toHaveLength(0)
    })

    it('tras silenciar, y el que sonaba se corta al instante', async () => {
      const { effects, sources } = await setupReady()
      effects.play('pop')

      effects.disable()
      effects.play('chime')

      expect(sources[0].stop).toHaveBeenCalled()
      expect(sources).toHaveLength(1)
    })

    it('tras dispose()', async () => {
      const { effects, sources } = await setupReady()

      effects.dispose()
      effects.play('pop')

      expect(sources).toHaveLength(0)
    })

    it('volver a prepararse lo permite de nuevo', async () => {
      const { effects, sources } = await setupReady()
      effects.disable()

      await effects.prepare()
      effects.play('pop')

      expect(audible(sources)).toHaveLength(1)
    })

    it('no da por hecho que el permiso dure: con el contexto bloqueado o suspendido, no suena', async () => {
      const { effects, context, sources } = await setupReady()
      context.state = 'suspended'

      effects.play('pop')

      expect(sources).toHaveLength(0)
    })

    it('si el navegador no deja reanudar el contexto, prepararse no se queda esperando y no suena', async () => {
      const { effects, sources } = setup({ allowResume: false })

      await effects.prepare()
      effects.play('pop')

      expect(sources).toHaveLength(0)
    })
  })

  describe('un efecto a la vez', () => {
    it('uno nuevo sustituye al que está sonando', async () => {
      const { effects, sources } = await setupReady()

      effects.play('pop')
      effects.play('chime')

      expect(sources).toHaveLength(2)
      expect(sources[0].stop).toHaveBeenCalled()
      expect(audible(sources)).toEqual([sources[1]])
    })

    it('el mismo efecto repetido tampoco se solapa consigo mismo', async () => {
      const { effects, sources } = await setupReady()

      effects.play('pop')
      effects.play('pop')

      expect(audible(sources)).toHaveLength(1)
    })

    it('al terminar por sí solo libera el hueco sin cortar nada más', async () => {
      const { effects, sources } = await setupReady()
      effects.play('pop')
      sources[0].end()

      effects.play('chime')

      expect(sources[0].stop).not.toHaveBeenCalled()
      expect(audible(sources)).toEqual([sources[1]])
    })
  })

  describe('nunca tapa la voz de Sofi', () => {
    it('no suena mientras la voz suena, y no queda en cola', async () => {
      const { effects, voice, sources } = await setupReady()
      voice.set('playing')

      effects.play('pop')
      voice.set('ready')

      expect(sources).toHaveLength(0)
    })

    it('suena de nuevo cuando la voz calla', async () => {
      const { effects, voice, sources } = await setupReady()
      voice.set('playing')
      voice.set('ready')

      effects.play('pop')

      expect(audible(sources)).toHaveLength(1)
    })

    it('si la voz empieza mientras suena un efecto, el efecto se corta', async () => {
      const { effects, voice, sources } = await setupReady()
      effects.play('pop')

      voice.set('playing')

      expect(sources[0].stop).toHaveBeenCalled()
      expect(audible(sources)).toHaveLength(0)
    })

    it('cualquier otro estado de la voz no lo impide', async () => {
      const { effects, voice, sources } = await setupReady()
      for (const status of ['blocked', 'unavailable', 'loading'] as const) {
        voice.set(status)
        effects.play('pop')
      }

      expect(sources).toHaveLength(3)
    })

    it('tras dispose() deja de escuchar a la voz', async () => {
      const { effects, voice } = setup({ running: true })
      const listeners = new Set<() => void>()
      vi.spyOn(voice, 'subscribe').mockImplementation((listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      })
      await effects.prepare()
      expect(listeners.size).toBe(1)

      effects.dispose()

      expect(listeners.size).toBe(0)
    })
  })

  describe.each<[string, EffectsSituation]>([
    ['seguridad', { safety: true }],
    ['salida rápida', { quickExit: true }],
    ['un estado sensible', { sensitive: true }],
  ])('en %s', (_name, situation) => {
    it('no suena ningún efecto, ni siquiera tras un borrado efectivo', async () => {
      const { effects, sources } = await setupReady()
      effects.setSituation({ ...situation, dataErased: true })

      effects.play('pop')
      effects.play('wipe')

      expect(sources).toHaveLength(0)
    })

    it('el que está sonando se corta en el acto', async () => {
      const { effects, sources } = await setupReady()
      effects.play('pop')

      effects.setSituation(situation)

      expect(sources[0].stop).toHaveBeenCalled()
      expect(audible(sources)).toHaveLength(0)
    })

    it('al terminar el estado, los efectos pueden volver a sonar', async () => {
      const { effects, sources } = await setupReady()
      effects.setSituation(situation)

      effects.setSituation({})
      effects.play('pop')

      expect(audible(sources)).toHaveLength(1)
    })
  })

  describe('los efectos de memory-wipe', () => {
    it('no suenan hasta que el borrado total es efectivo', async () => {
      const { effects, sources } = await setupReady()

      effects.play('wipe')
      effects.setSituation({ dataErased: false })
      effects.play('wipe')

      expect(sources).toHaveLength(0)
    })

    it('suenan tras el borrado efectivo, y los demás efectos no cambian', async () => {
      const { effects, sources } = await setupReady()
      effects.setSituation({ dataErased: true })

      effects.play('wipe')
      expect(audible(sources)).toHaveLength(1)

      effects.play('pop')
      expect(audible(sources)).toHaveLength(1)
      expect(sources).toHaveLength(2)
    })

    it('un efecto que no es de memory-wipe suena aunque no haya borrado', async () => {
      const { effects, sources } = await setupReady()

      effects.play('pop')

      expect(audible(sources)).toHaveLength(1)
    })
  })

  describe('sin condicionar nunca lo que ocurre en la aplicación', () => {
    it('play() es inmediato: no devuelve nada que haya que esperar', async () => {
      const { effects } = await setupReady()
      effects.setSituation({ dataErased: true })

      expect(effects.play('wipe')).toBeUndefined()
      expect(effects.play('pop')).toBeUndefined()
    })

    it('no lanza si la fuente falla al empezar', async () => {
      const { effects, context } = await setupReady()
      context.createBufferSource.mockImplementationOnce(() => {
        throw new Error('sin recursos de audio')
      })

      expect(() => effects.play('pop')).not.toThrow()
    })

    it('no lanza con un efecto desconocido, ni con la voz o el contexto rotos', async () => {
      const { effects } = await setupReady()

      expect(() => effects.play('inexistente' as 'pop')).not.toThrow()

      const broken = createEffectsAudio({
        context: () => {
          throw new Error('sin Web Audio')
        },
        effects: EFFECTS,
        voice: fakeAudio(),
      })
      await expect(broken.prepare()).resolves.toBeUndefined()
      expect(() => broken.play('pop')).not.toThrow()
    })
  })
})
