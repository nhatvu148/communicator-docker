vec3
_e6(
const vec3 _dU)
{
#ifdef TC_SRGB
return pow(_dU,vec3(2.2));
#else
return _dU;
#endif
}
vec4
_e6(
const vec4 _dU)
{
return vec4(_e6(_dU.rgb),_dU.a);
}
vec3
_fc(
const vec3 _dU)
{
#ifdef TC_SRGB
return pow(_dU,vec3(1./2.2));
#else
return _dU;
#endif
}
vec4
_fc(
const vec4 _dU)
{
return vec4(_fc(_dU.rgb),_dU.a);
}
