#version 100
precision highp float;
precision highp int;
#include "options"
#include "encode-float-h.glsl"
#include "ndc-to-eye-h.glsl"
#define _bd TC_FINAL
uniform sampler2D u_image;
uniform mat4 u_inv_projection;
uniform float u_edge_distance;
uniform vec2 u_interval;
uniform float u_weights[TC_SAMPLES];
#if _bd
uniform float u_alpha;
#endif
varying vec2 _k;
void
main(){
vec4 _bi=texture2D(u_image,_k);
if(_bi.gba==vec3(0.))
discard;
float _R=_bj(_bi.gba);
vec3 _S=_T(u_inv_projection,vec3(1.,1.,_R*2.-1.));
float _bk=1./(u_edge_distance*max(_S.x,_S.y));
float _bl=u_weights[TC_RADIUS];
float _bm=_bi.r*_bl;
vec2 _bn=_k-(float(TC_RADIUS)*u_interval);
#define _bo \
vec4 _bg=texture2D(u_image,_bn);\
float _bp=_bj(_bg.gba);\
float _bq=_O(u_inv_projection,_bp);\
float _bh=u_weights[i]*max(0.,1.-abs(_bq-_S.z)*_bk);\
\
_bm=_bg.r*_bh+_bm;\
_bl+=_bh;\
_bn+=u_interval;
for(int i=0;i<TC_RADIUS;++i){
_bo
}
_bn=_k+u_interval;
for(int i=TC_RADIUS+1;i<TC_SAMPLES;++i){
_bo
}
float _br=_bm/_bl;
#if _bd
gl_FragColor=vec4(0.,0.,0.,_br*u_alpha);
#else
gl_FragColor=vec4(_br,_bi.gba);
#endif
}
