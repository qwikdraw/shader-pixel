#version 410 core

in vec3 normal_v;
in vec3 dir_v;
in float dist_v;
in vec2 uv_v;

uniform sampler2D tex;

out vec3 color;

void	main()
{
	float modify = max(dot(normalize(normal_v), dir_v), 0.07);
	modify /= max(dist_v, 10.0);
	modify = (modify / (modify + 0.02));
	color = texture(tex, uv_v).rgb * modify;
}
