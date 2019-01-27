#pragma once

#include "util_inc.hpp"
#include <string>
#include <map>
#include <sys/stat.h>

class ShadingProgram
{
	std::string _vertexCode;
	std::string _fragmentCode;
	GLuint _program;
	std::string _vertex;
	GLuint _vertexShaderID;
	time_t _vertexModify;
	std::string _fragment;
	GLuint _fragmentShaderID;
	time_t _fragmentModify;

	std::map<std::string, GLuint> _uniforms;

	void _recompileProgram(bool keepVert, bool keepFrag);
	GLuint _compileVertexShader();
	GLuint _compileFragmentShader();
	void _getUniforms();

	std::string _getShaderCode(std::string filepath);
	void _checkCompilation(GLuint, std::string filepath);
	void _checkLinking();

public:
	ShadingProgram(std::string vp, std::string fp);
	~ShadingProgram();
	void Use();
	GLuint Uniform(const std::string&);
	void Update();
};
