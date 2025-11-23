#version 300 es
precision highp float;


in vec3 v_normal;
in vec3 v_surface_to_light;
in vec3 v_surface_to_view;

uniform vec4 u_intensity_ambient;
uniform vec4 u_constant_ambient;

uniform vec4 u_intensity_diffuse;
uniform vec4 u_constant_diffuse;

uniform vec4 u_intensity_specular;
uniform vec4 u_constant_specular;
uniform float u_intensity_shining;

out vec4 outColor;

void main() {
    float diffuse = max(dot(v_surface_to_light, v_normal), 0.0);
    float specular = 0.0;

    if (diffuse != 0.0) {
        vec3 r = 2.0 * dot(v_surface_to_light, v_normal) * v_normal - v_surface_to_light;
        specular = pow(max(dot(v_surface_to_view, r), 0.0), u_intensity_shining);
    }

    vec4 ambient_color = u_constant_ambient * u_intensity_ambient;
    vec4 diffuse_color = u_constant_diffuse * u_intensity_diffuse * diffuse;
    vec4 specular_color = u_constant_specular * u_intensity_specular * specular;

    outColor = ambient_color + diffuse_color + specular_color;
}
