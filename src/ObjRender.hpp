#pragma once

#include "FreeCamera.hpp"
#include "Texture.hpp"
#include "ShadingProgram.hpp"

#include "util_inc.hpp"
#include <string>
#include <vector>

class ObjRender
{
	static constexpr const char* _vertexPath = "src/shaders/obj.vert";
	static constexpr const char* _fragPath = "src/shaders/obj.frag";

	static constexpr const char* _objDir = "assets/objects/";
	static constexpr const char* _matDir = "assets/materials/";
	static constexpr const char* _texDir = "assets/textures/";

	static ShadingProgram* _program;

	// uniforms
	static GLuint _worldToScreenID;
	static GLuint _camPosID;
	static GLuint _texLocID;
	static GLuint _transformID;

	GLuint _texID;
	GLuint _trianglesID;
	GLuint _uvsID;
	GLuint _normalsID;
	GLuint _VAO;

	int _vertexCount;

	void _loadArrayBuffers(
		const std::vector<float>& vertices,
		const std::vector<float>& normals,
		const std::vector<float>& uvs);

	void _makeVAO();

	void _loadTexture(const std::string& filepath);

public:

	static void Init();

	ObjRender(const std::string& filepath);

	// render transforms.size() objects
	void Render(
		const CameraData& cam_data,
		const std::vector<glm::mat4>& transforms);
};
