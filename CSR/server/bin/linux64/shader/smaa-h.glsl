#if __VERSION__>=300
#define _ce
#else
#define _cd
#endif
#if defined(SMAA_ALPHA_EDGES)
#define _c2 1
#else
#define _c2 0
#endif
#if defined(SMAA_PRESET_ULTRA)
#define _bR
#elif defined(SMAA_PRESET_HIGH)
#define _bO
#elif defined(SMAA_PRESET_MEDIUM)
#define _bN
#elif defined(SMAA_PRESET_LOW)
#define _bI
#endif
#define _b0(_bg) _bg.ra
#include "smaa.glsl"
