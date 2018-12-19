#include "Scene.hpp"

Scene::Scene(const std::string& ground, const std::string& pillar) :
_ground(ground),
_pillar(pillar)
{
}


static int true_mod(int n, int a)
{
    int out = n % a;
    if (out < 0)
        out += a;
    return out;
}

void Scene::Render(const CameraData& cam_data)
{
	glm::ivec2 gridpos = glm::round(
		glm::vec2(cam_data.position.x, cam_data.position.z));

	std::vector<glm::mat4> groundTransforms;
	std::vector<glm::mat4> pillarTransforms;

	for (int x = gridpos.x - 20; x < gridpos.x + 20; x++)
	{
		for (int y = gridpos.y - 20; y < gridpos.y + 20; y++)
		{
			// if its a pillar
			if (true_mod(x, 5) == 0 && true_mod(y, 5) == 0)
			{
				pillarTransforms.push_back(
					glm::translate(glm::mat4(1), glm::vec3(x, 0, y))
				);
			}
			else // its a normal ground block
			{
				groundTransforms.push_back(
					glm::translate(glm::mat4(1), glm::vec3(x, 0, y))
				);
			}
		}
	}
	_ground.Render(cam_data, groundTransforms);
	_pillar.Render(cam_data, pillarTransforms);
}
