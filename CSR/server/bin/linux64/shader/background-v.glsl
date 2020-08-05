#version 100
precision highp float;
attribute vec3 a_vertex_and_color;
uniform vec4 u_colors[2];
varying vec4 _j;
void
main()
{
_j=u_colors[int(a_vertex_and_color.z)];
gl_Position=vec4(a_vertex_and_color.xy,0,1);
}
