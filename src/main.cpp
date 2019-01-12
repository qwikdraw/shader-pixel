#include "Window.hpp"
#include "FreeCamera.hpp"
#include "FPSDisplay.hpp"
#include "Time.hpp"
#include "SkyBox.hpp"
#include "ObjRender.hpp"
#include "Scene.hpp"
#include "ShaderObj.hpp"
#include "Light.hpp"

int	main(void)
{
	GLenum err;

	Window window(2560, 1440, "ft_vox");
	glClearColor(0.2, 0.25, 0.3, 1);

	FPSDisplay fps;
	FreeCamera cam(window);
	Time clock;
	SkyBox sky(
		"assets/textures/skybox/right.png",
		"assets/textures/skybox/left.png",
		"assets/textures/skybox/top.png",
		"assets/textures/skybox/bottom.png",
		"assets/textures/skybox/front.png",
		"assets/textures/skybox/back.png"
	);
	ObjRender::Init();
	ShaderObj sphere("src/shaders/sphere.frag");
	Scene scene;

	Light l2(glm::vec3(0, 10, 0), glm::vec3(0.4, 0.9, 0.6));

	while (!window.ShouldClose())
	{
		if ((err = glGetError()) != GL_NO_ERROR)
			std::cerr << err << std::endl;
		clock.Step();
		window.Clear();
		cam.Update(clock.Delta());
		scene.Render(cam.GetCameraData());

		glm::mat4 tr = glm::mat4(2);
		tr[3][3] = 1;
		sphere.Render(cam.GetCameraData(), tr, clock.Total());

		sphere.Render(cam.GetCameraData(),
			glm::translate(glm::mat4(1), glm::vec3(0, 3, 0)), clock.Total());

		sky.Render(cam.GetCameraData());
		fps.Render(window);
		window.Render();
		if (window.Key(GLFW_KEY_ESCAPE))
			break;
	}
	window.Close();
}
