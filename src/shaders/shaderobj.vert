#version 410 core

layout (location = 0) in vec2 vertex;

uniform mat4 screenToWorld;
uniform mat4 inverseTransform;
uniform vec3 camPos;

out vec3 ray_tp;
out vec3 ray_tv;

void	main()
{
    gl_Position = vec4(vertex, 0, 1);
    vec4 p = screenToWorld * vec4(vertex, 0, 1);
    p /= p.w;
    vec3 ray_v = vec3(p) - camPos;
    ray_tp = vec3(inverseTransform * vec4(camPos, 1));
    ray_tv = vec3(inverseTransform * vec4(ray_v, 0));
}
