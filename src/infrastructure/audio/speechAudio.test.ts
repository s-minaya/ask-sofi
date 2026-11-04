import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAudioContext } from '../../test/fakeAudio'
import { createSpeechAudio, type AudioContextLike } from './speechAudio'

function setup(
  options: Parameters<typeof fakeAudioContext>[0] = {},
  fetchData = vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
) {
  const fake = fakeAudioContext(options)
  const audio = createSpeechAudio({
    src: '/talking-sound.mp3',
    createContext: () => fake.context as unknown as AudioContextLike,
    fetchData,
  })
  return { ...fake, audio, fetchData }
}

describe('speechAudio', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('empieza en silencio y no crea nada hasta el primer gesto', () => {
    const { audio, context } = setup()

    expect(audio.getStatus()).toBe('off')
    expect(context.resume).not.toHaveBeenCalled()
  })

  it('al prepararse dentro del gesto reanuda el contexto y carga el sonido una sola vez', async () => {
    const { audio, context, fetchData } = setup()

    await expect(audio.prepare()).resolves.toBe(true)
    expect(context.resume).toHaveBeenCalledTimes(1)
    expect(audio.getStatus()).toBe('ready')

    await audio.prepare()
    expect(fetchData).toHaveBeenCalledTimes(1)
  })

  it('si el navegador no deja sonar, queda bloqueado sin quedarse esperando', async () => {
    const { audio } = setup({ allowResume: false })

    const prepared = audio.prepare()
    await vi.advanceTimersByTimeAsync(300)

    await expect(prepared).resolves.toBe(false)
    expect(audio.getStatus()).toBe('blocked')
  })

  it('si el archivo no carga, el sonido queda no disponible', async () => {
    const { audio } = setup(
      {},
      vi.fn(() => Promise.reject(new Error('404'))),
    )

    await expect(audio.prepare()).resolves.toBe(false)
    expect(audio.getStatus()).toBe('unavailable')
  })

  it('si no hay Web Audio, el sonido queda no disponible', async () => {
    const audio = createSpeechAudio({
      src: '/talking-sound.mp3',
      createContext: () => {
        throw new Error('sin Web Audio')
      },
    })

    await expect(audio.prepare()).resolves.toBe(false)
    expect(audio.getStatus()).toBe('unavailable')
  })

  it('usa un único canal: nunca se solapan dos fragmentos', async () => {
    const { audio, sources } = setup()
    await audio.prepare()

    audio.startVoice()
    audio.startVoice()

    expect(sources).toHaveLength(1)
    expect(sources[0].loop).toBe(true)
    expect(audio.getStatus()).toBe('playing')
  })

  it('cada fragmento continúa donde se quedó el anterior', async () => {
    const { audio, context, sources } = setup()
    await audio.prepare()

    audio.startVoice()
    context.currentTime = 2.5
    audio.stopVoice()
    audio.startVoice()

    expect(sources[0].stop).toHaveBeenCalled()
    expect(sources[1].start).toHaveBeenCalledWith(0, 2.5)
    expect(audio.getStatus()).toBe('playing')
  })

  it('un fragmento breve suena y se corta solo', async () => {
    const { audio, sources } = setup()
    await audio.prepare()

    audio.playFragment(600)
    expect(audio.getStatus()).toBe('playing')
    vi.advanceTimersByTime(600)

    expect(sources[0].stop).toHaveBeenCalled()
    expect(audio.getStatus()).toBe('ready')
  })

  it('no da por hecho que el permiso dure: si el contexto se suspende, avisa de bloqueo', async () => {
    const { audio, context, sources } = setup()
    await audio.prepare()

    context.state = 'suspended'
    audio.startVoice()

    expect(sources).toHaveLength(0)
    expect(audio.getStatus()).toBe('blocked')
  })

  it('al silenciar se corta al instante y al desmontar cierra el contexto', async () => {
    const { audio, context, sources } = setup()
    await audio.prepare()
    audio.startVoice()

    audio.disable()
    expect(sources[0].stop).toHaveBeenCalled()
    expect(audio.getStatus()).toBe('off')

    audio.dispose()
    expect(context.close).toHaveBeenCalled()
  })

  it('notifica cada cambio de estado', async () => {
    const { audio } = setup()
    const listener = vi.fn()
    audio.subscribe(listener)

    await audio.prepare()

    expect(listener).toHaveBeenCalled()
    expect(audio.getStatus()).toBe('ready')
  })

  describe('con un contexto prestado (D-11)', () => {
    function setupBorrowed(fake = fakeAudioContext()) {
      const borrow = vi.fn(() => fake.context as unknown as AudioContextLike)
      const audio = createSpeechAudio({
        src: '/talking-sound.mp3',
        context: borrow,
        fetchData: () => Promise.resolve(new ArrayBuffer(8)),
      })
      return { ...fake, audio, borrow }
    }

    it('no lo pide hasta que se prepara, y entonces lo usa para reanudar y decodificar', async () => {
      const { audio, borrow, context } = setupBorrowed()

      expect(borrow).not.toHaveBeenCalled()

      await expect(audio.prepare()).resolves.toBe(true)
      expect(borrow).toHaveBeenCalledTimes(1)
      expect(context.resume).toHaveBeenCalledTimes(1)
      expect(context.decodeAudioData).toHaveBeenCalledTimes(1)
      expect(audio.getStatus()).toBe('ready')
    })

    it('lo pide una sola vez aunque se prepare varias veces', async () => {
      const { audio, borrow } = setupBorrowed()

      await audio.prepare()
      await audio.prepare()

      expect(borrow).toHaveBeenCalledTimes(1)
    })

    it('la voz suena por el contexto prestado', async () => {
      const { audio, sources } = setupBorrowed()
      await audio.prepare()

      audio.startVoice()

      expect(sources).toHaveLength(1)
      expect(audio.getStatus()).toBe('playing')
    })

    it('dispose() no cierra el contexto prestado y deja de colgar de él su ganancia', async () => {
      const { audio, borrow, context, sources, gains } = setupBorrowed()
      await audio.prepare()
      audio.startVoice()

      audio.dispose()

      expect(context.close).not.toHaveBeenCalled()
      expect(sources[0].stop).toHaveBeenCalled()
      expect(gains[0].disconnect).toHaveBeenCalledTimes(1)
      expect(audio.getStatus()).toBe('off')
      expect(borrow).toHaveBeenCalledTimes(1)
    })

    it('tras dispose() vuelve a pedir el contexto en lugar de reutilizar el anterior', async () => {
      const first = fakeAudioContext()
      const second = fakeAudioContext()
      const contexts = [first, second]
      const context = vi.fn(
        () => contexts.shift()!.context as unknown as AudioContextLike,
      )
      const audio = createSpeechAudio({
        src: '/talking-sound.mp3',
        context,
        fetchData: () => Promise.resolve(new ArrayBuffer(8)),
      })
      await audio.prepare()
      audio.dispose()

      await expect(audio.prepare()).resolves.toBe(true)
      audio.startVoice()

      expect(context).toHaveBeenCalledTimes(2)
      expect(first.sources).toHaveLength(0)
      expect(second.sources).toHaveLength(1)
    })

    it('si no se puede obtener el contexto, el sonido queda no disponible', async () => {
      const context = vi.fn(() => {
        throw new Error('sin Web Audio')
      })
      const audio = createSpeechAudio({ src: '/talking-sound.mp3', context })

      await expect(audio.prepare()).resolves.toBe(false)
      expect(context).toHaveBeenCalledTimes(1)
      expect(audio.getStatus()).toBe('unavailable')
    })
  })
})
