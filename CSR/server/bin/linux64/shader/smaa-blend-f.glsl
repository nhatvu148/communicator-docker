#include "options"
precision highp float;
#include "compat-f.glsl"
varying vec2 _k,
_bu;
varying vec4 _l[3];
uniform sampler2D u_edges,
u_area,
u_search;
uniform vec4 u_rt_metrics;
#define _m 0
#define _n 1
#define _o u_rt_metrics
#include "smaa-h.glsl"
void
main(){
gl_FragColor=_dQ(
_k,_bu,_l,
u_edges,u_area,u_search,vec4(0.));
}
