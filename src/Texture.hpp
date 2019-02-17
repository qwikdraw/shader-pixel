#pragma once

#include <cstring>
#include <vector>
#include <fstream>
#include <iostream>
#include <map>
#include <stdint.h>

class	Texture
{
private:

	struct TextureInfo
	{
		uint8_t* data;
		int width;
		int height;
		int channels;
	};

	static std::map<std::string, TextureInfo> _cache;
	TextureInfo _texture;
	
public:

	//! Only supports png currently
	Texture(std::string filepath);

	unsigned Width(void);
	unsigned Height(void);
	uint8_t* Data(void);
};
