#pragma once

#include "FreeCamera.hpp"
#include "Texture.hpp"
#include "ShadingProgram.hpp"
#include "Light.hpp"

#include "graphics_utilities.hpp"
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
	void _render(const CameraData& cam_data);

public:

	static void Init();

	ObjRender(const std::string& filepath);
	~ObjRender();

	// render transforms.size() objects
	void Render(
		const CameraData& cam_data,
		const std::vector<glm::mat4>& transforms);

	// render single object
	void Render(
		const CameraData& cam_data,
		const glm::mat4& transforms);
};
