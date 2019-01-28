#version 410 core

#define MAX_LIGHTS 100

in vec3 ray_tp;
in vec3 ray_tv;

uniform mat4 worldToScreen;
uniform mat4 transform;

uniform vec3 lightPos[MAX_LIGHTS];
uniform vec3 lightColor[MAX_LIGHTS];
uniform int lightNum;

uniform float time;

out vec4 color;

const int MARCH_MAX = 255;
const float MARCH_MIN_DIST = 0.0f;
const float MARCH_MAX_DIST = 50.0f;
const float EPSILON = 0.001f;

float mandelbulb(vec3 p)
{
    vec3 w = p;
    float m = dot(w,w);

    //vec4 trap = vec4(abs(w),m);
	float dz = 1.0;
    
    
	for(int i=0; i < 4; i++ )
    {
        float m2 = m*m;
        float m4 = m2*m2;
		dz = 8.0 * sqrt(m4 * m2 * m) * dz + 1.0;

        float x = w.x; float x2 = x*x; float x4 = x2*x2;
        float y = w.y; float y2 = y*y; float y4 = y2*y2;
        float z = w.z; float z2 = z*z; float z4 = z2*z2;

        float k3 = x2 + z2;
        float k2 = inversesqrt(k3 * k3 * k3 * k3 * k3 * k3 * k3);
        float k1 = x4 + y4 + z4 - 6.0 * y2 * z2 - 6.0 * x2 * y2 + 2.0 * z2 * x2;
        float k4 = x2 - y2 + z2;

        w.x = p.x +  64.0 * x * y * z * (x2-z2) * k4 * (x4 - 6.0 * x2 * z2 + z4) * k1 * k2;
        w.y = p.y + -16.0 * y2 * k3 * k4 * k4 + k1 * k1;
        w.z = p.z +  -8.0 * y * k4 * (x4 * x4 - 28.0 * x4 * x2 * z2 + 70.0 * x4 * z4 - 28.0 * x2 * z2 * z4 + z4 * z4) * k1 * k2;
        //trap = min(trap, vec4(abs(w), m));

        m = dot(w,w);
		if (m > 256.0)
            break;
    }

    return 0.25 * log(m) * sqrt(m) / dz;
}

float scene(vec3 p) {
	// Scaled mandelbox by 0.1
	return mandelbulb(p * 2.0) / 2.0;
}


float ray_march(vec3 rp, vec3 rv) {
	float depth = MARCH_MIN_DIST;
	for (int i = 0; i < MARCH_MAX; ++i)
	{
		float min_distance = scene(rp + rv * depth);
		depth += min_distance;
		if (min_distance < EPSILON || depth >= MARCH_MAX_DIST) {
			break;
		}
	}
	return min(depth, MARCH_MAX_DIST);
}

/* Lighting */

// 1 for less accurate but faster normal, 0 for accurate but slower version.

#if 1

vec3 get_normal(vec3 p) {
	float ref = scene(p);
	return normalize(vec3(
		scene(vec3(p.x + EPSILON, p.y, p.z)) - ref,
		scene(vec3(p.x, p.y + EPSILON, p.z)) - ref,
		scene(vec3(p.x, p.y, p.z + EPSILON)) - ref
	));
}

#else

vec3 get_normal(vec3 p) {
    return normalize(vec3(
        scene(vec3(p.x + EPSILON, p.y, p.z)) - scene(vec3(p.x - EPSILON, p.y, p.z)),
        scene(vec3(p.x, p.y + EPSILON, p.z)) - scene(vec3(p.x, p.y - EPSILON, p.z)),
        scene(vec3(p.x, p.y, p.z  + EPSILON)) - scene(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

#endif

float ambient_occulsion(vec3 normal, vec3 p)
{
	float x = 0.0;
	x += 0.1 - scene(p + normal * 0.1);
	x += 0.3 - scene(p + normal * 0.3);
	x += 0.5 - scene(p + normal * 0.5);
	return 1.0 - x;
}

float diffuse(vec3 normal, vec3 ray_dir)
{
	return dot(normal, -ray_dir);
}

float soft_shadow(vec3 intersect, vec3 light_normal, float softness)
{
    float res = 1.0;
    for (float depth = MARCH_MIN_DIST; depth < 20;)
    {
        float min_distance = scene(intersect + light_normal * depth);
        if (min_distance < 0.001)
            return 0.0;
        res = min(res, softness * min_distance / depth);
        depth += min_distance;
    }
    return res;
}

vec3 shader(vec3 rp, vec3 rv) {
	float dist = ray_march(rp, rv);
	if (dist > MARCH_MAX_DIST - EPSILON)
		discard;
	vec3 intersect = rp + rv * dist;
	vec3 normal = get_normal(intersect);

	vec3 c = vec3(1.0);

	c *= max(diffuse(normal, rv), 0.2);
	//c *= ambient_occulsion(normal, intersect);
	c *= soft_shadow(intersect, vec3(0.0, 1.0, 0.0), 2.0);

	color = vec4(c, 1.0);

	return intersect;
}

void main()
{
	vec3 intersect = shader(ray_tp, normalize(ray_tv));
	//vec4 screenPoint = worldToScreen * transform * vec4(intersect, 1);
	//gl_FragDepth = (screenPoint.z / screenPoint.w + 1) / 2;
}
