#include "options"
#include "compat-v.glsl"
attribute vec4 a_vertex_tex_coord;
varying vec2 _k;
varying vec4 _l;
uniform vec4 u_rt_metrics;
#define _m 1
#define _n 0
#define _o u_rt_metrics
#include "smaa-h.glsl"
void
main(){
_k=a_vertex_tex_coord.zw;
_p(_k,_l);
gl_Position=vec4(a_vertex_tex_coord.xy,0,1);
}
