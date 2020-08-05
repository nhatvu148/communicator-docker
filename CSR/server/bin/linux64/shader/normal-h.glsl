vec3 _Y;
#if __VERSION__>=300||defined(GL_OES_standard_derivatives)
if(tc_ub_flat)
_Y=normalize(cross(dFdx(_s),dFdy(_s)));
else
#endif
{
float _Z;
if(tc_ub_auto_flip)
_Z=(-2.)*float(_r.z<0.)+1.;
else
_Z=2.*float(gl_FrontFacing)+(-1.);
_Y=normalize(_r*_Z);
#ifdef TC_NORMAL_MAP
vec3 _0=dFdx(_s);
vec3 _1=dFdy(_s);
vec2 _2=dFdx(_t);
vec2 _3=dFdy(_t);
vec3 _4=
(_3.t*_0-_2.t*_1)
/(_2.s*_3.t-_3.s*_2.t);
_4=normalize(_4-_Y*dot(_Y,_4));
vec3 _5=normalize(cross(_Y,_4));
mat3 _6=mat3(_4,_5,_Y);
vec3 _7=2.*texture2D(tc_us2_normal_map,_t).rgb-1.;
_Y=normalize(_6*_7);
#endif
}
