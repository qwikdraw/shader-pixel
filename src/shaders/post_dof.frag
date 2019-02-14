#version 410 core

in vec2 uv;
out vec3 frag_color;

uniform sampler2D color_buffer;
uniform sampler2D depth_buffer;
uniform vec2 pixel_size;

void main(void) {
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

	frag_color = mix(avg, center, 1.0 - pow(depth, 30.0));
}