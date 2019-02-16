#include <vector>
#include "Light.hpp"

std::vector<glm::vec3> Light::_positions;
std::vector<glm::vec3> Light::_colors;

const std::vector<glm::vec3> &Light::positions = Light::_positions;
const std::vector<glm::vec3> &Light::colors = Light::_colors;


Light::Light(glm::vec3 pos, glm::vec3 color) :
_pos(pos),
_color(color)
{
	_positions.push_back(_pos);
	_colors.push_back(_color);
}

Light::~Light(void)
{
	for (size_t i = 0; i < _positions.size(); i++)
	{
		if (_pos == _positions[i] && _color == _colors[i])
		{
			_positions.erase(_positions.begin() + i);
			_colors.erase(_colors.begin() + i);
			break;
		}
	}
}
