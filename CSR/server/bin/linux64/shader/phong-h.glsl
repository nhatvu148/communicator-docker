struct _em{
vec3 _Y;
vec3 _en;
float _eo;
};
struct _ep{
vec3 _eq,
_er;
};
_ep
_es(){
return _ep(vec3(0.),vec3(0.));
}
void
_et(
const vec3 _9,
const vec3 _dU,
const _em _eu,
inout _ep _c8)
{
_c8._eq+=_dU*max(0.,dot(_9,_eu._Y));
vec3 _ev=reflect(-_9,_eu._Y);
_c8._er+=_dU*pow(max(0.,dot(_ev,_eu._en)),_eu._eo);
}
