#latest
#include "gl-standard-derivatives-h.glsl"
#include "gl-draw-buffers-h.glsl"
precision mediump float;
#include "compat-f.glsl"
#include "precision-h.glsl"
#include "options"
#include "uniforms-f.glsl"
#include "cutting-section-h.glsl"
#ifdef TC_ENCODE_DEPTH
#include "encode-float-h.glsl"
#endif
varying vec3 _s,
_r;
varying vec2 _t;
void
main()
{
#ifdef TC_CUTTING_PLANES
if(_eY(_s))
discard;
#endif
#ifdef TC_ENCODE_DEPTH
#ifdef TC_MRT
#if defined(TC_FACES)
#include "normal-h.glsl"
gl_FragData[1]=vec4(_Y*.5+.5,1.);
#else
gl_FragData[1]=vec4(0.);
#endif
gl_FragData[0]=_ee(gl_FragCoord.z);
#else
gl_FragColor=_ee(gl_FragCoord.z);
#endif
#endif
}
