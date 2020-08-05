uniform mat4 tc_um4_projection_matrix,
tc_um4_view_matrix;
uniform vec3 tc_uv3_explode_translation;
#ifdef TC_POINTS
uniform float tc_uf_point_size;
#ifdef TC_SPLAT_WORLD
uniform float tc_uf_viewport_height;
#endif
#endif
#ifdef TC_TEXTURE_MATRIX
uniform vec3 tc_uv3_texture_matrix_row0,
tc_uv3_texture_matrix_row1;
#endif
#ifndef TC_INSTANCING
#ifdef TC_SINGLE_MATRIX
uniform mat4 tc_um4_model_matrix;
uniform mat3 tc_um3_normal_matrix;
#else
uniform vec4 tc_uv4_model_matrices[TC_BATCH_SIZE*3];
uniform ivec2 tc_uiv2_matrix_offsets;
#endif
#endif
#if TC_SHADOW_LIGHT_COUNT>0
uniform mat4 tc_um4_light_view_projection_matrix[TC_SHADOW_LIGHT_COUNT];
#endif
#ifdef TC_LINE_PATTERN
uniform float tc_uf_line_pattern_inverse_length;
#endif
