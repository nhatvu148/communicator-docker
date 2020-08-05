#version 100
precision mediump float;
#include "options"
#define TC_LAYER(i,_ej) \
uniform sampler2D _ej;
TC_LAYERS
#undef TC_LAYER
uniform float u_intensity[TC_LAYER_COUNT];
varying vec2 _k;
void
main(){
gl_FragColor=vec4(0.);
#define TC_LAYER(i,_ej) \
gl_FragColor+=u_intensity[i]*texture2D(_ej,_k);
TC_LAYERS
#undef TC_LAYER
}
