import GUI from "lil-gui";


const scene = {
    object: {
        facesNum: 4,
        height: 1,
        upperRadius: 1,
        lowerRadius: 1,
    }
}

interface args {
    start?: number;
    end?: number;
    n_torus?: number;
    exclusive?: boolean;
}

function iota({start = 0, end = 10, n_torus = 0, exclusive = false}: args = {}): number[] {
    if (start > end) throw new Error(`Start bigger than end: ${start} > ${end}`);
    if (n_torus < 0) throw new Error(`N torus cant be negative '${n_torus}'`);
    if (!exclusive) end++;

    return Array.from({length: end - start + n_torus}, (_, i) => start + (i % (end - start)));
}

// function fold(arr: number[], n: number = 2): number[][] {
//     const size = Math.ceil(arr.length / n);
//     const result: number[][] = [];
//
//     for (let i = 0; i < arr.length; i += size - 1) {
//         const to_add = arr.slice(i, i + size);
//
//         if (to_add.length === size) result.push(to_add);
//     }
//
//     return result;
// }

type Vertex = { x: number, y: number, z: number };

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

        const verticeGroups: Vertex[][] = [
            [
                {x: -lowerRadius, y: lowerRadius, z: 0.0},
                {x: lowerRadius, y: lowerRadius, z: 0.0},
                {x: lowerRadius, y: -lowerRadius, z: 0.0},
                {x: -lowerRadius, y: -lowerRadius, z: 0.0}
            ], [
                {x: -upperRadius, y: upperRadius, z: height},
                {x: upperRadius, y: upperRadius, z: height},
                {x: upperRadius, y: -upperRadius, z: height},
                {x: -upperRadius, y: -upperRadius, z: height}
            ]
        ];

        const verticeGroupsString: string[][] = verticeGroups.map(vertexGroup => (
            vertexGroup.map(vertex => {
                return `v ${vertex.x} ${vertex.y} ${vertex.z}`;
            })
        ));

        const totalVertices = verticeGroups[0].length * verticeGroups.length;
        const verticesPerGroup = verticeGroups[0].length;
        const indexes = [
            iota({start: 1, end: totalVertices / 2, n_torus: 1}),
            iota({start: totalVertices / 2 + 1, end: totalVertices, n_torus: 1})
        ];

        let top_bottom = '';
        switch (faces) {
            case 3:
                top_bottom = (`
                    f 1 2 3
                    
                    f 4 5 6`
                );
                break;
            case 4:
                top_bottom = (
                    `f 7 6 5
                    f 5 8 7

                    f 1 2 3
                    f 3 4 1`
                );
                break;
            default:
                break;
        }

        this.objectBuilt = `
            # Created by me :)
            # Faces: ${faces}
            # Dimensions: (x1 = ${lowerRadius}, x2 = ${upperRadius}, y = ${height})
            
            o Figure
            ${verticeGroupsString.map(grp => grp.join('\n')).join('\n\n')}
            
            ${
            iota({end: verticesPerGroup, exclusive: true})
                .map(i => (
                    `f ${indexes[0][i]} ${indexes[1][i]} ${indexes[1][i + 1]}
                     f ${indexes[1][i + 1]} ${indexes[0][i + 1]} ${indexes[0][i]}`
                )).join('\n\n')
        }
        
            ${top_bottom}

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
        .add(scene.object, 'facesNum', 3, 36, 1).name(`Number of Faces`);

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