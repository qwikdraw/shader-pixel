#include "ShaderObj.hpp"

GLuint ShaderObj::_camPosID;
GLuint ShaderObj::_transformID;
GLuint ShaderObj::_inverseTransformID;
GLuint ShaderObj::_screenToWorldID;
GLuint ShaderObj::_worldToScreenID;
GLuint ShaderObj::_cubeID;
GLuint ShaderObj::_VAO;

GLuint ShaderObj::_lightPosID;
GLuint ShaderObj::_lightColorID;
GLuint ShaderObj::_lightNumID;

GLuint ShaderObj::_timeID;

bool ShaderObj::_init = false;

// argument is ignored for now... just using hardcoded shader
ShaderObj::ShaderObj(const std::string& fragpath)
{
	_program = new ShadingProgram(_vertexPath, fragpath);
	if (!_init)
	{
		_transformID = glGetUniformLocation(_program->ID(), "transform");
		_inverseTransformID = glGetUniformLocation(_program->ID(), "inverseTransform");
		_camPosID = glGetUniformLocation(_program->ID(), "camPos");
		_screenToWorldID = glGetUniformLocation(_program->ID(), "screenToWorld");
		_worldToScreenID = glGetUniformLocation(_program->ID(), "worldToScreen");
		_lightPosID = glGetUniformLocation(_program->ID(), "lightPos");
		_lightColorID = glGetUniformLocation(_program->ID(), "lightColor");
		_lightNumID = glGetUniformLocation(_program->ID(), "lightNum");
		_timeID = glGetUniformLocation(_program->ID(), "time");
		_loadArrayBuffers();
		_makeVAO();
		_init = true;
	}
}

void ShaderObj::_loadArrayBuffers()
{
	const GLfloat cube[] = {
		//back
		-1.0f,  1.0f, -1.0f,
		-1.0f, -1.0f, -1.0f,
		+1.0f, -1.0f, -1.0f,
		+1.0f, -1.0f, -1.0f,
		+1.0f, +1.0f, -1.0f,
		-1.0f, +1.0f, -1.0f,

		//left
		-1.0f, -1.0f, +1.0f,
		-1.0f, -1.0f, -1.0f,
		-1.0f, +1.0f, -1.0f,
		-1.0f, +1.0f, -1.0f,
		-1.0f, +1.0f, +1.0f,
		-1.0f, -1.0f, +1.0f,

		//right
		+1.0f, -1.0f, -1.0f,
		+1.0f, -1.0f, +1.0f,
		+1.0f, +1.0f, +1.0f,
		+1.0f, +1.0f, +1.0f,
		+1.0f, +1.0f, -1.0f,
		+1.0f, -1.0f, -1.0f,

		//front
		-1.0f, -1.0f, +1.0f,
		-1.0f, +1.0f, +1.0f,
		+1.0f, +1.0f, +1.0f,
		+1.0f, +1.0f, +1.0f,
		+1.0f, -1.0f, +1.0f,
		-1.0f, -1.0f, +1.0f,

		//top
		-1.0f,  1.0f, -1.0f,
		+1.0f,  1.0f, -1.0f,
		+1.0f,  1.0f, +1.0f,
		+1.0f,  1.0f, +1.0f,
		-1.0f,  1.0f, +1.0f,
		-1.0f,  1.0f, -1.0f,

		//bot
		-1.0f, -1.0f, -1.0f,
		-1.0f, -1.0f, +1.0f,
		+1.0f, -1.0f, -1.0f,
		+1.0f, -1.0f, -1.0f,
		-1.0f, -1.0f, +1.0f,
		+1.0f, -1.0f, +1.0f
	};
	glGenBuffers(1, &_cubeID);
	glBindBuffer(GL_ARRAY_BUFFER, _cubeID);
	glBufferData(GL_ARRAY_BUFFER, sizeof(cube), cube, GL_STATIC_DRAW);
}

void ShaderObj::_makeVAO()
{
	glGenVertexArrays(1, &_VAO);
	glBindVertexArray(_VAO);

	glEnableVertexAttribArray(0);
	glBindBuffer(GL_ARRAY_BUFFER, _cubeID);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, 0);

	glBindVertexArray(0);
}

void ShaderObj::Render(
	const CameraData& cam_data,
	const glm::mat4& transform,
	float total_time)
{
	_program->Use();
	glBindVertexArray(_VAO);

	int size = Light::positions.size();
	size = std::min(size, 99);
	if (size)
	{
		glUniform3fv(_lightPosID,
			size,
			reinterpret_cast<const GLfloat*>(&(Light::positions[0].x)));
		glUniform3fv(_lightColorID,
			size,
			reinterpret_cast<const GLfloat*>(&(Light::colors[0].x)));
	}
	glUniform1i(_lightNumID, size);

	glUniform1f(_timeID, total_time);

	glUniform3fv(_camPosID, 1, &cam_data.position[0]);

	glm::mat4 screenToWorld = glm::inverse(cam_data.worldToScreen);

	glUniformMatrix4fv(_screenToWorldID, 1, GL_FALSE,
		glm::value_ptr(screenToWorld));
	glUniformMatrix4fv(_worldToScreenID, 1, GL_FALSE,
		glm::value_ptr(cam_data.worldToScreen));

	glm::mat4 inverse_transform = glm::inverse(transform);
	glUniformMatrix4fv(_inverseTransformID, 1, GL_FALSE,
		glm::value_ptr(inverse_transform));
	glUniformMatrix4fv(_transformID, 1, GL_FALSE,
		glm::value_ptr(transform));

	glEnable(GL_CULL_FACE);
	glFrontFace(GL_CCW);
	glCullFace(GL_BACK);
	glEnable(GL_BLEND);
	glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

	glDrawArrays(GL_TRIANGLES, 0, 36);
	glDisable(GL_CULL_FACE);
	glDisable(GL_BLEND);
}
