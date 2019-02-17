#!/bin/sh

brew install pkg-config glm glfw wget
mkdir -p lib
cd lib
mkdir -p stb
mkdir -p tiny_obj_loader
cd stb
wget https://raw.githubusercontent.com/nothings/stb/master/stb_image.h
cd ../tiny_obj_loader
wget https://raw.githubusercontent.com/syoyo/tinyobjloader/master/tiny_obj_loader.h