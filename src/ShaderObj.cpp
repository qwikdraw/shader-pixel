#include "ShaderObj.hpp"

GLuint ShaderObj::_camPosID;
GLuint ShaderObj::_transformID;
GLuint ShaderObj::_screenToWorldID;
GLuint ShaderObj::_worldToScreenID;
GLuint ShaderObj::_squareID;
GLuint ShaderObj::_VAO;

bool ShaderObj::_init = false;

// argument is ignored for now... just using hardcoded shader
ShaderObj::ShaderObj(const std::string& fragpath)
{
	_program = new ShadingProgram(_vertexPath, fragpath);
	if (!_init)
	{
		_transformID = glGetUniformLocation(_program->ID(), "transform");
		_camPosID = glGetUniformLocation(_program->ID(), "camPos");
		_screenToWorldID = glGetUniformLocation(_program->ID(), "screenToWorld");
		_worldToScreenID = glGetUniformLocation(_program->ID(), "worldToScreen");
		_loadArrayBuffers();
		_makeVAO();
		_init = true;
	}
}

void ShaderObj::_loadArrayBuffers()
{
	GLfloat square[] = {-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1};
	glGenBuffers(1, &_squareID);
	glBindBuffer(GL_ARRAY_BUFFER, _squareID);
	glBufferData(GL_ARRAY_BUFFER, sizeof(square), square, GL_STATIC_DRAW);
}

void ShaderObj::_makeVAO()
{
	glGenVertexArrays(1, &_VAO);
	glBindVertexArray(_VAO);

	glEnableVertexAttribArray(0);
	glBindBuffer(GL_ARRAY_BUFFER, _squareID);
	glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, 0);

	glBindVertexArray(0);
}

void ShaderObj::Render(const CameraData& cam_data, const glm::mat4& transform)
{
	_program->Use();
	glBindVertexArray(_VAO);
	glUniform3fv(_camPosID, 1, &cam_data.position[0]);

	glm::mat4 screenToWorld = glm::inverse(cam_data.worldToScreen);

	glUniformMatrix4fv(_screenToWorldID, 1, GL_FALSE,
		glm::value_ptr(screenToWorld));
	glUniformMatrix4fv(_worldToScreenID, 1, GL_FALSE,
		glm::value_ptr(cam_data.worldToScreen));

	glm::mat4 inverse_transform = glm::inverse(transform);
	glUniformMatrix4fv(_transformID, 1, GL_FALSE,
		glm::value_ptr(inverse_transform));

	glDrawArrays(GL_TRIANGLES, 0, 6);
}
