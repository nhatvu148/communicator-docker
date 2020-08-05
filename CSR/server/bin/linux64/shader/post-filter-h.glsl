uniform float u_compression;
const vec3 _ek=vec3(.299,.587,.114);
vec4
colorize(in vec4 _el,vec4 _dU){
_el.rgb*=1./_el.a;
return _dU*vec4(vec3(mix(dot(_ek,_el.rgb),1.,u_compression)*_el.a),_el.a);
}
vec4
desaturate(vec4 _el,vec4 _dU){
return vec4(vec3(dot(_ek,_el.rgb)*_dU.a),_el.a*_dU.a);
}
vec4
modulate(vec4 _el,vec4 _dU){
return _el*_dU;
}
vec4
noFilter(vec4 _el,vec4 _dU){
return _el;
}
