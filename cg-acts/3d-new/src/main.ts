import './style.css';

import * as twgl from 'twgl.js';
import {m4, v3} from 'twgl.js';

import shaderVertex from './shaders/vs.glsl?raw';
import shaderFaces from './shaders/fs.glsl?raw';


function appGuard({canvas, gl, programInfo, bufferInfo, vao}: any) {
    if (!canvas || !gl || !programInfo || !bufferInfo || !vao) {
        const problems: string[] = [];

        if (!canvas) {
            problems.push("canvas");
        }
        if (!gl) {
            problems.push("gl");
        }
        if (!programInfo) {
            problems.push("programInfo");
        }
        if (!bufferInfo) {
            problems.push("bufferInfo");
        }
        if (!vao) {
            problems.push("vao");
        }

        const problemsString: string = problems.join(', ');

        throw new Error(`Failed to initialize application.\nReason:\n\t${problemsString}.\n`);
    }
}

function toM3(mat4: Float32Array | number[]) {
    return new Float32Array([
        mat4[0], mat4[4], mat4[8],
        mat4[1], mat4[5], mat4[9],
        mat4[2], mat4[6], mat4[10]
    ]);
}

function main() {
    const canvas = document.getElementById('app-canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

    const programInfo = twgl.createProgramInfo(gl, [shaderVertex, shaderFaces]);
    const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1.0, 12.0, 24.0);
    // const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1.0);
    const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);

    appGuard({canvas, gl, programInfo, bufferInfo, vao});

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const eye = [0, 1, -3];
    const up = [0, 1, 0];
    const target = [0, 0, 0];
    const camera = m4.lookAt(eye, target, up);
    const view = m4.inverse(camera);

    const fov = Math.PI * 0.5;

    const color = new Float32Array([122 / 255, 45 / 255, 185 / 255, 1.0]);
    const cameraPosition = v3.normalize([-camera[8], -camera[9], -camera[10]]);
    const lightPosition = v3.normalize(new Float32Array([0, 1, -3]));

    function render(time: DOMHighResTimeStamp) {
        time *= 0.0005;

        const aspect = canvas.width / canvas.height;
        const projection = m4.perspective(fov, aspect, 0.1, 100);

        const viewProjection = m4.multiply(projection, view);
        const model = m4.rotationY(time);
        const mvp = m4.multiply(viewProjection, model);


        gl.viewport(0.0, 0.0, canvas.width, canvas.height);
        twgl.resizeCanvasToDisplaySize(canvas);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(programInfo.program);
        gl.bindVertexArray(vao);

        twgl.setUniforms(programInfo, {
            u_light_position: lightPosition,
            u_view_position: cameraPosition,

            u_mvp: mvp,
            u_model: toM3(model),
            u_inverse_mvp: toM3(m4.transpose(m4.inverse(model))),

            u_intensity_ambient: color,
            u_constant_ambient: color,

            u_intensity_diffuse: color,
            u_constant_diffuse: color,

            u_intensity_specular: color,
            u_constant_specular: color,
            u_intensity_shining: 100,
        });

        twgl.drawBufferInfo(gl, bufferInfo);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();