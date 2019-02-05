#version 410 core

in vec3 normal_v;
in vec3 dir_v;
in float dist_v;
in vec2 uv_v;

uniform sampler2D tex;

out vec3 color;

void	main()
{
    float modify = abs(dot(normalize(dir_v), normalize(normal_v)));
    color = texture(tex, uv_v).rgb * modify;
}
