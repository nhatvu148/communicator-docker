attribute vec4 a_vertex_tex_coord;
varying vec2 _k;
void
main()
{
_k=a_vertex_tex_coord.zw;
gl_Position=vec4(a_vertex_tex_coord.xy,1,1);
}
