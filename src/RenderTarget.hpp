#pragma once

#include "util_inc.hpp"

class RenderTarget
{
	GLuint _framebuffer;
	GLuint _texture;
	int _x;
	int _y;
public:
	RenderTarget(int x, int y);
	void Use();
	GLuint TextureID();
};
