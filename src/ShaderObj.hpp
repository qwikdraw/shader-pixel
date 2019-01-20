#pragma once

#include "Transparency.hpp"
#include "ShadingProgram.hpp"
#include "FreeCamera.hpp"
#include "Light.hpp"
#include "util_inc.hpp"
#include <iostream>

class ShaderObj : public Transparency
{
	static constexpr const char* _vertexPath = "src/shaders/shaderobj.vert";

	GLuint _camPosID;
	GLuint _transformID;
	GLuint _inverseTransformID;
	GLuint _screenToWorldID;
	GLuint _worldToScreenID;
	GLuint _cubeID;
	GLuint _VAO;

	GLuint _lightPosID;
	GLuint _lightColorID;
	GLuint _lightNumID;

	GLuint _timeID;

	ShadingProgram* _program;

	float _total_time;

	void _loadArrayBuffers();
	void _makeVAO();

	void _render(
		const CameraData& cam_data,
		const glm::mat4& transform);

public:
	ShaderObj(const std::string& fragpath);

	void Render(
		const CameraData& cam_data,
		const glm::mat4& transform,
		float total_time);
};
