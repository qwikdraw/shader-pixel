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
uniform vec3 u_position;

out vec4 color;

#define RAY_STEP 0.035

vec3 o1 = vec3(sin(time * 1.24) * 0.4, sin(time * 0.41) * 0.3, 0);
vec3 o2 = vec3(cos(time) * 0.3);
vec3 o3 = vec3(cos(time) * 0.5, 0, sin(time)) * 0.7;

float rand(vec2 n)
{
	return fract(sin(dot(n, vec2(0.9898, 0.1414))) * 214124.5453);
}

float shape_dist(vec3 p)
{
	return length(p) - 0.2;
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

float shape_intersect(vec3 rp, vec3 rv)
{
	float dist1 = dot(rv, rp);
	float discrim = dist1 * dist1 - dot(rp, rp) + 0.04;

	if (discrim < 0)
		return -1;
	discrim = sqrt(discrim);
	float dist2 = -dist1 - discrim;
	dist1 = -dist1 + discrim;

	float dist = min(dist1, dist2);
	if (dist < 0)
		dist = max(dist1, dist2);
	if (dist < 0)
		return -1;
	return dist;
}

vec4 get_fog(vec3 p, vec3 lightpos)
{
	vec3 v = normalize(lightpos - p);
	vec3 c;
	float d = shape_intersect(p, v);
	float l = length(lightpos - p);
	if (d > 0 && d < l)
		c = vec3(0);
	else
		c = vec3(1);
	c *= 1 / (0.25 * l * l);
	c = c / (0.1 + c);
	return vec4(c, (1 - length(p)));
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
	vec4 fog = vec4(0);
	vec3 lightpos = normalize(lightPos[0] - u_position) * 1.5;
	while (true)
	{
		if (travel_dist < 0)
			break;
		if (shape_dist(rp) < 0.001)
		{
			vec3 shapecol = phong(
				normalize(rp),
				vec3(1, 0, 0),
				rv,
				lightpos - rp,
				vec3(1),
				2);
			color = vec4(mix(shapecol, fog.xyz, fog.w), 1);
			return;
		}
		float mv = RAY_STEP * (1 + 0.7 * rand(rp.xy));
		vec4 fogval = get_fog(rp, lightpos);

		fogval.w *= mv;
		fog = vec4(mix(fog.xyz, fogval.xyz, pow(1 - fog.w, 10)), fog.w + (1 - fog.w) * fogval.w);
		travel_dist -= mv;
		rp += rv * mv;
	}
	color = fog;
}

void main()
{
	shader(ray_tp, normalize(ray_tv));
}
