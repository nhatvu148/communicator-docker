#version 100
precision mediump float;
#include "options"
uniform sampler2D u_image;
uniform vec2 u_interval;
uniform float u_weights[TC_SAMPLES];
#if TC_LUMA_FILTER
uniform float u_luma_threshold;
uniform float u_luma_threshold_ramp_width;
const vec3 _fl=vec3(.299,.587,.114);
#endif
varying vec2 _k;
void
main(){
vec2 _K=_k-float(TC_RADIUS)*u_interval;
vec4 _dU=vec4(0.);
#if TC_LUMA_FILTER
float _fm=u_luma_threshold+u_luma_threshold_ramp_width;
#endif
for(int i=0;i<TC_SAMPLES;++i){
vec4 _bg=texture2D(u_image,_K);
#if TC_LUMA_FILTER
float _fn=dot(_bg.xyz,_fl);
_bg*=smoothstep(u_luma_threshold,_fm,_fn);
#endif
_dU+=_bg*u_weights[i];
_K+=u_interval;
}
gl_FragColor=_dU;
}
