#version 100
precision highp float;
attribute vec4 a_clip_pos;
attribute vec4 a_color;
varying vec4 _j;
void
main(){
_j=a_color;
gl_Position=a_clip_pos;
gl_PointSize=1.;
}
