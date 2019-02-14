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
    vec4 color_sample = texture(tex, uv_v).rgba;
    if ((color_sample.r + color_sample.g) > 1.0 && color_sample.b < 0.4)
        frag_color = color_sample * vec4(1.0, 1.0, modify, 1.0);
    else
        frag_color = color_sample * modify;
}
