#pragma once

#include "FreeCamera.hpp"
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

// a parent class for transparent objects
class Transparency
{
	struct WorldData
	{
		CameraData cam_data;
		glm::mat4 transform;
		Transparency* instance;
	};
	static std::vector<WorldData> _renderList;

protected:
	// method to be implemented by children
	virtual void _render(
		const CameraData& cam_data,
		const glm::mat4& transform) = 0;

	// children must call this method to be added to _renderList
	void _addRender(const CameraData&, const glm::mat4& transform);

public:
	// renders objects sorted based on distance from camera
	static void RenderAll();

	// removes dangling pointers from _renderList
	virtual ~Transparency();
};
