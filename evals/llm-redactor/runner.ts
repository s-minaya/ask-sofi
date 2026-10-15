/**
 * Ejecutor de la evaluación de Mistral Small 4 para Ask Sofi.
 *
 * PRIMERA FASE (DRY_RUN = true): solo verifica la configuración estáticamente.
 * Para realizar llamadas reales, cambia DRY_RUN a false y obtén autorización explícita.
 *
 * Ejecución:
 *   node --experimental-strip-types evals/llm-redactor/runner.ts
 *
 * Requisito: Node >= 22.6.0 (experimental-strip-types).
 * La clave de API va exclusivamente en la variable de entorno MISTRAL_API_KEY.
 * Nunca se guarda en este archivo ni en los resultados.
 */

import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import type { EvalCase, ExplanationCase, TranslationCase } from "./cases.ts";
import { EXPLANATION_CASES, TRANSLATION_CASES } from "./cases.ts";
import {
  EXPLANATION_SYSTEM_PROMPT,
  TRANSLATION_SYSTEM_PROMPT,
} from "./prompts.ts";

// ─── Configuración ─────────────────────────────────────────────────────────────

const MODEL = "mistral-small-2603";
const API_BASE = "https://api.mistral.ai/v1";

/**
 * Cambiar a false SOLO tras obtener autorización explícita para realizar llamadas
 * reales. En true, el script solo verifica la configuración sin hacer ninguna petición.
 */
const DRY_RUN = true;

/** Temperatura baja para salidas reproducibles. */
const TEMPERATURE = 0.3;

/** Tokens máximos de salida por llamada. */
const MAX_TOKENS_PER_CALL = 400;

/**
 * Pausa entre llamadas. 2 000 ms = 0,5 req/s, muy por debajo de los límites
 * conocidos del free tier para evitar throttling.
 */
const DELAY_BETWEEN_CALLS_MS = 2_000;

/**
 * Presupuesto de tokens para la sesión completa. El runner se detiene si lo supera.
 * La estimación del dry-run usa 4 chars/token (conservador). Los tokens reales
 * suelen ser menores. 12 000 es el techo real de seguridad para 18 casos.
 */
const MAX_TOTAL_TOKENS_SESSION = 12_000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RESULTS_DIR = join(__dirname, "results");

// ─── Tipos internos ────────────────────────────────────────────────────────────

type CallResult = {
  case_id: string;
  task: "translation" | "explanation";
  input_summary: string;
  user_prompt: string;
  response: string;
  tokens_prompt: number;
  tokens_completion: number;
  latency_ms: number;
  error?: string;
};

type RunReport = {
  model: string;
  dry_run: boolean;
  timestamp: string;
  total_cases_run: number;
  results: CallResult[];
  total_tokens: number;
  total_latency_ms: number;
  avg_latency_ms: number;
  estimated_cost_usd: string;
  notes: string;
};

type MistralResponse = {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number };
};

// ─── Construcción de prompts ───────────────────────────────────────────────────

function buildTranslationUserPrompt(c: TranslationCase): string {
  return `Translate the following Spanish message to English:\n\n${c.input}`;
}

function buildExplanationUserPrompt(c: ExplanationCase): string {
  const { jev_signals, original_message } = c;

  const readings = [jev_signals.primary_reading, ...jev_signals.secondary_readings];
  const readingsList = readings.map((r, i) => `  ${i + 1}. ${r}`).join("\n");

  const profileSection = jev_signals.has_profile && jev_signals.profile_note
    ? `Perfil de comunicación disponible: ${jev_signals.profile_note}`
    : "Perfil de comunicación: no disponible";

  return [
    `Mensaje analizado: "${original_message}"`,
    "",
    "Señales del análisis:",
    `- Lecturas identificadas:\n${readingsList}`,
    `- Nivel de confianza: ${jev_signals.confidence_level}`,
    `- Suficiencia del contexto: ${jev_signals.context_sufficiency}`,
    `- Señal de seguridad: ${jev_signals.safety_flag ? "ACTIVA" : "no activa"}`,
    `- ${profileSection}`,
    "",
    "Escribe la explicación de Sofi en español de España (máximo 4 frases).",
  ].join("\n");
}

// ─── Llamada a la API ──────────────────────────────────────────────────────────

