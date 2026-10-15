// Sonda de diagnóstico del 429 en chat/completions: una única llamada, sin reintentos.
// Sin el argumento --run no se hace ninguna petición.
//   node --experimental-strip-types evals/llm-redactor/probe.ts --run
// No importa runner.ts: su punto de entrada se ejecuta al importarlo.

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
const MAX_TOKENS = 5;
const TIMEOUT_MS = 30_000;

// Lista blanca: solo se guardan valores de cabeceras de diagnóstico; del resto, solo el nombre.
const DIAGNOSTIC_HEADER = /ratelimit|retry-after|request-id|correlation|x-kong|cf-ray|^date$/i;

const RESULTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "results");

const payload = {
  model: MODEL,
  messages: [{ role: "user", content: "Responde solo con la palabra: ok" }],
  max_tokens: MAX_TOKENS,
};

const apiKey = process.env["MISTRAL_API_KEY"];

// Errores típicos de copiado; se describe la clave sin revelar ningún carácter.
const keyInfo = apiKey
  ? {
      present: true,
      length: apiKey.length,
      has_surrounding_whitespace: apiKey !== apiKey.trim(),
      has_quotes: /^["']|["']$/.test(apiKey),
    }
  : { present: false };

console.log("Endpoint:", ENDPOINT);
console.log("Payload: ", JSON.stringify(payload));
console.log("Clave:   ", JSON.stringify(keyInfo));

if (!apiKey || !process.argv.includes("--run")) {
  console.log(
    apiKey
      ? "Modo verificación: añade --run para hacer la única llamada real."
      : "MISTRAL_API_KEY no está en este proceso: no se hace ninguna llamada.",
  );
  process.exit(0);
}

const startedAt = new Date().toISOString();
const start = performance.now();
let report: Record<string, unknown>;

try {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const rawBody = await response.text();
  let body: unknown = rawBody.slice(0, 1000);
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Cuerpo no JSON: se conserva el texto recortado.
  }

  report = {
    started_at: startedAt,
    model_requested: MODEL,
    status: response.status,
    status_text: response.statusText,
    latency_ms: Math.round(performance.now() - start),
    header_names: [...response.headers.keys()],
    diagnostic_headers: Object.fromEntries(
      [...response.headers.entries()].filter(([name]) => DIAGNOSTIC_HEADER.test(name)),
    ),
    body,
  };
  if (!response.ok) process.exitCode = 1;
} catch (err) {
  report = {
    started_at: startedAt,
    model_requested: MODEL,
    status: null,
    latency_ms: Math.round(performance.now() - start),
    network_error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
  };
  process.exitCode = 1;
}

mkdirSync(RESULTS_DIR, { recursive: true });
const reportPath = join(
  RESULTS_DIR,
  `probe-${startedAt.replace(/[:.]/g, "-").slice(0, 19)}.json`,
);
writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

console.log(JSON.stringify(report, null, 2));
console.log("Informe guardado en:", reportPath);
