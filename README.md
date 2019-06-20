# Shader Pixel
Integrating objects rendered in the fragment shader with a polygon scene
In C++ and Opengl
Most objects are rendered with a raymarching technique, but the system supports
and kind of rendering possibel from the fragment shader.

## Features
* Occulsion culling for fragment shader objects
* Post processing with depth mapping
* Shared lighting between scene and shader objects
* Shader hot reload

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
