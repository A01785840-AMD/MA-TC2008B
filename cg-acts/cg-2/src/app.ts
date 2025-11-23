import GUI from "lil-gui";
import type {ProgramInfo} from "twgl-base.js";
import * as twgl from 'twgl-base.js';
import type {Vertex} from "./libs/utils.ts";
import {handleFileDownload, iota, makeGUIDraggable, polarToCartesian} from "./libs/utils.ts";

import vsGLSL from './shaders/vertex.glsl?raw';
import fsGLSL from './shaders/fragment.glsl?raw';

import {M4} from './libs/3d-lib.ts';
// import {mat4, vec3, quad} from `gl-matrix`;


class App {
    constructor(gl: WebGL2RenderingContext, output: HTMLElement, cpOutput: HTMLElement) {
        this.gl = gl;
        this.output = output;

        this.buffer = [];
        this.programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

        this.sceneObject = {
            faces: 6,
            height: 1,
            upperRadius: 1,
            lowerRadius: 1,
            vertexGroups: [],
            indexes: [],
            totalVertices: 0,
            verticesPerGroup: 0,
            position: [],
            indices: [],
            rotation: {x: 0, y: 0, z: 0},
            scale: {min: 0.1, n: 1, max: 5}
        };

        cpOutput.addEventListener('click', handleFileDownload(() => {
            return new Blob([this.#content], {type: 'text/plain;charset=utf-8'});
        }));
    }

    run() {
        this.#setUp();

        requestAnimationFrame(this.#render.bind(this));
    }

    #render(time: DOMHighResTimeStamp) {
        twgl.resizeCanvasToDisplaySize(this.gl.canvas as HTMLCanvasElement);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.programInfo.program);

        time = time * 0.0001;

        const eye = [5, 5, 5];
        const up = [0, 1, 0];
        const target = [0, 0, 0];
        const camera = M4.lookAt(eye, target, up);

        const rotationX = M4.rotationX(this.sceneObject.rotation.x);
        const rotationY = M4.rotationY(this.sceneObject.rotation.y);
        const rotationZ = M4.rotationZ(this.sceneObject.rotation.z);

        const rotation = M4.multiply(M4.multiply(rotationX, rotationY), rotationZ);
        const view = M4.multiply(M4.inverse(camera), rotation);

        const fov = 60 * Math.PI / 180;
        const aspect = window.innerWidth / window.innerHeight;
        const projection = M4.perspective(fov, aspect, 0.1, 100);
        const viewProjection = M4.multiply(M4.multiply(projection, view), M4.identity());

        const world = M4.scaling([this.sceneObject.scale.n, this.sceneObject.scale.n, this.sceneObject.scale.n]);
        const worldViewProjection = M4.multiply(viewProjection, world);

        const bufferInfo = twgl.createBufferInfoFromArrays(this.gl, this.getContentAsLinesArrays());

        twgl.setBuffersAndAttributes(this.gl, this.programInfo, bufferInfo);
        twgl.setUniforms(this.programInfo, {u_matrix: worldViewProjection, time: time});
        twgl.drawBufferInfo(this.gl, bufferInfo, this.gl.LINES);


        requestAnimationFrame(this.#render.bind(this));
    }

    #setUp() {
        this.#buildObject();
        this.#setUpUI();
        this.#setUpListener();
    }

    getContentAsArrays() {
        return {
            position: this.sceneObject.position,
            indices: this.sceneObject.indices
        };
    }

    getContentAsLinesArrays() {
        const lineIndices: number[] = [];
        const triangleIndices = this.sceneObject.indices;

        for (let i = 0; i < triangleIndices.length; i += 3) {
            const v0 = triangleIndices[i];
            const v1 = triangleIndices[i + 1];
            const v2 = triangleIndices[i + 2];

            lineIndices.push(v0, v1);
            lineIndices.push(v1, v2);
            lineIndices.push(v2, v0);
        }

        return {
            position: this.sceneObject.position,
            indices: lineIndices
        };
    }

    get #content(): string {
        return this.buffer.join('\n');
    }

    #calcObject() {
        const theta = 2 * Math.PI / this.sceneObject.faces;

        const vertexGroupsLiterals: Vertex[][] = [
            iota({start: 1, end: this.sceneObject.faces}).map(i => (
                {...polarToCartesian(this.sceneObject.lowerRadius, theta * i), z: 0.0}
            )),
            iota({start: 1, end: this.sceneObject.faces}).map(i => (
                {...polarToCartesian(this.sceneObject.upperRadius, theta * i), z: this.sceneObject.height}
            ))
        ];

        const vertexGroups: string[][] = vertexGroupsLiterals.map(vertexGroup => (
            vertexGroup.map(vertex => {
                return `v ${vertex.x} ${vertex.y} ${vertex.z}`;
            })
        ));

        const verticesPerGroup = vertexGroups[0].length;
        const totalVertices = verticesPerGroup * vertexGroups.length;

        this.sceneObject.indexes = [
            iota({start: 1, end: verticesPerGroup, n_torus: 1}),
            iota({start: verticesPerGroup + 1, end: totalVertices, n_torus: 1})
        ];
        this.sceneObject.vertexGroups = vertexGroups;
        this.sceneObject.totalVertices = totalVertices;
        this.sceneObject.verticesPerGroup = verticesPerGroup;

        this.sceneObject.position = vertexGroupsLiterals.flat(2).map(vrt => [vrt.x, vrt.z, vrt.y]).flat() as number[];
        this.sceneObject.indices.length = 0;

        iota({end: this.sceneObject.verticesPerGroup, exclusive: true}).forEach(i => {
            this.sceneObject.indices.push(...[this.sceneObject.indexes[1][i + 1], this.sceneObject.indexes[1][i], this.sceneObject.indexes[0][i]]);
            this.sceneObject.indices.push(...[this.sceneObject.indexes[0][i], this.sceneObject.indexes[0][i + 1], this.sceneObject.indexes[1][i + 1]]);
        });

