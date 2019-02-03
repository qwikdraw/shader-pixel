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

	GLuint _cubeID;
	GLuint _VAO;

	ShadingProgram* _program;

	float _total_time;
	GLuint _texID;

	void _loadArrayBuffers();
	void _makeVAO();

	void _render(
		const CameraData& cam_data,
		const glm::mat4& transform);

public:
	ShaderObj(const std::string& fragpath);
	~ShaderObj();

	void Render(
		const CameraData& cam_data,
		const glm::mat4& transform,
		float total_time,
		GLuint texID=0);
};
