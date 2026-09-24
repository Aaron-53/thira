uniform vec3 uEmber;
uniform vec3 uDeep;
uniform vec3 uAbyss;
uniform vec3 uIvory;
uniform vec3 uGold;
uniform vec3 uLightDirection;
vec3 skyColor(vec3 ray){
  float elevation=max(ray.y,0.0);
  vec3 horizon=mix(uEmber,uGold,.14)*1.2;
  vec3 sky=mix(horizon,uAbyss*.65,pow(smoothstep(0.0,.85,elevation),.55));
  return sky;
}
