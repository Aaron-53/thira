uniform float uTime;
uniform vec2 uFlow;
uniform float uAmplitude;
uniform float uSteepness;
uniform vec3 uLogoPosition;
/* NARRATIVE */
/* RIPPLES */
varying vec3 vWorld;
varying vec3 vNormal;
varying float vJacobian;
varying float vHeight;
void addWave(vec2 direction, float amplitude, float wavelength, float steepness, float speed,
             vec2 p, inout vec3 point, inout vec3 tangent, inout vec3 binormal) {
  amplitude *= uAmplitude*mix(1.0,2.5*(1.0-uResolve),uWaterMark);
  steepness *= uSteepness*mix(1.0,1.0-uResolve,uWaterMark);
  float k = 2.0 * 3.141592653589793 / wavelength;
  float phase = k * dot(direction, p) - sqrt(9.81 * k) * speed * uTime;
  float s = sin(phase), c = cos(phase);
  point.xz += direction * (steepness / k) * c;
  point.y += amplitude * s;
  tangent += vec3(-steepness * direction.x * direction.x * s,
                  amplitude * k * direction.x * c,
                 -steepness * direction.x * direction.y * s);
  binormal += vec3(-steepness * direction.x * direction.y * s,
                   amplitude * k * direction.y * c,
                  -steepness * direction.y * direction.y * s);
}
void main() {
  vec2 p = position.xy + uFlow;
  vMarkUv=uv;
  if(uWaterMark>.5)p=vec2(position.x,-30.0-uv.y*24.857142857)+uFlow;
  vec3 point = vec3(p.x, 0.0, p.y);
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  /* WAVES */
  point.xz -= uFlow;
  vNormal = normalize(cross(binormal, tangent));
  if(uVortex>.001){
    vec2 d=point.xz-vec2(0.0,-10.0);float turn=uVortex*.6*exp(-dot(d,d)/240.0);
    mat2 rotation=mat2(cos(turn),sin(turn),-sin(turn),cos(turn));
    point.xz=vec2(0.0,-10.0)+rotation*d;vNormal.xz=rotation*vNormal.xz;
  }
  if(uWaterMark>.5){
    float angle=uFold*1.570796327;
    point.z=-30.0-uv.y*24.857142857*cos(angle);
    point.y+=.15+uv.y*24.857142857*sin(angle)+(uLogoPosition.y-12.5785714285)*uFold;
    vNormal.yz=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*vNormal.yz;
  }else if(uVortex>.001||uGather*(1.0-uResolve)>.001){
    float e=.15;vec2 q=point.xz;
    vec2 slope=vec2(addedHeight(q+vec2(e,0))-addedHeight(q-vec2(e,0)),addedHeight(q+vec2(0,e))-addedHeight(q-vec2(0,e)))/(2.0*e);
    point.y+=addedHeight(q);vNormal=normalize(vNormal-vec3(slope.x,0,slope.y));
  }
  point.y += rippleHeight(point.xz)*mix(1.0,1.0-uResolve,uWaterMark);
  vJacobian = tangent.x * binormal.z - tangent.z * binormal.x;
  vHeight = point.y;
  if(uWaterMark>.5)vHeight-=.15+uv.y*24.857142857*sin(uFold*1.570796327)+(uLogoPosition.y-12.5785714285)*uFold;
  vWorld = point;
  gl_Position = projectionMatrix * viewMatrix * vec4(point, 1.0);
}
