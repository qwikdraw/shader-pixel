#version 410 core

in vec3 ray_p;
in vec3 ray_v;

out vec3 color;

void main()
{
	vec3 vect = normalize(ray_v);
	float dist1 = dot(vect, ray_p);
	float discrim = dist1 * dist1 - dot(ray_p, ray_p) + 1;

	if (discrim < 0)
		discard;
	else
		color = vec3(1, 1, 0.4);
	//discrim = sqrt(discrim);
	//float dist2 = -dist1 - discrim;
	//dist1 = -dist1 + discrim;

}
