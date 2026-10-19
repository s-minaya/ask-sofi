// Punto de entrada de la línea de órdenes:
//   npm run eval:jev -- [opciones]        en seco: cuenta y estima, no envía nada
//   npm run eval:jev -- --live ...        ejecución real (ver arguments.ts)
// El código de `src` importa sin extensión, como el cliente; Vite lo resuelve.
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})
try {
  const { main } = (await server.ssrLoadModule(
    '/evals/jev/runner/run.ts',
  )) as typeof import('./run.ts')
  process.exitCode = await main(process.argv.slice(2), process.env)
} finally {
  await server.close()
}
