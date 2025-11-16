import './style.css';
import {main} from "./generator.ts";


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>.obj generator</h1>
    <div id="output-container">
        <button id="cp-output">[--]</button>
        <div id="output"></div>
    </div>
<!--    <canvas></canvas>-->
  </div>
`

main();