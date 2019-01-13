#version 410 core

layout (location = 0) in vec3 vertex;

uniform mat4 worldToScreen;
uniform mat4 screenToWorld;
uniform mat4 transform;
uniform mat4 inverseTransform;
uniform vec3 camPos;

out vec3 ray_tp;
out vec3 ray_tv;

void	main()
{
    vec4 p = transform * vec4(vertex, 1);
    gl_Position = worldToScreen * p;
    p /= p.w;
    vec3 ray_v = vec3(p) - camPos;
    ray_tp = vec3(inverseTransform * vec4(camPos, 1));
    ray_tv = vec3(inverseTransform * vec4(ray_v, 0));
}
