#version 410 core

in vec2 uv;
out vec3 color;

uniform sampler2D color_buffer;
uniform sampler2D depth_buffer;
uniform vec2 pixel_size;
uniform float time;

float scale(float x)
{
	return x / (1 + x);
}

vec3 S(float x, float y)
{
	vec3 base = texture(color_buffer, uv + vec2(x, y)).rgb;
	float p_size = 10;
	float grey = (base.r + base.g + base.b) / 3;
	base *= (round(grey * p_size) / p_size) / grey;
	return base;
}

void main(void) {
	vec2 tx = vec2(1.0) / pixel_size;

	float x = tx.x;
	float y = tx.y;
	vec3 y_kern =
		S(-x,  y) * 3 + S(0,  y) * 10 + S(x, y) * 3 -
		S(-x, -y) * 3 - S(0, -y) * 10 - S(x, y) * 3;
	vec3 x_kern =
		S(-x, y) * 3 - S(x, y) * 3 +
		S(-x, 0) * 10 - S(x, 0) * 10 +
		S(-x, -y) * 3 - S(-x, -y) * 3;

	#define CUTOFF 3

	float m;
	vec3 base = S(0, 0);
	vec3 col = vec3(0);

	if ((m = length(vec2(x_kern.x, y_kern.x))) > CUTOFF)
		col += mix(base, vec3(1), scale(m - CUTOFF));
	if ((m = length(vec2(x_kern.y, y_kern.y))) > CUTOFF)
		col += mix(base, vec3(1), scale(m - CUTOFF));
	if ((m = length(vec2(x_kern.z, y_kern.z))) > CUTOFF)
		col += mix(base, vec3(1), scale(m - CUTOFF));
	if (col.x > 0 || col.y < 0 || col.z > 0)
		color = col;
	else
		color = base;
}
