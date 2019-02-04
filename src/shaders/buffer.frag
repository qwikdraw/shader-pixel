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

 float rand(vec2 n) {
	return fract(sin(dot(n, vec2(0.9898, 0.1414))) * 214124.5453);
}

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
	vec2 uv = (intersection.xy + vec2(0.7)) / 1.4;
	float dfs = 2 * max(abs(uv.x - 0.5), abs(uv.y - 0.5));
	float alpha = 1;
	if (dfs > 0.8)
		alpha = 1 - 5 * (dfs - 0.8);
	if (alpha < 0.1 && (sin(time) > length(uv - vec2(0.5))))
		color = vec4(1, 0.1, 0.25, pow(alpha * 5, 1));
	else
		color = vec4(texture(tex, uv).rgb, pow(alpha, 4));
}

void main()
{
	shader(ray_tp, normalize(ray_tv));
}
