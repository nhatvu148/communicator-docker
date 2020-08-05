#version 100
precision highp float;
uniform vec4 u_color_transform[2];
uniform vec4 u_input_transform;
uniform vec3 u_sample_interval;
uniform sampler2D u_image;
varying vec2 _D;
vec4
_8(in vec2 _9)
{
return.25*(
texture2D(u_image,_9+u_sample_interval.xy*vec2(-.25,-.25))
+texture2D(u_image,_9+u_sample_interval.xy*vec2(.25,-.25))
+texture2D(u_image,_9+u_sample_interval.xy*vec2(.25,.25))
+texture2D(u_image,_9+u_sample_interval.xy*vec2(-.25,.25)));
}
void
main()
{
vec2 _9=_D*u_input_transform.zw+u_input_transform.xy;
gl_FragColor.r=dot(vec4(_8(_9).rgb,1),u_color_transform[0]);
gl_FragColor.g=dot(vec4(_8(_9+u_sample_interval.xz).rgb,1),u_color_transform[0]);
gl_FragColor.b=dot(vec4(_8(_9+vec2(2.)*u_sample_interval.xz).rgb,1),u_color_transform[0]);
gl_FragColor.a=dot(vec4(_8(_9+vec2(3.)*u_sample_interval.xz).rgb,1),u_color_transform[0]);
}
