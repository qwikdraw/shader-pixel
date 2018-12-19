#version 410 core

layout (location = 0) in vec2 vertex;

uniform mat4 screenToWorld;
uniform mat4 transform;
uniform vec3 camPos;

out vec3 ray_p;
out vec3 ray_v;

void	main()
{
    gl_Position = vec4(vertex, 0, 1);
    ray_p = vec3(transform * vec4(camPos, 1));
    vec4 p = transform * screenToWorld * vec4(vertex, 0, 1);
    p /= p.w;
    ray_v = normalize(vec3(p) - ray_p);
}
