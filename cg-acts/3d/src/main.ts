import * as twgl from 'twgl.js';
import {m4} from 'twgl.js';
import vertexShader from './shaders/vs-simply.glsl?raw';
import facesShader from './shaders/fs-simply.glsl?raw';


function main() {
    const shaders = [
        vertexShader,
        facesShader
    ];

    const canvas = document.getElementById('app-canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    const programInfo = twgl.createProgramInfo(gl, shaders);

    if (!gl) {
        console.error("No gl");
        throw new Error("No GL");
    }

    if (!programInfo) {
        console.error("Failed to create program");
        console.error("Vertex Shader:", vertexShader);
        console.error("Fragment Shader:", facesShader);
        throw new Error("Program compilation failed");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1.0, 12, 24);
    const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);

    const eye = [0, 5, 5];
    const up = [0, 1, 0];
    const target = [0, 0, 0];
    const view = m4.inverse(m4.lookAt(eye, target, up));

    const fov = Math.PI * 0.4;

    const color = new Float32Array([122 / 255, 45 / 255, 185 / 255, 1.0]);

    function render(time: DOMHighResTimeStamp) {
        time = time * 0.001;

        twgl.resizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, canvas.width, canvas.height);

        const aspect = canvas.width / canvas.height;
        const projection = m4.perspective(fov, aspect, 0.1, 100.0);

        const model = m4.rotationY(time);

        const mvp = m4.multiply(m4.multiply(projection, view), model);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(programInfo.program);
        gl.bindVertexArray(vao);

        twgl.setUniforms(programInfo, {u_mvp: mvp, u_color: color});

        twgl.drawBufferInfo(gl, bufferInfo);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
