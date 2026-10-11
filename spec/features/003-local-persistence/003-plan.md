# 003 — Local Persistence — Plan

## Status

Complete

## Approach

Se implementará una capa de persistencia independiente de React y de los componentes visuales.

Orden previsto:

```text
storage infrastructure
    ↓
validation & versioning
    ↓
preferences integration
    ↓
session state
    ↓
scoped deletion
    ↓
verification
```

Se ampliará la infraestructura únicamente cuando exista un caso de uso real, siguiendo `tech-stack.md`.

## Storage infrastructure

Se creará una capa en `src/infrastructure/storage/` que encapsule el acceso a las Web Storage APIs.

La infraestructura ofrecerá operaciones tipadas de lectura, escritura y eliminación, separando el mecanismo de almacenamiento de los datos de aplicación.

Las claves tendrán un namespace propio de Ask Sofi y se declararán en un único lugar.

El acceso será síncrono, siguiendo el comportamiento nativo de Web Storage. No se introducirán dependencias externas ni abstracciones asíncronas innecesarias.

## Data validation & versioning

Los datos persistidos utilizarán un formato versionado.

La lectura seguirá conceptualmente:

```text
read
  ↓
parse
  ↓
validate version
  ↓
validate data
  ↓
return value / safe fallback
```

Se utilizarán validadores específicos para las estructuras implementadas en esta feature.

Las migraciones serán explícitas y limitadas a versiones conocidas. No se desarrollará un sistema genérico de migraciones sin necesidad.

Los datos incompatibles o inválidos nunca se utilizarán directamente.

Una versión futura desconocida no se sobrescribirá automáticamente.

## Error handling

El acceso al almacenamiento contemplará:

- disponibilidad restringida o bloqueada;
- errores de lectura y escritura;
- cuota de almacenamiento agotada;
- datos corruptos;
- valores o versiones incompatibles.

Cuando falle la persistencia, la aplicación conservará su funcionamiento en memoria durante la sesión activa.

Las operaciones deberán indicar cuándo un guardado no se ha realizado realmente, evitando presentar como persistido un dato que solo existe en memoria.

La infraestructura no registrará contenidos privados de consultas en logs.

## Preferences integration

Se revisará el adaptador de preferencias existente en `002` y se integrará con la nueva infraestructura, sin mantener dos sistemas paralelos.

La migración conservará las preferencias válidas previamente almacenadas y respetará sus valores por defecto.

Los controles existentes seguirán funcionando con sus mismas interfaces públicas.

No se modificará el Design System ni el comportamiento visual aprobado, salvo lo imprescindible para la integración.

## Session state

Se implementará la persistencia temporal del borrador y del contexto de consulta.

Los cambios podrán recuperarse después de recargar la página dentro de la misma sesión del navegador.

La integración evitará escrituras innecesarias durante la introducción de texto.

No se almacenarán respuestas de análisis real ni contratos de dominio que todavía no existan.

## Data deletion

Se definirán operaciones diferenciadas para:

- limpiar el estado temporal de consulta;
- eliminar los datos de historial cuando existan;
- eliminar todos los datos de Ask Sofi.

Las operaciones eliminarán únicamente las claves propias de la aplicación.

El borrado completo deberá reflejarse también en el estado activo de React, sin mantener datos obsoletos en memoria.

No se desarrollará todavía la interfaz definitiva de gestión de datos.

## Future persistence contracts

Las siguientes features podrán incorporar sus repositorios y validadores sobre esta infraestructura.

No se crearán anticipadamente modelos completos para perfiles, favoritos, análisis guardados o estadísticas.

La persistencia definitiva de esos datos y sus interacciones se definirán en las respectivas features.

## Testing

Se priorizarán pruebas unitarias para los comportamientos deterministas de la infraestructura.

Se comprobarán:

- lectura, escritura y eliminación;
- aislamiento de claves y tipos de almacenamiento;
- validación y versionado;
- migración de preferencias existentes;
- recuperación ante datos inválidos;
- errores de almacenamiento y fallback;
- borrado selectivo y completo;
- ausencia de persistencia no autorizada.

Los tests de integración verificarán la conexión con las preferencias y los formularios existentes.

Se incluirán pruebas en navegador para comprobar la persistencia tras recarga y el restablecimiento después del borrado.

## Verification

Se ejecutarán las comprobaciones técnicas aplicables definidas en `tech-stack.md`.

Se verificará que:

- la interfaz existente no presenta regresiones;
- las preferencias conservan su comportamiento;
- la persistencia no introduce dependencias circulares;
- los componentes no utilizan directamente Web Storage;
- los datos privados no aparecen en logs;
- el almacenamiento bloqueado no rompe la aplicación;
- los criterios de `003-spec.md` están satisfechos.

## Audit & contracts

Auditoría previa a la implementación (T001):

- Único acceso directo a Web Storage: `themePreferenceStorage` (feature `002`), clave `ask-sofi:theme` con formato `{ version: 1, data }`, usado por `ThemeProvider` y `main.tsx`.
- Sonido: arrancaba siempre en silencio y no se guardaba.
- Movimiento: `MotionPreferenceContext` solo fuerza el movimiento reducido en una zona (Design Lab); no existe un control de usuario ni un dato que guardar.
- Borrador y contexto: `useState` local de `ProvisionalConsultation`.
- `SoundProvider` también lo usa el Design Lab con audio simulado.

Contratos (T002), declarados en `src/infrastructure/storage/storageKeys.ts`:

