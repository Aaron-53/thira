uniform sampler2D uDepthTexture;
uniform mat4 uInverseProjection;
uniform mat4 uCameraWorld;
uniform vec3 uCamera;
uniform float uTime;
uniform float uUnderwater;
uniform float uAmplitude;
uniform vec3 uGold;
varying vec2 vUv;
/* HEIGHT */
void main(){
  if(uUnderwater<.001){gl_FragColor=vec4(0);return;}
  vec4 view=uInverseProjection*vec4(vUv*2.0-1.0,1.0,1.0);
  vec3 ray=normalize(mat3(uCameraWorld)*view.xyz);
  float depth=texture2D(uDepthTexture,vUv).r;
  vec4 hitView=uInverseProjection*vec4(vUv*2.0-1.0,depth*2.0-1.0,1.0);
  float distanceLimit=min(length(hitView.xyz/hitView.w),45.0);
  float sum=0.0;
  for(int i=0;i<RAY_STEPS;i++){
    float d=(float(i)+.5)/float(RAY_STEPS)*distanceLimit;
    vec3 samplePoint=uCamera+ray*d;
    // Ambient light enters across the overhead surface; waves focus it locally.
    vec2 surfacePoint=samplePoint.xz;
    float height=surfaceHeight(surfacePoint,uTime);
    float focus=pow(.5+.5*sin(surfacePoint.x*.45+surfacePoint.y*.27+height*.35),18.0);
    focus+=pow(.5+.5*sin(surfacePoint.x*.23-surfacePoint.y*.32-height*.3),22.0)*.6;
    float attenuation=exp(-d*.04)*exp(-abs(samplePoint.y)*.03);
    sum+=focus*attenuation*step(samplePoint.y,1.0);
  }
  float phase=.6+.4*max(ray.y,0.0);
  vec3 shafts=mix(uGold,vec3(.8,.75,.65),.25)*sum/float(RAY_STEPS)*phase*distanceLimit*.045*uUnderwater;
  gl_FragColor=vec4(shafts,1);
}
