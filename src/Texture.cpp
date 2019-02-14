#include "Texture.hpp"

#define STB_IMAGE_IMPLEMENTATION
#define STBI_NO_HDR
#define STBI_NO_PIC
#define STBI_NO_PSD
#define STBI_NO_TGA
#define STBI_FAILURE_USERMSG // User friendly messages

#include "stb_image.h"

std::map<std::string, Texture::TextureInfo> Texture::_cache;

Texture::Texture(std::string filepath)
{
	if (_cache.count(filepath) != 0)
		_texture = _cache[filepath];
	else
	{
		_texture.data = stbi_load(
			filepath.c_str(),
			&_texture.width,
			&_texture.height,
			&_texture.channels,
			4 // Desired channels, 0 for "use what the file has"
		);

		if (!_texture.data)
		{
			std::cerr << "Failed to load texture: " << stbi_failure_reason() << std::endl;
			return;
		}

		std::vector<uint8_t> temp(_texture.width * 4);
		for (long i = 0; i < _texture.height / 2; i++)
		{
			std::memmove(temp.data(),
				&(_texture.data)[i * _texture.width * 4],
				_texture.width * 4);
			std::memmove(&(_texture.data)[i * _texture.width * 4],
				&(_texture.data)[(_texture.height - i - 1) * _texture.width * 4],
				_texture.width * 4);
			std::memmove(&(_texture.data)[(_texture.height - i - 1) * _texture.width * 4],
				temp.data(),
				_texture.width * 4);
		}

		_cache[filepath] = _texture;
	}
}

unsigned Texture::Width(void)
{
	return _texture.width;
}

unsigned Texture::Height(void)
{
	return _texture.height;
}

uint8_t* Texture::Data(void)
{
	return _texture.data;
}
