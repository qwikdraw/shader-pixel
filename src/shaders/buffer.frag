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

uniform sampler2D tex;

out vec4 color;

void shader(vec3 rp, vec3 rv)
{
	const vec3 normal = vec3(0, 0, 1);
	float denom = dot(rv, normal);
	if (abs(denom) == 0)
	{
		color = vec4(0, 0, 0, 1);
		return;
	}
	denom = dot(-rp, normal) / denom;
	if (denom < 0)
	{
		color = vec4(0, 0, 0, 0);
		return;
	}
	vec3 intersection = rp + denom * rv;
	if (abs(intersection.x) > 0.7 || abs(intersection.y) > 0.7)
	{
		color = vec4(0);
		return;
	}
	color = vec4(texture(tex, (intersection.xy + vec2(0.7)) / 1.4).rgb, 1);
}

void main()
{
	shader(ray_tp, normalize(ray_tv));
}
