#version 100
precision mediump float;
varying vec2 _k;
uniform vec4 u_color;
void
main()
{
gl_FragColor=u_color;
}
