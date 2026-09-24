uniform sampler2D uLit;
uniform vec2 uResolution;
varying vec2 vUv;
void main(){
  vec3 bloom=vec3(0.0);float weight=0.0;
  for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){
    vec2 offset=vec2(float(x),float(y));
    float w=exp(-dot(offset,offset)*.4);
    vec3 color=texture2D(uLit,clamp(vUv+offset*3.0/uResolution,.001,.999)).rgb;
    bloom+=max(color-vec3(.72),vec3(0.0))*w;weight+=w;
  }
  gl_FragColor=vec4(bloom/weight,1.0);
}
