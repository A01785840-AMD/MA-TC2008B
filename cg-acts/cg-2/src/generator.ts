import GUI from "lil-gui";


const scene = {
    object: {
        facesNum: 4,
        height: 1,
        upperRadius: 1,
        lowerRadius: 1,
    }
}

function iota(start: number, end: number, {n_torus = 0, exclusive = false} = {}): number[] {
    if (start > end) throw new Error(`${start} > ${end}`);
    if (!exclusive) end++;

    return Array.from({length: end - start + n_torus}, (_, i) => start + (i % (end - start)));
}

function fold(arr: number[], n: number = 2): number[][] {
    const size = Math.ceil(arr.length / n);
    const result: number[][] = [];

    for (let i = 0; i < arr.length; i += size - 1) {
        const to_add = arr.slice(i, i + size);

        if (to_add.length === size) result.push(to_add);
    }

    return result;
}

interface vec3d {
    x?: number;
    y?: number;
    z?: number;
}

class Vertex {
    x: number;
    y: number;
    z: number;

    constructor({x = 0, y = 0, z = 0}: vec3d = {}) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    to_string(): string {
        return `v ${this.x} ${this.y} ${this.z}`;

    }
}

class OutputAPI {
    constructor(output: HTMLElement) {
        this.output = output;
        this.objectBuilt = "";
    }

    get content(): string {
        return this.objectBuilt;
    }

    buildObject(
        faces: number = scene.object.facesNum,
        height: number = scene.object.height,
        upperRadius: number = scene.object.upperRadius,
        lowerRadius: number = scene.object.lowerRadius
    ) {

        const verticeGroups: string[][] = [
            [
                new Vertex({x: -lowerRadius, y: lowerRadius, z: 0.0}).to_string(),
                new Vertex({x: lowerRadius, y: lowerRadius, z: 0.0}).to_string(),
                new Vertex({x: lowerRadius, y: -lowerRadius, z: 0.0}).to_string(),
                new Vertex({x: -lowerRadius, y: -lowerRadius, z: 0.0}).to_string()
            ], [
                new Vertex({x: -upperRadius, y: upperRadius, z: height}).to_string(),
                new Vertex({x: upperRadius, y: upperRadius, z: height}).to_string(),
                new Vertex({x: upperRadius, y: -upperRadius, z: height}).to_string(),
                new Vertex({x: -upperRadius, y: -upperRadius, z: height}).to_string()
            ]
        ];

        const totalVertices = verticeGroups[0].length * verticeGroups.length;
        const verticesPerGroup = verticeGroups[0].length;
        const indexes = [
            iota(1, totalVertices / 2, {n_torus: 1}),
            iota(totalVertices / 2 + 1, totalVertices, {n_torus: 1})
        ];

        this.objectBuilt = `
            # Created by me :)
            # Faces: ${faces}
            # Dimensions: (x1 = ${lowerRadius}, x2 = ${upperRadius}, y = ${height})
            
            o Figure
            ${verticeGroups.map(grp => grp.join('\n')).join('\n\n')}
            
            ${
            iota(0, verticesPerGroup, {exclusive: true})
                .map((i) => (
                    `f ${indexes[0][i]} ${indexes[1][i]} ${indexes[1][i + 1]}
                     f ${indexes[1][i + 1]} ${indexes[0][i + 1]} ${indexes[0][i]}`
                )).join('\n\n')
        }
        
            ${fold(indexes[1]).map(grp => `f ${grp.reverse().join(' ')}`).join("\n")}
            
            ${fold(indexes[0]).map(grp => `f ${grp.join(' ')}`).join("\n")}
             
        `;

        this.objectBuilt = this.objectBuilt.trim().split('\n').map(obj => obj.trim()).join('\n');

        this.output.innerText = `${this.objectBuilt}`;
    }

    private output: HTMLElement;
    private objectBuilt: string;
}


function setUpUI(onChange: () => void) {
    const gui = new GUI();

    const folderConfigObj = gui.addFolder('Object configuration (.obj)');
    folderConfigObj.onChange(() => onChange());

    folderConfigObj
        .add(scene.object, 'facesNum', 4, 36, 1).name(`Number of Faces`);

    folderConfigObj
        .add(scene.object, 'height', 1.0, 40.0, 0.5).name('Height');

    folderConfigObj
        .add(scene.object, 'upperRadius', 0.5, 40.0, 0.5).name('Upper radius');

    folderConfigObj
        .add(scene.object, 'lowerRadius', 0.5, 40.0, 0.5).name('Lower radius');

    folderConfigObj.open();
}

function handleFileDownload(getContent: () => Blob) {
    return async () => {
        const blob = getContent();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'model.obj';
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
    }
}

function main() {
    const cpOutput = document.getElementById('cp-output') as HTMLButtonElement;
    const output = document.getElementById('output') as HTMLElement;
    const outputApi = new OutputAPI(output);

    const downloadFile = handleFileDownload(() => {
        const content = outputApi.content
        return new Blob([content], {type: 'text/plain;charset=utf-8'});
    });

    cpOutput.addEventListener('click', downloadFile);

    outputApi.buildObject();
    setUpUI(() => outputApi.buildObject());
}


export {main};