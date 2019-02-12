#version 410 core

#define MAX_LIGHTS 100

in vec3 ray_tp;
in vec3 ray_tv;

uniform mat4 worldToScreen;
uniform mat4 transform;

uniform vec3 lightPos[MAX_LIGHTS];
uniform vec3 lightColor[MAX_LIGHTS];
uniform int lightNum;

uniform float time;

out vec4 frag_color;

const int MARCH_MAX = 255;
const float MARCH_MIN_DIST = 0.0f;
const float MARCH_MAX_DIST = 10.0f;
const float MARCH_VOLUME_DIST = 30.0f;
const float MARCH_STEP = 0.05f;
const float EPSILON = 0.001f;

// For volumetic objects, the w term is the density.
const vec4 materials[4] = vec4[](
	vec4(0.0), // Null Color
	vec4(1.0, 1.0, 1.0, 0.7), // Clear glass
	vec4(0.3, 0.8, 0.4, 8.0), // Blue glass
    vec4(0.3, 0.8, 0.4, 0.4) // Red glass
);

/*

#define CHEAPER_NOISES

float Noise( in vec3 x, float lod_bias )
{   
    vec3 p = floor(x);
    vec3 f = fract(x);
#ifndef CHEAPER_NOISES  
    f = f*f*(3.0-2.0*f);    //not terribly noticeable for higher freq noises anyway
#endif
    
    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;    
    vec2 rg = texture( iChannel1, (uv+ 0.5)/256.0, lod_bias ).yx;

    return mix( rg.x, rg.y, f.z );
}

vec2 Noise2( in vec3 x, float lod_bias )
{
    vec3 p = floor(x);
    vec3 f = fract(x);  
    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
    vec4 rg = texture( iChannel1, uv*(1./256.0), lod_bias ).yxwz;
    return mix( rg.xz, rg.yw, f.z );
}


vec2 Turbulence2(vec3 p, float lod)
{   
    vec2 t = vec2(0.);
    float oof = 1.;
    for (int i=0; i<5; i++)
    {
        t += abs(Noise2(p,lod))*oof;
        oof *= 0.5;
        p *= 2.7;   //bigger number, more detail
    }
    
    return t-vec2(1.);
}

vec2 PhaseShift2(vec3 p)
{
    float g = (p.y+2.);  //fall off with height
    
    float lod = -100.;
            //g*2.;
    
    p *= .4;
    
    p.x += iTime * .02;
    p.y += -iTime;
    
    
    return g * Turbulence2(p, lod);
}

float Density(vec3 p)
{   
    //rotate Z randomly about Y  =~ swirly space
    float t = Noise(p,-100.);
    t *= (180. / 3.1415927)*.005 * (p.y+2.);
    float s = sin(t); float c = cos(t);
    p.z = p.x*s+p.z*c;
    
    p.xz += PhaseShift2(p);
    
    //repeat it just because we can
    float f = 3.;
    p.xz = mod(p.xz, f) - f*.5;
    
    //column as distance from y axis
    float rx = dot(p.xz,p.xz)*5.  -p.y*0.25;
    if (rx < 1.)
    {
        float s = sin(3.1415927*rx);    //hollow tube
        return s*s*s*s;
    }   
    
    return 0.;
}

vec4 March(vec4 accum, vec3 viewP, vec3 viewD, vec2 mM)
{
    //exponential stepping

    #define STEPS   64  
    float slices = 256.;
    
    float Far = 10.;
    
    float sliceStart = log2(mM.x)*(slices/log2(Far));
    float sliceEnd = log2(mM.y)*(slices/log2(Far));
            
    float last_t = mM.x;
    
    for (int i=0; i<STEPS; i++)
    {                           
        sliceStart += 1.;
        float sliceI = sliceStart;// + float(i);    //advance an exponential step
        float t = exp2(sliceI*(log2(Far)/slices));  //back to linear

        vec3 p = viewP+t*viewD;
    
        float dens = Density(p);
        dens *= (t-last_t)*1.5;
                
        //color gradient
        vec3 c = mix( vec3(0.5,0.6,.7), vec3(0.2), p.y);
            
        c *= min(-t*.6+7.,1.);
        
        accum = BlendUnder(accum,vec4(c,dens));
            
        last_t=t;
    }
    
    return accum;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float ceil_intersect_t = (-viewP.y + 1.) / (viewD.y);

    vec4 a = March(vec4(0), ro, rv, vec2(ceil_intersect_t,floor_intersect_t));
    c = BlendUnder(a,vec4(c,1.)).xyz;
    c=pow(c,vec3(1./2.2));
    fragColor = vec4(c,1.0);
}

*/


