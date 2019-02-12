#include "PostProcess.hpp"

const GLfloat PostProcess::_vertexArray[8] = {
	-1.0f, -1.0f,
	+1.0f, -1.0f,
	-1.0f, +1.0f,
	+1.0f, +1.0f,
};

PostProcess::PostProcess(const char* fragPath) : 
_program(ShadingProgram(_vertexPath, fragPath, true))
{

	glGenVertexArrays(1, &_VAO);
	glBindVertexArray(_VAO);

	glGenBuffers(1, &_vertexArrayID);
	glBindBuffer(GL_ARRAY_BUFFER, _vertexArrayID);
	glBufferData(GL_ARRAY_BUFFER,
		sizeof(_vertexArray),
		_vertexArray,
		GL_STATIC_DRAW
	);
	glActiveTexture(GL_TEXTURE0);
	glEnableVertexAttribArray(0);
	glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, 0);

	glBindVertexArray(0);
}

PostProcess::~PostProcess()
{
	glDeleteBuffers(1, &_vertexArrayID);
	glDeleteVertexArrays(1, &_VAO);
}

void PostProcess::Render(GLuint textureID, GLuint depthID, float width, float height, double time)
{
	GLuint err;
	_program.Use();

	// Color buffer
	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, textureID);
	glUniform1i(_program.Uniform("color_buffer"), 0);

	// Depth buffer
	glActiveTexture(GL_TEXTURE0 + 1);
	glBindTexture(GL_TEXTURE_2D, depthID);
	glUniform1i(_program.Uniform("depth_buffer"), 1);

	GLfloat pixel_size[2] = {width, height};
	glUniform2fv(_program.Uniform("pixel_size"), 1, pixel_size);

	glUniform1f(_program.Uniform("time"), time);

	glBindVertexArray(_VAO);
	glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
}

void PostProcess::Render(RenderTarget& post, double time)
{
	Render(post._texture, post._depth, float(post._x), float(post._y), time);
}