#pragma once

#include "ShadingProgram.hpp"
#include "FreeCamera.hpp"
#include "Light.hpp"
#include "util_inc.hpp"
#include <iostream>

class ShaderObj
{
	static constexpr const char* _vertexPath = "src/shaders/shaderobj.vert";

	static GLuint _camPosID;
	static GLuint _transformID;
	static GLuint _screenToWorldID;
	static GLuint _worldToScreenID;
	static GLuint _squareID;
	static GLuint _VAO;

	static GLuint _lightPosID;
	static GLuint _lightColorID;
	static GLuint _lightNumID;

	static GLuint _timeID;

	static bool _init;

	ShadingProgram* _program;

	void _loadArrayBuffers();
	void _makeVAO();

public:
	ShaderObj(const std::string& fragpath);

	void Render(
		const CameraData& cam_data,
		const glm::mat4& transform,
		float total_time);
};
