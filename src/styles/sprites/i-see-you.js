// «Te veo» (009-i-see-you): el comportamiento. El aspecto está en _i-see-you.scss.
// Sofi sigue con la mirada el cursor por toda la página. Si la usuaria se da cuenta y juega con ella (lo mueve a su
// alrededor, de un lado a otro) o se lo deja encima, Sofi se ve pillada: «¡oh!», sonrisa pícara, lengua fuera y risita;
// luego vuelve al reposo y, durante un rato, no se deja pillar otra vez. Sin dependencias.
//
// Estados (data-i-see-you en el anfitrión) y mirada (data-i-see-you-gaze: center, left, right, up o down):
//   idle → watching: el cursor se mueve y lo mira, con un pequeño retraso (lo sigue, no va pegada a él).
//   watching → idle: el cursor lleva TIMING.rest ms quieto o ha salido de la ventana.
//   watching → caught → smirk → tease → giggle → smirk → idle: la pillan. Pasa si la mirada cambia TIMING.plays veces
//   en TIMING.play ms (están jugando con ella), si el cursor se queda TIMING.dwell ms encima de Sofi o con notice().
//   Después, TIMING.cooldown ms sin dejarse pillar (salvo con notice()).
// En pantallas táctiles mira hacia donde se toca, y una pulsación larga sobre ella también la pilla.
//
// Uso sin framework:
//   import { attachISeeYou } from './i-see-you.js';
//   const eyes = attachISeeYou(document.querySelector('.i-see-you')); // el sprite: class="sofi-blink i-see-you"
//   eyes.reset();   // cancelar: vuelve al reposo al instante (p. ej. cuando Sofi tiene que hablar)
//   eyes.destroy(); // al desmontar
// Para que no mire ni reaccione durante un rato (mientras habla o carga): eyes.reset() y eyes.pause('ocupada');
// después, eyes.resume('ocupada').
//
// Con «¡Deja de pincharme!» (poking.js) y «¿Sigues ahí?» (are-u-still-here.js) en el mismo sprite, que no se pisen:
// cuando una sale de su reposo, las otras vuelven al suyo y se pausan hasta que acaba. Mirar no cuenta como salir del
// reposo. Solo se actúa al cambiar (onChange de esta avisa también de cada cambio de mirada, y poking no distingue
// motivos de pausa: reanudarlo a cada aviso anularía cualquier otra pausa suya):
//   const poking = attachPoking(host, { onChange: (s) => quiet('poking', s === 'idle') });
//   const nap = attachStillHere(host, { onChange: (s) => quiet('nap', s === 'idle') });
//   const eyes = attachISeeYou(host, { onChange: (s) => quiet('eyes', s === 'idle' || s === 'watching') });
//   const resting = { poking: true, nap: true, eyes: true };
//   function quiet(who, rest) {
//     if (resting[who] === rest) return;
//     resting[who] = rest;
//     for (const [name, other] of Object.entries({ poking, nap, eyes })) {
//       if (name === who) continue;
//       if (rest) {
//         other.resume(who);
//       } else {
//         other.reset();
//         other.pause(who);
//       }
//     }
//   }
//
// En React: crea el controlador en un efecto y destrúyelo al limpiar; deja el anfitrión sin hijos de React
// (attachISeeYou le añade las capas). Si prefieres pintar tú las capas, usa createISeeYouMachine y gazeAt, y pon
// data-i-see-you={estado} y data-i-see-you-gaze={mirada} en el anfitrión.

export const STATES = ['idle', 'watching', 'caught', 'smirk', 'tease', 'giggle'];
export const GAZES = ['center', 'left', 'right', 'up', 'down'];

