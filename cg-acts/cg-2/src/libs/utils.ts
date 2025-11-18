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

export {
    iota,
    polarToCartesian,
    handleFileDownload
};

export type { Vertex };
