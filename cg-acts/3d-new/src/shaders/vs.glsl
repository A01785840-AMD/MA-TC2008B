#version 300 es
precision highp float;


in vec3 position;
in vec3 normal;

uniform vec3 u_light_position;
uniform vec3 u_view_position;

uniform mat4 u_mvp;
uniform mat3 u_model;
uniform mat3 u_inverse_mvp;

out vec3 v_normal;
out vec3 v_surface_to_light;
out vec3 v_surface_to_view;


void main() {
    vec3 surface_position = u_model * position;

    gl_Position = u_mvp * vec4(position, 1.0);

    v_normal = normalize(u_inverse_mvp * normal);
    v_surface_to_light = normalize(u_light_position - surface_position);
    v_surface_to_view = normalize(u_view_position - surface_position);
}
