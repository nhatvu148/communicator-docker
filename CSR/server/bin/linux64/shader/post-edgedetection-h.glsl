#include "ndc-to-eye-h.glsl"
uniform mat4 u_inv_projection;
uniform vec2 u_silhouette_delta_range,
u_hard_edge_negative_cos_range,
u_taps[2];
uniform vec4 u_silhouette_color,
u_hard_edge_color;
uniform sampler2D u_normals;
varying vec2 _k;
float
_fu(const in vec2 _9){
vec3 _fv=vec3(
_ew(_9),
_ew(_9+u_taps[0]),
_ew(_9+u_taps[1])
);
bvec3 _fw=equal(_fv,vec3(1.));
if(any(_fw)){
return float(!all(_fw));
}
vec3 _S=_T(u_inv_projection,vec3(1.,1.,_fv.x*2.-1.));
vec2 _bq=vec2(
_O(u_inv_projection,_fv.y),
_O(u_inv_projection,_fv.z)
);
vec2 _fx=abs(_bq-vec2(_S.z));
float _fy=max(_fx.x,_fx.y);
vec2 _fz=u_silhouette_delta_range*max(_S.x,_S.y);
if(u_silhouette_delta_range.y>u_silhouette_delta_range.x){
return clamp((_fy-_fz.x)/(_fz.y-_fz.x),0.,1.);
}
return float(_fy>=_fz.x);
}
float
_fA(const in vec2 _9){
vec3 _fB[3];
_fB[0]=texture2D(u_normals,_9).rgb;
_fB[1]=texture2D(u_normals,_9+u_taps[0]).rgb;
_fB[2]=texture2D(u_normals,_9+u_taps[1]).rgb;
bvec3 _fC=bvec3(
_fB[0]==vec3(0.),_fB[1]==vec3(0.),_fB[2]==vec3(0.));
if(any(_fC)){
return 0.;
}
for(int i=0;i<3;++i){
_fB[i]=_fB[i]*vec3(2.)-vec3(1.);
}
return max(
smoothstep(
u_hard_edge_negative_cos_range.x,u_hard_edge_negative_cos_range.y,
-dot(_fB[0],_fB[1])),
smoothstep(
u_hard_edge_negative_cos_range.x,u_hard_edge_negative_cos_range.y,
-dot(_fB[0],_fB[2])));
}
void
main(){
vec4 _dU=vec4(0.);
#ifdef TC_HARD_EDGES
{
vec4 _fD=u_hard_edge_color*_fA(_k);
_dU=_fD;
}
#endif
#ifdef TC_SILHOUETTE
{
vec4 _fD=u_silhouette_color*_fu(_k);
_dU=(1.-_fD.a)*_dU+_fD;
}
#endif
gl_FragColor=_dU;
}
