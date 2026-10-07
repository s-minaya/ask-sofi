# Ask Sofi — Mission

> **Probabilities must be earned, not assumed.**

## 1. Visión

**Ask Sofi — Relationship Intelligence Agency** es un consultorio sentimental interactivo pensado para ayudar a interpretar mensajes ambiguos dentro de una relación.

Su objetivo no es adivinar lo que otra persona piensa ni presentar una interpretación como una verdad absoluta. Ask Sofi analiza el mensaje, el contexto disponible y los patrones de comunicación proporcionados por el usuario para ofrecer **varias interpretaciones posibles acompañadas de su incertidumbre**.

La experiencia debe sentirse como hablar con **Sofi**: una persona cercana, observadora, divertida y con criterio, capaz de decir tanto:

> “Esto tiene bastante pinta de que le ha molestado.”

como:

> “Con un ‘vale’ no hago milagros. Dame contexto.”

Ask Sofi combina humor, diseño y análisis probabilístico sin perder de vista que las relaciones humanas son complejas y que una herramienta nunca puede sustituir una conversación real.

---

## 2. Problema que queremos resolver

En conversaciones de pareja es frecuente encontrarse con mensajes cuya intención no resulta evidente:

- “No pasa nada.”
- “Haz lo que quieras.”
- “Vale.”
- “Da igual.”
- “Que te lo pases bien.”
- “Estoy bien.”

El significado de estas frases depende enormemente de su contexto.

Ask Sofi quiere ayudar al usuario a detenerse y considerar **más de una interpretación posible** antes de reaccionar impulsivamente o asumir que sabe exactamente qué quería decir su pareja.

La herramienta debe fomentar preguntas como:

- ¿Qué estaba ocurriendo antes del mensaje?
- ¿Cómo suele comunicarse esta persona?
- ¿La frase parece literal o indirecta?
- ¿Puede haber varias explicaciones plausibles?
- ¿Falta información para interpretar correctamente la situación?

El producto no pretende sustituir estas preguntas por una respuesta automática, sino ayudar a formularlas.

---

## 3. Público principal

Ask Sofi está diseñado principalmente como un consultorio humorístico para personas que alguna vez han pensado:

> “¿Pero qué ha querido decir con esto?”

La identidad inicial del producto juega con el concepto de un **“consultorio sentimental para novios con pocas pistas”**, pero la arquitectura y el análisis no deben depender de estereotipos de género.

Aunque la comunicación de marca pueda utilizar humor relacionado con parejas y novios despistados, las conclusiones de la herramienta nunca deben basarse en premisas como:

- “las mujeres siempre dicen X cuando quieren decir Y”;
- “los hombres no entienden indirectas”;
- “si una persona escribe X, necesariamente siente Y”.

Ask Sofi analiza **contexto y comportamiento**, no género.

---

## 4. Principios del producto

### 4.1. Contexto antes que adivinación

Una frase aislada rara vez contiene suficiente información para interpretar de forma fiable la intención de quien la escribió.

Ask Sofi debe utilizar, cuando estén disponibles:

1. el mensaje actual;
2. el contexto inmediato de la conversación;
3. patrones generales de comunicación proporcionados por el usuario.

El contexto actual debe tener más peso que cualquier tendencia general almacenada sobre la pareja.

Un perfil que indique que alguien “usa sarcasmo con frecuencia” nunca debe significar que todos sus mensajes sean interpretados como sarcasmo.

---

### 4.2. Las probabilidades representan incertidumbre

Ask Sofi puede mostrar probabilidades o niveles de confianza, pero nunca debe presentarlos como una medición objetiva de los pensamientos o emociones de otra persona.

Un resultado como:

> 67 % — expressing disappointment

significa que, entre las interpretaciones consideradas y con la información proporcionada, esa opción recibe mayor apoyo del sistema.

No significa:

> “Existe científicamente un 67 % de probabilidad de que tu pareja esté decepcionada.”

La interfaz debe comunicar esta diferencia de manera comprensible.

---

### 4.3. Probabilities must be earned, not assumed

Ask Sofi no confiará ciegamente en un porcentaje únicamente porque un modelo lo haya generado.

Las decisiones probabilísticas relevantes deben poder ser:

- evaluadas;
- comparadas;
- sometidas a casos de prueba;
- revisadas cuando cambie el sistema;
- cuestionadas cuando exista poca información.

El proyecto mantendrá un conjunto propio de evaluaciones para comprobar, dentro de lo posible, el comportamiento del sistema en el dominio específico de Ask Sofi.

