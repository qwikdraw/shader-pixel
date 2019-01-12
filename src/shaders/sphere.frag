#version 410 core

in vec3 ray_p;
in vec3 ray_v;

uniform mat4 worldToScreen;
uniform mat4 transform;

out vec3 color;

void main()
{
	vec3 vect = normalize(ray_v);
	float dist1 = dot(vect, ray_p);
	float discrim = dist1 * dist1 - dot(ray_p, ray_p) + 1;

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
	vec3 intersect = ray_p + vect * dist;
	vec3 normal = normalize(intersect);
	color = dot(ray_v, -normal) * vec3(1, 1 * clamp(dist / 10, 0, 1), 0.4);

	vec4 screenPoint = worldToScreen * vec4(intersect, 1);
	gl_FragDepth = (screenPoint.z / screenPoint.w + 1) / 2;
}
