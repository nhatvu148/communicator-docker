#version 100
precision highp float;
#include "options"
#include "post-filter-h.glsl"
varying vec2 _k;
uniform sampler2D u_opaque,
u_blend;
uniform highp sampler2D u_opaque_depth,
u_blend_depth;
#ifdef TC_HIGHLIGHT
uniform sampler2D u_stencil;
uniform vec4 u_instance_color,
u_element_color,
u_unhighlighted_color;
#else
uniform vec4 u_color;
#endif
void
main(){
vec4 _bx=texture2D(u_opaque,_k),
_by=texture2D(u_blend,_k),
_bz=texture2D(u_opaque_depth,_k),
_bA=texture2D(u_blend_depth,_k);
bool _bB=_bA.r<=_bz.r;
vec4 _bC=float(_bB)*_by,
_bD=_bx*(1.-_bC.a)+_bC;
_bD.a=min(1.,_bD.a);
#ifdef TC_HIGHLIGHT
vec4 _bE=texture2D(u_stencil,_k);
bool _bF=(_bE.g>0.||(_bB&&_bE.a>0.));
bool _bG=!_bF&&(_bE.r>0.||(_bB&&_bE.b>0.));
bool _bH=!_bF&&!_bG;
gl_FragColor=
float(_bF)*TC_ELEMENT_FILTER(_bD,u_element_color)
+float(_bG)*TC_INSTANCE_FILTER(_bD,u_instance_color)
+float(_bH)*TC_UNHIGHLIGHTED_FILTER(_bD,u_unhighlighted_color);
#else
gl_FragColor=TC_FILTER(_bD,u_color);
#endif
}
