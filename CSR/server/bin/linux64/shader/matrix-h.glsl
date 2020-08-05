mat4
_b()
{
#ifdef TC_INSTANCING
return mat4(
tc_av4_matrix_col1.xyz,0.,
tc_av4_matrix_col2.xyz,0.,
tc_av4_matrix_col3.xyz,0.,
tc_av4_matrix_col1.w,tc_av4_matrix_col2.w,tc_av4_matrix_col3.w,1.);
#elif defined(TC_SINGLE_MATRIX)
return mat4(
tc_um4_model_matrix[0],
tc_um4_model_matrix[1],
tc_um4_model_matrix[2],
tc_um4_model_matrix[3].xyz+tc_uv3_explode_translation,tc_um4_model_matrix[3].w);
#else
int i=(int(tc_af_batch_index)+tc_uiv2_matrix_offsets.x)*3;
vec4 _c=tc_uv4_model_matrices[i];
vec4 _d=tc_uv4_model_matrices[i+1];
vec4 _e=tc_uv4_model_matrices[i+2];
return mat4(
_c.xyz,0.,_d.xyz,0.,_e.xyz,0.,
_c.w+tc_uv3_explode_translation.x,
_d.w+tc_uv3_explode_translation.y,
_e.w+tc_uv3_explode_translation.z,
1.);
#endif
}
mat3
_f()
{
#ifdef TC_INSTANCING
return mat3(
tc_av4_matrix_col1.xyz,
tc_av4_matrix_col2.xyz,
tc_av4_matrix_col3.xyz);
#elif defined(TC_SINGLE_MATRIX)
return tc_um3_normal_matrix;
#else
int i=(int(tc_af_batch_index)+tc_uiv2_matrix_offsets.y)*3;
return mat3(
tc_uv4_model_matrices[i].xyz,
tc_uv4_model_matrices[i+1].xyz,
tc_uv4_model_matrices[i+2].xyz);
#endif
}
mat4
_g(){
mat4 _h=_b();
mat4 _i=tc_um4_view_matrix;
_h[3].xyz=
(_h[3].xyz+_i[3].xyz)
+vec3(_i[0][3],_i[1][3],_i[2][3]);
return mat4(mat3(_i))*_h;
}
