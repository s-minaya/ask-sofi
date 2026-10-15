# POC — Evaluación de Mistral Small 4 como traductor y redactor de Ask Sofi

> Experimento aislado. No es código de producción.
> No modificar documentación de decisiones ni código de la app.
> No hacer commit ni push de este directorio sin autorización explícita.

---

## Estructura

```
evals/llm-redactor/
├── cases.ts       Casos sintéticos (T01–T08 traducción, E01–E10 explicación)
├── prompts.ts     Prompts del sistema para ambas tareas
├── runner.ts      Ejecutor reproducible (DRY_RUN = true por defecto)
├── rubric.md      Rúbrica de evaluación para rellenar tras ejecutar
├── README.md      Este archivo
└── results/       Informes JSON generados (gitignoreado)
```

---

## Requisitos

- Node >= 22.6.0 (necesario para `--experimental-strip-types`)
- Cuenta en Mistral con clave de API activa
- **Antes de cualquier llamada real**: opt-out de entrenamiento activado en el panel de Mistral

---

## Fase 1 — Verificación estática (sin llamadas reales)

```bash
node --experimental-strip-types evals/llm-redactor/runner.ts
```

El script está en modo `DRY_RUN = true`. Solo imprime la configuración,
los casos y la estimación de tokens. No hace ninguna petición a la API.

Se puede ejecutar **en cualquier momento** y sin la clave configurada.

---

## Fase 2 — Configurar la clave de API

**Opción A — variable de entorno en la sesión actual (recomendada):**

```bash
# macOS / Linux
export MISTRAL_API_KEY=tu_clave_aqui

# Windows PowerShell
$env:MISTRAL_API_KEY = "tu_clave_aqui"

# Windows cmd
set MISTRAL_API_KEY=tu_clave_aqui
```

**Opción B — archivo `.env.local` en la raíz del repo** (ya está en `.gitignore`):

```
MISTRAL_API_KEY=tu_clave_aqui
```

Si usas la opción B, carga las variables antes de ejecutar:

```bash
# macOS / Linux
export $(cat .env.local | xargs)
```

**La clave nunca debe aparecer en el código ni en los informes de resultados.**

---

## Lista de verificaciones antes de ejecutar llamadas reales

Comprueba estas condiciones en [console.mistral.ai](https://console.mistral.ai)
**antes** de cambiar `DRY_RUN = false`:

1. **Opt-out de entrenamiento activado**: Admin Panel → Privacy →
   toggle «Anonymous improvement data» → desactivado.
   (Confirmar que es el toggle de la API, no solo el de Vibe, que son independientes.)

2. **Cuota disponible verificada**: Admin Panel → API → Limits.
   Apuntar el límite de tokens por minuto y el límite mensual disponible.

3. **Modelo `mistral-small-2603` disponible en tu tier**:
   verificar en el panel o con `GET https://api.mistral.ai/v1/models`.

4. **Sin presupuesto activo que se pueda agotar inesperadamente**:
   esta evaluación usa ~5 000–8 000 tokens en total.

---

## Fase 3 — Ejecutar la evaluación real

Solo tras obtener autorización explícita:

1. Editar `runner.ts` → cambiar `const DRY_RUN = true` a `const DRY_RUN = false`.
2. Asegurarse de que `MISTRAL_API_KEY` está en el entorno.
3. Ejecutar:

```bash
node --experimental-strip-types evals/llm-redactor/runner.ts
```

El runner:
- Ejecuta los 18 casos en orden (8 traducción + 10 explicación)
- Espera 2 000 ms entre llamadas para no saturar la cuota
- Se detiene si alcanza el presupuesto de tokens definido en `MAX_TOTAL_TOKENS_SESSION`
- **No tiene reintentos automáticos en caso de error**
- Guarda el informe completo en `results/eval-<timestamp>.json`

---

## Fase 4 — Revisar resultados

El informe JSON en `results/` contiene para cada caso:
- Prompt enviado
- Respuesta completa
- Tokens de entrada y salida
- Latencia en ms
- Error (si lo hubo)

Usar `rubric.md` para evaluar cada respuesta siguiendo los criterios definidos.

---

## Notas de privacidad

- Todos los casos son **100 % sintéticos** — ningún dato real de usuario.
- En free mode, Mistral puede usar los datos para entrenamiento **salvo opt-out activo**.
  Activar siempre el opt-out antes de cualquier llamada, aunque sean datos sintéticos.
- Los resultados en `results/` están gitignoreados para no publicarlos accidentalmente.
- Para evaluaciones con datos más realistas en el futuro, usar plan de pago con ZDR aprobado.
