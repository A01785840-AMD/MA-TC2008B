#version 300 es


in vec4 v_normal;
in vec4 v_surface_to_light;
in vec4 v_surface_to_camera;


uniform vec4 u_intensity_enviroment;
uniform vec4 u_intensity_diffuse;
uniform vec4 u_intensity_specular;

uniform vec4 u_constant_enviroment;
uniform vec4 u_constant_diffuse;
uniform vec4 u_constant_specular;

uniform float u_shining;


out vec4 outColor;


void main() {
    vec4 n = normalize(v_normal);
    vec4 surface_to_light = normalize(v_surface_to_light);
    vec4 surface_to_camera = normalize(v_surface_to_camera);

    float diffuse = max(dot(normal, surface_to_light), 0.0);

    float specular = 0.0;
    if (diffuse_color != 0.0) {
        vec4 r = 2.0 * dot(surface_to_light, normal) * normal - surface_to_camera;
        specular =  pow(max(dot(normal, r), 0.0), u_shining);
    }

    vec4 ambient_color = u_constant_enviroment * u_intensity_enviroment;
    vec4 diffuse_color = u_constant_diffuse * u_intensity_diffuse * diffuse;
    vec4 specular_color = u_constant_specular * u_intensity_specular * specular;

    outColor = ambient_color + diffuse_color + specular_color;
}
