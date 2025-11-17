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
    private output: HTMLElement;
    private readonly elements: string[];

    constructor(output: HTMLElement) {
        this.output = output;
        this.elements = [];
    }

    getElement(): number {
        this.elements.push('');

        return this.elements.length - 1;
    }

    update(value: string, id: number) {
        this.elements[id] = value;

        this.output.innerHTML = `<ul>${this.elements
            .filter(elm => elm !== '')
            .map(elm => (`<li>${elm}</li>`))
            .join('')
        }</ul>`;
    }

    buildObject(
        faces: number = scene.object.facesNum,
        height: number = scene.object.height,
        upperRadius: number = scene.object.upperRadius,
        lowerRadius: number = scene.object.lowerRadius
    ) {
        // ${
        //     Array(faces)
        //         .fill(0)
        //         .map((elm: number, i: number) =>
        //             (`v ${elm}  # ${i}`)
        //         )
        //         .join('\n')
        // }

        const output = `
            # Created by me :)
            # Faces: ${faces}
            # Dimensions: (x1 = ${lowerRadius}, x2 = ${upperRadius}, y = ${height})
            
            o Cube
            
            v ${-lowerRadius} ${lowerRadius} 0.0
            v ${lowerRadius} ${lowerRadius} 0.0
            v ${lowerRadius} ${-lowerRadius} 0.0
            v ${-lowerRadius} ${-lowerRadius} 0.0
            
            v ${-upperRadius} ${upperRadius} ${height}
            v ${upperRadius} ${upperRadius} ${height}
            v ${upperRadius} ${-upperRadius} ${height}
            v ${-upperRadius} ${-upperRadius} ${height}
            
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

        this.output.innerText = `${output}`;
    }

}


function setUpUI(api: OutputAPI) {
    const gui = new GUI();

    const folderConfigObj = gui.addFolder('Object configuration (.obj)');

    folderConfigObj
        .add(scene.object, 'facesNum', 4, 36, 1)
        .name(`Number of Faces`)
        .onChange(() => {
            api.buildObject();
        });

    folderConfigObj
        .add(scene.object, 'height', 1.0, 40.0, 0.5)
        .name('Height')
        .onChange(() => {
            api.buildObject();
        });


    folderConfigObj
        .add(scene.object, 'upperRadius', 0.5, 40.0, 0.5)
        .name('Upper radius')
        .onChange(() => {
            api.buildObject();
        });

    folderConfigObj
        .add(scene.object, 'lowerRadius', 0.5, 40.0, 0.5)
        .name('Lower radius')
        .onChange(() => {
            api.buildObject();
        });

    folderConfigObj.open();

}


function main() {
    const output = document.getElementById('output') as HTMLElement;
    const outputApi = new OutputAPI(output as HTMLElement);
    const cpOutput = document.getElementById('cp-output') as HTMLButtonElement;


    cpOutput.addEventListener('click', async () => {
        // try {
        //     await navigator.clipboard.writeText(output.textContent);
        // } catch (err) {
        //     window.alert(`Failed to copy: ${err}`)
        // }

        const content = (output.textContent ?? '').trim().split('            ').join('\n');
        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'model.obj';
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
    });
    outputApi.buildObject();

    setUpUI(outputApi);

    return 0;
}

export {main};