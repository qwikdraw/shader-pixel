#version 410 core

in vec3 normal_v;
in vec3 dir_v;
in float dist_v;
in vec2 uv_v;

uniform sampler2D tex;

out vec4 frag_color;

void    main()
{
    float modify = abs(dot(vec3(0.0, 1.0, 0.0), normalize(normal_v)));
    frag_color = vec4(texture(tex, uv_v).rgb * modify, 1.0);
}
