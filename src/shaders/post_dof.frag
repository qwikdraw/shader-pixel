#version 410 core

in vec2 uv;
out vec3 color;

uniform sampler2D color_buffer;
uniform sampler2D depth_buffer;
uniform vec2 pixel_size;
uniform float time;

float rand(vec2 co){
	return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main(void) {
	vec2 tx = vec2(1.0) / pixel_size;

	#define SAMPLE(x,y) texture(color_buffer, uv + vec2(x, y)).rgb

	vec3 center = texture(color_buffer, uv).rgb;
	float x = tx.x;
	float y = tx.y;
	float x2;
	float t = mod(time, 10);
	if (t > 9)
		x2 = (2 + 10 * (10 - t)) * x;
	else if (t > 8)
		x2 = (2 + 10 * (t - 8)) * x;
	else
		x2 = 2 * x;
	float y2 = 2.0 * y;
	vec3 avg = 
		SAMPLE(-x2, y2)  + SAMPLE(-x, y2)     + SAMPLE(0.0, y2)  + SAMPLE(x, y2)      + SAMPLE(x2, y2) +
		SAMPLE(-x2, y)   + SAMPLE(-x, y)      + SAMPLE(0.0, y)   + SAMPLE(x, y)       + SAMPLE(x2, y) + 
		SAMPLE(-x2, 0.0) + SAMPLE(-tx.x, 0.0) + center           + SAMPLE(tx.x, tx.y) + SAMPLE(2.0 * tx.x, tx.y) +
		SAMPLE(-x2, -y)  + SAMPLE(-x, -y)     + SAMPLE(0.0, -y)  + SAMPLE(x, -y)      + SAMPLE(x2, -y) +
		SAMPLE(-x2, -y2) + SAMPLE(-x, -y2)    + SAMPLE(0.0, -y2) + SAMPLE(x, -y2)     + SAMPLE(x2, -y2);
	avg /= 25.0;
	float depth = texture(depth_buffer, uv).r;
	color = mix(avg, center, 1.0 - pow(depth, 20.0));
}