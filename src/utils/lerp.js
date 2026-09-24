export const clamp01 = x => Math.max(0, Math.min(1, x));
export const smoothstep = (a,b,x) => { const t=clamp01((x-a)/(b-a));return t*t*(3-2*t); };
export const lerp = (a,b,t) => a+(b-a)*t;
export function perlin1(x) {
  const i=Math.floor(x), f=x-i, u=f*f*f*(f*(f*6-15)+10);
  const gradient=n=>Math.sin(n*127.1+311.7)*2;
  return lerp(gradient(i)*f,gradient(i+1)*(f-1),u);
}
