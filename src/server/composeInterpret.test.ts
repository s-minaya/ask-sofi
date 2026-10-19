import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EnglishPreparer } from '../infrastructure/language/englishPreparation'
import { TEST_POLICY_CONFIG } from '../test/analysisFixtures'
import { API_KEY, gateway, withOverrides } from '../test/jevGateway'
import { composeInterpret } from './composeInterpret'
import { createInterpretHandler } from './interpretHandler'

const preparer: EnglishPreparer = {
  prepare: async ({ message }) => ({
    ok: true,
    message,
    provenance: {
      service: 'fake-translator',
      result: 'already_english',
      version: 'v1',
    },
  }),
}
const ENV = { AI_GATEWAY_API_KEY: API_KEY }
const COMPLETE = { policy: TEST_POLICY_CONFIG, createPreparer: () => preparer }

describe('composeInterpret', () => {
  afterEach(() => vi.unstubAllEnvs())

  describe('falla cerrado', () => {
    it('con el estado actual del repositorio nunca se completa, ni con credencial', () => {
      // Sin traductor aprobado (L1) ni PolicyConfig respaldada por experimentos.
      expect(composeInterpret(ENV)).toBeUndefined()
    })

    it('sin la credencial de AI Gateway', () => {
      expect(composeInterpret({}, COMPLETE)).toBeUndefined()
      expect(
        composeInterpret({ AI_GATEWAY_API_KEY: '' }, COMPLETE),
      ).toBeUndefined()
      expect(
        composeInterpret({ AI_GATEWAY_API_KEY: '   ' }, COMPLETE),
      ).toBeUndefined()
    })

    it('sin PolicyConfig', () => {
      expect(
        composeInterpret(ENV, { ...COMPLETE, policy: undefined }),
      ).toBeUndefined()
    })

    it('sin traductor aprobado', () => {
      expect(
        composeInterpret(ENV, { ...COMPLETE, createPreparer: () => undefined }),
      ).toBeUndefined()
    })

    it('el traductor recibe el entorno recibido, no el del proceso', () => {
      vi.stubEnv('AI_GATEWAY_API_KEY', 'del-proceso')
      const received: unknown[] = []

      composeInterpret(ENV, {
        ...COMPLETE,
        createPreparer: (env) => {
          received.push(env)
          return preparer
        },
      })

      expect(received).toEqual([ENV])
    })

    it('no lee el entorno del proceso: sin argumento no hay credencial', () => {
      vi.stubEnv('AI_GATEWAY_API_KEY', API_KEY)

      expect(composeInterpret({}, COMPLETE)).toBeUndefined()
    })
  })

  describe('con las tres piezas', () => {
    it('devuelve las dependencias del manejador, con la política recibida', () => {
      const dependencies = composeInterpret(ENV, COMPLETE)

      expect(dependencies).toBeDefined()
      expect(dependencies?.policy).toBe(TEST_POLICY_CONFIG)
      expect(dependencies?.preparer).toBe(preparer)
    })

    it('el manejador resultante analiza con Jev (pasarela simulada) y nunca con el fake', async () => {
      const received = gateway(withOverrides({}))
      const handler = createInterpretHandler(composeInterpret(ENV, COMPLETE))

      const response = await handler(
        new Request('https://ask-sofi.test/api/interpret', {
          method: 'POST',
          body: JSON.stringify({ message: 'Vale.' }),
        }),
      )
      const body = (await response.json()) as {
        ok: boolean
        result: { meta: { provider: { id: string } } }
      }

      expect(response.status).toBe(200)
      expect(received).toHaveLength(1)
      expect(received[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`)
      expect(body.result.meta.provider.id).toBe('jev')
    })
  })

  it('un manejador sin dependencias responde 503 y no llama a la pasarela', async () => {
    const received = gateway()
    const handler = createInterpretHandler(composeInterpret(ENV))

    const response = await handler(
      new Request('https://ask-sofi.test/api/interpret', {
        method: 'POST',
        body: JSON.stringify({ message: 'Vale.' }),
      }),
    )

    expect(response.status).toBe(503)
    expect(received).toHaveLength(0)
  })
})