// Tiempos en ms. caught, tease y giggle están también en _i-see-you.scss (lo que duran sus efectos).
export const TIMING = Object.freeze({
  react: 90, // retraso de la mirada al cambiar de dirección
  rest: 2500, // cursor quieto hasta que vuelve al reposo
  dwell: 1200, // cursor encima de Sofi hasta que la pillan
  play: 3500, // ventana en la que se cuentan los cambios de mirada…
  plays: 6, // …y cuántos hacen falta para pillarla
  caught: 1100, // «¡oh!», con la alerta
  smirk: 900, // sonrisa pícara: «sí, te seguía»
  tease: 1300, // lengua fuera, con el destello
  giggle: 1200, // risita
  after: 800, // vuelve a la sonrisa pícara antes del reposo
  cooldown: 15000, // tras reaccionar, sin dejarse pillar
});

// Dónde mira: el punto entre los ojos (fracción del sprite) y el radio, en anchos de sprite, dentro del cual mira al
// frente (el cursor está sobre su cara).
export const FACE = Object.freeze({ x: 0.53, y: 0.5, radius: 0.14 });

const SECTORS = { right: 0, down: 90, left: 180, up: -90 };
const HYSTERESIS = 12; // grados de más que conserva la mirada actual, para que no tiemble en los bordes

// Mirada hacia el punto (x, y) de la ventana, para un sprite con la caja rect (getBoundingClientRect). current es la
// mirada actual: la conserva cerca de los bordes entre direcciones.
export function gazeAt(x, y, rect, current = null, face = FACE) {
  const dx = x - (rect.left + face.x * rect.width);
  const dy = y - (rect.top + face.y * rect.height);
  if (Math.hypot(dx, dy) < face.radius * rect.width * (current === 'center' ? 1.25 : 1)) return 'center';
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const off = (gaze) => Math.abs(((angle - SECTORS[gaze] + 540) % 360) - 180);
  if (current in SECTORS && off(current) <= 45 + HYSTERESIS) return current;
  return Object.keys(SECTORS).reduce((a, b) => (off(b) < off(a) ? b : a));
}

