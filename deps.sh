#!/bin/sh

brew install pkg-config glm glfw wget
mkdir -p lib
cd lib
mkdir -p stb
cd stb
wget https://raw.githubusercontent.com/nothings/stb/master/stb_image.h