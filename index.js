let struct = Object.fromEntries(["x", "y", "vel", "angle", "angVel", "wiggly"].map((x, i) => [x, i])),
renderThreads = 16,
entityThreads = 4,
entitiesPerThread = 128,
bytesPerProp = 4,

structPropCount = Object.values(struct).length,
allocPerEntity = structPropCount * bytesPerProp,
subBufferPerRenderThread = 512 * 512 * 4 / renderThreads,
subBufferPerEntityThread = allocPerEntity * entitiesPerThread,

entityBuffer = new ArrayBuffer(entityThreads * subBufferPerEntityThread),
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
    constructor (file, id, update, BuffArray) {
        this.worker = new Worker(file);
        this.id = id;
        this.update = update;
        this.BuffArray = BuffArray;
    }
    listen (start, Resolve) {
        this.worker.addEventListener("message", msg => {
            this.update(start, new this.BuffArray(msg.data));
            Resolve();
        }, {
            once: true
        })
    }
    tick (buffer, subBufferLength) {
        let start = this.id * subBufferLength,
            buff = buffer.slice(start, start + subBufferLength);
        this.worker.postMessage(buff, [buff]);
        return new Promise(Resolve => this.listen(start, Resolve));
    }
}

let canvas = document.getElementsByTagName('canvas')[0],
    ctx = canvas.getContext('2d'),
    imageData;

//da engine loop
async function main() {
    let start = performance.now();

    await Promise.all(entityThreads.map(t => t.tick(entityBuffer, subBufferPerEntityThread)));

    imageData = ctx.getImageData(0, 0, 512, 512);
    await Promise.all(renderThreads.map(t => t.tick(imageData.data.buffer, subBufferPerRenderThread)));
    ctx.putImageData(imageData, 0, 0);

    ctx.fillStyle = 'white';
    for (let i = 0; i < editableBuffer.length; i += structPropCount) {
        ctx.fillRect(editableBuffer[i + struct.x] - 1, editableBuffer[i + struct.y] - 1, 2, 2);
    }

    setTimeout(main, 20);
}

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);

function makeThreadArray(count, file, BuffArray, update) {
    return Array(count).fill().map((_, i) => new Thread(file, i, update, BuffArray));
}

entityThreads = makeThreadArray(entityThreads, 'entityWorker.js', Float32Array,
(start, buff) => {
    for (let i = 0; i < buff.length; i++) {
        editableBuffer[start + i] = buff[i];
    }
});

renderThreads = makeThreadArray(renderThreads, 'renderWorker.js', Uint8ClampedArray,
(start, buff) => {
    for (let i = 0; i < buff.length; i++) {
        imageData.data[start + i] = buff[i];
    }
});

main();