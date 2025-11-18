import GUI from "lil-gui";
import type {Vertex} from "./libs/utils.ts";
import {handleFileDownload, iota, polarToCartesian} from "./libs/utils.ts";


class App {
    constructor(output: HTMLElement, cpOutput: HTMLElement) {
        this.output = output;
        this.buffer = [];
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
            indices: []
        };

        cpOutput.addEventListener('click', handleFileDownload(() => {
            return new Blob([this.#content], {type: 'text/plain;charset=utf-8'});
        }));
    }

    run() {
        this.#buildObject();
        this.#setUpUI();
    }

    getContentAsArrays() {
        const arr = {
            position: this.sceneObject.position,
            indices: this.sceneObject.indices
        };
        console.log(arr);
        return arr;
    }

    getContentAsLinesArrays() {
        // Convert triangle indices to line indices
        const lineIndices: number[] = [];
        const triangleIndices = this.sceneObject.indices;

        // Process triangles (every 3 indices form a triangle)
        for (let i = 0; i < triangleIndices.length; i += 3) {
            const v0 = triangleIndices[i];
            const v1 = triangleIndices[i + 1];
            const v2 = triangleIndices[i + 2];

            // Add the three edges of the triangle
            lineIndices.push(v0, v1);
            lineIndices.push(v1, v2);
            lineIndices.push(v2, v0);
        }

        const arr = {
            position: this.sceneObject.position,
            indices: lineIndices
        };
        console.log('Line indices:', arr);
        return arr;
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
            this.sceneObject.position.push(0, 0,0);
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
        const gui = new GUI();
        const folderConfigObj = gui.addFolder('Object configuration (.obj)');

        folderConfigObj.onChange(this.#buildObject.bind(this));
        folderConfigObj.add(this.sceneObject, 'faces', 3, 36, 1).name(`Number of Faces`);
        folderConfigObj.add(this.sceneObject, 'height', 1.0, 2.0, 0.005).name('Height');
        folderConfigObj.add(this.sceneObject, 'upperRadius', 0.5, 2.0, 0.005).name('Upper radius');
        folderConfigObj.add(this.sceneObject, 'lowerRadius', 0.5, 2.0, 0.005).name('Lower radius');

        folderConfigObj.open();
    }

    private readonly output: HTMLElement;
    private readonly buffer: string[];
    private readonly sceneObject: {
        faces: number; height: number;
        upperRadius: number; lowerRadius: number;
        vertexGroups: string[][]; indexes: number[][];
        totalVertices: number; verticesPerGroup: number;
        position: number[], indices: number[];
    };
}

export default App;