#pragma once

#include "ShadingProgram.hpp"
#include "FreeCamera.hpp"
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

	static bool _init;

	ShadingProgram* _program;

	void _loadArrayBuffers();
	void _makeVAO();

public:
	ShaderObj(const std::string& fragpath);

	void Render(const CameraData& cam_data, const glm::mat4& transform);
};
