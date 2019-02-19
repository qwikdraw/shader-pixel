NAME = shader_pixel
LIST = main \
Window \
Time \
ShadingProgram \
FPSDisplay \
FreeCamera \
SkyBox \
Texture \
Text \
ObjRender \
ShaderObj \
Light \
Transparency \
RenderTarget \
PostProcess

OBJ_DIR = obj

VPATH = src

SRC = $(addsuffix .cpp, $(LIST))
OBJ = $(addsuffix .o, $(addprefix $(OBJ_DIR)/, $(LIST)))
DEP = $(OBJ:%.o=%.d)

MAKEFLAGS=-j4

CPPFLAGS = -std=c++14 -Wall -Wextra -Werror -Wno-unused-parameter \
-Wno-unused-variable \
$(shell pkg-config --cflags glfw3 glm) \
-I lib/stb -I lib/tiny_obj_loader \
-g -O3 -march=native \
#-fsanitize=address -fsanitize=undefined

LDFLAGS = -framework OpenGl \
$(shell pkg-config --libs glfw3 glm) \
 -pipe \
#-fsanitize=address -fsanitize=undefined

all: $(OBJ_DIR) $(NAME)

$(OBJ_DIR):
	@mkdir -p $(OBJ_DIR)

-include $(DEP)

$(OBJ_DIR)/%.o: %.cpp
	@printf "\e[34;1mCompiling: \e[0m%s\n" $<
	@clang++ $(CPPFLAGS) -MMD -c $< -o $@

$(NAME): $(OBJ)
	@echo "\033[32;1mLinking.. \033[0m"
	@clang++ $(LDFLAGS) -o $@ $^
	@echo "\033[32;1mCreated:\033[0m "$(NAME)

clean:
	@printf "\e[31;1mCleaning..\e[0m\n"
	@rm -f $(OBJ)
	@rm -f lib/lodepng/lodepng.o

fclean:
	@printf "\e[31;1mFull Cleaning..\e[0m\n"
	@rm -rf $(OBJ_DIR)
	@rm -f $(NAME)
	@rm -f lib/lodepng/liblodepng.a

re:
	@$(MAKE) fclean 2>/dev/null
	@$(MAKE) 2>/dev/null

deps:
	@./deps.sh

.PHONY: clean fclean all re
