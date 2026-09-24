// Device orientation uses the phone's fused accelerometer/gyroscope reading.
// Calibrate to the way the phone is held, rather than requiring it to lie flat.
export function createTiltControl({ button, status, motion, host = window }) {
  const coarse = host.matchMedia('(pointer: coarse)').matches;
  const supported = coarse && host.navigator.maxTouchPoints > 0
    && host.isSecureContext && !!host.DeviceOrientationEvent;
  let enabled = false, listening = false, baseline = null, timeout;
  let targetX = 0, targetY = 0, x = 0, y = 0;
  const clamp = value => Math.max(-1, Math.min(1, value));
  function reset() { baseline = null; targetX = targetY = x = y = 0; }
  function sync() {
    button.hidden = !supported || motion.matches;
    button.textContent = enabled ? 'Tilt on · turn off' : 'Enable tilt';
    button.setAttribute('aria-pressed', String(enabled));
  }
  function receive(event) {
    if (motion.matches || host.document.hidden || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    const angle = (host.screen.orientation?.angle ?? host.orientation ?? 0) * Math.PI / 180;
    const sx = event.gamma * Math.cos(angle) + event.beta * Math.sin(angle);
    const sy = event.beta * Math.cos(angle) - event.gamma * Math.sin(angle);
    if (!baseline) baseline = [sx, sy];
    const dx = ((sx-baseline[0]+540)%360)-180;
    const dy = ((sy-baseline[1]+540)%360)-180;
    targetX = Math.abs(dx) < 1.5 ? 0 : clamp(dx/25);
    targetY = Math.abs(dy) < 1.5 ? 0 : clamp(dy/25);
    clearTimeout(timeout);
    enabled = true; status.textContent = ''; sync();
  }
  function stop() {
    host.removeEventListener('deviceorientation', receive);
    clearTimeout(timeout); enabled = listening = false; reset(); sync();
  }
  function listen() {
    if (listening || !supported || motion.matches) return;
    reset(); listening = true;
    host.addEventListener('deviceorientation', receive, {passive:true});
    timeout = setTimeout(() => {
      if (!enabled) { stop(); status.textContent = 'Tilt unavailable. Touch the water to make ripples.'; }
    }, 5000);
  }
  async function click() {
    if (enabled || listening) { stop(); return; }
    if (!supported || motion.matches) return;
    try {
      const api = host.DeviceOrientationEvent;
      if (typeof api.requestPermission === 'function') {
        const permission = await api.requestPermission();
        if (permission !== 'granted') {
          status.textContent = 'Motion access was not enabled. Touch ripples still work.';
          return;
        }
      }
      status.textContent = 'Hold your phone comfortably, then tilt gently.';
      listen();
    } catch {
      stop(); status.textContent = 'Tilt unavailable. Touch ripples still work.';
    }
  }
  function preferenceChanged() {
    stop();
    if (!motion.matches && supported && typeof host.DeviceOrientationEvent.requestPermission !== 'function') listen();
  }
  function visibilityChanged() { reset(); }
  button.addEventListener('click', click);
  motion.addEventListener('change', preferenceChanged);
  host.addEventListener('orientationchange', reset);
  host.screen.orientation?.addEventListener('change', reset);
  host.document.addEventListener('visibilitychange', visibilityChanged);
  sync();
  if (supported && !motion.matches && typeof host.DeviceOrientationEvent.requestPermission !== 'function') listen();
  return {
    update(dt) {
      const blend = 1-Math.exp(-dt*4);
      x += ((enabled ? targetX : 0)-x)*blend;
      y += ((enabled ? targetY : 0)-y)*blend;
      return {x, y, enabled};
    },
    dispose() {
      stop(); button.removeEventListener('click', click);
      motion.removeEventListener('change', preferenceChanged);
      host.removeEventListener('orientationchange', reset);
      host.screen.orientation?.removeEventListener('change', reset);
      host.document.removeEventListener('visibilitychange', visibilityChanged);
    },
  };
}
