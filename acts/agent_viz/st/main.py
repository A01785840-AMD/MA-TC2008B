import eventlet

eventlet.monkey_patch()

from flask_socketio import SocketIO
from flask import Flask, jsonify

app = Flask(__name__)
sio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)


@app.route('/')
def index():
    return jsonify({'status': 'ok'})


@sio.on('connect')
def on_connect():
    print('connected')

    sio.emit('message', {'hello': 'hello'})


@sio.on('disconnect')
def on_disconnect():
    print('disconnected')


from threading import Thread
from time import sleep


def hello():
    i: int = 0
    while True:
        sleep(5)
        print("Send hello")
        sio.emit('message', f'Hello n: {i}')
        i += 1


def main():
    thread = Thread(target=hello)
    thread.start()
    sio.run(app, debug=True, host='0.0.0.0', port=5000)


if __name__ == '__main__':
    main()
