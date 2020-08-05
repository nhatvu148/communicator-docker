#version 100
precision highp float;
attribute vec2 a_position;
uniform vec4 u_output_transform;
varying vec2 _D;
void
main()
{
_D=a_position;
gl_Position=vec4((a_position*u_output_transform.zw+u_output_transform.xy)*vec2(2)+vec2(-1),0,1);
}
