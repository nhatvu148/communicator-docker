#version 100
precision mediump float;
varying vec2 _k;
uniform sampler2D u_texture;
void
main()
{
gl_FragColor=texture2D(u_texture,_k);
}
