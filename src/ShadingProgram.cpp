#include <fstream>
#include <sstream>
#include "ShadingProgram.hpp"

std::list<ShadingProgram*> ShadingProgram::_updateList;

ShadingProgram::ShadingProgram(std::string vp, std::string fp, bool update)
{
	_shouldUpdate = update;
	_vertex = vp;
	_fragment = fp;
	_program = 0;
	_vertexShaderID = 0;
	_fragmentShaderID = 0;
	_recompileProgram(false, false);
	if (_shouldUpdate)
		_updateList.push_back(this);
}

ShadingProgram::~ShadingProgram()
{
	glDeleteShader(_vertexShaderID);
	glDeleteShader(_fragmentShaderID);
	glDeleteProgram(_program);
	if (_shouldUpdate)
	{
		_updateList.erase(
			std::remove_if(
				_updateList.begin(),
				_updateList.end(),
				[this](ShadingProgram* a){return a == this;}),
			_updateList.end()
		);
	}
}

void ShadingProgram::_recompileProgram(bool keepVert, bool keepFrag)
{
	if (keepVert && keepFrag)
		return;
	std::cout << "program changing" << std::endl;
	if (!keepVert)
	{
		glDeleteShader(_vertexShaderID);
		_vertexShaderID = _compileVertexShader();
	}
	if (!keepFrag)
	{
		glDeleteShader(_fragmentShaderID);
		_fragmentShaderID = _compileFragmentShader();
	}
	glDeleteProgram(_program);
	_program = glCreateProgram();

	glAttachShader(_program, _vertexShaderID);
	glAttachShader(_program, _fragmentShaderID);
	glLinkProgram(_program);
	_checkLinking();
	_getUniforms();
}

GLuint ShadingProgram::_compileVertexShader()
{
	struct stat result;
	if (stat(_vertex.c_str(), &result) == 0)
		_vertexModify = result.st_mtime;

	GLuint shader_id = glCreateShader(GL_VERTEX_SHADER);
	_vertexCode = _getShaderCode(_vertex);
	const GLchar* source = _vertexCode.c_str();
	glShaderSource(shader_id, 1, &source, nullptr);
	glCompileShader(shader_id);
	_checkCompilation(shader_id, _vertex);
	return shader_id;
}

GLuint ShadingProgram::_compileFragmentShader()
{
	struct stat result;
	if (stat(_fragment.c_str(), &result) == 0)
		_fragmentModify = result.st_mtime;

	GLuint shader_id = glCreateShader(GL_FRAGMENT_SHADER);
	_fragmentCode = _getShaderCode(_fragment);
	const GLchar* source = _fragmentCode.c_str();
	glShaderSource(shader_id, 1, &source, nullptr);
	glCompileShader(shader_id);
	_checkCompilation(shader_id, _fragment);
	return shader_id;
}

std::string	ShadingProgram::_getShaderCode(std::string filepath)
{
	std::ifstream fileStream(filepath);

	if (fileStream.fail() || !fileStream.good())
	{
		std::cerr << "Cannot read shader file: " << filepath << std::endl;
	}
	std::stringstream buf;
	buf << fileStream.rdbuf();
	return buf.str();
}

void	ShadingProgram::_checkCompilation(GLuint id, std::string path)
{
	GLint success = 0;
	GLint logsize;

	glGetShaderiv(id, GL_COMPILE_STATUS, &success);
	if (success == GL_FALSE)
	{
		glGetShaderiv(id, GL_INFO_LOG_LENGTH, &logsize);

		char *log = new char[logsize];

		glGetShaderInfoLog(id, logsize, nullptr, log);
		std::cerr << "Error compiling shader" << std::endl
			<< "src: \"" << path << '"' << std::endl
			<< log << std::endl << std::endl;
		delete[] log;
	}
}

void	ShadingProgram::_checkLinking()
{
	GLint success = 0;
	GLint logsize;

	glGetProgramiv(_program, GL_LINK_STATUS, &success);
	if (success == GL_FALSE)
	{
		glGetProgramiv(_program, GL_INFO_LOG_LENGTH, &logsize);

		char *log = new char[logsize];

		glGetProgramInfoLog(_program, logsize, nullptr, log);
		std::cerr << "Error linking shader program:" << std::endl << log << std::endl;
		delete[] log;
	}
}

void ShadingProgram::_getUniforms()
{
	for (auto& p : _uniforms)
		p.second = glGetUniformLocation(_program, p.first.c_str());
}

void ShadingProgram::_update()
{
	bool keepVert = true;
	bool keepFrag = true;

	struct stat stat_v;
	if (stat(_vertex.c_str(), &stat_v) == 0)
		if (stat_v.st_mtime > _vertexModify)
			keepVert = false;

	struct stat stat_f;
	if (stat(_fragment.c_str(), &stat_f) == 0)
		if (stat_f.st_mtime > _fragmentModify)
			keepFrag = false;

	_recompileProgram(keepVert, keepFrag);
}

void	ShadingProgram::Use()
{
	glUseProgram(_program);
}

GLuint	ShadingProgram::Uniform(const std::string& name)
{
	if (_uniforms.count(name) == 0)
		_uniforms[name] = glGetUniformLocation(_program, name.c_str());
	return _uniforms[name];
}

void ShadingProgram::UpdateAll()
{
	for (auto p : _updateList)
		p->_update();
}
