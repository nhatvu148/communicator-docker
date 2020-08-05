#latest
precision highp float;
#include "compat-v.glsl"
#include "forward-lighting-h.glsl"
#include "attributes-h.glsl"
#include "uniforms-v.glsl"
#include "matrix-h.glsl"
void
main()
{
mat4 _v=_g();
mat4 _w=tc_um4_projection_matrix*_v;
vec4 _x=_v*tc_av4_vertex;
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
#ifdef TC_FACES
_r=vec3(tc_um4_view_matrix*vec4(_f()*tc_av3_normal,0.));
#ifdef TC_FLIP_NORMALS
_r=-_r;
#endif
#endif
_s=_x.xyz;
_q=tc_av4_base_color;
gl_Position=_w*tc_av4_vertex;
#ifdef TC_LINE_PATTERN
_u=tc_af_line_pattern_offset*tc_uf_line_pattern_inverse_length;
#ifdef TC_LINE_PATTERN_SCREEN
_u*=gl_Position.w;
#endif
#endif
#ifdef TC_SPLAT_WORLD
{
vec4 _z=tc_um4_projection_matrix*vec4(0.,tc_uf_point_size,_x.z,1.);
gl_PointSize=(_z.y/_z.w)*.5*tc_uf_viewport_height;
}
#elif defined(TC_POINTS)
gl_PointSize=tc_uf_point_size;
#endif
}
