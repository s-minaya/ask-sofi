// «¿Sigues ahí?» (008-are-u-still-here): el comportamiento. El aspecto está en _are-u-still-here.scss.
// Si nadie toca la página durante un rato, a Sofi le entra sueño y se duerme; con la primera actividad se despierta
// de un susto. Sin dependencias.
//
// Estados (data-still-here en el anfitrión):
//   idle → drowsy → nodding → drowsy → nodding → asleep: tras TIMING.idleAfter ms sin actividad, sola.
//   asleep dura hasta que hay actividad (o wake()) → startled → guilty → idle, o hasta reset() → idle sin susto.
//   Con actividad antes de dormirse (drowsy o nodding), vuelve directamente a idle.
// Si la pestaña ha estado oculta lo bastante, al volver ya está dormida: se durmió mientras no estabas.
//
// Uso sin framework:
//   import { attachStillHere } from './are-u-still-here.js';
//   const nap = attachStillHere(document.querySelector('.are-u-still-here')); // el sprite: class="sofi-blink are-u-still-here"
//   nap.reset();   // cancelar: vuelve al reposo al instante (p. ej. cuando Sofi tiene que hablar)
//   nap.destroy(); // al desmontar
// Para que no se duerma durante un rato (mientras habla o carga): nap.reset() y nap.pause('ocupada'); después,
// nap.resume('ocupada').
//
// Con «¡Deja de pincharme!» (poking.js) en el mismo sprite, que no se pisen: mientras se duerme, duerme o se
// despierta, poking vuelve a su reposo y no cuenta pinchazos (el clic despierta a Sofi):
//   const poking = attachPoking(host);
//   const nap = attachStillHere(host, {
//     onChange: (state) => (state === 'idle' ? poking.resume('nap') : (poking.reset(), poking.pause('nap'))),
//   });
//
// En React: crea el controlador en un efecto y destrúyelo al limpiar; deja el anfitrión sin hijos de React
// (attachStillHere le añade las capas). Si prefieres pintar tú las capas, usa createStillHereMachine y su onChange, y
// pon data-still-here={estado} en el anfitrión.

export const STATES = ['idle', 'drowsy', 'nodding', 'asleep', 'startled', 'guilty'];

// Tiempos en ms.
export const TIMING = Object.freeze({
  idleAfter: 90000, // sin actividad hasta que le entra sueño
  drowsy: 4200, // párpados pesados, con dos parpadeos lentos
  nod: 1100, // primera cabezada
  drowsyAgain: 2600, // se espabila… a medias
  nodAgain: 1500, // segunda cabezada, y se duerme
  startled: 900, // susto al despertar
  guilty: 2200, // cara de no haber hecho nada; luego, reposo
});

// Eventos que cuentan como actividad.
export const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];

