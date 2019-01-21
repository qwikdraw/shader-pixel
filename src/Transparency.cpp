#include "Transparency.hpp"

std::vector<Transparency::WorldData> Transparency::_renderList;

void Transparency::_addRender(
	const CameraData& cam_data,
	const glm::mat4& transform)
{
	_renderList.push_back(WorldData{cam_data, transform, this});
}

void Transparency::RenderAll()
{
	std::vector<float> depths;
	depths.reserve(_renderList.size());

	for (auto item : _renderList)
	{
		glm::vec4 p(
			item.transform[3][0],
			item.transform[3][1],
			item.transform[3][2],
			1.0f
		);
		glm::vec4 pos = item.cam_data.view * p;
		depths.push_back(pos.z);
	}
	std::vector<size_t> indices(depths.size());
	std::iota(indices.begin(), indices.end(), 0);
	auto cmp = [&depths](size_t i, size_t j)
	{
		return depths[i] < depths[j];
	};
	std::sort(indices.begin(), indices.end(), cmp);

	for (size_t i : indices)
	{
		_renderList[i].instance->_render(
			_renderList[i].cam_data,
			_renderList[i].transform
		);
	}
	_renderList.erase(_renderList.begin(), _renderList.end());
}

Transparency::~Transparency()
{
	_renderList.erase(
		std::remove_if(
			_renderList.begin(),
			_renderList.end(),
			[this](WorldData& a){return a.instance == this;}),
		_renderList.end()
	);
}
