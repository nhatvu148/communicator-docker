#latest
#include "gl-standard-derivatives-h.glsl"
precision highp float;
precision highp int;
#include "compat-f.glsl"
#include "options"
#include "ndc-to-eye-h.glsl"
#include "encode-float-h.glsl"
#define _fE 6.28318530718
#define _fF TC_ENCODED_DEPTH
#define _be TC_NORMAL_BUFFER
#define _fG TC_SAMPLES
#define _fH TC_CONTRAST
uniform mat4 u_inv_projection;
uniform highp sampler2D u_depth;
uniform sampler2D u_noise;
uniform vec2 u_screen_noise_ratio;
uniform float u_radius,
u_bias,
u_intensity,
u_contrast;
#if _be
uniform sampler2D u_normals;
#else
uniform sampler2D u_stencil;
#endif
varying vec2 _k;
float
_fI(){
return texture2D(u_noise,_k*u_screen_noise_ratio).r;
}
float
_fJ(const in vec2 _K){
return
#if _fF
_L(texture2D(u_depth,_K));
#else
texture2D(u_depth,_K).r;
#endif
}
void
main(){
float _N=_fJ(_k);
#if _be
#if!_fF
if(_N==1.)
discard;
#endif
#else
vec2 _fK=vec2(step(1.,_N),
texture2D(u_stencil,_k).r);
vec4 _fL=vec4(dFdx(_fK),dFdy(_fK));
if(any(notEqual(_fK,vec2(0.))))
discard;
#endif
vec3 _fM=vec3(_k,_N);
vec3 _fN=_fM*2.-1.;
vec3 _S=_T(u_inv_projection,vec3(1.,1.,_fN.z));
vec3 _fO=vec3(
_fN.xy*_S.xy,
_S.z);
float _fP=max(_S.x,_S.y);
#if _be
vec3 _fQ=texture2D(u_normals,_k).rgb;
if(_fQ==vec3(0.))
discard;
vec3 _Y=normalize(_fQ*2.-1.);
#else
vec3 _Y=normalize(cross(dFdx(_fO),dFdy(_fO)));
#endif
#define _fR u_radius
float _fS=_fR*2.*_fP;
float _dF=u_bias*_fP;
float _fT=_fE*_fI();
float _fU=0.;
float _fV=0.;
for(int i=0;i<_fG;++i){
float _fW=(float(i)+.5)*(1./float(_fG));
float _fX=(_fE*float(TC_SAMPLE_TURNS))*_fW+_fT;
vec3 _fY=vec3(
_fW*_fR
*vec2(cos(_fX),sin(_fX))+_k,0.);
_fY.z=_fJ(_fY.xy);
if(all(bvec4(
greaterThan(_fY.xy,vec2(0.)),
lessThan(_fY.xy,vec2(1.))
)))
{
if(_fY.z<1.){
vec3 _fZ=_fY*2.-1.;
vec3 _f0=_T(u_inv_projection,_fZ);
vec3 _i=_f0-_fO;
_fU+=max(0.,dot(_i,_Y)-_dF)/dot(_i,_i);
}
_fV+=1.;
}
}
float _f1=0.;
if(_fV>0.){
_f1=
#if _fH
pow(
#endif
max(0.,1.-(u_intensity/_fV)*_fS*_fU)
#if _fH
,u_contrast)
#endif
;
}
#if _be
gl_FragColor=vec4(_f1,_X(_fM.z));
#else
gl_FragColor=vec4(_f1+(2./255.),_X(_fM.z));
if(any(notEqual(_fL,vec4(0.))))
gl_FragColor.r=0.;
#endif
}