// Máquina de estados sin DOM. Un solo temporizador a la vez: la cuenta atrás en reposo o el paso que toca después.
// Todo se mide con un reloj propio, que avanza a la velocidad elegida y se para con las pausas.
export function createStillHereMachine({ timing, onChange } = {}) {
  const t = { ...TIMING, ...timing };
  const DOZE = [['drowsy', t.drowsy], ['nodding', t.nod], ['drowsy', t.drowsyAgain], ['nodding', t.nodAgain]];
  let state = 'idle';
  let rate = 1;
  const holds = new Set(); // motivos de pausa: el de quien la usa y, en attachStillHere, pestaña oculta o fuera de pantalla
  let base = 0; // reloj propio acumulado hasta `since` (ms reales)
  let since = performance.now();
  const now = () => (holds.size ? base : base + (performance.now() - since) * rate);
  let lastActivity = now();
  let timer = 0;
  let due = null; // { at: instante del reloj propio, run }
  let listener = onChange;

  function arm() {
    clearTimeout(timer);
    if (!due || holds.size) return;
    timer = setTimeout(() => {
      const { run } = due;
      due = null;
      run();
    }, Math.max(0, (due.at - now()) / rate));
  }

  function schedule(ms, run) {
    due = { at: now() + ms, run };
    arm();
  }

  function cancel() {
    clearTimeout(timer);
    due = null;
  }

  function enter(next) {
    state = next;
    listener?.(state);
  }

  // En reposo, se duerme cuando lleve idleAfter sin actividad. La actividad solo apunta la hora (no toca el
  // temporizador): al vencer, se comprueba y, si ha habido actividad, se vuelve a esperar lo que falte.
  function countdown() {
    schedule(lastActivity + t.idleAfter - now(), () => {
      if (now() - lastActivity >= t.idleAfter) doze(0);
      else countdown();
    });
  }

  function doze(step) {
    if (step === DOZE.length) {
      enter('asleep'); // hasta que la despierten
      return;
    }
    const [next, ms] = DOZE[step];
    enter(next);
    schedule(ms, () => doze(step + 1));
  }

  // De vuelta al reposo, la cuenta empieza de cero (el susto y la cara de pillada no cuentan como inactividad).
  function toIdle() {
    lastActivity = now();
    enter('idle');
    countdown();
  }

  countdown();

  return {
    get state() {
      return state;
    },
    // Actividad de la usuaria: reinicia la cuenta y, si se estaba durmiendo o dormía, la despierta.
    wake() {
      lastActivity = now();
      if (holds.size) return;
      if (state === 'drowsy' || state === 'nodding') {
        cancel();
        toIdle();
      } else if (state === 'asleep') {
        enter('startled');
        schedule(t.startled, () => {
          enter('guilty');
          schedule(t.guilty, toIdle);
        });
      }
    },
    // Empieza ya a dormirse (solo desde el reposo).
    sleep() {
      if (state !== 'idle') return;
      cancel();
      doze(0);
    },
    // Cancela lo que esté haciendo: reposo al instante, sin susto, y la cuenta vuelve a empezar.
    reset() {
      cancel();
      lastActivity = now();
      if (state !== 'idle') enter('idle');
      countdown();
    },
    // Tiempo (ms reales) que la pestaña ha estado oculta: cuenta como inactividad. Si basta, ya está dormida.
    away(ms) {
      if (state !== 'idle' && state !== 'drowsy' && state !== 'nodding') return;
      lastActivity -= ms * rate;
      if (now() - lastActivity >= t.idleAfter) {
        cancel();
        enter('asleep');
      } else if (state === 'idle') countdown();
    },
    // Congela los tiempos (no las animaciones CSS). Cada motivo se reanuda por separado.
    pause(reason = 'user') {
      if (!holds.size) {
        base = now();
        clearTimeout(timer);
      }
      holds.add(reason);
    },
    resume(reason = 'user') {
      if (!holds.delete(reason) || holds.size) return;
      since = performance.now();
      arm();
    },
    // Velocidad de los tiempos (1 normal, 0.25 cuatro veces más lento), para revisar a cámara lenta.
    setRate(next) {
      if (!holds.size) {
        base = now();
        since = performance.now();
      }
      rate = next;
      arm();
    },
    destroy() {
      cancel();
      listener = undefined;
    },
  };
}

// Capas que pinta _are-u-still-here.scss. Van por atributo (no por clase) para que funcionen igual con CSS Modules.
const LAYERS =
  '<span data-still-here-layer="body"><span data-still-here-layer="pose"></span>' +
  '<span data-still-here-layer="face"></span><span data-still-here-layer="mouth"></span></span>' +
  '<span data-still-here-layer="z1"></span><span data-still-here-layer="z2"></span>' +
  '<span data-still-here-layer="z3"></span><span data-still-here-layer="burst"></span>';

// Conecta la máquina con el sprite de Sofi: escucha la actividad en `target` (toda la página por defecto), pone
// data-still-here y detiene los tiempos mientras Sofi está fuera de la pantalla. Con la pestaña oculta también se
// detienen, pero ese rato cuenta como inactividad. El anfitrión tiene que llevar la clase de _are-u-still-here.scss
// (en CSS Modules, styles['are-u-still-here']).
export function attachStillHere(host, { timing, target = document, onChange } = {}) {
  if (!host.querySelector(':scope > [data-still-here-layer="body"]')) host.insertAdjacentHTML('beforeend', LAYERS);

  const machine = createStillHereMachine({
    timing,
    onChange(state) {
      host.dataset.stillHere = state;
      onChange?.(state);
    },
  });
  host.dataset.stillHere = machine.state;

  const onActivity = (e) => {
    // Al hacer scroll o moverse lo que hay debajo, el navegador manda movimientos de puntero sin desplazamiento.
    if (e.type === 'pointermove' && !e.movementX && !e.movementY) return;
    machine.wake();
  };
  const listen = { capture: true, passive: true };
  for (const type of ACTIVITY) target.addEventListener(type, onActivity, listen);

  let hiddenAt = 0;
  const onVisibility = () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      machine.pause('hidden');
    } else if (hiddenAt) {
      machine.away(performance.now() - hiddenAt);
      hiddenAt = 0;
      machine.resume('hidden');
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();

  const observer =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) =>
          entries.at(-1).isIntersecting ? machine.resume('offscreen') : machine.pause('offscreen'),
        )
      : null;
  observer?.observe(host);

  return {
    get state() {
      return machine.state;
    },
    wake: machine.wake,
    sleep: machine.sleep,
    reset: machine.reset,
    pause: (reason) => machine.pause(reason),
    resume: (reason) => machine.resume(reason),
    setRate: machine.setRate,
    destroy() {
      for (const type of ACTIVITY) target.removeEventListener(type, onActivity, listen);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
      machine.destroy();
      delete host.dataset.stillHere;
      for (const layer of host.querySelectorAll(':scope > [data-still-here-layer]')) layer.remove();
    },
  };
}