Cuando no exista suficiente confianza o contexto, **pedir más información es una respuesta válida y preferible a inventar certeza**.

---

### 4.4. Varias interpretaciones son mejores que una sentencia

Siempre que resulte razonable, Ask Sofi debe presentar diferentes explicaciones plausibles.

Por ejemplo:

- puede estar expresando decepción;
- quizá espera que tomes la iniciativa;
- puede necesitar espacio;
- podría estar hablando literalmente;
- puede faltar contexto.

El objetivo no es encontrar una única “traducción correcta”, sino ayudar al usuario a comprender el espacio de posibilidades.

---

### 4.5. Ask Sofi puede decir “no lo sé”

La incertidumbre forma parte del producto.

Mensajes extremadamente breves, situaciones contradictorias o falta de contexto pueden impedir una interpretación razonable.

En esos casos Ask Sofi debe poder decir:

> “Necesito más contexto.”

Esta respuesta se considera un resultado correcto, no un fallo del sistema.

---

### 4.6. La comunicación real sigue siendo la mejor herramienta

Ask Sofi puede ofrecer pistas, pero nunca debe fomentar que sus resultados sustituyan una conversación con la pareja.

Cuando sea adecuado, las recomendaciones pueden favorecer comportamientos como:

- preguntar;
- aclarar;
- escuchar;
- expresar necesidades;
- evitar conclusiones precipitadas.

Ask Sofi ayuda a interpretar una situación. No toma decisiones sentimentales por el usuario.

---

## 5. Personalidad de Ask Sofi

Sofi es la voz del producto.

Debe sentirse:

- observadora;
- ingeniosa;
- directa;
- cercana;
- algo dramática cuando el humor lo permita;
- consciente de sus propias limitaciones.

Puede bromear.

Puede juzgar una situación de forma juguetona.

Puede utilizar expresiones coloquiales.

Pero no debe humillar, insultar ni ridiculizar seriamente al usuario o a su pareja.

La personalidad nunca debe interferir con la comprensión de los resultados.

El humor pertenece a **la presentación**.

La incertidumbre pertenece a **los datos**.

No deben confundirse.

---

## 6. Privacidad y filosofía local-first

Ask Sofi debe recopilar la mínima cantidad de información necesaria para funcionar.

Siempre que una funcionalidad pueda existir únicamente en el dispositivo del usuario, se preferirá una solución **local-first** antes que introducir almacenamiento remoto.

Entre los datos que pueden mantenerse localmente se encuentran:

- preferencias;
- borradores;
- historial voluntario;
- análisis guardados;
- favoritos;
- perfil de comunicación de la pareja;
- estadísticas personales derivadas de ese historial.

No se introducirá una cuenta de usuario, sincronización entre dispositivos o base de datos remota mientras no exista una necesidad real que lo justifique.

El historial persistente debe ser opcional.

El usuario debe poder borrar fácilmente la información almacenada por Ask Sofi.

Cuando información local vaya a enviarse para realizar un análisis, la interfaz debe dejar claro que esos datos abandonarán temporalmente el dispositivo para ser procesados.

---

## 7. Perfil de contexto de la pareja

Ask Sofi puede permitir al usuario describir tendencias habituales de comunicación de su pareja para mejorar el contexto de futuros análisis.

Este perfil debe:

- ser opcional;
- almacenarse localmente;
- poder modificarse;
- poder eliminarse;
- admitir respuestas como “no lo sé” o “depende”;
- centrarse en comportamientos observables.

Debe evitar diagnósticos o etiquetas como:

- “es manipuladora”;
- “tiene apego ansioso”;
- “es narcisista”;
- “es tóxica”.

En su lugar debe preguntar por cuestiones como:

- si suele hablar directamente;
- si utiliza sarcasmo;
- si necesita espacio durante un conflicto;
- si suele expresar claramente aquello que le molesta.

El perfil representa **tendencias aportadas por el usuario**, no hechos objetivos sobre otra persona.

---

## 8. Seguridad y prevención del abuso

Ask Sofi será una herramienta pública y debe asumir que puede recibir tráfico automatizado o malicioso.

El proyecto debe incorporar medidas razonables para:

- evitar abuso de recursos;
- limitar solicitudes excesivas;
- validar toda entrada;
- limitar el tamaño de mensajes y contexto;
- proteger credenciales y secretos;
- evitar que datos privados terminen innecesariamente en logs;
- degradarse de forma segura cuando un recurso externo no esté disponible.

La seguridad no debe depender de información almacenada en el navegador que pueda ser modificada por el usuario.

Las protecciones deben ser proporcionales al riesgo y a la escala del proyecto, evitando introducir infraestructura innecesaria.

