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

float rand(float n){return fract(sin(n) * 43758.5453123);}

float rand(vec2 n) {
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(float p){
	float fl = floor(p);
	float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
	vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float time_noise(vec2 n) {
	n.x += time + sin(time * 0.525);
	n.y += time * 0.3 + 0.4 * cos(time * 1.525);
	const vec2 d = vec2(0.0, 1.0);
	vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return 0.8 + 0.3 * sin(time) * mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}


vec3 portal(vec3 rp, vec3 rv)
{
	float smog = 0;
	for (int i = 0; i < 40; i++)
	{
		rp += rv * (0.1 + rand(rp.xy) * 0.1);
		if (rp.y + 1.5 < noise(rp.xz))
		{
			// intersection
			vec2 a2 = rp.xz + vec2(0, 0.01);
			vec2 b2 = rp.xz + vec2(0.01, 0);
			vec3 a3 = vec3(a2.x, noise(a2), a2.y);
			vec3 b3 = vec3(b2.x, noise(b2), b2.y);
			vec3 intersect = vec3(rp.x, noise(rp.xz), rp.z);
			vec3 normal = normalize(cross(intersect - a3, intersect - b3));
			float modify = dot(normal, vec3(0, 0.707, 0.707));

			vec3 basecol = mix(vec3(0.1, 0.2, 0.1), vec3(0.5, 0.5, 0.2), intersect.y);
			float smogmix = smog / 40.0;
			vec3 smogcol = vec3(1, 0.9, 0.9);
		 	return mix(vec3(1.0 - float(i) / 40) * modify * basecol, smogcol, smogmix);
		}
		if (rp.y + 1.5 < time_noise(rp.xz))
			smog += 1.0;
	}
	float smogmix = smog / 40.0;
	vec3 smogcol = vec3(1, 0.9, 0.9);
	return mix(vec3(0, 0, 0), smogcol, smogmix);
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
	vec3 c = portal(intersect, rv);
	float alpha;
	if (dot(-rv, normal) < 0.5)
		alpha = pow(2 * dot(-rv, normal), 7);
	else
		alpha = 1;
	color = vec4(c, alpha);
}

void main()
{
	shader(ray_tp, normalize(ray_tv));
}