| Dato                                              | Almacenamiento   | Clave                           |
| ------------------------------------------------- | ---------------- | ------------------------------- |
| Preferencias (`theme`, `sound`)                   | `localStorage`   | `ask-sofi:preferences`          |
| Borrador y contexto                               | `sessionStorage` | `ask-sofi:session:consultation` |
| Historial (reservado, sin modelo)                 | `localStorage`   | prefijo `ask-sofi:history`      |
| Tema de la feature `002` (lectura y migración)    | `localStorage`   | `ask-sofi:theme`                |

Todo lo que guarda Ask Sofi lleva el prefijo `ask-sofi:`; es lo único que el borrado puede tocar.

## Implementation notes

Decisiones tomadas durante la implementación, sin cambiar los requisitos:

- **Preferencias unificadas.** `theme` y `sound` viven en un único registro versionado, validado campo a campo (un valor inválido no hace perder el otro). El tema antiguo de `002` se recupera en la lectura y se migra a la clave nueva en el siguiente guardado, momento en que se elimina la clave antigua.
- **Sonido.** Se recuerda la última elección, pero solo preselecciona la portada: `enabled` sigue empezando en silencio. La persistencia es opt-in (`SoundProvider persist`, activado solo en `App`) para que el Design Lab no toque las preferencias reales. La aplicación real activa además `deferAudio`: elegir «Con sonido» no descarga ni decodifica el MP3 mientras ningún componente suyo reproduzca la voz. El Design Lab no lo activa y prepara el audio con el gesto, como estaba aprobado.
- **Movimiento.** No hay preferencia de usuario en `002`, así que no se persiste; su comportamiento no cambia.
- **Borrador.** Se guarda en `sessionStorage` con una pausa de 400 ms tras la última pulsación y se vuelca al salir de la pantalla, al ocultarse la página y al cerrarla. No se persisten los avisos de validación; la pantalla activa se guarda aparte (véase *Manual review corrections*).
- **Resultados de guardado.** Cada escritura devuelve `{ persisted: true }` o `{ persisted: false, reason }` (`unavailable`, `quota`, `error`, `newer-version`); el valor se mantiene en memoria durante la sesión.
- **Versión futura.** Un registro de versión superior se conserva intacto: la sesión sigue con una copia en memoria que no vuelve a escribirse.
- **Borrado.** `clearConsultation`, `clearHistory` y `clearUserData` avisan dentro del documento para que React no conserve datos obsoletos. Todavía no existe interfaz que las invoque.
- **Guardia de arquitectura.** Una regla de ESLint prohíbe `localStorage` y `sessionStorage` fuera de `src/infrastructure/storage/` y de los tests.

## Manual review corrections

Tres problemas hallados en la revisión manual. Los requisitos están en `003-spec.md`; aquí, causa y enfoque.

**Sonido sin efecto.** No era un fallo de 003: `AppShell` preparaba el audio al pulsar «Empezar» (comprobado en navegador: contexto en marcha y MP3 decodificado), pero la aplicación real no tiene ningún `SofiSpeech` que pida la voz; solo existe en el Design Lab. Se mantiene el aviso de demostración aprobado y la voz llegará con la feature de resultados. Hasta entonces la voz y el typewriter se verifican en el Design Lab, donde una prueba de navegador comprueba que la fuente de audio arranca. Como preparar el audio en la aplicación real descargaba un MP3 que no suena, `deferAudio` lo difiere: la feature de resultados lo preparará llamando a `unlock` desde el gesto que pida la lectura.

**Restauración de la consulta.** Solo se persistía el texto; la pantalla activa era estado de React y la recarga volvía a la portada. Se persiste la pantalla activa en `sessionStorage` como navegación temporal (`tech-stack.md` §35). Coherencia:

- recargar restaura la pantalla y los textos;
- «Borrar todo» vacía el borrador y permanece en la consulta;
- volver a la portada conserva el borrador y «Empezar» lo retoma; la acción explícita para empezar de cero es «Borrar todo»;
- `clearUserData` devuelve la portada, que es el estado inicial.

**Desplazamiento al aviso de demostración.** «Una columna» es el mismo umbral que el layout (`$columns`, 67,5 em en `_breakpoints.scss`), no un tipo de dispositivo. Se desplaza una vez por petición, con `behavior: auto` si hay movimiento reducido, sin mover el foco (el aviso `role="status"` ya se anuncia) y solo si el destino no está ya visible. El margen superior se resuelve con `scroll-margin`.

## Known limits

- La prueba de navegador con almacenamiento bloqueado corre contra el servidor de desarrollo y simula el bloqueo solo para el código de la aplicación (el worker de MSW, exclusivo de desarrollo, guarda cookies en `localStorage`).
- **Audición.** En navegador real se comprueba automáticamente que, con el gesto, el contexto de audio queda en marcha, el MP3 se decodifica y, en el Design Lab, la fuente de audio arranca cuando Sofi escribe. La audición de la voz en el Design Lab y las comprobaciones manuales de interfaz, accesibilidad y responsive han sido confirmadas manualmente.
- **Tras recargar**, y con el audio diferido, el sonido solo se prepara con una acción que lo pida (`unlock`): el interruptor de la cabecera aparece apagado aunque la preferencia recordada sea «Con sonido» hasta que se pulsa. La portada sí la preselecciona.
- **A varias columnas** el aviso puede quedar bajo el pliegue: no se fuerza el desplazamiento por requisito.

## References

Requisitos:

- `003-spec.md`

Decisiones globales:

- `spec/constitution/mission.md`
- `spec/constitution/roadmap.md`
- `spec/constitution/tech-stack.md`

Reglas para agentes:

- `AGENTS.md`