async function callMistral(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const apiKey = process.env["MISTRAL_API_KEY"];
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY no está definida en el entorno");
  }

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: MAX_TOKENS_PER_CALL,
      temperature: TEMPERATURE,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as MistralResponse;
  const content = data.choices[0]?.message.content ?? "(respuesta vacía)";
  return {
    content,
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Estimación de tokens (sin llamada real) ───────────────────────────────────

/** Aproximación: 4 caracteres ≈ 1 token. Solo para el dry-run. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Verificación estática (dry-run) ──────────────────────────────────────────

function verifyConfiguration(): void {
  const apiKey = process.env["MISTRAL_API_KEY"];
  const allCases: EvalCase[] = [...TRANSLATION_CASES, ...EXPLANATION_CASES];

  console.log("══════════════════════════════════════════════");
  console.log("  Ask Sofi — Evaluación LLM redactor (POC)");
  console.log("══════════════════════════════════════════════");
  console.log(`Modelo:             ${MODEL}`);
  console.log(`Modo:               DRY RUN — sin llamadas reales`);
  console.log(`Temperatura:        ${TEMPERATURE}`);
  console.log(`Tokens máx./llamada: ${MAX_TOKENS_PER_CALL}`);
  console.log(`Delay entre llamadas: ${DELAY_BETWEEN_CALLS_MS} ms`);
  console.log(`Presupuesto sesión:  ${MAX_TOTAL_TOKENS_SESSION} tokens`);

  console.log("\n─── Clave de API ───────────────────────────");
  if (apiKey) {
    const masked = `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
    console.log(`✓ MISTRAL_API_KEY detectada: ${masked}`);
  } else {
    console.log("✗ MISTRAL_API_KEY no encontrada");
    console.log("  Configúrala antes de ejecutar (ver README.md)");
  }

  console.log("\n─── Casos de evaluación ─────────────────────");
  console.log(`  Traducción:  ${TRANSLATION_CASES.length} casos`);
  console.log(`  Explicación: ${EXPLANATION_CASES.length} casos`);
  console.log(`  Total:       ${allCases.length} casos`);

  console.log("\n─── Estimación de tokens por caso ───────────");
  let totalEstimated = 0;

  for (const c of allCases) {
    const sysPrompt =
      c.task === "translation" ? TRANSLATION_SYSTEM_PROMPT : EXPLANATION_SYSTEM_PROMPT;
    const userPrompt =
      c.task === "translation"
        ? buildTranslationUserPrompt(c as TranslationCase)
        : buildExplanationUserPrompt(c as ExplanationCase);

    const inputTokens = estimateTokens(sysPrompt + userPrompt);
    const outputTokens = c.task === "translation" ? 50 : 200;
    const total = inputTokens + outputTokens;
    totalEstimated += total;

    const label = c.task === "translation"
      ? (c as TranslationCase).input.slice(0, 30)
      : (c as ExplanationCase).original_message.slice(0, 30);

    console.log(`  ${c.id} [${c.task.slice(0, 5)}] "${label}" → ~${total} tokens`);
  }

  console.log("\n─── Presupuesto total ────────────────────────");
  // Precio medio estimado: ($0.15 entrada + $0.60 salida) / 2 ≈ $0.375/MTok
  const estimatedCostUSD = (totalEstimated / 1_000_000) * 0.375;
  console.log(`Tokens estimados:   ~${totalEstimated}`);
  console.log(`Dentro de presupuesto: ${totalEstimated <= MAX_TOTAL_TOKENS_SESSION ? "✓ sí" : "✗ no — revisar MAX_TOTAL_TOKENS_SESSION"}`);
  console.log(`Coste estimado:     ~$${estimatedCostUSD.toFixed(5)} USD`);

  console.log("\n─── Resultado del dry-run ───────────────────");
  const issues: string[] = [];
  if (!apiKey) issues.push("MISTRAL_API_KEY no configurada");
  if (totalEstimated > MAX_TOTAL_TOKENS_SESSION) issues.push("Estimación supera el presupuesto");

  if (issues.length === 0) {
    console.log("✓ Configuración válida. Listo para ejecutar cuando se autorice.");
  } else {
    console.log("Problemas detectados:");
    for (const issue of issues) console.log(`  ✗ ${issue}`);
  }

  console.log("\nPara ejecutar llamadas reales:");
  console.log("  1. Obtén autorización explícita");
  console.log("  2. Activa el opt-out de entrenamiento en el panel de Mistral");
  console.log("  3. Verifica la cuota disponible en Admin Panel → API → Limits");
  console.log("  4. Cambia DRY_RUN = false en runner.ts");
  console.log("  5. Configura MISTRAL_API_KEY (ver README.md)");
  console.log("  6. Vuelve a ejecutar: node --experimental-strip-types evals/llm-redactor/runner.ts");
}

// ─── Ejecución real ────────────────────────────────────────────────────────────

async function runEvaluation(): Promise<void> {
  const apiKey = process.env["MISTRAL_API_KEY"];
  if (!apiKey) {
    console.error("Error: MISTRAL_API_KEY no está definida. Abortando.");
    process.exit(1);
  }

  const allCases: EvalCase[] = [...TRANSLATION_CASES, ...EXPLANATION_CASES];
  const results: CallResult[] = [];
  let totalTokens = 0;
  let totalLatency = 0;

  mkdirSync(RESULTS_DIR, { recursive: true });

  console.log("══════════════════════════════════════════════");
  console.log("  Ask Sofi — Evaluación LLM redactor (REAL)");
  console.log("══════════════════════════════════════════════");
  console.log(`Modelo: ${MODEL} | Casos: ${allCases.length} | Temp: ${TEMPERATURE}`);
  console.log();

  for (let i = 0; i < allCases.length; i++) {
    const c = allCases[i]!;
    const systemPrompt =
      c.task === "translation" ? TRANSLATION_SYSTEM_PROMPT : EXPLANATION_SYSTEM_PROMPT;
    const userPrompt =
      c.task === "translation"
        ? buildTranslationUserPrompt(c as TranslationCase)
        : buildExplanationUserPrompt(c as ExplanationCase);

    const inputSummary =
      c.task === "translation"
        ? (c as TranslationCase).input
        : (c as ExplanationCase).original_message;

    console.log(`[${c.id}] ${c.task} — "${inputSummary.slice(0, 50)}"`);

    const start = Date.now();
    let result: CallResult;

    try {
      const { content, promptTokens, completionTokens } = await callMistral(
        systemPrompt,
        userPrompt,
      );
      const latency = Date.now() - start;

      result = {
        case_id: c.id,
        task: c.task,
        input_summary: inputSummary,
        user_prompt: userPrompt,
        response: content,
        tokens_prompt: promptTokens,
        tokens_completion: completionTokens,
        latency_ms: latency,
      };

      totalTokens += promptTokens + completionTokens;
      totalLatency += latency;

      console.log(
        `  ✓ ${latency}ms | ${promptTokens}p + ${completionTokens}c = ${promptTokens + completionTokens} tokens`,
      );
      console.log(
        `  → "${content.slice(0, 100)}${content.length > 100 ? "…" : ""}"`,
      );
    } catch (err) {
      const latency = Date.now() - start;
      result = {
        case_id: c.id,
        task: c.task,
        input_summary: inputSummary,
        user_prompt: userPrompt,
        response: "",
        tokens_prompt: 0,
        tokens_completion: 0,
        latency_ms: latency,
        error: err instanceof Error ? err.message : String(err),
      };
      console.log(`  ✗ Error: ${result.error}`);
    }

    results.push(result);

    if (totalTokens >= MAX_TOTAL_TOKENS_SESSION) {
      console.log(
        `\n⚠ Presupuesto alcanzado (${totalTokens} tokens). Deteniendo antes del caso ${i + 2}.`,
      );
      break;
    }

    if (i < allCases.length - 1) {
      await sleep(DELAY_BETWEEN_CALLS_MS);
    }
  }

  const estimatedCostUSD = (totalTokens / 1_000_000) * 0.375;
  const avgLatency = results.length > 0 ? Math.round(totalLatency / results.length) : 0;

  const report: RunReport = {
    model: MODEL,
    dry_run: false,
    timestamp: new Date().toISOString(),
    total_cases_run: results.length,
    results,
    total_tokens: totalTokens,
    total_latency_ms: totalLatency,
    avg_latency_ms: avgLatency,
    estimated_cost_usd: `$${estimatedCostUSD.toFixed(5)}`,
    notes:
      "POC de evaluación. La clave de API no aparece en este archivo. " +
      "Revisar con la rúbrica en rubric.md.",
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const reportPath = join(RESULTS_DIR, `eval-${timestamp}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("\n══════════════════════════════════════════════");
  console.log("Evaluación completada");
  console.log(`Casos ejecutados:   ${results.length}`);
  console.log(`Tokens totales:     ${totalTokens}`);
  console.log(`Latencia media:     ${avgLatency} ms`);
  console.log(`Coste estimado:     ${report.estimated_cost_usd}`);
  console.log(`Informe guardado:   ${reportPath}`);
  console.log("Revisa los resultados con rubric.md.");
}

// ─── Punto de entrada ──────────────────────────────────────────────────────────

if (DRY_RUN) {
  verifyConfiguration();
} else {
  runEvaluation().catch((err: unknown) => {
    console.error("Error fatal:", err);
    process.exit(1);
  });
}
