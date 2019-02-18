#version 410 core

in vec2 uv;
out vec3 color;

uniform sampler2D color_buffer;
uniform sampler2D depth_buffer;
uniform vec2 pixel_size;
uniform int key_1;
uniform int key_2;
uniform int key_3;

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

void sobel(void)
{
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

void dof(void) {
	vec2 tx = vec2(1.0) / pixel_size;

	float depth = texture(depth_buffer, uv).r;

	#define SAMPLE(x,y) texture(color_buffer, uv + vec2(x, y)).rgb

	vec3 center = texture(color_buffer, uv).rgb;

	float x = tx.x;
	float y = tx.y;
	float x2 = 2.0 * x;
	float y2 = 2.0 * y;
	vec3 avg = 
		SAMPLE(-x2, y2)  + SAMPLE(-x, y2)  + SAMPLE(0.0, y2)  + SAMPLE(x, y2)  + SAMPLE(x2, y2) +
		SAMPLE(-x2, y)   + SAMPLE(-x, y)   + SAMPLE(0.0, y)   + SAMPLE(x, y)   + SAMPLE(x2, y) + 
		SAMPLE(-x2, 0.0) + SAMPLE(-x, 0.0) + center           + SAMPLE(x, 0.0) + SAMPLE(x2, 0.0) +
		SAMPLE(-x2, -y)  + SAMPLE(-x, -y)  + SAMPLE(0.0, -y)  + SAMPLE(x, -y)  + SAMPLE(x2, -y) +
		SAMPLE(-x2, -y2) + SAMPLE(-x, -y2) + SAMPLE(0.0, -y2) + SAMPLE(x, -y2) + SAMPLE(x2, -y2);
	avg /= 25.0;

	color = mix(avg, center, 1.0 - pow(depth, 30.0));
}

void vigentte(void)
{
	vec3 c = texture(color_buffer, uv).rgb;

	vec2 u = uv;

	float aspect = pixel_size.x / pixel_size.y;

	u.x *= aspect;
	u.x -= (aspect - 1.0) / 2.0;
	float x = 1.0 - pow(length(u - 0.5), 2.0) / 2.0;

	c *= x;

	color = c;
}

void main(void) {
	if (key_1 == 1)
		vigentte();
	else if (key_2 == 1)
		dof();
	else if (key_3 == 1)
		sobel();
	else
	color = texture(color_buffer, uv).rgb;
}