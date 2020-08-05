vec3
_T(
const in mat4 _bs,
const in vec3 _bt)
{
vec4 r=_bs*vec4(_bt,1.);
return r.xyz/r.w;
}
float
_O(
const in mat4 _bs,
const in float _N)
{
vec2 r=_bs[2].zw*(_N*2.-1.)+_bs[3].zw;
return r.x/r.y;
}
