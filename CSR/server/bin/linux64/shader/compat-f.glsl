#if __VERSION__>=300
#define varying in
out vec4 _bc[4];
#define gl_FragColor _bc[0]
#define gl_FragData _bc
#define texture2D texture
#endif
