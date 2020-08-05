float
_A(
const in float _B,
const in float _C,
const in float x)
{
return clamp((x-_B)/(_C-_B),0.,1.);
}
