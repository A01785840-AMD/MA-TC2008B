import GUI from "lil-gui";


const scene = {
    object: {
        facesNum: 4,
        height: 1,
        upperRadius: 1,
        lowerRadius: 1,
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
        const verticeGroups: number[][][] = [
            [
                [-lowerRadius, lowerRadius, 0.0],
                [lowerRadius, lowerRadius, 0.0],
                [lowerRadius, -lowerRadius, 0.0],
                [-lowerRadius, -lowerRadius, 0.0]
            ], [
                [-upperRadius, upperRadius, height],
                [upperRadius, upperRadius, height],
                [upperRadius, -upperRadius, height],
                [-upperRadius, -upperRadius, height]
            ]
        ];

        this.objectBuilt = `
            # Created by me :)
            # Faces: ${faces}
            # Dimensions: (x1 = ${lowerRadius}, x2 = ${upperRadius}, y = ${height})
            
            o Cube
            
            ${
            verticeGroups
                .map((group: number[][]) =>
                    (group.map((vertice: number[]) =>
                        (`v ${vertice[0]} ${vertice[1]} ${vertice[2]}`)
                    ).join('\n'))
                ).join('\n\n')
        }
            
            # back face
            f 1 2 3
            f 3 4 1
            
            # front face
            f 7 6 5
            f 5 8 7
            
            # left face
            f 8 5 1
            f 1 4 8
            
            # right face
            f 2 6 7
            f 7 3 2
            
            #lower face
            f 7 8 4
            f 4 3 7
            
            # upper face
            f 6 2 1
            f 1 5 6
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