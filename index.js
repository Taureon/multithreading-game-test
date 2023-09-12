let struct = Object.fromEntries(["x", "y", "vel", "angle", "angVel", "wiggly"].map((x, i) => [x, i])),
threads = 4,
entitiesPerThread = 16,
bytesPerProp = 4,

structPropCount = Object.values(struct).length,
allocPerEntity = structPropCount * bytesPerProp,
subBufferPerThread = allocPerEntity * entitiesPerThread,
entityBuffer = new ArrayBuffer(threads * subBufferPerThread),
editableBuffer = new Float32Array(entityBuffer);

// generate entities
for (let i = 0; i < editableBuffer.length; i += structPropCount) {
    let x = Math.random() * 512,
        y = Math.random() * 512,
        vel = Math.random() * 5,
        angle = Math.random() * 360,
        angVel = Math.random() * 20 - 10,
        wiggly = Math.random() * 5;
    editableBuffer[i + struct.x] = x;
    editableBuffer[i + struct.y] = y;
    editableBuffer[i + struct.vel] = vel;
    editableBuffer[i + struct.angle] = angle;
    editableBuffer[i + struct.angVel] = angVel;
    editableBuffer[i + struct.wiggly] = wiggly;
}

class Thread {
    constructor (id) {
        this.worker = new Worker('worker.js');
        this.id = id;
    }
    update (start, buff) {
        for (let i = 0; i < buff.length; i++) {
            editableBuffer[start + i] = buff[i];
        }
    }
    listen (start, Resolve) {
        this.worker.addEventListener("message", msg => {
            this.update(start, new Float32Array(msg.data));
            Resolve();
        }, {
            once: true
        })
    }
    tick () {
        let start = this.id * subBufferPerThread,
            buff = entityBuffer.slice(start, start + subBufferPerThread);
        this.worker.postMessage(buff, [buff]);
        return new Promise(Resolve => this.listen(start, Resolve));
    }
}

let canvas = document.getElementsByTagName('canvas')[0],
    ctx = canvas.getContext('2d');

function render() {
    ctx.fillStyle = 'white';
    for (let i = 0; i < editableBuffer.length; i += structPropCount) {
        ctx.fillRect(editableBuffer[i + struct.x] - 1, editableBuffer[i + struct.y] - 1, 2, 2);
    }
}

//da engine loop
async function main() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    threads = Array(threads).fill().map((_, i) => new Thread(i));
    while(true) {
        let start = performance.now();

        await Promise.all(threads.map(t => t.tick()));

        render();

        //force 50 tps
        while (performance.now() < start + 20) {}
    }
}

main();