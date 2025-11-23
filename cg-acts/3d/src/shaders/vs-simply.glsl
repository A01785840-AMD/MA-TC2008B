#version 300 es


in vec4 position;
uniform mat4 u_mvp;


void main() {
    gl_Position = u_mvp * position;

}