// Clear marble
float marble(vec3 p, out int material_id) {
	material_id = 2;
    float torus_bound = length(vec2(length(p.xz) - 0.6, p.y)) - 0.2;
    vec3 q = mod(p, vec3(.1, .1, .1)) - 0.5 * vec3(.1, .1, .1);
    return max(torus_bound, length(q) - 0.03);
}

// Distance field representing the scene.
float scene(vec3 p, out int material_id) {
    return marble(p, material_id);
}

// Returns depth traveled inside object.
float volume_march(vec3 pos, vec3 rv, int material_id) {
	float inside_dist = 0.0f;
	int new_material_id;
	for (float depth = 0.0f; depth < MARCH_MAX_DIST;depth += MARCH_STEP)
	{
		float dist = scene(pos + rv * depth, new_material_id);
		if (dist <= 0.0) {
			inside_dist += MARCH_STEP;
		}
	}
    return inside_dist;
}

float ray_march(vec3 ro, vec3 rv, out int material_id) {
    float depth = MARCH_MIN_DIST;
    for (int i = 0; i < MARCH_MAX; ++i)
    {
        float min_distance = scene(ro + rv * depth, material_id);
        depth += min_distance;
        if (min_distance < EPSILON || depth >= MARCH_MAX_DIST) {
            break;
        }
    }
    return min(depth, MARCH_MAX_DIST);
}

/* Lighting */

// 1 for less accurate but faster normal, 0 for accurate but slower version.

#if 1

vec3 get_normal(vec3 p) {
    int _;
    float ref = scene(p, _);
    return normalize(vec3(
        scene(vec3(p.x + EPSILON, p.y, p.z), _) - ref,
        scene(vec3(p.x, p.y + EPSILON, p.z), _) - ref,
        scene(vec3(p.x, p.y, p.z + EPSILON), _) - ref
    ));
}

#else

vec3 get_normal(vec3 p) {
    return normalize(vec3(
        scene(vec3(p.x + EPSILON, p.y, p.z)) - scene(vec3(p.x - EPSILON, p.y, p.z)),
        scene(vec3(p.x, p.y + EPSILON, p.z)) - scene(vec3(p.x, p.y - EPSILON, p.z)),
        scene(vec3(p.x, p.y, p.z  + EPSILON)) - scene(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

#endif

float ambient_occulsion(vec3 normal, vec3 pos)
{
    int _;
    float x = 0.0;
    x += 0.1 - scene(pos + normal * 0.1, _);
    x += 0.2 - scene(pos + normal * 0.2, _);
    x += 0.3 - scene(pos + normal * 0.3, _);
    return 1.0 - x;
}

vec3 phong(vec3 normal, vec3 material_color, vec3 cam_dir, vec3 light_normal, vec3 light_color, float light_strength)
{
    float distance = length(light_normal);
    light_normal = normalize(light_normal);

    float diffuse = clamp(dot(normal, light_normal), 0.0, 1.0);

    vec3 reflected_light_dir = normalize(reflect(light_normal, normal));
    
    float specular = pow(clamp(dot(reflected_light_dir, cam_dir), 0.0, 1.0), 10.0);

    vec3 diffuse_color = material_color * max(diffuse, 0.05);
    vec3 specular_color = light_color * specular;

    distance *= distance;
    return (diffuse_color + specular_color) * light_strength / distance;  
}

float soft_shadow(vec3 pos, vec3 light_normal, float softness)
{
    float res = 1.0;
    int _;
    for (float depth = 0.01; depth < 20.0;)
    {
        float min_distance = scene(pos + light_normal * depth, _);
        if (min_distance < 0.001)
            return 0.0;
        res = min(res, softness * min_distance / depth);
        depth += min_distance;
    }
    return res;
}

float rand(vec2 co) {
	return fract(sin(dot(co, vec2(77.9898,78.233))) * 43758.5453);
}

void shader(vec3 ro, vec3 rv) {
    int material_id;
    float dist = ray_march(ro, rv, material_id);
    if (dist > MARCH_MAX_DIST - EPSILON)
        discard;
    vec3 pos = ro + rv * dist;

    vec3 normal = get_normal(pos);

    float jitter = rand(rv.xy);

    vec4 object_color = materials[material_id];
    float volume_distance = volume_march(pos - rv * jitter, rv, material_id);
    object_color.w = pow(2.718, volume_distance * object_color.w) - 1.0;

    vec3 light_normal = vec3(0.0, 5.0, 0.0) - pos; 

    vec3 color = phong(
        normal, // object normal
        object_color.xyz,
        rv, // camera direction
        light_normal, // light position
        vec3(1.0, 1.0, 0.8), // light Color
        100.0 // Light strength
    );

    //color *= ambient_occulsion(normal, pos);
    //color *= soft_shadow(pos, light_normal, 4.0);

    frag_color = vec4(pow(color, vec3(1.0 / 2.2)), object_color.w);
}

void main()
{
    shader(ray_tp, normalize(ray_tv));
}