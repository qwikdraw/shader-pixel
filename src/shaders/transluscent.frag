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

out vec4 frag_color;

const int MARCH_MAX = 255;
const float MARCH_MIN_DIST = 0.0f;
const float MARCH_MAX_DIST = 10.0f;
const float MARCH_VOLUME_DIST = 30.0f;
const float MARCH_STEP = 0.05f;
const float EPSILON = 0.001f;

// For volumetic objects, the w term is the density.
const vec4 materials[4] = vec4[](
	vec4(0.0), // Null Color
	vec4(1.0, 1.0, 1.0, 0.7), // Clear glass
	vec4(0.3, 0.8, 0.4, 8.0), // Blue glass
    vec4(0.3, 0.8, 0.4, 0.4) // Red glass
);

// Clear marble
float marble(vec3 p, out int object_id) {
	object_id = 2;
    float torus_bound = length(vec2(length(p.xz) - 0.6, p.y)) - 0.2;
    vec3 q = mod(p, vec3(.1, .1, .1)) - 0.5 * vec3(.1, .1, .1);
    return max(torus_bound, length(q) - 0.03);
}

// Distance field representing the scene.
float scene(vec3 p, out int object_id) {
    return marble(p, object_id);
}

// Returns depth traveled inside object.
float volume_march(vec3 pos, vec3 rv, int object_id) {
	float inside_dist = 0.0f;
	int new_object_id;
	for (float depth = 0.0f; depth < MARCH_MAX_DIST;depth += MARCH_STEP)
	{
		float dist = scene(pos + rv * depth, new_object_id);
		if (dist <= 0.0) {
			inside_dist += MARCH_STEP;
		}
	}
    return inside_dist;
}

float ray_march(vec3 ro, vec3 rv, out int object_id) {
    float depth = MARCH_MIN_DIST;
    for (int i = 0; i < MARCH_MAX; ++i)
    {
        float min_distance = scene(ro + rv * depth, object_id);
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
    int _;
    float ref = scene(p, _);
    return normalize(vec3(
        scene(vec3(p.x + EPSILON, p.y, p.z), _) - ref,
        scene(vec3(p.x, p.y + EPSILON, p.z), _) - ref,
        scene(vec3(p.x, p.y, p.z + EPSILON), _) - ref
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

float ambient_occulsion(vec3 normal, vec3 pos)
{
    int _;
    float x = 0.0;
    x += 0.1 - scene(pos + normal * 0.1, _);
    x += 0.2 - scene(pos + normal * 0.2, _);
    x += 0.3 - scene(pos + normal * 0.3, _);
    return 1.0 - x;
}

vec3 phong(vec3 normal, vec3 material_color, vec3 cam_dir, vec3 light_normal, vec3 light_color, float light_strength)
{
    float distance = length(light_normal);
    light_normal = normalize(light_normal);

    float diffuse = clamp(dot(normal, light_normal), 0.0, 1.0);

    vec3 reflected_light_dir = normalize(reflect(light_normal, normal));
    
    float specular = pow(clamp(dot(reflected_light_dir, cam_dir), 0.0, 1.0), 10.0);

    vec3 diffuse_color = material_color * max(diffuse, 0.05);
    vec3 specular_color = light_color * specular;

    distance *= distance;
    return (diffuse_color + specular_color) * light_strength / distance;  
}

float soft_shadow(vec3 pos, vec3 light_normal, float softness)
{
    float res = 1.0;
    int _;
    for (float depth = 0.01; depth < 20;)
    {
        float min_distance = scene(pos + light_normal * depth, _);
        if (min_distance < 0.001)
            return 0.0;
        res = min(res, softness * min_distance / depth);
        depth += min_distance;
    }
    return res;
}

float rand(vec2 co) {
	return fract(sin(dot(co, vec2(77.9898,78.233))) * 43758.5453);
}

void shader(vec3 ro, vec3 rv) {
    int object_id;
    float dist = ray_march(ro, rv, object_id);
    if (dist > MARCH_MAX_DIST - EPSILON)
        discard;
    vec3 pos = ro + rv * dist;

    vec3 normal = get_normal(pos);

    float jitter = rand(rv.xy);

    vec4 object_color = materials[object_id];
    float volume_distance = volume_march(pos - rv * jitter, rv, object_id);
    object_color.w = pow(2.718, volume_distance * object_color.w) - 1.0;

    vec3 light_normal = vec3(0.0, 5.0, 0.0) - pos; 

    vec3 color = phong(
        normal, // object normal
        object_color.xyz,
        rv, // camera direction
        light_normal, // light position
        vec3(1.0, 1.0, 0.8), // light Color
        100.0 // Light strength
    );

    //color *= ambient_occulsion(normal, pos);
    //color *= soft_shadow(pos, light_normal, 4.0);

    frag_color = vec4(pow(color, vec3(1.0 / 2.2)), object_color.w);
}

void main()
{
    shader(ray_tp, normalize(ray_tv));
}