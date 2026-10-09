import { http, HttpResponse } from 'msw'

// Handler mínimo de prueba para demostrar la interceptación HTTP.
export const pingHandler = http.get('https://ask-sofi.test/api/ping', () =>
  HttpResponse.json({ ok: true }),
)
