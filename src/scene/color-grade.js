import * as THREE from 'three';

// Three 16³ scene-linear grading LUTs, packed as horizontal blue slices.
// A compressed domain retains HDR headroom when sampled before ACES.
export function createActGrades(){
  const size=16;
  const make=(red,green,blue)=>{
    const data=new Uint8Array(size*size*size*4);
    for(let b=0;b<size;b++)for(let g=0;g<size;g++)for(let r=0;r<size;r++){
      const offset=(g*size*size+b*size+r)*4;
      for(const [channel,value,gain] of [[0,r,red],[1,g,green],[2,b,blue]]){
        const compressed=value/(size-1);
        const linear=compressed/Math.max(.001,1-compressed);
        const graded=linear*gain;
        data[offset+channel]=Math.round(255*graded/(1+graded));
      }
      data[offset+3]=255;
    }
    const texture=new THREE.DataTexture(data,size*size,size,THREE.RGBAFormat);
    texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
    return texture;
  };
  const surface=make(1.025,1.0,.97),deep=make(.87,.95,1.14),returning=make(1.06,1.025,.91);
  return {uniforms:{uSurfaceGrade:{value:surface},uDeepGrade:{value:deep},uReturnGrade:{value:returning}},dispose(){surface.dispose();deep.dispose();returning.dispose();}};
}
