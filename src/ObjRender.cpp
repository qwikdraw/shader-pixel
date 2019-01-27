#include "ObjRender.hpp"

#define TINYOBJLOADER_IMPLEMENTATION
#include "third_party/tiny_obj_loader.h"

#include <iostream>

ShadingProgram* ObjRender::_program = nullptr;

static void
get_mesh_data(
	const std::string& filepath,
	std::vector<float>& vertices,
	std::vector<float>& normals,
	std::vector<float>& uvs,
	std::vector<std::string>& textures,
	const std::string& matdir)
{
	tinyobj::attrib_t attrib;
	std::vector<tinyobj::shape_t> shapes;
	std::vector<tinyobj::material_t> materials;
	std::string warn;
	std::string err;
	bool ret = tinyobj::LoadObj(
		&attrib, &shapes, &materials, &warn, &err,
		filepath.c_str(), matdir.c_str());

	if (!err.empty())
		std::cerr << err << std::endl;

	if (!warn.empty())
		std::cout << warn << std::endl;

	if (!ret)
		exit(1);

	// Loop over shapes
	for (size_t s = 0; s < shapes.size(); s++)
	{
		// Loop over faces(polygon)
		size_t index_offset = 0;
		for (size_t f = 0; f < shapes[s].mesh.num_face_vertices.size(); f++)
		{
			size_t fv = shapes[s].mesh.num_face_vertices[f];
			// Loop over vertices in the face.
			for (size_t v = 0; v < fv; v++)
			{
				// access to vertex
				tinyobj::index_t idx = shapes[s].mesh.indices[index_offset + v];
				vertices.push_back(attrib.vertices[3*idx.vertex_index+0]);
				vertices.push_back(attrib.vertices[3*idx.vertex_index+1]);
				vertices.push_back(attrib.vertices[3*idx.vertex_index+2]);
				normals.push_back(attrib.normals[3*idx.normal_index+0]);
				normals.push_back(attrib.normals[3*idx.normal_index+1]);
				normals.push_back(attrib.normals[3*idx.normal_index+2]);
				uvs.push_back(attrib.texcoords[2*idx.texcoord_index+0]);
				uvs.push_back(attrib.texcoords[2*idx.texcoord_index+1]);
				// only supporting 1 texture atm
				// texindices.push_back(shapes[s].mesh.material_ids[f]);
			}
			index_offset += fv;
		}
	}
	for (auto& mat : materials)
		textures.push_back(mat.diffuse_texname);
}


void ObjRender::Init()
{
	_program = new ShadingProgram(_vertexPath, _fragPath);
}


ObjRender::ObjRender(const std::string& filepath)
{
	std::vector<float> vertices;
	std::vector<float> normals;
	std::vector<float> uvs;
	std::vector<std::string> textures;

	get_mesh_data(_objDir + filepath, vertices,
		normals, uvs, textures, _matDir);

	if (textures.size() != 1)
	{
		std::cerr << filepath << ": only single texture obj files are supported" << std::endl;
		exit(1);
	}
	_vertexCount = vertices.size() / 3;
	_loadArrayBuffers(vertices, normals, uvs);
	_makeVAO();
	_loadTexture(_texDir + textures[0]);
}

ObjRender::~ObjRender()
{
	glDeleteVertexArrays(1, &_VAO);
	glDeleteBuffers(1, &_trianglesID);
	glDeleteBuffers(1, &_uvsID);
	glDeleteBuffers(1, &_normalsID);
}

void
ObjRender::_loadArrayBuffers(
	const std::vector<float>& vertices,
	const std::vector<float>& normals,
	const std::vector<float>& uvs)
{
	glGenBuffers(1, &_trianglesID);
	glGenBuffers(1, &_uvsID);
	glGenBuffers(1, &_normalsID);

	glBindBuffer(GL_ARRAY_BUFFER, _trianglesID);
	glBufferData(GL_ARRAY_BUFFER,
		vertices.size() * sizeof(GLfloat),
		vertices.data(),
		GL_STATIC_DRAW);

	glBindBuffer(GL_ARRAY_BUFFER, _uvsID);
	glBufferData(GL_ARRAY_BUFFER,
		uvs.size() * sizeof(GLfloat),
		uvs.data(),
		GL_STATIC_DRAW);

	glBindBuffer(GL_ARRAY_BUFFER, _normalsID);
	glBufferData(GL_ARRAY_BUFFER,
		normals.size() * sizeof(GLfloat),
		normals.data(),
		GL_STATIC_DRAW);
}


void ObjRender::_makeVAO()
{
	glGenVertexArrays(1, &_VAO);
	glBindVertexArray(_VAO);

	glEnableVertexAttribArray(0);
	glBindBuffer(GL_ARRAY_BUFFER, _trianglesID);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, 0);

	glEnableVertexAttribArray(1);
	glBindBuffer(GL_ARRAY_BUFFER, _uvsID);
	glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 0, 0);

	glEnableVertexAttribArray(2);
	glBindBuffer(GL_ARRAY_BUFFER, _normalsID);
	glVertexAttribPointer(2, 3, GL_FLOAT, GL_FALSE, 0, 0);

	glBindVertexArray(0);
}


void ObjRender::_loadTexture(const std::string& filepath)
{
	Texture tex(filepath);

	glPixelStorei(GL_UNPACK_ALIGNMENT, 4);
	glGenTextures(1, &_texID);
	glBindTexture(GL_TEXTURE_2D, _texID);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_BASE_LEVEL, 0);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAX_LEVEL, 0);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);

	glTexImage2D(
		GL_TEXTURE_2D,
		0,
		GL_RGBA,
		tex.Width(),
		tex.Height(),
		0,
		GL_RGBA,
		GL_UNSIGNED_BYTE,
		tex.Data()
	);
}


void ObjRender::Render(
	const CameraData& cam_data,
	const std::vector<glm::mat4>& transforms)
{
	_program->Update();
	_program->Use();
	glBindTexture(GL_TEXTURE_2D, _texID);
	glActiveTexture(GL_TEXTURE0);
	glUniform1i(_program->Uniform("tex"), 0);

	glBindVertexArray(_VAO);
	glUniform3fv(_program->Uniform("worldToScreen"), 1, &cam_data.position[0]);
	glUniformMatrix4fv(_program->Uniform("worldToScreen"), 1, GL_FALSE,
		glm::value_ptr(cam_data.worldToScreen));


	glEnable(GL_CULL_FACE);
	glFrontFace(GL_CCW);
	glCullFace(GL_BACK);
	for (auto& transform : transforms)
	{
		glUniformMatrix4fv(_program->Uniform("transform"), 1, GL_FALSE,
			glm::value_ptr(transform));
		glDrawArrays(GL_TRIANGLES, 0, _vertexCount);
	}
	glDisable(GL_CULL_FACE);
}
