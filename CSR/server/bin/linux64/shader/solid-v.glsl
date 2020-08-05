#version 100
attribute vec4 a_vertex;
uniform mat4 u_view_projection_matrix;
void
main(){
gl_Position=u_view_projection_matrix*a_vertex;
}
