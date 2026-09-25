uniform sampler2D uMap;
uniform float uOpacity,uTime,uUnderwater;
uniform vec3 uIvory,uGold,uDeep;
varying vec2 vUv;
varying vec3 vWorld;
/* RIPPLES */
void main(){
  // Follow the view ray to the overhead water so surface ripples refract the mark.
  vec3 ray=normalize(vWorld-cameraPosition);
  vec2 surface=vWorld.xz+ray.xz*clamp(-vWorld.y/max(ray.y,.15),0.0,30.0);
  vec2 slope=rippleGradient(surface);
  float ripple=rippleHeight(surface);
  vec2 drift=vec2(sin(vWorld.y*2.1+uTime*.32),cos(vWorld.x*2.4-uTime*.27));
  vec2 uv=vUv+drift*.0025+clamp(slope,vec2(-.4),vec2(.4))*.025;
  float a=texture2D(uMap,uv).a*.5;
  a+=(texture2D(uMap,uv+vec2(.0015,0)).a+texture2D(uMap,uv-vec2(.0015,0)).a
     +texture2D(uMap,uv+vec2(0,.0015)).a+texture2D(uMap,uv-vec2(0,.0015)).a)*.125;
  // Soft refracted wash across the lower edge, never a hard rectangular crop.
  float wash=.1+.06*sin(vWorld.x*2.0+uTime*.35)+ripple*.12;
  float transmission=mix(.6,1.0,smoothstep(wash-.1,wash+.18,vUv.y));
  a*=uOpacity*transmission;
  if(a<.012)discard;
  // Same moving sinusoidal caustic field as the underside of the ocean.
  float caustic=pow(.5+.5*sin(surface.x*.65+surface.y*.8+ripple*2.5+uTime*.6),8.0);
  float ambient=mix(1.0,.78,uUnderwater);
  vec3 ink=mix(uGold,uIvory,.78)*ambient*(1.25+caustic*.38);
  ink=mix(uDeep*.22,ink,.82+.18*transmission);
  gl_FragColor=vec4(ink,a);
}
