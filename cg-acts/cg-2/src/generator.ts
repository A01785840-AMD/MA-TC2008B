import GUI from "lil-gui";


const scene = {
    object: {
        height: 0,
        facesNum: 0,
        halfWidth: 0,
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

}


function setUpUI(api: OutputAPI) {
    const gui = new GUI();

    const folderConfigObj = gui.addFolder('Object configuration (.obj)');

    const facesElm = api.getElement()
    folderConfigObj
        .add(scene.object, 'facesNum', 4, 36, 1)
        .name(`Number of Faces`)
        .onChange((value: number) => {
            api.update(`Faces value: ${value}`, facesElm);
        });

    const heightElm = api.getElement();
    folderConfigObj
        .add(scene.object, 'height', 0.0, 100.0, 0.5)
        .name('Object height')
        .onChange((value: number) => {
            api.update(`Height value: ${value}`, heightElm);
        });

    const widthElm = api.getElement();
    folderConfigObj
        .add(scene.object, 'halfWidth', 0.0, 100.0, 0.5)
        .name('Object half width')
        .onChange((value: number) => {
            api.update(`Width value: ${value}`, widthElm);
        });

    folderConfigObj.open();

}


function main() {
    const output = document.getElementById('output');

    const outputApi = new OutputAPI(output as HTMLElement);
    
    setUpUI(outputApi);

    return 0;
}

export {main};