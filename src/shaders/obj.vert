#version 410 core

layout (location = 0) in vec3 vertex;
layout (location = 1) in vec2 uv;
layout (location = 2) in vec3 normal;

uniform mat4 worldToScreen;
uniform mat4 transform;
uniform vec3 campos;

out	vec3 normal_v;
out vec3 dir_v;
out float dist_v;
out vec2 uv_v;

void	main()
{
    gl_Position = worldToScreen * transform * vec4(vertex, 1);
    normal_v = normal;
    dir_v = vec3(transform * vec4(vertex, 1)) - campos;
    dist_v = length(dir_v);
    dir_v = normalize(dir_v);
    uv_v = uv;
}
