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

	float dist = min(dist1, dist2);
	if (dist < 0)
		dist = max(dist1, dist2);
	if (dist < 0)
	{
		color = vec4(0, 0, 0, 0);
		return;
	}
	vec3 intersect = rp + rv * dist;
	vec3 normal = normalize(intersect);
	vec3 col = vec3(0);

	for (int i = 0; i < lightNum; i++)
	{
		vec3 lp = lightPos[i] +
			vec3(5, 9, 21) * sin(time) +
			vec3(-10, 20, -10) * sin(time / 3.2144225);
		col += lightColor[0] * dot(normalize(lp - intersect), normal) *
			normalize(abs(lp));
	}
	color = vec4(col / (col + vec3(1)), 1);
}

void main()
{
	shader(ray_tp, normalize(ray_tv));
}
