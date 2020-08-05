
attribute vec4 tc_av4_vertex,
tc_av4_base_color;
attribute vec3 tc_av3_normal;
attribute vec2 tc_av2_texture_coords;
attribute float tc_af_line_pattern_offset;
#ifdef TC_INSTANCING
attribute vec4 tc_av4_matrix_col1,
tc_av4_matrix_col2,
tc_av4_matrix_col3;
#else
attribute float tc_af_batch_index;
#endif
