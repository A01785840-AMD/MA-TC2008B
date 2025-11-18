import './style.css';
import App from "./app.ts";

import * as twgl from 'twgl-base.js';
import {M4} from './libs/3d-lib.ts';

const vs = `#version 300 es
in vec4 position;
uniform mat4 u_matrix;
void main() {
  gl_Position = u_matrix * position;
}`;

const fs = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  outColor = vec4(0.267, 0.290, 0.953, 1);
}`;

function main() {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = (`
        <canvas id="canvas"></canvas>
        <div id="container">
            <h1>.obj generator</h1> 
        </div>
        <div id="output-container">
            <div class="shadow-overlay"></div>
            <a id="cp-output">Download</a>
        <div id="output"></div>
    `);

    const cpOutput = document.getElementById('cp-output') as HTMLButtonElement;
    const output = document.getElementById('output') as HTMLElement;
    const app = new App(output, cpOutput);

    app.run();

    const canvas = document.getElementById(`canvas`) as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    function render(time: DOMHighResTimeStamp) {
        twgl.resizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(programInfo.program);

        time = time * 0.0001;

        const bufferInfo = twgl.createBufferInfoFromArrays(gl, app.getContentAsLinesArrays());

        const fov = 60 * Math.PI / 180;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const projection = M4.perspective(fov, aspect, 0.1, 100);
        const eye = [Math.cos(time) * 5, 2, Math.sin(time) * 5];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const camera = M4.lookAt(eye, target, up);
        const view = M4.inverse(camera);
        const viewProjection = M4.multiply(projection, view);

        // Scale the cube
        const scale = 1; // Change this value to scale the cube (0.5 = half size, 2 = double size)
        const world = M4.scaling([scale, scale, scale]);
        const worldViewProjection = M4.multiply(viewProjection, world);

        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, {u_matrix: worldViewProjection, time: time});
        twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);


        requestAnimationFrame(render);
    }

    render(0);
}

main();