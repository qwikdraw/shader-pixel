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

// Mandelbox
const float ITERS = 6;
const float SCALE = 2.7f;
const float MR2 = 0.25f;

float sphere(vec3 p) {
	return length(p) - 1.0f;
}

const vec4 scalevec = vec4(SCALE, SCALE, SCALE, abs(SCALE)) / MR2;
const float C1 = abs(SCALE - 1.0), C2 = pow(abs(SCALE), float(1 - ITERS));

float mandelbox(vec3 position){
  vec4 p = vec4(position.xyz, 1.0), p0 = vec4(position.xyz, 1.0);
  for (int i=0; i < ITERS; i++) {
    p.xyz = clamp(p.xyz, -1.0, 1.0) * 2.0 - p.xyz;
    float r2 = dot(p.xyz, p.xyz);
	p.xyzw *= clamp(max(MR2 / r2, MR2), 0.0, 1.0);
    p.xyzw = p * scalevec + p0;
  }
  return (length(p.xyz) - C1) / p.w - C2;
}

// Distance field representing our scene.
float scene(vec3 p) {
	// Scaled mandelbox by 0.1
	return mandelbox(p * 10) / 10;
}

float ray_march(vec3 rp, vec3 rv) {
	float depth = MARCH_MIN_DIST;
	for (int i = 0; i < MARCH_MAX; ++i)
	{
		float min_distance = scene(rp + rv * depth);
		if (min_distance < EPSILON) {
			color = vec4(0.6, 1.0, 0.6, 1.0);
			break;
		}
		depth += min_distance;
		if (depth >= MARCH_MAX_DIST)
		{
			depth = MARCH_MAX_DIST;
			break;
		}
	}
	return depth;
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
	x += 0.1 -  scene(p + normal * 0.1);
	x += 0.3 -  scene(p + normal * 0.3);
	x += 0.5 -  scene(p + normal * 0.5);
	return 1.0 - x;
}

float diffuse(vec3 normal, vec3 ray_dir)
{
	return max(dot(normal, -ray_dir), 0.1);
}

vec3 shader(vec3 rp, vec3 rv) {
	float dist = ray_march(rp, rv);
	if (dist > MARCH_MAX_DIST - EPSILON)
		discard;
	vec3 intersect = rp + rv * dist;
	vec3 normal = get_normal(intersect);

	// Various lighting effects.
	float light = 1.0;
	light *= diffuse(normal, rv);
	light *= ambient_occulsion(normal, intersect);

	color.xyz *= light; // Apply Light coefficent.

	return intersect;
}

void main()
{
	vec3 intersect = shader(ray_tp, normalize(ray_tv));
	//vec4 screenPoint = worldToScreen * transform * vec4(intersect, 1);
	//gl_FragDepth = (screenPoint.z / screenPoint.w + 1) / 2;
}
