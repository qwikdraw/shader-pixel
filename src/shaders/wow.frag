#version 410 core

#define MAX_LIGHTS 100

in vec3 ray_tp;
in vec3 ray_tv;

uniform mat4 worldToScreen;
uniform mat4 transform;

uniform vec3 lightPos[MAX_LIGHTS];
uniform vec3 lightColor[MAX_LIGHTS];
uniform int lightNum;
uniform vec3 u_position;

uniform float time;

out vec4 color;

#define RAY_STEP 0.02

vec3 o1 = vec3(sin(time * 1.24) * 0.4, sin(time * 0.41) * 0.3, 0);
vec3 o2 = vec3(cos(time) * 0.3);
vec3 o3 = vec3(cos(time) * 0.5, 0, sin(time)) * 0.7;

float rand(vec2 n)
{
	return fract(sin(dot(n, vec2(0.9898, 0.1414))) * 214124.5453);
}

float metaval(vec3 p)
{
	return 1 / dot(p, p);
}

bool metasurface(vec3 p)
{
	vec3 p1 = p - o1;
	vec3 p2 = p - o2;
	vec3 p3 = p - o3;

	return metaval(p1) + metaval(p2) + metaval(p3) > 29 + sin(time * 1.234) * 4;
}

vec3 metanormal(vec3 p)
{
	vec3 p1 = p - o1;
	vec3 p2 = p - o2;
	vec3 p3 = p - o3;

	return normalize(
		normalize(p1) * metaval(p1) +
		normalize(p2) * metaval(p2) +
		normalize(p3) * metaval(p3));
}

vec3 metacol(vec3 p)
{
	vec3 p1 = p - o1;
	vec3 p2 = p - o2;
	vec3 p3 = p - o3;

	vec3 mv = vec3(metaval(p1), metaval(p2), metaval(p3));
	float sum = mv.x + mv.y + mv.z;
	vec3 raw_c = mv / sum;

	return raw_c / (raw_c + sum * 0.003);
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

mat3 rmatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
}

void shader(vec3 rp, vec3 rv)
{
	float dist1 = dot(rv, rp);
	float discrim = dist1 * dist1 - dot(rp, rp) + 1;

	if (discrim < 0)
	{
		color = vec4(0, 0, 0, 0);
		return;
	}
	discrim = sqrt(discrim);
	float dist2 = -dist1 - discrim;
	dist1 = -dist1 + discrim;

	float d = max(min(dist1, dist2), 0);
	float tmp = max(dist1, dist2);
	if (tmp < 0)
	{
		color = vec4(0, 0, 0, 0);
		return;
	}
	float travel_dist = tmp - d;
	rp = rp + rv * d;
	while (true)
	{
		if (travel_dist < 0)
			break;
		if (metasurface(rp))
		{
			vec3 mcol = metacol(rp);
			vec3 norm = metanormal(rp);
			color = vec4(phong(norm, mcol, rv, normalize(lightPos[0] - u_position), vec3(1), 0.9), 1);
			return;
		}
		float mv = RAY_STEP * (1 + 0.7 * rand(rp.xy));
		travel_dist -= mv;
		rp += rv * mv;
	}
}

void main()
{
	shader(ray_tp, normalize(ray_tv));
}
