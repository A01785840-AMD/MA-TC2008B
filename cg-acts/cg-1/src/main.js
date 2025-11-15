import './style.css'
import happyFace from "./happy-face.js";

document.querySelector('#app').innerHTML = `
<div id="title">CG-1: Happy Face</div>
<canvas id="canvas"></canvas>
`
happyFace()
