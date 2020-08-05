#ifdef TC_CUTTING_PLANES
bool
_eY(const in vec3 _fo){
vec4 _fp=vec4(_fo,1.);
bool _fq=false;
for(int i=0;i<TC_MAX_CUTTING_SECTIONS;++i){
_fq=_fq||(
i<tc_ui_cutting_sections
&&all(greaterThanEqual(
vec4(
dot(_fp,tc_uv4_cutting_planes[i*4]),
dot(_fp,tc_uv4_cutting_planes[i*4+1]),
dot(_fp,tc_uv4_cutting_planes[i*4+2]),
dot(_fp,tc_uv4_cutting_planes[i*4+3])
),
vec4(0.)
))
);
}
return _fq;
}
#endif
