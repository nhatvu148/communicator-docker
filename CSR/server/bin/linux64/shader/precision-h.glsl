#if __VERSION__>=300||defined(GL_FRAGMENT_PRECISION_HIGH)
#define _e1 1
precision highp float;
precision highp int;
#else
#define _e1 0
precision mediump float;
precision mediump int;
#endif
