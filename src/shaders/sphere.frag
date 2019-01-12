#version 410 core

#define MAX_LIGHTS 100

in vec3 ray_p;
in vec3 ray_v;

uniform mat4 worldToScreen;
uniform mat4 transform;

uniform vec3 lightPos[MAX_LIGHTS];
uniform vec3 lightColor[MAX_LIGHTS];
uniform int lightNum;

uniform float time;

out vec3 color;

// returns intersect
vec3 shader(vec3 rp, vec3 rv)
{
	float dist1 = dot(rv, rp);
	float discrim = dist1 * dist1 - dot(rp, rp) + 1;

	if (discrim < 0)
		discard;
	discrim = sqrt(discrim);
	float dist2 = -dist1 - discrim;
	dist1 = -dist1 + discrim;

	float dist = min(dist1, dist2);
	if (dist < 0)
		dist = max(dist1, dist2);
	if (dist < 0)
		discard;
	vec3 intersect = rp + rv * dist;
	vec3 normal = normalize(intersect);
	vec3 col = vec3(0);

	for (int i = 0; i < lightNum; i++)
	{
		vec3 modify = vec3(0.1, 0.3, 0.7) * time * 0.3;
		col += lightColor[0] * dot(normalize(lightPos[i] - intersect), normal) * modify;
	}
	color = col / (col + vec3(1));

	return intersect;
}

void main()
{
	vec4 screenPoint = worldToScreen * vec4(shader(ray_p, normalize(ray_v)), 1);
	gl_FragDepth = (screenPoint.z / screenPoint.w + 1) / 2;
}
