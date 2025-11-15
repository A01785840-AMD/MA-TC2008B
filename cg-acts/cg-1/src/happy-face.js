/*
 * Angel Montemayor Davila, A01785840
 * 14 - Nov - 2025
 *
 * Estes es un archivo para la simulación de una cara feliz "Happy Face" y transformaciones comunes (translación y
 * escalará) además, un pivote (un rombo al que igual se le pueden aplicar translaciones) que será el punto donde
 * la cara feliz rotara sin importar su translación o la del pivote.
 * pivote
 */

'use strict';

import * as twgl from 'twgl-base.js';
import { M3 } from './libs/2d.js';
import GUI from 'lil-gui';

const vsGLSL = `#version 300 es
in vec4 a_position;
in vec4 a_color;

uniform mat3 u_transforms;

out vec4 v_color;

void main() {
    vec2 position = (u_transforms * vec3(a_position.xy, 1)).xy;
    gl_Position = vec4(position, 0, 1);
    v_color = a_color;
}
`;

const fsGLSL = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
    outColor = v_color;
}
`;

const DEFAULTS = {
    translation: { x: 0, y: 0 },
    rotation: { angle: 0 },
    scale: { x: 1, y: 1 },
    color: { r: 255 / 255, g: 217 / 255, b: 0 / 255 },
    pivot: { x: 0, y: 0 }
};

const scene = {
    happyFace: {
        translation: { x: DEFAULTS.translation.x, y: DEFAULTS.translation.y },
        rotation: { angle: DEFAULTS.rotation.angle },
        scale: { x: DEFAULTS.scale.x, y: DEFAULTS.scale.y },
        color: { ...DEFAULTS.color }
    },
    colorPicker: {
        faceColor: { ...DEFAULTS.color }
    },
    pivot: {
        x: DEFAULTS.pivot.x,
        y: DEFAULTS.pivot.y
    }
};

function resetScene(updateFaceColor, gui) {
    scene.happyFace.translation.x = DEFAULTS.translation.x;
    scene.happyFace.translation.y = DEFAULTS.translation.y;
    scene.happyFace.rotation.angle = DEFAULTS.rotation.angle;
    scene.happyFace.scale.x = DEFAULTS.scale.x;
    scene.happyFace.scale.y = DEFAULTS.scale.y;
    scene.happyFace.color = { ...DEFAULTS.color };
    scene.colorPicker.faceColor = { ...DEFAULTS.color };
    scene.pivot.x = DEFAULTS.pivot.x;
    scene.pivot.y = DEFAULTS.pivot.y;

    updateFaceColor();
    gui.controllersRecursive().forEach(controller => controller.updateDisplay());
}

function generateHappyFace() {
    const arrays = {
        a_position: { numComponents: 2, data: [] },
        a_color: { numComponents: 4, data: [] },
        indices: { numComponents: 3, data: [] }
    };

    let vertexIndex = 0;
    const color = scene.happyFace.color;
    const faceColor = [color.r, color.g, color.b, 1.0];
    const black = [0.0, 0.0, 0.0, 1.0];

    const faceVertices = 18;
    const faceRadius = 0.7;

    arrays.a_position.data.push(0, 0);
    arrays.a_color.data.push(...faceColor);
    const faceCenter = vertexIndex++;

    const angleStep = 2 * Math.PI / faceVertices;
    for (let i = 0; i < faceVertices; i++) {
        const angle = angleStep * i;
        const x = Math.cos(angle) * faceRadius;
        const y = Math.sin(angle) * faceRadius;
        arrays.a_position.data.push(x, y);
        arrays.a_color.data.push(...faceColor);
        vertexIndex++;
    }

    for (let i = 0; i < faceVertices; i++) {
        const next = ((i + 1) % faceVertices) + 1;
        arrays.indices.data.push(faceCenter, i + 1, next);
    }

    const eyeSize = 0.12;
    const eyeY = 0.25;
    const eyeSpacing = 0.25;
    const leftEyeX = -eyeSpacing;
    const leftEyeTop = eyeY + eyeSize * 0.866;

    arrays.a_position.data.push(leftEyeX - eyeSize / 2, leftEyeTop);
    arrays.a_color.data.push(...black);
    const leftEye1 = vertexIndex++;

    arrays.a_position.data.push(leftEyeX + eyeSize / 2, leftEyeTop);
    arrays.a_color.data.push(...black);
    const leftEye2 = vertexIndex++;

    arrays.a_position.data.push(leftEyeX, eyeY - eyeSize * 0.433);
    arrays.a_color.data.push(...black);
    const leftEye3 = vertexIndex++;

    arrays.indices.data.push(leftEye1, leftEye2, leftEye3);

    const rightEyeX = eyeSpacing;

    arrays.a_position.data.push(rightEyeX - eyeSize / 2, leftEyeTop);
    arrays.a_color.data.push(...black);
    const rightEye1 = vertexIndex++;

    arrays.a_position.data.push(rightEyeX + eyeSize / 2, leftEyeTop);
    arrays.a_color.data.push(...black);
    const rightEye2 = vertexIndex++;

    arrays.a_position.data.push(rightEyeX, eyeY - eyeSize * 0.433);
    arrays.a_color.data.push(...black);
    const rightEye3 = vertexIndex++;

    arrays.indices.data.push(rightEye1, rightEye2, rightEye3);

    const mouthWidth = 0.75;
    const mouthY = -0.35;
    const mouthHeight = 0.15;

    arrays.a_position.data.push(-mouthWidth / 2, mouthY + mouthHeight);
    arrays.a_color.data.push(...black);
    const mouth1 = vertexIndex++;

    arrays.a_position.data.push(mouthWidth / 2, mouthY + mouthHeight);
    arrays.a_color.data.push(...black);
    const mouth2 = vertexIndex++;

    arrays.a_position.data.push(0, mouthY);
    arrays.a_color.data.push(...black);
    const mouth3 = vertexIndex++;

    arrays.indices.data.push(mouth1, mouth2, mouth3);

    return arrays;
}

function generatePivotRhombus() {
    const arrays = {
        a_position: { numComponents: 2, data: [] },
        a_color: { numComponents: 4, data: [] },
        indices: { numComponents: 3, data: [] }
    };

    const gray = [0.7, 0.7, 0.7, 1.0];
    const size = 0.08;

    arrays.a_position.data.push(0, size);
    arrays.a_color.data.push(...gray);

    arrays.a_position.data.push(size, 0);
    arrays.a_color.data.push(...gray);

    arrays.a_position.data.push(0, -size);
    arrays.a_color.data.push(...gray);

    arrays.a_position.data.push(-size, 0);
    arrays.a_color.data.push(...gray);

    arrays.indices.data.push(0, 1, 2);
    arrays.indices.data.push(0, 2, 3);

    return arrays;
}

function setupUI(updateFaceColor) {
    const gui = new GUI();

    const resetButton = { 'Reset All': () => resetScene(updateFaceColor, gui) };
    gui.add(resetButton, 'Reset All');

    const happyFaceFolder = gui.addFolder('Happy Face');

    const translationFolder = happyFaceFolder.addFolder('Translation');
    translationFolder.add(scene.happyFace.translation, 'x', -3, 3).name('Translate X');
    translationFolder.add(scene.happyFace.translation, 'y', -3, 3).name('Translate Y');
    translationFolder.open();

    const rotationFolder = happyFaceFolder.addFolder('Rotation');
    rotationFolder.add(scene.happyFace.rotation, 'angle', 0, Math.PI * 2).name('Angle');
    rotationFolder.open();

    const scaleFolder = happyFaceFolder.addFolder('Scale');
    scaleFolder.add(scene.happyFace.scale, 'x', 0.1, 3).name('Scale X');
    scaleFolder.add(scene.happyFace.scale, 'y', 0.1, 3).name('Scale Y');
    scaleFolder.open();

    happyFaceFolder.addColor(scene.colorPicker, 'faceColor')
        .name('Face Color')
        .onChange((value) => {
            scene.happyFace.color = value;
            updateFaceColor();
        });

    happyFaceFolder.open();

    const pivotFolder = gui.addFolder('Pivot');
    const pivotTranslationFolder = pivotFolder.addFolder('Translation');
    pivotTranslationFolder.add(scene.pivot, 'x', -3, 3).name('Pivot X');
    pivotTranslationFolder.add(scene.pivot, 'y', -3, 3).name('Pivot Y');
    pivotTranslationFolder.open();
    pivotFolder.open();
}

function main() {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    const programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

    let aspectRatio = 1;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        aspectRatio = canvas.width / canvas.height;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const faceArrays = generateHappyFace();
    const pivotArrays = generatePivotRhombus();

    const faceBufferInfo = twgl.createBufferInfoFromArrays(gl, faceArrays);
    const faceVAO = twgl.createVAOFromBufferInfo(gl, programInfo, faceBufferInfo);

    const pivotBufferInfo = twgl.createBufferInfoFromArrays(gl, pivotArrays);
    const pivotVAO = twgl.createVAOFromBufferInfo(gl, programInfo, pivotBufferInfo);

    function updateFaceColor() {
        const newFaceArrays = generateHappyFace();
        gl.bindBuffer(gl.ARRAY_BUFFER, faceBufferInfo.attribs.a_color.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newFaceArrays.a_color.data), gl.STATIC_DRAW);
    }

    setupUI(updateFaceColor);

    function render() {
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(programInfo.program);

        const projectionMatrix = aspectRatio > 1
            ? M3.scale([1 / aspectRatio, 1])
            : M3.scale([1, aspectRatio]);

        const scaleMatrix = M3.scale([scene.happyFace.scale.x, scene.happyFace.scale.y]);
        const relativePivotX = scene.pivot.x - scene.happyFace.translation.x;
        const relativePivotY = scene.pivot.y - scene.happyFace.translation.y;

        const translateToPivot = M3.translation([-relativePivotX, -relativePivotY]);
        const rotationMatrix = M3.rotation(scene.happyFace.rotation.angle);
        const translateFromPivot = M3.translation([relativePivotX, relativePivotY]);
        const faceTranslation = M3.translation([scene.happyFace.translation.x, scene.happyFace.translation.y]);

        let faceTransform = M3.multiply(scaleMatrix, translateToPivot);
        faceTransform = M3.multiply(faceTransform, rotationMatrix);
        faceTransform = M3.multiply(faceTransform, translateFromPivot);
        faceTransform = M3.multiply(faceTransform, faceTranslation);
        faceTransform = M3.multiply(faceTransform, projectionMatrix);

        twgl.setUniforms(programInfo, { u_transforms: faceTransform });
        gl.bindVertexArray(faceVAO);
        twgl.drawBufferInfo(gl, faceBufferInfo);

        let pivotTransform = M3.translation([scene.pivot.x, scene.pivot.y]);
        pivotTransform = M3.multiply(pivotTransform, projectionMatrix);
        twgl.setUniforms(programInfo, { u_transforms: pivotTransform });
        gl.bindVertexArray(pivotVAO);
        twgl.drawBufferInfo(gl, pivotBufferInfo);

        requestAnimationFrame(render);
    }

    render();
}

export default main;
