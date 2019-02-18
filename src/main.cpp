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

	RenderTarget lowRes(200, 200);

	PostProcess post("src/shaders/post_combined.frag");

	ObjRender scene("sky_island.obj");

	// ordinary shaders that don't need special treatment
	std::vector<std::pair<ShaderObj*, glm::mat4>> shaders {
		{
			new ShaderObj("src/shaders/ifs.frag"),
			glm::scale(
				glm::translate(glm::mat4(1.0), glm::vec3(-2, 7, -69)),
				glm::vec3(2.0))
		},
		{
			new ShaderObj("src/shaders/mandelbulb.frag"),
			glm::scale(
				glm::translate(glm::mat4(1.0), glm::vec3(-61, 6.5, -24)),
				glm::vec3(2.0))
		},
		{
			new ShaderObj("src/shaders/mandelbox.frag"),
			glm::scale(
				glm::translate(glm::mat4(1.0), glm::vec3(-60, 9, 25)),
				glm::vec3(2.0))
		},
		{
			new ShaderObj("src/shaders/wow.frag"),
			glm::scale(
				glm::translate(glm::mat4(1.0), glm::vec3(28, 3.9, 4.8)),
				glm::vec3(2.0))
		},
		{
			new ShaderObj("src/shaders/volume.frag"),
			glm::scale(
				glm::translate(glm::mat4(1.0), glm::vec3(61, 7.2, 34)),
				glm::vec3(2.0))
		},
		{
			new ShaderObj("src/shaders/portal.frag"),
			glm::scale(
				glm::translate(glm::mat4(1.0), glm::vec3(0, 6.2, 42)),
				glm::vec3(5.0))
		}
	};

	ShaderObj water("src/shaders/water.frag");
	ShaderObj buffer("src/shaders/buffer.frag");

	while (!window.ShouldClose())
	{
		clock.Step();

		if ((err = glGetError()) != GL_NO_ERROR)
			std::cerr << "glerror: "<< err << std::endl;

		if (int(clock.Total()) > lastSecond)
		{
			lastSecond = clock.Total();
			ShadingProgram::UpdateAll();
			auto data = cam.GetCameraData();
		}

		window.Clear();
		cam.Update(clock.Delta());

		// render the scene and sky and water to a low res render target
		lowRes.Use();
		scene.Render(cam.GetCameraData(), glm::mat4(1.0));
		sky.Render(cam.GetCameraData());
		water.Render(cam.GetCameraData(),
			glm::scale(
				glm::translate(glm::mat4(1.0), glm::vec3(20.0, -0.15, 0.0)),
				glm::vec3(32.0)),
			clock.Total(),
			true);
		window.RemoveRenderMask();

		postBuffer.Use();

		scene.Render(cam.GetCameraData(), glm::mat4(1.0));

		// render the special shaders
		buffer.Render(cam.GetCameraData(),
			glm::scale(
				glm::translate(glm::mat4(1),
					glm::vec3(55, 12, -40)),
				glm::vec3(4.0)) *
			glm::rotate(float(clock.Total()), glm::vec3(0, 1, 0)),
			clock.Total(),
			false,
			lowRes.TextureID());
		water.Render(cam.GetCameraData(),
			glm::scale(
				glm::translate(glm::mat4(1.0), glm::vec3(20.0, -0.15, 0.0)),
				glm::vec3(32.0)),
			clock.Total(),
			true);

		// render ordinary shaders
		for (auto& shader : shaders)
		{
			shader.first->Render(cam.GetCameraData(), shader.second, clock.Total());
		}

		ShadingProgram& post_program = post.GetProgram();
		post_program.Use();
		glUniform1i(post_program.Uniform("key_1"), window.Key('1'));
		glUniform1i(post_program.Uniform("key_2"), (int)window.Key('2'));
		glUniform1i(post_program.Uniform("key_3"), (int)window.Key('3'));

		sky.Render(cam.GetCameraData());
		Transparency::RenderAll();
		window.RemoveRenderMask();

		post.Render(postBuffer, clock.Total());

		fps.Render(window);

		window.Render();
		if (window.Key(GLFW_KEY_ESCAPE))
			break;
	}
	window.Close();
	for (auto& shader : shaders)
		delete shader.first;
}
