import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpeechAudio, type AudioContextLike } from './speechAudio'

type FakeSource = {
  buffer: AudioBuffer | null
  loop: boolean
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

// Doble de AudioContext: permite decidir si el navegador deja sonar o no.
function fakeContext({ running = false, allowResume = true } = {}) {
  const sources: FakeSource[] = []
  const context = {
    state: (running ? 'running' : 'suspended') as AudioContextState,
    currentTime: 0,
    destination: {} as AudioNode,
    resume: vi.fn(() => {
      if (!allowResume) return new Promise<void>(() => {})
      context.state = 'running'
      return Promise.resolve()
    }),
    close: vi.fn(() => Promise.resolve()),
    createBufferSource: vi.fn(() => {
      const source: FakeSource = {
        buffer: null,
        loop: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      sources.push(source)
      return source as unknown as AudioBufferSourceNode
    }),
    createGain: vi.fn(
      () => ({ gain: { value: 1 }, connect: vi.fn() }) as unknown as GainNode,
    ),
    decodeAudioData: vi.fn(() =>
      Promise.resolve({ duration: 21 } as AudioBuffer),
    ),
  }
  return { context, sources }
}

function setup(
  options: Parameters<typeof fakeContext>[0] = {},
  fetchData = vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
) {
  const fake = fakeContext(options)
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
})
