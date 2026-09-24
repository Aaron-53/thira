uniform sampler2D uLit,uBloomTexture;
uniform sampler2D uSurfaceGrade,uDeepGrade,uReturnGrade;
uniform vec2 uResolution;
uniform float uTime,uUnderwater,uWet,uBloom,uRunoff,uReturn,uGrain,uAberration;
varying vec2 vUv;
vec3 lookup(sampler2D lut,vec3 color){
  vec3 p=clamp(color/(1.0+color),0.0,.999)*15.0;
  float slice=floor(p.b);
  vec2 a=vec2((slice*16.0+p.r+.5)/256.0,(p.g+.5)/16.0);
  vec2 b=vec2((min(slice+1.0,15.0)*16.0+p.r+.5)/256.0,a.y);
  vec3 graded=mix(texture2D(lut,a).rgb,texture2D(lut,b).rgb,fract(p.b));
  return graded/max(vec3(.004),1.0-graded);
}
vec3 lens(vec2 uv){
  uv=clamp(uv,.001,.999);
  return texture2D(uLit,uv).rgb+texture2D(uBloomTexture,uv).rgb*.36*uBloom;
}
void main(){
  vec2 uv=vUv;
  vec2 droplets=vec2(sin(uv.y*41.0+sin(uv.x*27.0)+uTime*2.0),cos(uv.x*37.0+uTime));
  float streak=pow(.5+.5*sin(uv.x*47.0+sin(uv.y*7.0-uTime*3.0)),12.0);
  uv+=droplets*.008*uWet;uv.y+=streak*.004*uRunoff;
  // 1.5 physical pixels at corners, zero at the optical centre.
  vec2 radial=(vUv-.5)*2.0;
  vec2 split=radial*length(radial)*.5*uAberration/uResolution;
  vec3 color=vec3(lens(uv+split).r,lens(uv).g,lens(uv-split).b);
  vec3 warm=lookup(uSurfaceGrade,color),deep=lookup(uDeepGrade,color),rise=lookup(uReturnGrade,color);
  color=mix(mix(warm,rise,uReturn),deep,uUnderwater);
  color*=1.0-uWet*.12;
  gl_FragColor=vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  // Grain is applied after tone mapping, to the entire image including marks.
  float seed=dot(gl_FragCoord.xy,vec2(12.9898,78.233))+floor(uTime*24.0)*37.719;
  float grain=fract(sin(seed)*43758.5453)-.5;
  gl_FragColor.rgb+=grain*uGrain;
  float vignette=1.0-smoothstep(.15,.8,length(vUv-.5));
  gl_FragColor.rgb*=mix(.8,1.0,vignette);
  gl_FragColor.rgb=max(gl_FragColor.rgb,vec3(0.0));
}
