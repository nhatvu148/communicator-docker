#version 100
precision highp float;
attribute vec4 a_vertex;
uniform mat4 u_view_projection_matrix;
uniform mat4 u_model_matrix;
void
main(){
gl_Position=u_view_projection_matrix*(u_model_matrix*a_vertex);
}
