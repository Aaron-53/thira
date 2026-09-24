import * as THREE from 'three';
export function createParticles(scene,palette,mobile){
  const count=mobile?180:400;
  const points=new Float32Array(count*3);
  for(let i=0;i<count;i++){points[i*3]=(Math.random()-.5)*55;points[i*3+1]=-Math.random()*14;points[i*3+2]=15-Math.random()*80;}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(points,3));
  const material=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uRise:{value:0},uVisible:{value:0},uColor:{value:palette.uIvory.value}},transparent:true,depthWrite:false,
    vertexShader:'uniform float uTime;uniform float uRise;varying float vDepth;void main(){vec3 p=position;p.x+=sin(uTime*.15+p.y)*.3;p.y+=sin(uTime*.13+p.z)*.15-uRise*mod(uTime*3.0+position.x,8.0);vec4 mv=modelViewMatrix*vec4(p,1);vDepth=-mv.z;gl_PointSize=clamp(30.0/-mv.z,1.0,3.0)*(1.0+uRise*2.0);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uVisible;uniform float uRise;uniform vec3 uColor;varying float vDepth;void main(){float a=(1.0-smoothstep(.1,.5,length((gl_PointCoord-.5)*vec2(1.0+uRise*2.0,1.0))))*uVisible*.25*exp(-vDepth*.04);gl_FragColor=vec4(uColor,a);}',
  });
  const mesh=new THREE.Points(geometry,material);scene.add(mesh);
  return{setQuality(fraction){geometry.setDrawRange(0,Math.round(count*fraction));},update(t,u,act={}){material.uniforms.uRise.value=act.rising||0;material.uniforms.uTime.value=t;material.uniforms.uVisible.value=u;},dispose(){geometry.dispose();material.dispose();}};
}
