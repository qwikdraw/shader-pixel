#pragma once

#include <string>
#include <vector>

#include "FreeCamera.hpp"
#include "Texture.hpp"
#include "ShadingProgram.hpp"
#include "RenderTarget.hpp"

#include "graphics_utilities.hpp"

class PostProcess
{
	static constexpr const char* _vertexPath = "src/shaders/post.vert";
	static const GLfloat _vertexArray[8];

	ShadingProgram _program;
	GLuint _vertexArrayID;
	GLuint _VAO;

public:
	PostProcess(const char* fragPath);
	~PostProcess();

	void Render(GLuint textureID, GLuint depthID, float width, float height, double time);
	ShadingProgram& GetProgram();

	void Render(RenderTarget& post, double time);
};
