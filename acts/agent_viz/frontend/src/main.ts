import './style.css';
import {io} from 'socket.io-client';


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Hello World</h1>
    <button id="init-simulation">Init Simulation</button>
    <canvas id="canvas"></canvas>
  </div>
`;

const socket = io('/');

document.getElementById('init-simulation')?.addEventListener('click', () => {
    console.log('init simulation send');
    fetch('/api/simulation/initialize?start_simulation=true', {
        method: 'POST',
    })
        .then((res) => res.json())
        .then((res) => {
            console.log("Response returned", res);
        }).catch(err => {
        console.log(err);
    });
});

interface AgentSerialization {
    id: number;
    type: string; // 'main'
    position: number[];
}

interface MModelSerialization {
    model_id: number;
    step: number;
    timestamp: number;
    created: AgentSerialization[];
    updated: AgentSerialization[];
    deleted: number[];
}

socket.on('connect', () => {
    console.log('connected');
});

socket.on('update', (data: MModelSerialization) => {
    console.log('update', data);
});

socket.on('disconnect', () => {
    console.log('disconnected');
});

setInterval(() => {
    socket.emit('message', {"Hello": "1st world"});
}, 5000);