        this.sceneObject.indices = this.sceneObject.indices.map(i => i - 1);
    }

    #buildTopBottom(): string {
        const buffer: string[] = [];
        const indicesBuffer: number[] = [];
        if (this.sceneObject.faces === 3) {
            buffer.push(`f 3 2 1`);
            indicesBuffer.push(3, 2, 1);
            buffer.push(`f 4 5 6`);
            indicesBuffer.push(4, 5, 6);
        } else if (this.sceneObject.faces === 4) {
            buffer.push('f 5 6 7');
            indicesBuffer.push(5, 6, 7);
            buffer.push('f 7 8 5');
            indicesBuffer.push(7, 8, 5);
            buffer.push('f 3 2 1');
            indicesBuffer.push(3, 2, 1);
            buffer.push('f 1 4 3');
            indicesBuffer.push(1, 4, 3);
        } else {
            const index = this.sceneObject.totalVertices + 1;
            this.sceneObject.vertexGroups[1].push(`v 0 0 0`);
            this.sceneObject.position.push(0, 0, 0);
            this.sceneObject.vertexGroups[1].push(`v 0 0 ${this.sceneObject.height}`);
            this.sceneObject.position.push(0, this.sceneObject.height, 0); // z and y swaped

            buffer.push('# Top bottom faces')
            iota({start: 1, end: this.sceneObject.verticesPerGroup}).forEach(i => {
                const linkIndex = i % this.sceneObject.verticesPerGroup + 1;

                buffer.push(`f ${i} ${index} ${linkIndex}`);
                indicesBuffer.push(i, index, linkIndex,);
                buffer.push(`f ${this.sceneObject.verticesPerGroup + linkIndex} ${index + 1} ${this.sceneObject.verticesPerGroup + i}`);
                indicesBuffer.push(this.sceneObject.verticesPerGroup + linkIndex, index + 1, this.sceneObject.verticesPerGroup + i,);
                buffer.push('');
            });
        }
        this.sceneObject.indices.push(...indicesBuffer.map(i => i - 1));

        return buffer.join('\n');
    }

    #buildObject() {
        this.#calcObject();
        const topBottom: string = this.#buildTopBottom();

        this.buffer.length = 0;

        this.buffer.push(`# Created by me :)`);
        this.buffer.push(`# Dimensions \t:`);
        this.buffer.push(`# \tFaces       : ${this.sceneObject.faces}`);
        this.buffer.push(`# \tBase radius : ${this.sceneObject.lowerRadius}`);
        this.buffer.push(`# \tTop radius  : ${this.sceneObject.upperRadius}`);
        this.buffer.push(`# \tHeight      : ${this.sceneObject.height}`);
        this.buffer.push(``);

        this.buffer.push(`o Figure`);
        this.buffer.push(this.sceneObject.vertexGroups.map(group => group.join('\n')).join('\n\n'))
        this.buffer.push('');

        this.buffer.push('# Side Faces')
        iota({end: this.sceneObject.verticesPerGroup, exclusive: true}).forEach(i => {
            this.buffer.push(`f ${this.sceneObject.indexes[1][i + 1]} ${this.sceneObject.indexes[1][i]} ${this.sceneObject.indexes[0][i]}`);
            this.buffer.push(`f ${this.sceneObject.indexes[0][i]} ${this.sceneObject.indexes[0][i + 1]} ${this.sceneObject.indexes[1][i + 1]}`);
            this.buffer.push('');
        });

        this.buffer.push(topBottom);

        this.output.innerText = this.buffer.join('\n');
    }

    #setUpUI() {
        const gui = new GUI({title: 'Object Controls', width: 500});

        gui.onChange(this.#buildObject.bind(this));
        gui.add(this.sceneObject, 'faces', 3, 36, 1).name(`Faces`);
        gui.add(this.sceneObject, 'height', 1.0, 2.0, 0.005).name('Height');
        gui.add(this.sceneObject, 'upperRadius', 0.5, 2.0, 0.005).name('Upper radius');
        gui.add(this.sceneObject, 'lowerRadius', 0.5, 2.0, 0.005).name('Lower radius');
        // gui.add(this.sceneObject, 'scale', 0.5, 2.0, 0.005).name('Scaling');

        gui.add(this.sceneObject.rotation, 'x', 0, 2 * Math.PI, Math.PI / 100).name('Rotation x');
        gui.add(this.sceneObject.rotation, 'y', 0, 2 * Math.PI, Math.PI / 100).name('Rotation y');
        gui.add(this.sceneObject.rotation, 'z', 0, 2 * Math.PI, Math.PI / 100).name('Rotation z');

        makeGUIDraggable(gui);
    }

    #setUpListener() {
        document.addEventListener('wheel', (e: WheelEvent) => {
            const percent = (e.deltaY / window.innerHeight) * 100;
            const newValue = this.sceneObject.scale.n + (this.sceneObject.scale.n * percent * 0.01)

            this.sceneObject.scale.n = Math.min(Math.max(newValue, this.sceneObject.scale.min), this.sceneObject.scale.max);
        });
    }

    private readonly gl: WebGL2RenderingContext;
    private readonly output: HTMLElement;
    private readonly buffer: string[];
    private readonly programInfo: ProgramInfo;
    private readonly sceneObject: {
        faces: number; height: number;
        upperRadius: number; lowerRadius: number;
        vertexGroups: string[][]; indexes: number[][];
        totalVertices: number; verticesPerGroup: number;
        position: number[], indices: number[];
        rotation: Vertex; scale: {min: number, n: number, max:number};
    };
}

export default App;