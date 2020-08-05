vec2
_ea(const in float _cZ){
const vec2 _eb=vec2(255.,1.),
_ec=vec2(0.,1./255.);
vec2 _br=fract(_cZ*_eb);
_br-=_br.xx*_ec;
float _ed=step(1.,_cZ);
return _ed*vec2(0.,1.)+(1.-_ed)*_br;
}
vec3
_X(const in float _cZ){
const vec3 _eb=vec3(255.*255.,255.,1.),
_ec=vec3(0.,vec2(1./255.));
vec3 _br=fract(_cZ*_eb);
_br-=_br.xxy*_ec;
float _ed=step(1.,_cZ);
return _ed*vec3(0.,0.,1.)+(1.-_ed)*_br;
}
vec4
_ee(const in float _cZ){
const vec4 _eb=vec4(255.*255.*255.,255.*255.,255.,1.),
_ec=vec4(0.,vec3(1./255.));
vec4 _br=fract(_cZ*_eb);
_br-=_br.xxyz*_ec;
float _ed=step(1.,_cZ);
return _ed*vec4(0.,0.,0.,1.)+(1.-_ed)*_br;
}
vec3
_W(const in vec4 _cZ){
return _cZ.yzw;
}
vec2
_ef(const in vec4 _cZ){
return _cZ.zw;
}
vec2
_eg(const in vec3 _cZ){
return _cZ.yz;
}
float
_eh(const in vec2 _cZ){
const vec2 _eb=vec2(1./255.,1.);
return dot(_cZ,_eb);
}
float
_bj(const in vec3 _cZ){
const vec3 _eb=vec3(1./(255.*255.),1./255.,1.);
return dot(_cZ,_eb);
}
float
_L(const in vec4 _cZ){
const vec4 _eb=vec4(1./(255.*255.*255.),1./(255.*255.),1./255.,1.);
return dot(_cZ,_eb);
}
