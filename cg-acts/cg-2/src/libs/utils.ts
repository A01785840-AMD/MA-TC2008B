import GUI from 'lil-gui';


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

    if (n_torus === 0) {
        return Array.from({length: end - start}, (_, i) => start + i);
    }

    return Array.from({length: end - start + n_torus}, (_, i) => start + (i % (end - start)));
}

function polarToCartesian(radius: number, theta: number): { x: number, y: number } {
    const x: number = radius * Math.cos(theta);
    const y: number = radius * Math.sin(theta);

    return {x: x, y: y};
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

type Vertex = { x: number, y: number, z: number };


function makeGUIDraggable(gui: GUI) {
    const guiElement = gui.domElement;
    const titleElement = guiElement.querySelector('.lil-title') as HTMLElement;

    if (!titleElement) return;

    let isDragging = false;
    let hasMoved = false;
    let offsetX = 0;
    let offsetY = 0;
    let startX = 0;
    let startY = 0;
    const DRAG_THRESHOLD = 5;

    titleElement.addEventListener('mousedown', (e: MouseEvent) => {
        isDragging = true;
        hasMoved = false;

        const rect = guiElement.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        startX = e.clientX;
        startY = e.clientY;

        titleElement.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);

        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
            hasMoved = true;
            e.preventDefault();

            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;

            guiElement.style.setProperty('left', `${newX}px`, 'important');
            guiElement.style.setProperty('top', `${newY}px`, 'important');
            guiElement.style.setProperty('right', 'auto', 'important');
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            titleElement.style.cursor = 'grab';
        }
    });

    titleElement.addEventListener('click', (e: MouseEvent) => {
        if (hasMoved) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            hasMoved = false;
        }
    }, true);
}

export {
    iota,
    polarToCartesian,
    handleFileDownload,
    makeGUIDraggable
};

export type { Vertex };
