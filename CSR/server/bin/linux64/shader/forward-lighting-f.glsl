#latest
#include "gl-standard-derivatives-h.glsl"
#include "gl-draw-buffers-h.glsl"
precision mediump float;
#include "compat-f.glsl"
#include "precision-h.glsl"
#include "forward-lighting-h.glsl"
#include "uniforms-f.glsl"
#include "cutting-section-h.glsl"
#include "linearstep-h.glsl"
#include "srgb-h.glsl"
#include "phong-h.glsl"
#include "metallic-roughness-h.glsl"
void
main()
{
#ifdef TC_CUTTING_PLANES
if(_eY(_s))
discard;
#endif
#ifdef TC_LINE_PATTERN
if(texture2D(
tc_us2_line_pattern,
vec2(fract(
_u
#ifdef TC_LINE_PATTERN_SCREEN
*gl_FragCoord.w
#endif
),0.)).r
==0.
)
discard;
#endif
#if defined(TC_SPLAT_DISK)||defined(TC_SPLAT_SPHERE)
#ifdef TC_SPLAT_SPHERE
vec3 _Y;
#endif
{
vec2 _eZ=gl_PointCoord-vec2(.5);
if(dot(_eZ,_eZ)>.25)
discard;
#ifdef TC_SPLAT_SPHERE
vec2 _e0=
vec2(_eZ.x,-_eZ.y)*2.;
_Y=vec3(
_e0,
sqrt(1.-dot(_e0,_e0)));
#endif
}
#endif
#if defined(TC_LIGHTS)||defined(TC_SPHERE_MAP)
vec3 _en;
#if _e1
if(tc_ub_projection_is_ortho)
_en=vec3(0.,0.,1.);
else
_en=-normalize(_s);
#else
_en=vec3(0.,0.,1.);
#endif
#endif
#ifdef TC_FACES
#include "normal-h.glsl"
#ifdef TC_MRT
gl_FragData[1]=vec4(_Y*.5+.5,1.);
#endif
#elif defined(TC_MRT)
gl_FragData[1]=vec4(0.);
#endif
vec4 _e2=tc_uv4_base_color*_q;
#ifdef TC_TEXTURE
vec4 _e3=texture2D(tc_us2_texture,
#if TC_TEXTURE & TC_REPEAT
fract(_t)
#else
_t
#endif
);
_e3.rgb*=_e3.a;
#if TC_TEXTURE & TC_DECAL
_e2=vec4(_e2.rgb*_e2.a,_e2.a)*(1.-_e3.a)+_e3;
#else
_e2.rgb=_e3.rgb*_e2.a;
_e2.a*=_e3.a;
#endif
#else
_e2.rgb*=_e2.a;
#endif
_e2*=tc_uf_opacity;
#ifdef TC_DISCARD_0_ALPHA
if(_e2.a<=0.)
discard;
#endif
#ifdef TC_MRT
#define _e4 gl_FragData[0]
#else
#define _e4 gl_FragColor
#endif
#ifdef TC_LIGHTS
#ifdef TC_PHONG
_em _eu;
_eu._Y=_Y;
_eu._en=_en;
_eu._eo=tc_uv2_specular_mix_and_gloss.y;
_ep _e5=_es();
_e5._eq+=tc_uv3_ambient_light_color;
#ifdef TC_PLAIN_DIR_LIGHTS
#define TC_LIGHT(i) \
_et(tc_uv3_light_position[i],tc_uv3_light_color[i],_eu,_e5);
TC_PLAIN_DIR_LIGHTS
#undef TC_LIGHT
#endif
_e4=vec4(
mix(
_e2.rgb,
_e2.rgb*min(vec3(1.),_e5._eq)
+_e5._er*(tc_uv2_specular_mix_and_gloss.x*_e2.a)
,tc_uf_light_mix),
_e2.a);
#elif defined(TC_METALLIC_ROUGHNESS)
_e2.rgb=_e6(_e2.rgb);
_ex _eu;
_eu._Y=_Y;
_eu._en=_en;
float _e7=tc_uv2_metallic_roughness.y;
float _e8=tc_uv2_metallic_roughness.x;
#ifdef TC_METALLIC_ROUGHNESS_MAP
vec4 _e9=texture2D(tc_us2_metallic_roughness_map,_t);
_e7=_e9.g*_e7;
_e8=_e9.b*_e8;
#endif
_e7=clamp(_e7,_eJ,1.0);
_e8=clamp(_e8,0.0,1.0);
_eu._eC=_e7*_e7;
vec3 _fa=vec3(.04);
_eu._eA=_e2.rgb*(vec3(1.)-_fa);
_eu._eA*=1.-_e8;
_eu._eB=mix(_fa,_e2.rgb,_e8);
float _fb=
max(max(_eu._eB.r,_eu._eB.g),_eu._eB.b);
_eu._ey=_eu._eB.rgb;
_eu._ez=vec3(clamp(_fb*25.,0.,1.));
_e4=vec4(vec3(0.),_e2.a);
#ifdef TC_PLAIN_DIR_LIGHTS
#define TC_LIGHT(i) \
_e4.rgb+=_eU(tc_uv3_light_position[i],tc_uv3_light_color[i],_eu);
TC_PLAIN_DIR_LIGHTS
#undef TC_LIGHT
#endif
_e4.rgb=_fc(min(_e4.rgb,vec3(1.)));
#endif
#else
_e4=_e2;
#endif
#ifdef TC_SPHERE_MAP
vec3 _ev=reflect(-_en,_Y);
_ev.z+=1.;
float _fd=1./(2.*length(_ev));
_e4.rgb=mix(
_e4.rgb,
texture2D(
tc_us2_sphere_map,
_ev.xy*vec2(_fd,-_fd)+vec2(.5)
).rgb*_e4.a,
tc_uf_mirror);
#endif
vec3 _fe=tc_uv3_emissive_color;
#ifdef TC_EMISSIVE_MAP
_fe*=texture2D(tc_us2_emissive_map,_t).rgb;
#endif
_e4.rgb+=_fe;
if(tc_uv2_reflection_attenuation.y>tc_uv2_reflection_attenuation.x){
float _ff=dot(tc_uv4_ground_plane,vec4(_s,1.));
_e4*=_A(
tc_uv2_reflection_attenuation.y,tc_uv2_reflection_attenuation.x,
_ff);
}
}
