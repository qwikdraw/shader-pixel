#pragma once

#include <string>
#include <map>
#include <list>
#include <algorithm>
#include <sys/stat.h>
#include <iostream>
#include "graphics_utilities.hpp"

class ShadingProgram
{
	static std::list<ShadingProgram*> _updateList;
	bool _shouldUpdate;

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

	void _update();

public:
	ShadingProgram(std::string vp, std::string fp, bool update=false);
	~ShadingProgram();
	void Use();
	GLuint Uniform(const std::string&);

	static void UpdateAll();
};
