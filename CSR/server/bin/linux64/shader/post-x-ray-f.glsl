#version 100
precision mediump float;
uniform sampler2D u_opaque,
u_blend;
varying vec2 _k;
void
main(){
vec4 _bx=texture2D(u_opaque,_k),
_bC=texture2D(u_blend,_k);
gl_FragColor=_bC*(1.-_bx.a)+_bx;
}
