#version 100
precision mediump float;
uniform sampler2D u_image1,
u_image2;
uniform vec3 u_same_color,
u_only1_color,
u_only2_color;
varying vec2 _k;
const vec3 _fl=vec3(.299,.587,.114);
void
main(){
vec4 _ba=texture2D(u_image1,_k);
vec4 _bb=texture2D(u_image2,_k);
vec2 _fr=vec2(dot(_fl,_ba.rgb),_ba.a);
vec2 _fs=vec2(dot(_fl,_bb.rgb),_bb.a);
vec3 _dU;
vec2 _ft;
if(_fr==_fs){
_dU=u_same_color;
_ft=_fr;
}else if(_ba.a>_bb.a){
_dU=u_only1_color;
_ft=_fr;
}else if(_bb.a>_ba.a){
_dU=u_only2_color;
_ft=_fs;
}else if(_fr.x<_fs.x){
_dU=u_only1_color;
_ft=_fr;
}else{
_dU=u_only2_color;
_ft=_fs;
}
_dU=mix(_dU,vec3(1.),_ft.x);
gl_FragColor=vec4(_dU*_ft.y,_ft.y);
}
