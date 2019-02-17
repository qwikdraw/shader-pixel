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

const int MARCH_MAX = 128;
const float MARCH_MIN_DIST = 0.0f;
const float MARCH_MAX_DIST = 256.0f;
const float EPSILON = 0.001f;

float mandelbulb(vec3 p)
{
    vec3 w = p;
    float m = dot(w,w);
    float dz = 1.0;

    for (int i = 0; i < 4; i++)
    {
        #if 1 // Efficient version using Multiple angles theorem
        /*
        Based on using https://en.wikipedia.org/wiki/List_of_trigonometric_identities#Multiple-angle_formulae
        to remove the expensive trig calls, and algebraic expansion of the pow calls.
        roughly 2x as fast.
        */

        float m2 = m * m;
        float m4 = m2 * m2;
        dz = 8.0 * sqrt(m4 * m2 * m) * dz + 1.0;

        float x = w.x; float x2 = x * x; float x4 = x2 * x2;
        float y = w.y; float y2 = y * y; float y4 = y2 * y2;
        float z = w.z; float z2 = z * z; float z4 = z2 * z2;

        float k3 = x2 + z2;
        float k2 = inversesqrt(k3 * k3 * k3 * k3 * k3 * k3 * k3);
        float k1 = x4 + y4 + z4 - 6.0 * y2 * z2 - 6.0 * x2 * y2 + 2.0 * z2 * x2;
        float k4 = x2 - y2 + z2;

        w.x = p.x +  64.0 * x * y * z * (x2-z2) * k4 * (x4 - 6.0 * x2 * z2 + z4) * k1 * k2;
        w.y = p.y + -16.0 * y2 * k3 * k4 * k4 + k1 * k1;
        w.z = p.z +  -8.0 * y * k4 * (x4 * x4 - 28.0 * x4 * x2 * z2 + 70.0 * x4 * z4 - 28.0 * x2 * z2 * z4 + z4 * z4) * k1 * k2;

        #else // Standard formula for mandelbulb, note the pow and trig.

        dz = 8.0 * pow(sqrt(m), 7.0) * dz + 1.0;

        float r = length(w);
        float b = 8.0 * acos(w.y / r);
        float a = 8.0 * atan(w.x, w.z);
        w = p + pow(r, 8.0) * vec3(sin(b) * sin(a), cos(b), sin(b) * cos(a));
        #endif

        m = dot(w, w);
        if (m > 256.0)
            break;
    }
    return 0.25 * log(m) * sqrt(m) / dz;
}

// Distance field representing the scene.
float scene(vec3 p) {
    return mandelbulb(p * 2.0) / 2.0;
}

float bound_sphere(vec3 ro, vec3 rv)
{
    float dist1 = dot(rv, ro);
    float discrim = dist1 * dist1 - dot(ro, ro) + 1;

    if (discrim < EPSILON)
        return MARCH_MAX_DIST;

    discrim = sqrt(discrim);
    float dist2 = -dist1 - discrim;
    dist1 = -dist1 + discrim;
    float dist = min(dist1, dist2);

    return max(dist, MARCH_MIN_DIST);
}

float ray_march(vec3 ro, vec3 rv, out int steps) {
    float depth = bound_sphere(ro, rv);
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
    float x = 0.0;
    x += 0.1 - scene(pos + normal * 0.1);
    x += 0.2 - scene(pos + normal * 0.2);
    x += 0.3 - scene(pos + normal * 0.3);
    float t = (MARCH_MAX - (pow(steps, 1.4))) / MARCH_MAX;
    return mix(1.0 - x, t, 0.5);
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
    light_normal = normalize(light_normal);
    for (float depth = 0.01; depth < 20.0;)
    {
        float min_distance = scene(pos + light_normal * depth);
        if (min_distance < 0.001)
            return 0.02;
        res = min(res, softness * min_distance / depth);
        depth += min_distance;
    }
    return res;
}

void shader(vec3 ro, vec3 rv) {

    int steps;
    float dist = ray_march(ro, rv, steps);
    if (dist > MARCH_MAX_DIST - EPSILON)
        discard;
    vec3 pos = ro + rv * dist;

    vec3 normal = get_normal(pos);

    vec3 object_color = vec3(0.0, 1.0, (1.0 + sin(steps * 0.2)) / 2.0);

    vec3 light_normal = vec3(0.0, 5.0, 0.0) - pos; 

    vec3 color = phong(
        normal, // object normal
        object_color,
        rv, // camera direction
        light_normal, // light normal
        vec3(1.0, 1.0, 0.8), // light Color
        40.0 // Light strength
    );

    color *= ambient_occulsion(normal, pos, steps);
    color *= soft_shadow(pos, light_normal, 4.0);
    frag_color = vec4(pow(color, vec3(0.454545)), 1.0);
}

void main()
{
    shader(ray_tp, normalize(ray_tv));
}
