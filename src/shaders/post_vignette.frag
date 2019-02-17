#version 410 core

in vec2 uv;
out vec3 color;

uniform sampler2D color_buffer;
uniform sampler2D depth_buffer;
uniform vec2 pixel_size;

void main(void) {
	vec3 c = texture(color_buffer, uv).rgb;

	vec2 u = uv;

	float aspect = pixel_size.x / pixel_size.y;

	u.x *= aspect;
	u.x -= (aspect - 1.0) / 2.0;
	float x = 1.0 - pow(length(u - 0.5), 2.0) / 2.0;

	c *= x;

	color = c;
}