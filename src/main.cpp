#include "Window.hpp"
#include "FreeCamera.hpp"
#include "FPSDisplay.hpp"
#include "Time.hpp"
#include "SkyBox.hpp"
#include "ObjRender.hpp"
#include "Scene.hpp"
#include "ShaderObj.hpp"
#include "Light.hpp"
#include "Transparency.hpp"
#include "ShadingProgram.hpp"
#include "RenderTarget.hpp"
#include "PostProcess.hpp"

int	main(void)
{
	GLenum err;

	Window window(1920, 1080, "shader_pixel");
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
	ShaderObj shader("src/shaders/ifs.frag");
	Scene scene;

	Light l2(glm::vec3(0, 10, 0), glm::vec3(0.4, 0.9, 0.6));

	int lastSecond = 0;

	RenderTarget postBuffer(1920, 1080);

	PostProcess post("src/shaders/post_dof.frag");

	while (!window.ShouldClose())
	{
		//if ((err = glGetError()) != GL_NO_ERROR)
		//	std::cerr << err << std::endl;
		clock.Step();

		if (int(clock.Total()) > lastSecond)
		{
			lastSecond = clock.Total();
			ShadingProgram::UpdateAll();
		}

		window.Clear();
		cam.Update(clock.Delta());

		postBuffer.Use();

		scene.Render(cam.GetCameraData());

		shader.Render(cam.GetCameraData(),
			glm::translate(glm::mat4(1), glm::vec3(0, 3, 0)), clock.Total());

		sky.Render(cam.GetCameraData());

		glm::mat4 tr = glm::mat4(2);
		tr[3][3] = 1;

		Transparency::RenderAll();

		window.RemoveRenderMask();
		post.Render(postBuffer, clock.Total());

		fps.Render(window);

		window.Render();
		if (window.Key(GLFW_KEY_ESCAPE))
			break;

	}
	window.Close();
}
