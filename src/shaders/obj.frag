#version 410 core

in vec3 normal_v;
in vec2 uv_v;
in vec3 vertex_v;

#define MAX_LIGHTS 100
uniform vec3 lightPos[MAX_LIGHTS];
uniform vec3 lightColor[MAX_LIGHTS];
uniform int lightNum;

uniform sampler2D tex;

out vec4 frag_color;

void    main()
{
	vec3 normal = normalize(normal_v);
	vec3 col;
	vec3 lava = vec3(0);
	for (int i = 0; i < lightNum; i++)
	{
		vec3 v = normalize(lightPos[i] - vertex_v);
		col += max(dot(v, normal), 0) * lightColor[i];
	}
	vec3 texcol = texture(tex, uv_v).rgb;
	lava = 5 * vec3(1 - min(2 * length(texcol - vec3(1, 0.65, 0)), 1));
	col = col + lava;
	col = col / (0.3 + col);
	frag_color = vec4(texcol * col, 1.0);
}
