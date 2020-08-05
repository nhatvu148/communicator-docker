
struct _ex{
vec3 _Y,
_en,
_ey,
_ez,
_eA,
_eB;
float _eC;
};
struct _eD{
float _eE,
_eF,
_eG,
_eH,
_eI;
};
const float _eJ=.04,
_eK=4.,
_eL=3.141592653589793;
vec3
_eM(
const _ex _eu)
{
return _eu._eA/_eL;
}
vec3
_eN(
const _ex _eu,
const _eD _eO)
{
return _eu._ey
+(_eu._ez-_eu._ey)
*pow(clamp(1.-_eO._eI,0.,1.),5.);
}
float
_eP(
const _ex _eu,
const _eD _eO)
{
float _eQ=_eu._eC*_eu._eC,
_eR=2.*_eO._eE/(
_eO._eE+sqrt(_eQ+(1.-_eQ)*(_eO._eE*_eO._eE))),
_eS=2.*_eO._eF/(
_eO._eF+sqrt(_eQ+(1.-_eQ)*(_eO._eF*_eO._eF)));
return _eR*_eS;
}
float
_eT(
const _ex _eu,
const _eD _eO)
{
float _eQ=_eu._eC*_eu._eC,
f=(_eO._eG*_eQ-_eO._eG)*_eO._eG+1.;
return _eQ/(_eL*f*f);
}
vec3
_eU(
const vec3 _9,
const vec3 _dU,
const _ex _eu)
{
vec3 _eV=normalize(_9+_eu._en);
_eD _eO=_eD(
clamp(dot(_eu._Y,_9),.001,1.),
clamp(abs(dot(_eu._Y,_eu._en)),.001,1.),
clamp(dot(_eu._Y,_eV),0.,1.),
clamp(dot(_9,_eV),0.,1.),
clamp(dot(_eu._en,_eV),0.,1.)
);
vec3 F=_eN(_eu,_eO);
float G=_eP(_eu,_eO),
D=_eT(_eu,_eO);
vec3 _eW=(1.-F)*_eM(_eu),
_eX=F*G*D/(4.*_eO._eE*_eO._eF);
return _eO._eE*_eK*_dU*(_eW+_eX);
}
