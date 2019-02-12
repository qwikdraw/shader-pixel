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
const float MARCH_MAX_DIST = 20.0f;
const float EPSILON = 0.0001f;

const vec4 materials[2] = vec4[](
    vec4(0.0), // Null Color
    vec4(0.2, 0.0, 1.0, 1.0) // Deep Purple
);
const float PI = 3.14159;

vec2 fold(vec2 p, float rad){
    vec2 n = vec2(cos(-rad), sin(-rad));
    p -= 2.0 * min(0.0, dot(p,n)) * n;
    return p;
}

vec3 tri_fold(vec3 pt) {
    pt.xy = fold(pt.xy, PI / 6.0 - cos(time * 0.5) / 2.0);
    pt.xy = fold(pt.xy, -PI / 3.0);
    pt.yz = fold(pt.yz, -PI / 6.0 + sin(time * 0.5) / 4.0);
    pt.yz = fold(pt.yz, PI / 3.0);
    return pt;
}

vec3 tri_curve(vec3 pt) {
    for (int i = 0; i < 8; i++) {
        pt *= 2.0;
        pt.x -= 2.6;
        pt = tri_fold(pt);
    }
    return pt;
}

float ifs(vec3 p){
    p = tri_curve(p);
    return (length(p * 0.004) - 0.015);
}

// Distance field representing our scene.
float scene(vec3 p, out int material_id) {
    material_id = 1;
    return ifs(p * 4) / 4;
}


float ray_march(vec3 ro, vec3 rv, out int material_id) {
    float depth = MARCH_MIN_DIST;
    for (int i = 0; i < MARCH_MAX; ++i)
    {
        float min_distance = scene(ro + rv * depth, material_id);
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
    int _;
    return normalize(vec3(
        scene(vec3(p.x + EPSILON, p.y, p.z), _) - scene(vec3(p.x - EPSILON, p.y, p.z), _),
        scene(vec3(p.x, p.y + EPSILON, p.z), _) - scene(vec3(p.x, p.y - EPSILON, p.z), _),
        scene(vec3(p.x, p.y, p.z  + EPSILON), _) - scene(vec3(p.x, p.y, p.z - EPSILON), _)
    ));
}

#endif

float ambient_occulsion(vec3 normal, vec3 pos)
{
    int _;
    float x = 0.0;
    x += 0.1 - scene(pos + normal * 0.1, _);
    x += 0.3 - scene(pos + normal * 0.3, _);
    x += 0.5 - scene(pos + normal * 0.5, _);
    return 1.0 - x;
}

vec3 phong(vec3 normal, vec3 material_color, vec3 cam_dir, vec3 light_normal, vec3 light_color, float light_strength)
{
    float distance = length(light_normal);
    light_normal = normalize(light_normal);

    float diffuse = clamp(dot(normal, light_normal), 0.0, 1.0);

    vec3 reflected_light_dir = normalize(reflect(light_normal, normal));

    float specular = pow(clamp(dot(reflected_light_dir, cam_dir), 0.0, 1.0), 10.0);

    vec3 diffuse_color = material_color * max(diffuse, 0.02);
    vec3 specular_color = light_color * specular;

    distance *= distance;
    return (diffuse_color + specular_color) * light_strength / distance;
}

float soft_shadow(vec3 pos, vec3 light_normal, float softness)
{
    float res = 1.0;
    int _;
    light_normal = normalize(light_normal);
    for (float depth = EPSILON * 2.0; depth < 20.0;)
    {
        float min_distance = scene(pos + light_normal * depth, _);
        if (min_distance < 0.001)
            return 0.02;
        res = min(res, softness * min_distance / depth);
        depth += min_distance;
    }
    return res;
}

void shader(vec3 ro, vec3 rv) {

    int material_id;
    float dist = ray_march(ro, rv, material_id);
    if (dist > MARCH_MAX_DIST - EPSILON)
        discard;
    vec3 pos = ro + rv * dist;

    vec3 normal = get_normal(pos);

    vec4 object_color = materials[material_id];

    vec3 light_normal = vec3(0.0, 5.0, 0.0) - pos; 

    vec3 color = phong(
        normal, // object normal
        object_color.xyz,
        rv, // camera direction
        light_normal, // light normal
        vec3(1.0, 1.0, 0.8), // light Color
        40.0 // Light strength
    );

    color *= ambient_occulsion(normal, pos);
    //color *= soft_shadow(pos, light_normal, 4.0);
    frag_color = vec4(pow(color, vec3(0.4545)), object_color.w);
}

void main()
{
    shader(ray_tp, normalize(ray_tv));
}