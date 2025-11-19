#version 300 es

precision highp float;
in vec4 position;
uniform mat4 u_matrix;

void main() {
    gl_Position = u_matrix * position;
}