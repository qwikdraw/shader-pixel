#version 410 core

layout (location = 0) in vec3 vertex;
layout (location = 1) in vec2 uv;
layout (location = 2) in vec3 normal;

uniform mat4 worldToScreen;
uniform mat4 transform;
uniform vec3 campos;

out	vec3 normal_v;
out vec2 uv_v;
out vec3 vertex_v;

void	main()
{
	vec4 v = transform * vec4(vertex, 1);
    gl_Position = worldToScreen * v;
    normal_v = vec3(transform * vec4(normal, 0));
    uv_v = uv;
	vertex_v = vec3(v);
}