---

## 9. Accesibilidad

La accesibilidad forma parte de la definición de calidad del producto.

No es una tarea que se añade al finalizar el desarrollo.

Ask Sofi tendrá como objetivo **WCAG 2.2 nivel AA**.

Cada funcionalidad deberá considerar desde su diseño:

- navegación mediante teclado;
- foco visible;
- estructura semántica;
- labels y nombres accesibles;
- estados y errores comprensibles;
- contraste suficiente;
- zoom y reflow;
- lectores de pantalla;
- movimiento reducido;
- alternativas estáticas a animaciones;
- información que no dependa exclusivamente del color.

La personalidad visual del proyecto nunca justifica excluir usuarios.

---

## 10. Open source y aprendizaje

Ask Sofi es un proyecto open source y de portfolio.

El código debe ser suficientemente claro para que:

- una persona junior pueda comprenderlo;
- su autora pueda defender todas las decisiones en una entrevista técnica;
- otros desarrolladores puedan contribuir sin necesitar conocer todo el proyecto;
- las decisiones importantes puedan rastrearse hasta una especificación.

Se preferirán soluciones sencillas y explícitas frente a abstracciones sofisticadas que no aporten una ventaja concreta.

El objetivo no es construir la arquitectura más compleja posible.

El objetivo es construir **la arquitectura más sencilla que resuelva correctamente el problema y pueda evolucionar cuando sea necesario**.

---

## 11. Spec Driven Development

Ask Sofi seguirá un enfoque de **Spec Driven Development**.

El flujo esperado es:

```text
idea
  ↓
specification
  ↓
plan
  ↓
tasks
  ↓
implementation
  ↓
verification
```

Las features no deben comenzar por la implementación.

Cada decisión debe vivir en el documento que corresponda y evitar duplicarse innecesariamente en distintas partes del repositorio.

Las especificaciones representan la intención del producto.

El código representa su implementación.

Cuando ambas cosas diverjan, la discrepancia debe resolverse explícitamente.

---

## 12. Coste

Uno de los requisitos fundamentales de Ask Sofi es poder mantenerse con un coste económico de:

> **0 €**

Se priorizarán herramientas, servicios y niveles gratuitos que permitan desarrollar, probar y publicar el proyecto sin asumir gastos.

Si una funcionalidad externa puede generar costes, debe existir una estrategia para:

- controlar su consumo;
- limitar el abuso;
- detectar agotamiento de recursos;
- degradar el servicio de forma segura.

Una funcionalidad no es suficientemente importante como para justificar cargos inesperados.

---

## 13. Fuera de alcance

Ask Sofi no pretende ser:

- terapia de pareja;
- una herramienta de diagnóstico psicológico;
- un detector de mentiras;
- un sistema de vigilancia de la pareja;
- una fuente objetiva sobre los pensamientos de otra persona;
- un sustituto de la comunicación;
- una herramienta para manipular emocionalmente a alguien;
- una plataforma social;
- un servicio de mensajería;
- una aplicación de citas.

Tampoco necesita, mientras no aparezca una necesidad demostrable:

- cuentas de usuario;
- autenticación para la aplicación web;
- sincronización entre dispositivos;
- una base de datos de conversaciones;
- almacenamiento remoto del historial personal.

El alcance debe mantenerse deliberadamente pequeño.

---

## 14. Criterio para tomar decisiones

Cuando existan varias soluciones posibles, se priorizarán en este orden:

1. privacidad y seguridad;
2. claridad para el usuario;
3. fiabilidad de las interpretaciones;
4. accesibilidad;
5. simplicidad de implementación;
6. mantenibilidad;
7. coste cero;
8. personalidad visual;
9. incorporación de nuevas funcionalidades.

Una solución técnicamente interesante no debe introducirse únicamente porque sea interesante.

Cada herramienta, dependencia o abstracción debe poder responder a la pregunta:

> **¿Qué problema concreto de Ask Sofi está resolviendo?**

Si no existe una respuesta clara, probablemente no la necesitamos.

---

## 15. Declaración final

Ask Sofi quiere demostrar que una aplicación basada en inteligencia artificial puede ser divertida sin fingir certeza, personalizada sin construir perfiles remotos y técnicamente interesante sin convertirse en una arquitectura innecesariamente compleja.

La misión del proyecto es ayudar al usuario a pasar de:

> “¿Qué demonios ha querido decir?”

a:

> “Estas son las interpretaciones más plausibles. Ahora tengo más contexto para decidir qué preguntar.”

**Ask Sofi ofrece perspectivas, no verdades.**