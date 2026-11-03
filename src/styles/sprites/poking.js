// «¡Deja de pincharme!» (006-poking): el comportamiento. El aspecto está en _poking.scss.
// Cada pinchazo sube un escalón; no hay bucle automático. Sin dependencias.
//
// Estados (data-poking en el anfitrión):
//   idle → curious → skeptical → stop → offended: un escalón por pinchazo; 10 s sin pinchazos, vuelta a idle.
//   offended → hide: se esconde tras el borde y, tras una pausa, se asoma (peek). Pincharla escondida retrasa la pausa.
//   peek → nope si la pinchan. Desde peek o nope, al rato, return: vuelve a subir aún ofendida → idle.
//
// Uso sin framework:
//   import { attachPoking } from './poking.js';
//   const poking = attachPoking(document.querySelector('.poking')); // el sprite de reposo: class="sofi-blink poking"
//   poking.destroy();                                                 // al desmontar
//
// En React: crea el controlador en un efecto y destrúyelo al limpiar; deja el anfitrión sin hijos de React
// (attachPoking le añade las capas). Si prefieres pintar tú las capas, usa createPokingMachine y su
// onChange, y pon data-poking={estado} en el anfitrión.

export const STATES = ['idle', 'curious', 'skeptical', 'stop', 'offended', 'hide', 'peek', 'nope', 'return'];

// Tiempos en ms.
export const TIMING = Object.freeze({
  cooldown: 300, // entre dos pinchazos que cuentan: un doble clic no se salta un escalón
  reset: 10000, // sin pinchazos, de curious…offended vuelve al reposo
  peekAfter: 1800, // escondida hasta asomarse (cada pinchazo mientras está escondida vuelve a empezar la espera)
  peekFor: 5000, // asomada sin que la pinchen, antes de volver
  nopeFor: 2200, // escondida tras el «nope», antes de volver
  returnFor: 1500, // vuelve a subir, aún ofendida, y queda en reposo
});

const NEXT = { idle: 'curious', curious: 'skeptical', skeptical: 'stop', stop: 'offended' };

// Máquina de estados sin DOM. Un solo temporizador a la vez: el paso automático que toca tras el estado actual.
export function createPokingMachine({ timing, onChange } = {}) {
  const t = { ...TIMING, ...timing };
  let state = 'idle';
  let rate = 1;
  const holds = new Set(); // motivos de pausa: el de quien la usa y, en attachPoking, pestaña oculta o fuera de pantalla
  let lastPoke = -Infinity;
  let timer = 0;
  let task = null; // { run, left: ms de animación que faltan, since: inicio del tramo en curso }
  let listener = onChange;

  const clock = () => performance.now();

  function clear() {
    clearTimeout(timer);
    task = null;
  }

  function arm() {
    if (!task || holds.size) return;
    task.since = clock();
    timer = setTimeout(() => {
      const { run } = task;
      task = null;
      run();
    }, task.left / rate);
  }

  // Descuenta lo que ya ha corrido del tramo en curso.
  function hold() {
    if (!task || holds.size) return;
    clearTimeout(timer);
    task.left = Math.max(0, task.left - (clock() - task.since) * rate);
  }

  function schedule(ms, run) {
    clear();
    task = { run, left: ms, since: 0 };
    arm();
  }

  function enter(next, ms, run) {
    state = next;
    if (run) schedule(ms, run);
    else clear();
    listener?.(state);
  }

  const toIdle = () => enter('idle');
  const toReturn = () => enter('return', t.returnFor, toIdle);
  const toPeek = () => enter('peek', t.peekFor, toReturn);

  // Un pinchazo. Devuelve si ha contado.
  function poke() {
    const now = clock();
    if ((now - lastPoke) * rate < t.cooldown || holds.size) return false;
    if (state === 'nope' || state === 'return') return false;
    lastPoke = now;
    if (NEXT[state]) enter(NEXT[state], t.reset, toIdle);
    else if (state === 'offended') enter('hide', t.peekAfter, toPeek);
    else if (state === 'hide') schedule(t.peekAfter, toPeek); // no se asoma mientras la pinchan
    else if (state === 'peek') enter('nope', t.nopeFor, toReturn);
    return true;
  }

  return {
    get state() {
      return state;
    },
    poke,
    // Vuelve al reposo sin animación de vuelta (cancela lo pendiente).
    reset() {
      lastPoke = -Infinity;
      if (state !== 'idle' || task) enter('idle');
    },
    // Congela los tiempos (no las animaciones CSS). Cada motivo se reanuda por separado.
    pause(reason = 'user') {
      hold();
      holds.add(reason);
    },
    resume(reason = 'user') {
      if (!holds.delete(reason) || holds.size) return;
      arm();
    },
    // Velocidad de los tiempos (1 normal, 0.25 cuatro veces más lento), para revisar a cámara lenta.
    setRate(next) {
      hold();
      rate = next;
      arm();
    },
    destroy() {
      clear();
      listener = undefined;
    },
  };
}

// Capas que pinta _poking.scss. Van por atributo (no por clase) para que funcionen igual con CSS Modules.
const LAYERS =
  '<span data-poking-layer="body"><span data-poking-layer="face"></span><span data-poking-layer="palm"></span>' +
  '<span data-poking-layer="pose"></span><span data-poking-layer="head"></span></span>' +
  '<span data-poking-layer="hands"></span><span data-poking-layer="question"></span>' +
  '<span data-poking-layer="vein"></span>';

// Conecta la máquina con el sprite de Sofi: escucha sus clics (ratón, toque y teclado si es un botón, una sola vez
// por pulsación), pone data-poking y detiene los tiempos mientras la pestaña está oculta o
// Sofi fuera de la pantalla. El anfitrión tiene que llevar la clase de _poking.scss (en CSS Modules, styles.poking).
export function attachPoking(host, { timing, onChange } = {}) {
  if (!host.querySelector(':scope > [data-poking-layer="body"]')) host.insertAdjacentHTML('beforeend', LAYERS);

  const machine = createPokingMachine({
    timing,
    onChange(state) {
      host.dataset.poking = state;
      onChange?.(state);
    },
  });
  host.dataset.poking = 'idle';

  // Solo click: un toque genera un único click (no se cuentan touchend y click por separado).
  const onClick = () => machine.poke();
  const onVisibility = () => (document.hidden ? machine.pause('hidden') : machine.resume('hidden'));
  host.addEventListener('click', onClick);
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
    poke: machine.poke,
    reset: machine.reset,
    pause: () => machine.pause(),
    resume: () => machine.resume(),
    setRate: machine.setRate,
    destroy() {
      host.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
      machine.destroy();
      delete host.dataset.poking;
      for (const layer of host.querySelectorAll(':scope > [data-poking-layer]')) layer.remove();
    },
  };
}
