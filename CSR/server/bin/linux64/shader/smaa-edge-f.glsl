#include "options"
precision highp float;
#include "compat-f.glsl"
varying vec2 _k;
varying vec4 _l[3];
uniform sampler2D u_image;
uniform vec4 u_rt_metrics;
#define _m 0
#define _n 1
#define _o u_rt_metrics
#include "smaa-h.glsl"
void
main(){
gl_FragColor=vec4(_bw(_k,_l,u_image),0.,0.);
}
