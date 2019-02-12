#pragma once

#include "graphics_utilities.hpp"

class PostProcess;

class RenderTarget
{
	friend class PostProcess;
	GLuint _framebuffer;
	GLuint _texture;
	GLuint _depth;
	int _x;
	int _y;
public:
	RenderTarget(int x, int y);
	~RenderTarget(void);
	GLuint TextureID(void);
	GLuint DepthID(void);
  	void Use();
};
