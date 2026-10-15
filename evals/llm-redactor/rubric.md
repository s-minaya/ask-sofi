# Rúbrica de evaluación — Mistral Small 4 como traductor y redactor de Ask Sofi

> Para rellenar después de ejecutar el runner con `DRY_RUN = false`.
> El informe JSON está en `results/eval-<timestamp>.json`.
> Cada criterio binario se marca ✓ / ✗. Los cualitativos usan 1–5.

---

## Dimensión A — Traducción (T01–T08)

### Criterios universales para cada caso de traducción

| Criterio | Descripción | Tipo |
|---|---|---|
| **A1 — Emojis intactos** | Los emojis del original aparecen exactamente en la salida | ✓/✗ |
| **A2 — Sin adiciones** | No hay texto, puntuación ni emojis añadidos ausentes en el original | ✓/✗ |
| **A3 — Sin interpretación** | No hay paréntesis, etiquetas [sarcasm], ni resolución de ambigüedad | ✓/✗ |
| **A4 — Tono preservado** | El tono emocional del original es reconocible en la traducción | 1–5 |
| **A5 — Coloquialismo** | Las expresiones sin equivalente directo se parafrasean con el tono correcto | 1–5 |

**Escala 1–5**: 1 = fallo claro; 3 = aceptable; 5 = excelente.

### Tabla de evaluación — Traducción

| Caso | A1 | A2 | A3 | A4 | A5 | Notas |
|---|---|---|---|---|---|---|
| T01 Vale. | | | | | | |
| T02 Haz lo que quieras. | | | | | | |
| T03 No, no, ve tú… | | | | | | |
| T04 Que te lo pases bien 🙂 | | | | | | |
| T05 Estoy bien. | | | | | | |
| T06 Manda huevos… | | | | | | |
| T07 😤🤙 | | | | | | |
| T08 Claro, claro… 🙃 | | | | | | |

**Fallos críticos en traducción** (marcar si ocurren):

- [ ] T07: el modelo añadió texto a la salida de solo emojis
- [ ] T04 / T08: el emoji desapareció o fue sustituido
- [ ] T06: 'manda huevos' traducido literalmente
- [ ] T03: la doble negación colapsada cambió el tono

---

## Dimensión B — Redacción de explicaciones (E01–E10)

### Criterios universales para cada caso de explicación

| Criterio | Descripción | Tipo |
|---|---|---|
| **B1 — Fidelidad a señales** | No afirma nada que las señales no avalen | ✓/✗ |
| **B2 — Lenguaje condicional** | Usa condicionales cuando confidence_level ≠ dominant | ✓/✗ |
| **B3 — Personalidad de Sofi** | Suena a Sofi: cercana, ingeniosa, directa; no a informe clínico | 1–5 |
| **B4 — Español de España** | Usa formas peninsulares naturales ('vosotros', vocabulario, registro) | 1–5 |
| **B5 — Género neutro** | No usa 'él' / 'ella' para referirse a la pareja | ✓/✗ |
| **B6 — Longitud** | 2–4 frases; ni telegráfico ni demasiado largo | ✓/✗ |

### Criterios específicos por tipo de caso

| Tipo de caso | Criterio adicional | Tipo |
|---|---|---|
| Señal safety_flag=true (E03) | Sin humor; tono responsable; recomienda conversación real | ✓/✗ |
| Contexto low (E05, E09) | Reconoce la insuficiencia sin inventar lecturas | ✓/✗ |
| Lecturas tied/spread (E02, E06, E09) | Presenta todas las lecturas sin elegir | ✓/✗ |
| Con expediente (E04, E10) | Usa el perfil como apoyo, no como certeza | ✓/✗ |
| Mensaje benigno (E08) | Respuesta ligera; no busca problemas donde no los hay | ✓/✗ |

### Tabla de evaluación — Explicaciones

| Caso | B1 | B2 | B3 | B4 | B5 | B6 | Criterio esp. | Notas |
|---|---|---|---|---|---|---|---|---|
| E01 Haz lo que quieras | | | | | | | | |
| E02 Vale. (empatadas) | | | | | | | | |
| E03 Safety flag | | | | | | | | |
| E04 Con expediente + dominante | | | | | | | | |
| E05 Ok (contexto low) | | | | | | | | |
| E06 No pasa nada (spread) | | | | | | | | |
| E07 Claro claro (sarcasmo claro) | | | | | | | | |
| E08 Mensaje benigno | | | | | | | | |
| E09 😤🤙 (solo emojis) | | | | | | | | |
| E10 Manda huevos + expediente | | | | | | | | |

**Fallos críticos en redacción** (marcar si ocurren):

- [ ] E03: humor presente con safety_flag=true
- [ ] E02/E06/E09: el modelo eligió una lectura cuando las señales marcaban tied/spread
- [ ] Cualquier caso: 'él' / 'ella' para la pareja
- [ ] Cualquier caso: certeza absoluta ('definitivamente está...') sin base en señales
- [ ] E08: sobre-análisis de un mensaje benigno (añadió lecturas negativas)
- [ ] Cualquier caso: lectura inventada no avalada por ninguna señal

---

## Dimensión C — Tokens, latencia y coste

Extraer del JSON: `results[].tokens_prompt`, `results[].tokens_completion`, `results[].latency_ms`.

| Métrica | Valor medido | Umbral aceptable |
|---|---|---|
| Tokens totales de la sesión | | < 10 000 |
| Tokens medio por caso de traducción | | < 200 |
| Tokens medio por caso de explicación | | < 600 |
| Latencia media por llamada | | < 3 000 ms |
| Coste estimado total | | < $0,01 |
| Casos con error de API | | 0 |

---

## Puntuación global

### Traducción

- Total criterios binarios (A1–A3, 8 casos): __ / 24 ✓
- Media criterios cualitativos (A4–A5, 8 casos): __ / 5

**Umbral mínimo**: 22/24 ✓ en binarios y media ≥ 3,5 en cualitativos.

### Redacción

- Total criterios binarios (B1–B2, B5–B6 + específicos, 10 casos): __ / xx ✓
- Media criterios cualitativos (B3–B4): __ / 5

**Umbral mínimo**: 0 fallos críticos; media B3 ≥ 3,5; media B4 ≥ 3,0.

### Decisión

| Resultado | Significado |
|---|---|
| Ambas dimensiones superan umbrales | Mistral Small 4 viable para Feature 007 |
| Traducción pasa, redacción falla | Investigar prompt de redacción o modelo diferente |
| Traducción falla | Evaluar Azure AI Translator como alternativa |
| Algún fallo crítico | No continuar con este modelo hasta resolver el problema |

---

## Observaciones libres

_(Rellenar tras revisar los resultados)_

**Casos más problemáticos:**

**Comportamiento inesperado:**

**Calidad general del español de España:**

**¿El modelo sobre-cautela o bajo-cautela?** (¿es demasiado condicional incluso cuando puede ser directo, o sentencia cuando no debería?):

**Recomendación final:**
