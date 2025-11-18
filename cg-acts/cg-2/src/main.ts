import './style.css';
import App from "./app.ts";


function main() {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = (`
        <canvas id="canvas"></canvas>
        <div id="container">
            <h1>.obj generator</h1> 
        </div>
        <div id="output-container">
            <div class="shadow-overlay"></div>
            <a id="cp-output">Download</a>
        <div id="output"></div>
    `);

    const canvas = document.getElementById(`canvas`) as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

    const cpOutput = document.getElementById('cp-output') as HTMLButtonElement;
    const output = document.getElementById('output') as HTMLElement;

    const app = new App(gl, output, cpOutput);

    app.run();
}

main();