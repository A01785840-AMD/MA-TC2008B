import './style.css';
import App from "./app.ts";


function main() {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = (`
        <div>
            <h1>OBJ Gen</h1>
            <div id="output-container">
                <button id="cp-output">Download</button>
                <div id="output"></div>
            </div>
        </div>`
    );

    const cpOutput = document.getElementById('cp-output') as HTMLButtonElement;
    const output = document.getElementById('output') as HTMLElement;
    const app = new App(output, cpOutput);

    app.run();
}

main();