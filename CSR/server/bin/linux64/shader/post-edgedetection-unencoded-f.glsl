#version 100
precision highp float;
#include "options"
uniform highp sampler2D u_opaque,
u_blend;
#ifdef TC_MERGE
float
_ew(in vec2 _K){
return min(texture2D(u_opaque,_K).r,texture2D(u_blend,_K).r);
}
#else
#define _ew(_K) texture2D(u_opaque,_K).r
#endif
#include "post-edgedetection-h.glsl"
