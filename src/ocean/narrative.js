// Separate, localized displacement. The original Gerstner sum stays intact.
export function vortexHeight(x,z,time,strength=0){
  const dx=x,dz=z+10,r=Math.hypot(dx,dz),angle=Math.atan2(dz,dx);
  return strength*(-9*Math.exp(-r*r/90)+1.8*Math.sin(angle*3+r*.7-time*1.2)*Math.exp(-r*r/300)*(1-Math.exp(-r*r/12)));
}
export const narrativeGLSL=`
uniform float uVortex,uGather,uFold,uResolve,uWaterMark;
uniform sampler2D uFormationMask;
varying vec2 vMarkUv;
float vortexHeight(vec2 p){
 if(uVortex<.001)return 0.0;
 vec2 d=p-vec2(0.0,-10.0);float r=length(d),a=atan(d.y,d.x);
 return uVortex*(-9.0*exp(-r*r/90.0)+1.8*sin(a*3.0+r*.7-uTime*1.2)*exp(-r*r/300.0)*(1.0-exp(-r*r/12.0)));
}
float gatheringHeight(vec2 p){
 if(uGather<.001||uResolve>.999)return 0.0;
 vec2 uv=vec2(p.x/18.0+.5,(-30.0-p.y)/24.857142857);
 float inside=step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);
 return texture2D(uFormationMask,clamp(uv,0.0,1.0)).a*inside*uGather*(1.0-uResolve)*.4;
}
float addedHeight(vec2 p){return vortexHeight(p)+gatheringHeight(p);}
`;
