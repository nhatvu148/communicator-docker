#version 100
precision highp float;
uniform sampler2D u_opaque,
u_blend;
uniform highp sampler2D u_opaque_depth,
u_blend_depth;
varying vec2 _k;
void
main(){
vec4 _bx=texture2D(u_opaque,_k),
_bC=texture2D(u_blend,_k),
_bz=texture2D(u_opaque_depth,_k),
_bA=texture2D(u_blend_depth,_k),
_ei=float(_bA.r<=_bz.r)*_bC;
gl_FragColor=_bx*(1.-_ei.a)+_ei;
}
