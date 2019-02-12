#pragma once

#include "graphics_utilities.hpp"

class	Light
{
private:

	static std::vector<glm::vec3> _positions;
	static std::vector<glm::vec3> _colors;

	glm::vec3 _pos;
	glm::vec3 _color;

public:

	const static std::vector<glm::vec3> &positions;
	const static std::vector<glm::vec3> &colors;

	//! creation adds a light to the scene
	Light(glm::vec3 pos, glm::vec3 color);
	//! destruction removes light from the scene
	~Light(void);
};
