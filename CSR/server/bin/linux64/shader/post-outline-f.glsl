#version 100
precision mediump float;
varying vec2 _k;
uniform sampler2D u_texture;
uniform vec2 u_sample_interval;
uniform vec4 u_instance_color,
u_element_color;
void
main()
{
vec2 _fg=vec2(1.)-texture2D(u_texture,_k).rg;
vec2 _fh=texture2D(u_texture,_k+vec2(0.,u_sample_interval.y)).rg;
_fh+=texture2D(u_texture,_k+vec2(-u_sample_interval.x,0.)).rg;
_fh+=texture2D(u_texture,_k+vec2(u_sample_interval.x,0.)).rg;
_fh+=texture2D(u_texture,_k+vec2(0.,-u_sample_interval.y)).rg;
vec2 _fi=min(_fg*vec2(2.)*_fh,vec2(1.));
vec4 _fj=_fi.r*u_instance_color;
vec4 _fk=_fi.g*u_element_color;
gl_FragColor=_fj*(1.-_fk.a)+_fk;
}
