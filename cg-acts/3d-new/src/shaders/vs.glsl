#version 300 es
precision highp float;


in vec3 position;
in vec3 normal;

uniform vec3 u_light_position;
uniform vec3 u_view_position;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;

out vec3 v_normal;
out vec3 v_surface_to_light;
out vec3 v_surface_to_view;


void main() {
    vec4 position4 = vec4(position, 1.0);
    vec3 surface_position = (u_model * position4).xyz;

    gl_Position = u_mvp * position4;

    v_normal = normalize(u_normal_matrix * normal);
    v_surface_to_light = normalize(u_light_position - surface_position);
    v_surface_to_view = normalize(u_view_position - surface_position);
}
