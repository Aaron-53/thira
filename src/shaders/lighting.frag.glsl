uniform sampler2D uScene,uRays,uDepthTexture;
uniform mat4 uInverseProjection;
uniform vec3 uAbyss;
uniform float uUnderwater;
varying vec2 vUv;
void main(){
  vec3 color=texture2D(uScene,vUv).rgb;
  float depth=texture2D(uDepthTexture,vUv).r;
  vec4 point=uInverseProjection*vec4(vUv*2.0-1.0,depth*2.0-1.0,1.0);
  float distanceToScene=length(point.xyz/point.w);
  float fog=(1.0-exp(-pow(distanceToScene*.065,2.0)))*uUnderwater;
  color=mix(color,uAbyss,fog*.92);
  if(uUnderwater>.001)color+=texture2D(uRays,vUv).rgb;
  gl_FragColor=vec4(color,1.0);
}
