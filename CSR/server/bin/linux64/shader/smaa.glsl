
#if defined(_bI)
#define _bJ 0.15
#define _bK 4
#define _bL
#define _bM
#elif defined(_bN)
#define _bJ 0.1
#define _bK 8
#define _bL
#define _bM
#elif defined(_bO)
#define _bJ 0.1
#define _bK 16
#define _bP 8
#define _bQ 25
#elif defined(_bR)
#define _bJ 0.05
#define _bK 32
#define _bP 16
#define _bQ 25
#endif
#ifndef _bJ
#define _bJ 0.1
#endif
#ifndef _bS
#define _bS (0.1*_bJ)
#endif
#ifndef _bK
#define _bK 16
#endif
#ifndef _bP
#define _bP 8
#endif
#ifndef _bQ
#define _bQ 25
#endif
#ifndef _bT
#define _bT 2.0
#endif
#ifndef _bU
#define _bU 0
#endif
#ifndef _bV
#define _bV 0.01
#endif
#ifndef _bW
#define _bW 2.0
#endif
#ifndef _bX
#define _bX 0.4
#endif
#ifndef _bY
#define _bY 0
#endif
#ifndef _bZ
#define _bZ 30.0
#endif
#ifndef _m
#define _m 1
#endif
#ifndef _n
#define _n 1
#endif
#ifndef _b0
#if defined(_b1)
#define _b0(_bg) _bg.ra
#else
#define _b0(_bg) _bg.rg
#endif
#endif
#ifndef _b2
#define _b2(_bg) _bg.r
#endif
#ifndef _b3
#define _b3(_bg) _bg.rg
#endif
#define _b4 16
#define _b5 20
#define _b6 (1.0/_b7(160.0,560.0))
#define _b8 (1.0/7.0)
#define _b9 _b7(66.0,33.0)
#define _ca _b7(64.0,16.0)
#define _cb (float(_bQ)/100.0)
#if defined(_cc)||defined(_cd)||defined(_ce)||defined(_cf)
#if defined(_cc)||defined(_cd)
#define _cg(_ch,_ci) texture2D(_ch,_ci)
#define _cj(_ch,_ci) texture2D(_ch,_ci)
#define _ck(_ch,_ci,_cl) texture2D(_ch,_ci+_cl*_o.xy)
#define _cm(_ch,_ci) texture2D(_ch,_ci)
#define _cn(_ch,_ci) texture2D(_ch,_ci)
#define _co(_ch,_ci,_cl) texture2D(_ch,_ci+_cl*_o.xy)
#else
#define _cg(_ch,_ci) textureLod(_ch,_ci,0.0)
#define _cj(_ch,_ci) textureLod(_ch,_ci,0.0)
#define _ck(_ch,_ci,_cl) textureLodOffset(_ch,_ci,0.0,_cl)
#define _cm(_ch,_ci) texture(_ch,_ci)
#define _cn(_ch,_ci) texture(_ch,_ci)
#define _co(_ch,_ci,_cl) textureOffset(_ch,_ci,_cl)
#endif
#define _cp(_ch) sampler2D _ch
#define _cq(_ch) _ch
#define _cr
#define _cs
#define _ct(a,b,t) mix(a,b,t)
#define _cu(a) clamp(a,0.0,1.0)
#if defined(_cf)
#define _cv(a,b,c) fma(a,b,c)
#define _cw(_ch,_ci) textureGather(_ch,_ci)
#else
#define _cv(a,b,c) (a*b+c)
#endif
#define _b7 vec2
#define _cx vec3
#define _cy vec4
#define _cz ivec2
#define _cA ivec3
#define _cB ivec4
#define _cC bvec2
#define _cD bvec3
#define _cE bvec4
#endif
#if defined(_cc)||defined(_cd)
#define _cF(v) floor((v)+.5)
#define _cG(x,y) vec2(x,y)
#else
#define _cF(v) round(v)
#define _cG(x,y) _cz(x,y)
#endif
#if defined(_cd)
#define _cH(_cI,_cJ) for (int i=0;i<_cI;i++){if (!(_cJ)) break;
#else
#define _cH(_cI,_cJ) while (_cJ){
#endif
#if!defined(_b1)&&!defined(_cK)&&!defined(_cL)&&!defined(_cc)&&!defined(_cd)&&!defined(_ce)&&!defined(_cf)&&!defined(_cM)
#error you must define the shading language:SMAA_HLSL_*,SMAA_GLSL_*or SMAA_CUSTOM_SL
#endif
_cx _cN(_b7 _cO,
_cy _cl[3],
_cp(_ch)){
#ifdef _cw
return _cw(_ch,_cO+_o.xy*_b7(-0.5,-0.5)).grb;
#else
float P=_cn(_ch,_cO).r;
float _cP=_cn(_ch,_cl[0].xy).r;
float _cQ=_cn(_ch,_cl[0].zw).r;
return _cx(P,_cP,_cQ);
#endif
}
_b7 _cR(_b7 _cO,
_cy _cl[3],
_cp(_cS)){
_cx _cT=_cN(_cO,_cl,_cq(_cS));
_b7 _cU=abs(_cT.xx-_cT.yz);
_b7 _cV=step(_bV,_cU);
return _bW*_bJ*(1.0-_bX*_cV);
}
void _cW(_cC _cX,inout _b7 _cY,_b7 _cZ){
_cr if(_cX.x) _cY.x=_cZ.x;
_cr if(_cX.y) _cY.y=_cZ.y;
}
void _cW(_cE _cX,inout _cy _cY,_cy _cZ){
_cW(_cX.xy,_cY.xy,_cZ.xy);
_cW(_cX.zw,_cY.zw,_cZ.zw);
}
#if _m
void _c0(_b7 _cO,
inout _cy _cl[3]){
_cl[0]=_cv(_o.xyxy,_cy(-1.0,0.0,0.0,-1.0),_cO.xyxy);
_cl[1]=_cv(_o.xyxy,_cy(1.0,0.0,0.0,1.0),_cO.xyxy);
_cl[2]=_cv(_o.xyxy,_cy(-2.0,0.0,0.0,-2.0),_cO.xyxy);
}
void _bv(_b7 _cO,
out _b7 _c1,
inout _cy _cl[3]){
_c1=_cO*_o.zw;
_cl[0]=_cv(_o.xyxy,_cy(-0.25,-0.125,1.25,-0.125),_cO.xyxy);
_cl[1]=_cv(_o.xyxy,_cy(-0.125,-0.25,-0.125,1.25),_cO.xyxy);
_cl[2]=_cv(_o.xxyy,
_cy(-2.0,2.0,-2.0,2.0)*float(_bK),
_cy(_cl[0].xz,_cl[1].yw));
}
void _p(_b7 _cO,
out _cy _cl){
_cl=_cv(_o.xyxy,_cy(1.0,0.0,0.0,1.0),_cO.xyxy);
}
#endif
#if _n
#if _c2
_b7 _bw(_b7 _cO,
_cy _cl[3],
_cp(_c3)
#if _bU
,_cp(_cS)
#endif
){
#if _bU
_b7 _c4=_cR(_cO,_cl,_cq(_cS));
#else
_b7 _c4=_b7(_bJ,_bJ);
#endif
_cx _c5=_cx(0.2126,0.7152,0.0722);
_cy _cU;
_cy _c6;
#define _c7(_c8,_ch,_K) \
_c6=_cn(_ch,_K);\
_b7 _c8=_b7(dot(_c6.rgb,_c5),_c6.a)
_c7(C,_c3,_cO);
_c7(_c9,_c3,_cl[0].xy);
_b7 t=abs(C-_c9);
_cU.x=max(t.r,t.g);
_c7(_da,_c3,_cl[0].zw);
t=abs(C-_da);
_cU.y=max(t.r,t.g);
_b7 _cV=step(_c4,_cU.xy);
if(dot(_cV,_b7(1.0,1.0))==0.0)
discard;
_c7(_db,_c3,_cl[1].xy);
t=abs(C-_db);
_cU.z=max(t.r,t.g);
_c7(_dc,_c3,_cl[1].zw);
t=abs(C-_dc);
_cU.w=max(t.r,t.g);
_b7 _dd=max(_cU.xy,_cU.zw);
_c7(_de,_c3,_cl[2].xy);
t=abs(C-_de);
_cU.z=max(t.r,t.g);
_c7(_df,_c3,_cl[2].zw);
t=abs(C-_df);
_cU.w=max(t.r,t.g);
_dd=max(_dd.xy,_cU.zw);
float _dg=max(_dd.x,_dd.y);
_cV.xy*=step(_dg,_bT*_cU.xy);
return _cV;
#undef _c7
}
#else
_b7 _bw(_b7 _cO,
_cy _cl[3],
_cp(_c3)
#if _bU
,_cp(_cS)
#endif
){
#if _bU
_b7 _c4=_cR(_cO,_cl,_cq(_cS));
#else
_b7 _c4=_b7(_bJ,_bJ);
#endif
_cx _c5=_cx(0.2126,0.7152,0.0722);
float L=dot(_cn(_c3,_cO).rgb,_c5);
float _dh=dot(_cn(_c3,_cl[0].xy).rgb,_c5);
float _di=dot(_cn(_c3,_cl[0].zw).rgb,_c5);
_cy _cU;
_cU.xy=abs(L-_b7(_dh,_di));
_b7 _cV=step(_c4,_cU.xy);
if(dot(_cV,_b7(1.0,1.0))==0.0)
discard;
float _dj=dot(_cn(_c3,_cl[1].xy).rgb,_c5);
float _dk=dot(_cn(_c3,_cl[1].zw).rgb,_c5);
_cU.zw=abs(L-_b7(_dj,_dk));
_b7 _dd=max(_cU.xy,_cU.zw);
float _dl=dot(_cn(_c3,_cl[2].xy).rgb,_c5);
float _dm=dot(_cn(_c3,_cl[2].zw).rgb,_c5);
_cU.zw=abs(_b7(_dh,_di)-_b7(_dl,_dm));
_dd=max(_dd.xy,_cU.zw);
float _dg=max(_dd.x,_dd.y);
_cV.xy*=step(_dg,_bT*_cU.xy);
return _cV;
}
_b7 _dn(_b7 _cO,
_cy _cl[3],
_cp(_c3)
#if _bU
,_cp(_cS)
#endif
){
#if _bU
_b7 _c4=_cR(_cO,_cl,_cS);
#else
_b7 _c4=_b7(_bJ,_bJ);
#endif
_cy _cU;
_cx C=_cn(_c3,_cO).rgb;
_cx _c9=_cn(_c3,_cl[0].xy).rgb;
_cx t=abs(C-_c9);
_cU.x=max(max(t.r,t.g),t.b);
_cx _da=_cn(_c3,_cl[0].zw).rgb;
t=abs(C-_da);
_cU.y=max(max(t.r,t.g),t.b);
_b7 _cV=step(_c4,_cU.xy);
if(dot(_cV,_b7(1.0,1.0))==0.0)
discard;
_cx _db=_cn(_c3,_cl[1].xy).rgb;
t=abs(C-_db);
_cU.z=max(max(t.r,t.g),t.b);
_cx _dc=_cn(_c3,_cl[1].zw).rgb;
t=abs(C-_dc);
_cU.w=max(max(t.r,t.g),t.b);
_b7 _dd=max(_cU.xy,_cU.zw);
_cx _de=_cn(_c3,_cl[2].xy).rgb;
t=abs(C-_de);
_cU.z=max(max(t.r,t.g),t.b);
_cx _df=_cn(_c3,_cl[2].zw).rgb;
t=abs(C-_df);
_cU.w=max(max(t.r,t.g),t.b);
_dd=max(_dd.xy,_cU.zw);
float _dg=max(_dd.x,_dd.y);
_cV.xy*=step(_dg,_bT*_cU.xy);
return _cV;
}
_b7 _do(_b7 _cO,
_cy _cl[3],
_cp(_dp)){
_cx _cT=_cN(_cO,_cl,_cq(_dp));
_b7 _cU=abs(_cT.xx-_b7(_cT.y,_cT.z));
_b7 _cV=step(_bS,_cU);
if(dot(_cV,_b7(1.0,1.0))==0.0)
discard;
return _cV;
}
#endif
#if!defined(_bL)
_b7 _dq(_b7 e){
e.r=e.r*abs(5.0*e.r-5.0*0.75);
return _cF(e);
}
_cy _dq(_cy e){
e.rb=e.rb*abs(5.0*e.rb-5.0*0.75);
return _cF(e);
}
_b7 _dr(_cp(_ds),_b7 _cO,_b7 _dt,out _b7 e){
_cy _ci=_cy(_cO,-1.0,1.0);
_cx t=_cx(_o.xy,1.0);
_cH(_bP,
_ci.z<float(_bP-1)&&_ci.w>0.9)
_ci.xyz=_cv(t,_cx(_dt,1.0),_ci.xyz);
e=_cg(_ds,_ci.xy).rg;
_ci.w=dot(e,_b7(0.5,0.5));
}
return _ci.zw;
}
_b7 _du(_cp(_ds),_b7 _cO,_b7 _dt,out _b7 e){
_cy _ci=_cy(_cO,-1.0,1.0);
_ci.x+=0.25*_o.x;
_cx t=_cx(_o.xy,1.0);
_cH(_bP,
_ci.z<float(_bP-1)&&_ci.w>0.9)
_ci.xyz=_cv(t,_cx(_dt,1.0),_ci.xyz);
e=_cg(_ds,_ci.xy).rg;
e=_dq(e);
_ci.w=dot(e,_b7(0.5,0.5));
}
return _ci.zw;
}
_b7 _dv(_cp(_dw),_b7 _dx,_b7 e,float _cl){
_b7 _cO=_cv(_b7(_b5,_b5),e,_dx);
_cO=_cv(_b6,_cO,0.5*_b6);
_cO.x+=0.5;
_cO.y+=_b8*_cl;
return _b0(_cg(_dw,_cO));
}
_b7 _dy(_cp(_ds),_cp(_dw),_b7 _cO,_b7 e,_cy _dz){
_b7 _c5=_b7(0.0,0.0);
_cy d;
_b7 _dA;
if(e.r>0.0){
d.xz=_dr(_cq(_ds),_cO,_b7(-1.0,1.0),_dA);
d.x+=float(_dA.y>0.9);
}else
d.xz=_b7(0.0,0.0);
d.yw=_dr(_cq(_ds),_cO,_b7(1.0,-1.0),_dA);
_cs
if(d.x+d.y>2.0){
_cy _dB=_cv(_cy(-d.x+0.25,d.x,d.y,-d.y-0.25),_o.xyxy,_cO.xyxy);
_cy c;
c.xy=_ck(_ds,_dB.xy,_cG(-1,0)).rg;
c.zw=_ck(_ds,_dB.zw,_cG(1,0)).rg;
c.yxwz=_dq(c.xyzw);
_b7 _dC=_cv(_b7(2.0,2.0),c.xz,c.yw);
_cW(_cC(step(0.9,d.zw)),_dC,_b7(0.0,0.0));
_c5+=_dv(_cq(_dw),d.xy,_dC,_dz.z);
}
d.xz=_du(_cq(_ds),_cO,_b7(-1.0,-1.0),_dA);
if(_ck(_ds,_cO,_cG(1,0)).r>0.0){
d.yw=_du(_cq(_ds),_cO,_b7(1.0,1.0),_dA);
d.y+=float(_dA.y>0.9);
}else
d.yw=_b7(0.0,0.0);
_cs
if(d.x+d.y>2.0){
_cy _dB=_cv(_cy(-d.x,-d.x,d.y,d.y),_o.xyxy,_cO.xyxy);
_cy c;
c.x=_ck(_ds,_dB.xy,_cG(-1,0)).g;
c.y=_ck(_ds,_dB.xy,_cG(0,-1)).r;
c.zw=_ck(_ds,_dB.zw,_cG(1,0)).gr;
_b7 _dC=_cv(_b7(2.0,2.0),c.xz,c.yw);
_cW(_cC(step(0.9,d.zw)),_dC,_b7(0.0,0.0));
_c5+=_dv(_cq(_dw),d.xy,_dC,_dz.w).gr;
}
return _c5;
}
#endif
float _dD(_cp(_dE),_b7 e,float _cl){
_b7 _H=_b9*_b7(0.5,-1.0);
_b7 _dF=_b9*_b7(_cl,1.0);
_H+=_b7(-1.0,1.0);
_dF+=_b7(0.5,-0.5);
_H*=1.0/_ca;
_dF*=1.0/_ca;
return _b2(_cg(_dE,_cv(_H,e,_dF)));
}
float _dG(_cp(_ds),_cp(_dE),_b7 _cO,float _dA){
_b7 e=_b7(0.0,1.0);
_cH(_bK,
_cO.x>_dA&&
e.g>0.8281&&
e.r==0.0)
e=_cg(_ds,_cO).rg;
_cO=_cv(-_b7(2.0,0.0),_o.xy,_cO);
}
float _cl=_cv(-(255.0/127.0),_dD(_cq(_dE),e,0.0),3.25);
return _cv(_o.x,_cl,_cO.x);
}
float _dH(_cp(_ds),_cp(_dE),_b7 _cO,float _dA){
_b7 e=_b7(0.0,1.0);
_cH(_bK,
_cO.x<_dA&&
e.g>0.8281&&
e.r==0.0)
e=_cg(_ds,_cO).rg;
_cO=_cv(_b7(2.0,0.0),_o.xy,_cO);
}
float _cl=_cv(-(255.0/127.0),_dD(_cq(_dE),e,0.5),3.25);
return _cv(-_o.x,_cl,_cO.x);
}
float _dI(_cp(_ds),_cp(_dE),_b7 _cO,float _dA){
_b7 e=_b7(1.0,0.0);
_cH(_bK,
_cO.y>_dA&&
e.r>0.8281&&
e.g==0.0)
e=_cg(_ds,_cO).rg;
_cO=_cv(-_b7(0.0,2.0),_o.xy,_cO);
}
float _cl=_cv(-(255.0/127.0),_dD(_cq(_dE),e.gr,0.0),3.25);
return _cv(_o.y,_cl,_cO.y);
}
float _dJ(_cp(_ds),_cp(_dE),_b7 _cO,float _dA){
_b7 e=_b7(1.0,0.0);
_cH(_bK,
_cO.y<_dA&&
e.r>0.8281&&
e.g==0.0)
e=_cg(_ds,_cO).rg;
_cO=_cv(_b7(0.0,2.0),_o.xy,_cO);
}
float _cl=_cv(-(255.0/127.0),_dD(_cq(_dE),e.gr,0.5),3.25);
return _cv(-_o.y,_cl,_cO.y);
}
_b7 _dK(_cp(_dw),_b7 _dx,float e1,float e2,float _cl){
_b7 _cO=_cv(_b7(_b4,_b4),_cF(4.0*_b7(e1,e2)),_dx);
_cO=_cv(_b6,_cO,0.5*_b6);
_cO.y=_cv(_b8,_cl,_cO.y);
return _b0(_cg(_dw,_cO));
}
void _dL(_cp(_ds),inout _b7 _c5,_cy _cO,_b7 d){
#if!defined(_bM)
_b7 _dM=step(d.xy,d.yx);
_b7 _dN=(1.0-_cb)*_dM;
_dN/=_dM.x+_dM.y;
_b7 _dO=_b7(1.0,1.0);
_dO.x-=_dN.x*_ck(_ds,_cO.xy,_cG(0,1)).r;
_dO.x-=_dN.y*_ck(_ds,_cO.zw,_cG(1,1)).r;
_dO.y-=_dN.x*_ck(_ds,_cO.xy,_cG(0,-2)).r;
_dO.y-=_dN.y*_ck(_ds,_cO.zw,_cG(1,-2)).r;
_c5*=_cu(_dO);
#endif
}
void _dP(_cp(_ds),inout _b7 _c5,_cy _cO,_b7 d){
#if!defined(_bM)
_b7 _dM=step(d.xy,d.yx);
_b7 _dN=(1.0-_cb)*_dM;
_dN/=_dM.x+_dM.y;
_b7 _dO=_b7(1.0,1.0);
_dO.x-=_dN.x*_ck(_ds,_cO.xy,_cG(1,0)).g;
_dO.x-=_dN.y*_ck(_ds,_cO.zw,_cG(1,1)).g;
_dO.y-=_dN.x*_ck(_ds,_cO.xy,_cG(-2,0)).g;
_dO.y-=_dN.y*_ck(_ds,_cO.zw,_cG(-2,1)).g;
_c5*=_cu(_dO);
#endif
}
_cy _dQ(_b7 _cO,
_b7 _c1,
_cy _cl[3],
_cp(_ds),
_cp(_dw),
_cp(_dE),
_cy _dz){
_cy _c5=_cy(0.0,0.0,0.0,0.0);
_b7 e=_cm(_ds,_cO).rg;
_cs
if(e.g>0.0){
#if!defined(_bL)
_c5.rg=_dy(_cq(_ds),_cq(_dw),_cO,e,_dz);
_cs
if(_c5.r==-_c5.g){
#endif
_b7 d;
_cx _dB;
_dB.x=_dG(_cq(_ds),_cq(_dE),_cl[0].xy,_cl[2].x);
_dB.y=_cl[1].y;
d.x=_dB.x;
float e1=_cg(_ds,_dB.xy).r;
_dB.z=_dH(_cq(_ds),_cq(_dE),_cl[0].zw,_cl[2].y);
d.y=_dB.z;
d=abs(_cF(_cv(_o.zz,d,-_c1.xx)));
_b7 _dR=sqrt(d);
float e2=_ck(_ds,_dB.zy,_cG(1,0)).r;
_c5.rg=_dK(_cq(_dw),_dR,e1,e2,_dz.y);
_dB.y=_cO.y;
_dL(_cq(_ds),_c5.rg,_dB.xyzy,d);
#if!defined(_bL)
}else
e.r=0.0;
#endif
}
_cs
if(e.r>0.0){
_b7 d;
_cx _dB;
_dB.y=_dI(_cq(_ds),_cq(_dE),_cl[1].xy,_cl[2].z);
_dB.x=_cl[0].x;
d.x=_dB.y;
float e1=_cg(_ds,_dB.xy).g;
_dB.z=_dJ(_cq(_ds),_cq(_dE),_cl[1].zw,_cl[2].w);
d.y=_dB.z;
d=abs(_cF(_cv(_o.ww,d,-_c1.yy)));
_b7 _dR=sqrt(d);
float e2=_ck(_ds,_dB.xz,_cG(0,1)).g;
_c5.ba=_dK(_cq(_dw),_dR,e1,e2,_dz.x);
_dB.x=_cO.x;
_dP(_cq(_ds),_c5.ba,_dB.xyxz,d);
}
return _c5;
}
_cy _E(_b7 _cO,
_cy _cl,
_cp(_c3),
_cp(_dS)
#if _bY
,_cp(_dT)
#endif
){
_cy a;
a.x=_cm(_dS,_cl.xy).a;
a.y=_cm(_dS,_cl.zw).g;
a.wz=_cm(_dS,_cO).xz;
_cs
if(dot(a,_cy(1.0,1.0,1.0,1.0))<=1e-5){
_cy _dU=_cg(_c3,_cO);
#if _bY
_b7 _dV=_b3(_cg(_dT,_cO));
_dU.a=sqrt(5.0*length(_dV));
#endif
return _dU;
}else{
bool h=max(a.x,a.z)>max(a.y,a.w);
_cy _dW=_cy(0.0,a.y,0.0,a.w);
_b7 _dX=a.yw;
_cW(_cE(h,h,h,h),_dW,_cy(a.x,0.0,a.z,0.0));
_cW(_cC(h,h),_dX,a.xz);
_dX/=dot(_dX,_b7(1.0,1.0));
_cy _dY=_cv(_dW,_cy(_o.xy,-_o.xy),_cO.xyxy);
_cy _dU=_dX.x*_cg(_c3,_dY.xy);
_dU+=_dX.y*_cg(_c3,_dY.zw);
#if _bY
_b7 _dV=_dX.x*_b3(_cg(_dT,_dY.xy));
_dV+=_dX.y*_b3(_cg(_dT,_dY.zw));
_dU.a=sqrt(5.0*length(_dV));
#endif
return _dU;
}
}
_cy _dZ(_b7 _cO,
_cp(_d0),
_cp(_d1)
#if _bY
,_cp(_dT)
#endif
){
#if _bY
_b7 _dV=-_b3(_cn(_dT,_cO).rg);
_cy _d2=_cn(_d0,_cO);
_cy _d3=_cn(_d1,_cO+_dV);
float _cU=abs(_d2.a*_d2.a-_d3.a*_d3.a)/5.0;
float _bh=0.5*_cu(1.0-sqrt(_cU)*_bZ);
return _ct(_d2,_d3,_bh);
#else
_cy _d2=_cn(_d0,_cO);
_cy _d3=_cn(_d1,_cO);
return _ct(_d2,_d3,0.5);
#endif
}
#ifdef _d4
void _d5(_cy _9,
_b7 _cO,
out _cy _d6,
out _cy _d7,
_d8(_d9)){
_cz _K=_cz(_9.xy);
_d6=_d4(_d9,_K,0);
_d7=_d4(_d9,_K,1);
}
#endif
#endif
