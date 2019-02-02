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
const float MARCH_MAX_DIST = 30.0f;
const float MARCH_VOLUME_DIST = 30.0f;
const float MARCH_STEP = 0.1f;
const float EPSILON = 0.001f;

const vec4 materials[3] = vec4[](
	vec4(0.0), // Null Color
	vec4(1.0, 1.0, 1.0, 0.4), // Clear glass
	vec4(0.1, 0.1, 1.0, 0.4) // Blue glass
);

// Clear marble
float marble(vec3 p, out int object_id) {
	object_id = 2;
	float dist = length(p) - 1.0;
	return dist;
}

// Distance field representing our scene.
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
		if (object_id != new_object_id)
			break;
	}
    return min(inside_dist, MARCH_MAX_DIST);
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

float ambient_occulsion(vec3 normal, vec3 p)
{
    int _;
    float x = 0.0;
    x += 0.1 - scene(p + normal * 0.1, _);
    x += 0.2 - scene(p + normal * 0.2, _);
    x += 0.3 - scene(p + normal * 0.3, _);
    return 1.0 - x;
}

vec3 phong(vec3 pos, vec3 normal, vec3 material_color, vec3 cam_pos, vec3 light_pos, vec3 light_color)
{
    vec3 light_normal = light_pos - pos;
    float distance = length(light_normal);
    light_normal = normalize(light_normal);

    float diffuse = clamp(dot(normal, light_normal), 0.0, 1.0);

    vec3 reflected_light_dir = normalize(reflect(-light_normal, normal));
    
    vec3 cam_dir = normalize(cam_pos - pos);
    float specular = pow(clamp(dot(reflected_light_dir, cam_dir), 0.0, 1.0), 10.0);

    vec3 diffuse_color = material_color * diffuse;
    vec3 specular_color = light_color * specular;

    distance *= distance;
    return (vec3(0.001) + diffuse_color + specular_color) / distance;  
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
	return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void shader(vec3 ro, vec3 rv) {
    int object_id;
    float dist = ray_march(ro, rv, object_id);
    if (dist > MARCH_MAX_DIST - EPSILON)
        discard;
    vec3 pos = ro + rv * dist;



    vec4 object_color = materials[object_id];
    //float volume_distance = volume_march(pos - rv * ((sin((rv.y * rv.x) * 1000.0) + 1.0) / 1.0), rv, object_id);
    float volume_distance = volume_march(pos - rv * rand(rv.xy), rv, object_id);
    object_color.w *= volume_distance;

    vec3 normal = get_normal(pos);


    vec3 color = phong(
        pos, // hit position
        normal, // object normal
        object_color.xyz,
        ro, // camera position
        vec3(0.0, 1.0, 0.0), // light position
        vec3(1.0, 1.0, 0.8) // light Color
    );

    //vec3 color = object_color.xyz;
    //color *= ambient_occulsion(normal, pos);
    //color *= soft_shadow(pos, vec3(0.0, 1.0, 0.0), 2.0);

    frag_color = vec4(pow(color, vec3(1.0 / 2.2)), object_color.w);
}

void main()
{
    shader(ray_tp, normalize(ray_tv));
}