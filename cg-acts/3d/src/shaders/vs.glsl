#version 300 es
precision highp float;


in vec4 a_position;
in vec4 a_normal;


uniform vec4 u_light_world_position;
uniform vec4 u_view_world_position;

uniform mat4 u_world;
uniform mat4 u_world_inverse;
uniform mat4 u_world_view_projection;


out vec4 v_normal;
out vec4 v_surface_to_light;
out vec4 v_surface_to_camera;


void main() {
    gl_Position = u_world_view_projection * a_position;

    v_normal = u_world_inverse * a_normal;

    vec4 surface_world_position = u_world * a_position;
    v_surface_to_light = u_light_world_position - surface_world_position;
    v_surface_to_camera = u_view_world_position - surface_world_position;

}
