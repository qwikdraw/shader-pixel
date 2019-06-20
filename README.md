# Shader Pixel
Experimental rendering system integrating objects rendered in the fragment shader with a polygon scene
in C++ and OpenGL 4
Most objects are rendered with a raymarching technique, but the system supports
any kind of rendering possible from the fragment shader.

## Features
* Occulsion culling for fragment shader objects
* Post processing with depth mapping
* Shared lighting between scene and shader objects
* Shader hot reload
* Ambient occulsion, soft shadows in shader objects

![demo gif](https://raw.githubusercontent.com/qwikdraw/shader-pixel/master/assets/demo.gif)

## Building

### Dependencies
* GLFW 
* stb_image
* tiny_objloader

#### macOS
`./deps.sh` Install dependencies though brew  
`make`

# Team
Theo Walton
Logan Kaser
