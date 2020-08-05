uniform vec4 tc_uv4_base_color,
tc_uv4_ground_plane;
uniform vec3 tc_uv3_emissive_color,
tc_uv3_ambient_light_color;
uniform vec2 tc_uv2_reflection_attenuation;
uniform float tc_uf_opacity;
uniform bool tc_ub_flat,
tc_ub_auto_flip,
tc_ub_projection_is_ortho;
#ifdef TC_PHONG
uniform vec2 tc_uv2_specular_mix_and_gloss;
#elif defined(TC_METALLIC_ROUGHNESS)
uniform vec2 tc_uv2_metallic_roughness;
#ifdef TC_METALLIC_ROUGHNESS_MAP
uniform sampler2D tc_us2_metallic_roughness_map;
#endif
#endif
#ifdef TC_TEXTURE
uniform sampler2D tc_us2_texture;
#define TC_DECAL 1
#define TC_REPEAT 2
#endif
#ifdef TC_SPHERE_MAP
uniform float tc_uf_mirror;
uniform sampler2D tc_us2_sphere_map;
#endif
#if TC_LIGHT_COUNT>0
uniform vec3 tc_uv3_light_position[TC_LIGHT_COUNT],
tc_uv3_light_color[TC_LIGHT_COUNT];
uniform float tc_uf_light_mix;
#endif
#if TC_SHADOW_LIGHT_COUNT>0
uniform sampler2D tc_us2_light_depth_map[TC_SHADOW_LIGHT_COUNT];
#endif
#ifdef TC_CUTTING_PLANES
uniform int tc_ui_cutting_sections;
uniform vec4 tc_uv4_cutting_planes[TC_MAX_CUTTING_SECTIONS*TC_MAX_CUTTING_PLANES_PER_SECTION];
#endif
#ifdef TC_LINE_PATTERN
uniform sampler2D tc_us2_line_pattern;
#endif
#ifdef TC_NORMAL_MAP
uniform sampler2D tc_us2_normal_map;
#endif
#ifdef TC_EMISSIVE_MAP
uniform sampler2D tc_us2_emissive_map;
#endif
