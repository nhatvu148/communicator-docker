#version 100
precision highp float;
uniform mat4 u_model_view_projection_matrix;
attribute vec4 a_vertex_tex_coord;
varying vec2 _k;
void
main(){
_k=a_vertex_tex_coord.zw;
gl_Position=u_model_view_projection_matrix*vec4(a_vertex_tex_coord.xy,0,1);
}
