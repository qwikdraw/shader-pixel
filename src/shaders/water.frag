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

const int MARCH_MAX = 100;
const float MARCH_MIN_DIST = 0.0f;
const float MARCH_MAX_DIST = 256.0f;
const float EPSILON = 0.005f;



float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float perlin(vec2 n) {
    const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
    return mix(mix(random(b), random(b + d.yx), f.x), mix(random(b + d.xy), random(b + d.yy), f.x), f.y);
}

/*
Sphere limited plane with noise for height varience
Looks a lot better with FBM noise but it was too expensive
(or my FBM was bad) so I had to settle for to passes of perlin noise.
*/

float water_surface(vec3 p)
{
    float yd = perlin(p.xz * 40.0 - (time * 0.9)) / 90.0;
    float yd2 = mix(perlin(p.xz * 80.0 - (time * 0.6)) / 120.0, perlin(p.xz * 100.0 - (time * 0.8)) / 180.0, 0.5);

    p.y -= yd + yd2;
    float bound = length(p) - 1.0;
    const vec3 n = vec3(0.0, 1.0, 0.0);
    return max(dot(p, n), bound);
}

// Distance field representing the scene.
float scene(vec3 p) {
    return water_surface(p - vec3(0.0, -0.02, 0.0));
}

float ray_march(vec3 ro, vec3 rv, out int steps) {
    float depth = MARCH_MIN_DIST;
    for (int i = 0; i < MARCH_MAX; ++i)
    {
        float min_distance = scene(ro + rv * depth);
        depth += min_distance;
        if (min_distance < EPSILON || depth >= MARCH_MAX_DIST) {
            steps = i;
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

float ambient_occulsion(vec3 normal, vec3 pos, int steps)
{
    return max((MARCH_MAX - (pow(steps, 1.15))) / MARCH_MAX, 0.1);
}

vec3 phong(vec3 normal, vec3 material_color, vec3 cam_dir, vec3 light_normal, vec3 light_color, float light_strength)
{
    float distance = length(light_normal);
    light_normal = normalize(light_normal);

    float diffuse = clamp(dot(normal, light_normal), 0.0, 1.0);

    vec3 reflected_light_dir = normalize(reflect(light_normal, normal));

    float specular = pow(clamp(dot(reflected_light_dir, cam_dir), 0.0, 1.0), 100.0);

    vec3 diffuse_color = material_color * max(diffuse, 0.02);
    vec3 specular_color = light_color * specular;

    distance *= distance;
    return (diffuse_color + specular_color) * light_strength / distance;
}

vec3 shader(vec3 ro, vec3 rv) {

    int steps;
    float dist = ray_march(ro, rv, steps);
    if (dist > MARCH_MAX_DIST - EPSILON)
        discard;
    vec3 pos = ro + rv * dist;

    vec3 normal = get_normal(pos);

    vec3 object_color = vec3(0.003, 0.15, 0.45);

    vec3 light_normal = vec3(0.0, 5.0, 0.0) - pos; 

    vec3 color = phong(
        normal, // object normal
        object_color,
        rv, // camera direction
        light_normal, // light normal
        vec3(0.03, 0.045, 0.0), // light Color
        30.0 // Light strength
    );

    color *= ambient_occulsion(normal, pos, steps);
    frag_color = vec4(pow(color, vec3(0.454545)), 0.9 - (abs(pos.y) * 10.0));
    return pos;
}

void main()
{
    vec3 intersect = shader(ray_tp, normalize(ray_tv));
    vec4 screenPoint = worldToScreen * transform * vec4(intersect, 1);
    gl_FragDepth = (screenPoint.z / screenPoint.w + 1) / 2;
}