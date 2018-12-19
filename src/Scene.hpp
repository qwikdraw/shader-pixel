#pragma once

#include "FreeCamera.hpp"
#include "ObjRender.hpp"

#include "util_inc.hpp"
#include <string>
#include <vector>

class Scene
{
	ObjRender _ground;
	ObjRender _pillar;

public:
	Scene(
		const std::string& ground = "ground.obj",
		const std::string& pillar = "pillar.obj");

	void Render(const CameraData& cam_data);
};