// Máquina de estados sin DOM. Todo se mide con un reloj propio, que avanza a la velocidad elegida y se para con las
// pausas; los temporizadores con nombre (retraso de la mirada, reposo, cursor encima y pasos de la reacción) comparten
// un solo setTimeout, el del más próximo.
export function createISeeYouMachine({ timing, onChange } = {}) {
  const t = { ...TIMING, ...timing };
  const SEQUENCE = [['caught', t.caught], ['smirk', t.smirk], ['tease', t.tease], ['giggle', t.giggle], ['smirk', t.after]];
  let state = 'idle';
  let gaze = 'center';
  let pending = null; // mirada que espera su retraso
  let rate = 1;
  const holds = new Set(); // motivos de pausa: el de quien la usa y, en attachISeeYou, pestaña oculta o fuera de pantalla
  let base = 0; // reloj propio acumulado hasta `since` (ms reales)
  let since = performance.now();
  const now = () => (holds.size ? base : base + (performance.now() - since) * rate);
  const timers = new Map(); // nombre → { at: instante del reloj propio, run }
  let handle = 0;
  let plays = []; // instantes de los últimos cambios de mirada
  let lastMove = 0; // último movimiento del cursor
  let calmUntil = -Infinity; // hasta cuándo no se deja pillar
  let listener = onChange;

  const reacting = () => state !== 'idle' && state !== 'watching';
  const emit = () => listener?.(state, gaze);

  function arm() {
    clearTimeout(handle);
    if (holds.size || !timers.size) return;
    let next = Infinity;
    for (const { at } of timers.values()) next = Math.min(next, at);
    handle = setTimeout(fire, Math.max(0, (next - now()) / rate));
  }

  function fire() {
    const time = now();
    for (const [name, task] of [...timers]) {
      if (task.at > time + 1 || timers.get(name) !== task) continue;
      timers.delete(name);
      task.run();
    }
    arm();
  }

  function after(name, ms, run) {
    timers.set(name, { at: now() + ms, run });
    arm();
  }

  function cancel(...names) {
    for (const name of names) timers.delete(name);
    arm();
  }

  function toIdle() {
    cancel('react', 'rest');
    pending = null;
    plays = [];
    if (state === 'idle') return;
    state = 'idle';
    emit();
  }

  // Reposo cuando el cursor lleve t.rest quieto. Moverlo solo apunta la hora (no toca el temporizador): al vencer, se
  // comprueba y, si se ha movido, se vuelve a esperar lo que falte.
  function restCheck() {
    const left = lastMove + t.rest - now();
    if (left > 1) after('rest', left, restCheck);
    else toIdle();
  }

  function commit(next) {
    pending = null;
    if (state === 'watching' && next === gaze) return;
    const was = state;
    state = 'watching';
    gaze = next;
    emit();
    if (was !== 'watching') return;
    const time = now();
    plays = plays.filter((at) => time - at < t.play);
    plays.push(time);
    if (plays.length >= t.plays) spotted();
  }

  // La reacción, paso a paso; al acabar, reposo y un rato sin dejarse pillar.
  function react(step) {
    if (step === SEQUENCE.length) {
      calmUntil = now() + t.cooldown;
      toIdle();
      return;
    }
    const [next, ms] = SEQUENCE[step];
    state = next;
    emit();
    after('step', ms, () => react(step + 1));
  }

  function start() {
    cancel('react', 'rest', 'dwell');
    pending = null;
    plays = [];
    gaze = 'center';
    react(0);
  }

  // La pillan sola (jugando con ella o con el cursor encima): no mientras reacciona ni justo después.
  function spotted() {
    if (!reacting() && now() >= calmUntil) start();
  }

  return {
    get state() {
      return state;
    },
    // La mirada que va a tener: la que espera su retraso o la actual.
    get gaze() {
      return pending ?? gaze;
    },
    // El cursor se ha movido y la mirada que le toca es `next`.
    look(next) {
      if (holds.size || reacting()) return;
      lastMove = now();
      if (!timers.has('rest')) after('rest', t.rest, restCheck);
      if (state === 'watching' && next === gaze) {
        if (pending) {
          pending = null;
          cancel('react');
        }
        return;
      }
      if (next === pending) return;
      pending = next;
      after('react', t.react, () => commit(next));
    },
    // El cursor ha salido de la ventana: reposo enseguida.
    rest() {
      if (reacting() || state !== 'watching') return;
      lastMove = now() - t.rest + 400;
      after('rest', 400, restCheck);
    },
    // El cursor entra en Sofi (true) o sale (false). Si se queda encima, la pillan.
    hover(on) {
      if (!on) cancel('dwell');
      else if (!holds.size && !reacting()) after('dwell', t.dwell, spotted);
    },
    // Que la pillen ya, aunque acabe de reaccionar.
    notice() {
      if (!holds.size && !reacting()) start();
    },
    // Cancela lo que esté haciendo: reposo al instante. Si estaba reaccionando, cuenta como reacción acabada.
    reset() {
      if (reacting()) calmUntil = now() + t.cooldown;
      cancel('react', 'rest', 'dwell', 'step');
      pending = null;
      plays = [];
      if (state !== 'idle') {
        state = 'idle';
        emit();
      }
    },
    // Congela los tiempos (no las animaciones CSS). Cada motivo se reanuda por separado.
    pause(reason = 'user') {
      if (!holds.size) {
        base = now();
        clearTimeout(handle);
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
      timers.clear();
      clearTimeout(handle);
      listener = undefined;
    },
  };
}

// Capas que pinta _i-see-you.scss. Van por atributo (no por clase) para que funcionen igual con CSS Modules.
const LAYERS =
  '<span data-i-see-you-layer="face"></span><span data-i-see-you-layer="alert"></span>' +
  '<span data-i-see-you-layer="sparkle"></span>';

// Conecta la máquina con el sprite de Sofi: sigue el puntero en `target` (toda la página por defecto), pone
// data-i-see-you y data-i-see-you-gaze, y se detiene con la pestaña oculta o con Sofi fuera de la pantalla. La caja del
// sprite solo se mide cuando hace falta (tras scroll, cambio de tamaño o redimensionado), nunca en cada movimiento. El
// anfitrión tiene que llevar la clase de _i-see-you.scss (en CSS Modules, styles['i-see-you']).
export function attachISeeYou(host, { timing, face = FACE, target = document, onChange } = {}) {
  if (!host.querySelector(':scope > [data-i-see-you-layer="face"]')) host.insertAdjacentHTML('beforeend', LAYERS);

  const machine = createISeeYouMachine({
    timing,
    onChange(state, gaze) {
      host.dataset.iSeeYou = state;
      host.dataset.iSeeYouGaze = gaze;
      onChange?.(state, gaze);
    },
  });
  host.dataset.iSeeYou = machine.state;
  host.dataset.iSeeYouGaze = machine.gaze;

  let rect = null; // caja del sprite; null = hay que medirla
  let point = null; // último punto del puntero, en coordenadas de la ventana
  let frame = 0;

  // Un cálculo por fotograma como mucho, con el último punto.
  const update = () => {
    frame = 0;
    if (!point) return;
    rect ??= host.getBoundingClientRect();
    if (!rect.width) return;
    const current = machine.state === 'watching' ? machine.gaze : null;
    machine.look(gazeAt(point[0], point[1], rect, current, face));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const onPointer = (e) => {
    // Con el dedo solo cuenta mientras toca (al soltar, el punto deja de valer).
    if (e.pointerType === 'touch' && e.type === 'pointermove' && !e.buttons) return;
    point = [e.clientX, e.clientY];
    schedule();
  };
  const onRelease = (e) => {
    if (e.pointerType === 'touch') point = null;
  };
  // Sale de la ventana (solo ratón y lápiz: el dedo «sale» cada vez que se levanta).
  const onOut = (e) => {
    if (!e.relatedTarget && e.pointerType !== 'touch') {
      point = null;
      machine.rest();
    }
  };
  // Con scroll, Sofi se mueve bajo el cursor: hay que volver a medir y a mirar.
  const onScroll = () => {
    rect = null;
    if (point) schedule();
  };
  const onResize = () => {
    rect = null;
  };
  const onEnter = () => machine.hover(true);
  const onLeave = () => machine.hover(false);

  const listen = { capture: true, passive: true };
  for (const type of ['pointermove', 'pointerdown']) target.addEventListener(type, onPointer, listen);
  for (const type of ['pointerup', 'pointercancel']) target.addEventListener(type, onRelease, listen);
  target.addEventListener('pointerout', onOut, listen);
  window.addEventListener('scroll', onScroll, listen);
  window.addEventListener('resize', onResize, { passive: true });
  host.addEventListener('pointerenter', onEnter);
  host.addEventListener('pointerleave', onLeave);

  const resizer = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null;
  resizer?.observe(host);

  const onVisibility = () => (document.hidden ? machine.pause('hidden') : machine.resume('hidden'));
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
    get gaze() {
      return machine.gaze;
    },
    notice: machine.notice,
    reset: machine.reset,
    pause: (reason) => machine.pause(reason),
    resume: (reason) => machine.resume(reason),
    setRate: machine.setRate,
    destroy() {
      for (const type of ['pointermove', 'pointerdown']) target.removeEventListener(type, onPointer, listen);
      for (const type of ['pointerup', 'pointercancel']) target.removeEventListener(type, onRelease, listen);
      target.removeEventListener('pointerout', onOut, listen);
      window.removeEventListener('scroll', onScroll, listen);
      window.removeEventListener('resize', onResize);
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
      resizer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
      machine.destroy();
      delete host.dataset.iSeeYou;
      delete host.dataset.iSeeYouGaze;
      for (const layer of host.querySelectorAll(':scope > [data-i-see-you-layer]')) layer.remove();
    },
  };
}
