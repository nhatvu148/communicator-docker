#version 100
precision highp float;
#include "options"
#include "encode-float-h.glsl"
#include "ndc-to-eye-h.glsl"
#define _F u_pixel_size
varying vec2 _k;
uniform highp sampler2D u_depth;
uniform mat4 u_inv_projection;
uniform vec2 _F;
uniform float u_alpha;
uniform float u_edge_distance;
float _G=0.;
const float _H=-.1;
const float _I=.707107;
float
_J(vec2 _K){
#if TC_ENCODED_DEPTH
return _L(texture2D(u_depth,_K));
#else
return texture2D(u_depth,_K).r;
#endif
}
float
_M(vec2 _K){
float _N=_J(_K);
if(_N>=1.)
return 0.;
else
return max(0.,_O(u_inv_projection,_N)-_G);
}
void
main(){
float _P=0.;
#if TC_ENCODED_DEPTH
vec4 _Q=texture2D(u_depth,_k);
float _R=_L(_Q);
#else
float _R=_J(_k);
#endif
if(_R>=1.)
discard;
_G=_O(u_inv_projection,_R);
_P+=_M(_k+vec2(-_F.x,_F.y))*_I;
_P+=_M(_k+vec2(0.,_F.y));
_P+=_M(_k+_F)*_I;
_P+=_M(_k+vec2(-_F.x,0.));
_P+=_M(_k+vec2(_F.x,0.));
_P+=_M(_k+vec2(-_F.x,-_F.y))*_I;
_P+=_M(_k+vec2(0.,-_F.y));
_P+=_M(_k+vec2(_F.x,-_F.y))*_I;
vec3 _S=_T(u_inv_projection,vec3(1.,1.,_R*2.-1.));
float _U=u_edge_distance*_S.y;
float _V=_P/_U;
#if TC_BLUR
gl_FragColor=vec4(
_V,
#if TC_ENCODED_DEPTH
_W(_Q)
#else
_X(_R)
#endif
);
#else
gl_FragColor=vec4(0.,0.,0.,min(1.,_V)*u_alpha);
#endif
}
