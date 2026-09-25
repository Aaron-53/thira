uniform vec4 uTypeShadows[9];
uniform sampler2D uLogoReflection;
uniform sampler2D uLogoTexture;
uniform mat4 uLogoProjection;
uniform vec3 uLogoPosition;
uniform vec2 uLogoSize;
uniform float uLogoStrength;
uniform float uIntroSmear;
uniform float uTime;
uniform float uFoamThreshold;
uniform float uUnderwater;
uniform float uWaterMark,uResolve;
uniform sampler2D uFormationMask;
varying vec2 vMarkUv;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vJacobian;
varying float vHeight;
/* SKY */
/* NOISE */
/* RIPPLES */
void main(){
  float markAlpha=1.0;
  if(uWaterMark>.5){markAlpha=texture2D(uFormationMask,vMarkUv).a*(1.0-uResolve);if(markAlpha<.06)discard;}
  vec3 viewDir=normalize(cameraPosition-vWorld);
  float distanceToCamera=length(cameraPosition-vWorld);
  vec2 waterDetail=mix(vWorld.xz,vec2(vWorld.x,-30.0-vMarkUv.y*24.857142857),uWaterMark);
  vec2 detail=noiseDerivative(waterDetail*2.7+vec2(uTime*.24,uTime*.15));
  detail+=noiseDerivative(waterDetail*5.8+vec2(-uTime*.18,uTime*.31))*.42;
  float detailFade=1.0-smoothstep(25.0,150.0,distanceToCamera);
  // Sample the FBO gradient per fragment, preserving small reflected ripples
  // even where the geometric grid cannot resolve their full curvature.
  vec2 rippleSlope=rippleGradient(vWorld.xz);
  vec3 N=normalize(vNormal+vec3(detail.x,0,detail.y)*mix(.025,.3,uWaterMark)*detailFade
                  -vec3(rippleSlope.x,0,rippleSlope.y));
  if(!gl_FrontFacing){
    N=-N;
    float incidence=max(dot(N,viewDir),0.0);
    float tir=1.0-smoothstep(.64,.69,incidence);
    float caustic=pow(.5+.5*sin(vWorld.x*.65+vWorld.z*.8+vHeight*2.5+uTime*.6),8.0);
    vec3 below=mix(uDeep*.07,uGold*.14,caustic*.65);
    below=mix(below,mix(uAbyss,uGold*.18,pow(1.0-incidence,2.0)),tir*.8);
    vec3 refracted=refract(-viewDir,N,1.333);
    below+=skyColor(refracted)*.035*(1.0-tir);
    // The surface refracts the actual animated mark, rather than a screen overlay.
    vec3 toLogo=refract(-viewDir,N,1.333);
    float travel=(uLogoPosition.z-vWorld.z)/(abs(toLogo.z)<.001?.001:toLogo.z);
    vec3 logoHit=vWorld+toLogo*max(travel,0.0);
    vec2 logoUv=(logoHit.xy-uLogoPosition.xy)/uLogoSize+.5;
    logoUv+=N.xz*.075;
    float inside=step(0.0,logoUv.x)*step(logoUv.x,1.0)*step(0.0,logoUv.y)*step(logoUv.y,1.0)*step(0.0,travel);
    float mark=0.0;
    for(int j=-3;j<=3;j++){
      vec2 blur=vec2(float(j)*.025,float(j)*.012)*uIntroSmear;
      mark+=texture2D(uLogoTexture,clamp(logoUv+blur,0.0,1.0)).a/7.0;
    }
    below+=mix(uEmber,uIvory,.45*(1.0-uIntroSmear))*mark*inside*uLogoStrength*.65*exp(-abs(cameraPosition.y)*.1);
    // A distant, scattered image on the underside, softened by surface distortion.
    vec2 overheadUv=vec2(vWorld.x/14.0+.5,(-vWorld.z-15.0)/20.0)+N.xz*.12;
    float overheadInside=step(0.0,overheadUv.x)*step(overheadUv.x,1.0)*step(0.0,overheadUv.y)*step(overheadUv.y,1.0);
    float overheadMark=0.0;
    for(int k=-2;k<=2;k++)overheadMark+=texture2D(uLogoTexture,clamp(overheadUv+vec2(float(k)*.014,float(k)*.009),0.0,1.0)).a*.2;
    below+=mix(uEmber,uIvory,.3)*overheadMark*overheadInside*uLogoStrength*uIntroSmear*.8;
    float fog=1.0-exp(-pow(distanceToCamera*.038,2.0));
    gl_FragColor=vec4(mix(below,uAbyss,fog),markAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    return;
  }
  float facing=max(dot(N,viewDir),0.0);
  float fresnel=.02+.98*pow(1.0-facing,5.0);
  // The folded sheet exposes both interfaces of a thin film of water.
  // Its reflection stays visible front-on, unlike the deep horizontal ocean.
  fresnel=mix(fresnel,.42+.58*pow(1.0-facing,3.0),uWaterMark);
  vec3 reflected=skyColor(reflect(-viewDir,N));
  // Project the mirrored-logo pass onto the surface; normal distortion tears
  // and stretches it across moving crests. Samples stay within the target.
  vec4 projected=uLogoProjection*vec4(vWorld.x,0.0,vWorld.z,1.0);
  vec2 reflectionUv=projected.xy/projected.w*.5+.5;
  reflectionUv+=vec2(N.x*.035,N.z*.025);
  vec3 logoReflection=vec3(0.0);
  for(int j=0;j<5;j++){
    vec2 sampleUv=reflectionUv+vec2(0,float(j)-2.0)*(.003+abs(N.z)*.012);
    float valid=step(0.0,sampleUv.x)*step(sampleUv.x,1.0)*step(0.0,sampleUv.y)*step(sampleUv.y,1.0)*step(0.0,projected.w);
    logoReflection+=texture2D(uLogoReflection,clamp(sampleUv,0.0,1.0)).rgb*valid*.2;
  }
  reflected+=logoReflection*mix(uIvory,uGold,.55)*2.0*(.35+.65*smoothstep(-.8,.65,vHeight));
  float depth=clamp((2.8-vHeight)/5.0,0.0,1.0);
  vec3 transmission=mix(uEmber*.7,uDeep,.35+depth*.65);
  transmission=mix(transmission,uAbyss,depth*.58);
  float crest=max(vHeight,0.0);
  float scattering=pow(max(dot(viewDir,-uLightDirection),0.0),4.0)*crest;
  transmission+=uEmber*scattering*.6;
  vec3 color=mix(transmission,reflected,fresnel);
  vec3 toLight=uLogoPosition-vWorld;
  float falloff=1.0/(1.0+dot(toLight,toLight)*.02);
  float crestLight=smoothstep(-.35,1.2,vHeight)*max(dot(N,normalize(toLight)),0.0);
  color+=mix(uEmber,uGold,.25)*falloff*crestLight*uLogoStrength*1.8;
  vec3 halfVector=normalize(viewDir+uLightDirection);
  float specular=pow(max(dot(N,halfVector),0.0),600.0);
  // Tight glitter from general directional illumination, without a broad disc lobe.
  color+=uGold*specular*7.0;
  float compression=1.0-smoothstep(uFoamThreshold-.18,uFoamThreshold,vJacobian);
  float bubbles=worley(vWorld.xz*vec2(2.7,4.1)+vec2(uTime*.09,-uTime*.05));
  float streaks=.5+.5*simplex(vWorld.xz*vec2(.32,1.5)+uTime*.08);
  float foam=compression*smoothstep(-.05,.9,vHeight)*smoothstep(.16,.63,bubbles+streaks*.3);
  color=mix(color,uIvory*(.5+.35*max(dot(N,uLightDirection),0.0)),foam*.9);
  // Soft contact ellipses beneath the moving glyph clusters, before haze/post.
  float contact=0.0;
  for(int i=0;i<9;i++){
    vec4 shadow=uTypeShadows[i];
    vec2 offset=(vWorld.xz-shadow.xy)/vec2(shadow.z,1.25);
    contact+=exp(-dot(offset,offset)*2.0)*shadow.w;
  }
  color*=1.0-min(contact,.42)*(1.0-foam*.8);
  float haze=smoothstep(75.0,185.0,distanceToCamera);
  color=mix(color,skyColor(normalize(vWorld-cameraPosition)),haze);
  gl_FragColor=vec4(color,markAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
