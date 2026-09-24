import {vortexHeight} from './narrative.js';
export const PALETTE = {
  ember: '#C1440E', deep: '#6E1B12', abyss: '#0B0E1A',
  ivory: '#F4E4D0', gold: '#E8A33D',
};
export const STORM_PALETTE={ember:'#292A35',deep:'#090F1D',abyss:'#03060D',gold:'#778392'};
// Foam is a density cutoff (low = more breaking). The material maps this to
// its existing compression test without changing the foam/SSS equations.
export const ROUGH_WATER={amplitude:1.85,steepness:1.05,foam:.5,palette:0};
export const SETTLED_WATER={amplitude:.55,steepness:.45,foam:.95,palette:1};

const wavelengths = [60, 31, 17, 9, 5, 3];
const angles = [-22, 17, -34, 31, -12, 24];
const steepnesses = [.17, .16, .15, .14, .12, .10];
const total = steepnesses.reduce((a, b) => a + b, 0);
export const WAVES = wavelengths.map((wavelength, i) => {
  const angle = Math.atan2(.35, 1) + angles[i] * Math.PI / 180;
  return {
    direction: [Math.cos(angle), Math.sin(angle)],
    amplitude: .038 * Math.pow(wavelength, .9),
    wavelength, steepness: steepnesses[i] * Math.min(1, .94 / total),
    speed: .72 + i * .075,
  };
});

// The same constants and phase equation are used in both languages.
export function gerstnerHeight(x, z, time, controls) {
  let height = 0;
  for (const wave of WAVES) {
    const k = 2 * Math.PI / wave.wavelength;
    const phase = k * (wave.direction[0] * x + wave.direction[1] * z)
      - Math.sqrt(9.81 * k) * wave.speed * time;
    height += wave.amplitude * Math.sin(phase);
  }
  return height*(controls?.amplitude??1);
}
export function gerstnerSlope(x, z, time, controls) {
  let slope = 0;
  for (const wave of WAVES) {
    const k = 2 * Math.PI / wave.wavelength;
    const phase = k * (wave.direction[0] * x + wave.direction[1] * z)
      - Math.sqrt(9.81 * k) * wave.speed * time;
    slope += wave.amplitude * k * wave.direction[0] * Math.cos(phase);
  }
  return slope*(controls?.amplitude??1);
}

// Invert horizontal Gerstner displacement to project input onto the rendered
// surface, rather than onto a flat y=0 plane behind a visible wave crest.
export function heightAtWorld(worldX, worldZ, time, controls) {
  const r2=worldX*worldX+(worldZ+10)*(worldZ+10);
  const twist=-(controls?.vortex??0)*.6*Math.exp(-r2/240);
  const vx=worldX,vz=worldZ+10;
  worldX=vx*Math.cos(twist)-vz*Math.sin(twist);worldZ=vx*Math.sin(twist)+vz*Math.cos(twist)-10;
  let x = worldX, z = worldZ;
  for (let iteration = 0; iteration < 6; iteration++) {
    let offsetX = 0, offsetZ = 0;
    for (const wave of WAVES) {
      const k = 2 * Math.PI / wave.wavelength;
      const phase = k * (wave.direction[0] * x + wave.direction[1] * z)
        - Math.sqrt(9.81 * k) * wave.speed * time;
      const horizontal = wave.steepness*(controls?.steepness??1) / k * Math.cos(phase);
      offsetX += wave.direction[0] * horizontal;
      offsetZ += wave.direction[1] * horizontal;
    }
    x = worldX - offsetX;
    z = worldZ - offsetZ;
  }
  return gerstnerHeight(x, z, time, controls)+vortexHeight(vx,vz-10,time,controls?.vortex??0);
}
const f = value => Number(value).toPrecision(12);
export const waveGLSL = WAVES.map(w => `addWave(vec2(${w.direction.map(f).join(',')}), ${f(w.amplitude)}, ${f(w.wavelength)}, ${f(w.steepness)}, ${f(w.speed)}, p, point, tangent, binormal);`).join('\n');
