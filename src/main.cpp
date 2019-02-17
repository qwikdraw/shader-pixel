#include "Window.hpp"
#include "FreeCamera.hpp"
#include "FPSDisplay.hpp"
#include "Time.hpp"
#include "SkyBox.hpp"
#include "ObjRender.hpp"
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

	Light l2(glm::vec3(0, 10, 0), glm::vec3(0.4, 0.9, 0.6));

	int lastSecond = 0;

	RenderTarget postBuffer(1920, 1080);

	PostProcess post("src/shaders/post_vignette.frag");

	ObjRender scene("sky_island.obj");

	std::vector<std::pair<ShaderObj*, glm::mat4>> shaders {
		{new ShaderObj("src/shaders/ifs.frag"), glm::translate(glm::mat4(1.0), glm::vec3(20.0, 8.0, 0.0))},
		{new ShaderObj("src/shaders/mandelbulb.frag"), glm::translate(glm::mat4(1.0), glm::vec3(20.0, 8.0, 4.0))},
		{new ShaderObj("src/shaders/mandelbox.frag"), glm::translate(glm::mat4(1.0), glm::vec3(20.0, 8.0, -4.0))},
		{new ShaderObj("src/shaders/portal.frag"), // Scaled so you can easily go inside
			glm::scale(glm::translate(glm::mat4(1.0), glm::vec3(15.0, 8.0, -4.0)), glm::vec3(2.0))},
		{new ShaderObj("src/shaders/water.frag"),
			glm::scale(glm::translate(glm::mat4(1.0), glm::vec3(20.0, -0.15, 0.0)), glm::vec3(32.0))}
	};

	//ShaderObj shader("src/shaders/ifs.frag");

	while (!window.ShouldClose())
	{
		clock.Step();

		if ((err = glGetError()) != GL_NO_ERROR)
			std::cerr << "glerror: "<< err << std::endl;

		if (int(clock.Total()) > lastSecond)
		{
			lastSecond = clock.Total();
			ShadingProgram::UpdateAll();
		}

		window.Clear();
		cam.Update(clock.Delta());

		postBuffer.Use();


		scene.Render(cam.GetCameraData(), glm::mat4(1.0));

		for (auto& shader : shaders)
		{
			shader.first->Render(cam.GetCameraData(), shader.second, clock.Total());
		}
		//shader.Render(cam.GetCameraData(), glm::translate(glm::mat4(1), glm::vec3(20, 8, 0)), clock.Total());

		sky.Render(cam.GetCameraData());

		Transparency::RenderAll();

		window.RemoveRenderMask();
		post.Render(postBuffer, clock.Total()                                                                                                                                                                                                                     );


		fps.Render(window);

		window.Render();
		if (window.Key(GLFW_KEY_ESCAPE))
			break;
	}
	window.Close();
	for (auto& shader : shaders)
		delete shader.first;
}
