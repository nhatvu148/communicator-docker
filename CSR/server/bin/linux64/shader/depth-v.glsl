#latest
precision highp float;
#include "compat-v.glsl"
#include "options"
#include "attributes-h.glsl"
#include "uniforms-v.glsl"
#include "matrix-h.glsl"
varying vec3 _s,
_r;
varying vec2 _t;
void
main()
{
mat4 _v=_g();
mat4 _w=tc_um4_projection_matrix*_v;
vec4 _x=_v*tc_av4_vertex;
_s=_x.xyz;
#if defined(TC_FACES)&&defined(TC_MRT)
_r=vec3(tc_um4_view_matrix*vec4(_f()*tc_av3_normal,0.));
#ifdef TC_FLIP_NORMALS
_r=-_r;
#endif
#endif
#ifdef TC_TEXTURE
_t=tc_av2_texture_coords;
#ifdef TC_TEXTURE_MATRIX
{
vec3 _y=vec3(_t,1.);
_t=vec2(
dot(tc_uv3_texture_matrix_row0,_y),
dot(tc_uv3_texture_matrix_row1,_y));
}
#endif
_t.y=1.-_t.y;
#endif
gl_Position=_w*tc_av4_vertex;
gl_PointSize=1.;
}
