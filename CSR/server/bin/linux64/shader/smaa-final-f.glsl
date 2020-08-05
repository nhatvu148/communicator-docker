#include "options"
precision highp float;
#include "compat-f.glsl"
varying vec2 _k;
varying vec4 _l;
uniform sampler2D u_image,
u_blend;
uniform vec4 u_rt_metrics;
#define _m 0
#define _n 1
#define _o u_rt_metrics
#include "smaa-h.glsl"
void
main(){
gl_FragColor=_E(_k,_l,u_image,u_blend);
}
