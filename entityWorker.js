let struct = Object.fromEntries(["x", "y", "vel", "angle", "angVel", "wiggly"].map((x, i) => [x, i])),
bytesPerProp = 4,

structPropCount = Object.values(struct).length,
allocPerEntity = structPropCount * bytesPerProp,

width = 512,
height = 512,
degToRad = Math.PI / 180;

self.onmessage = (msg) => {
    let buff = msg.data,
        entity = {},
        entityBuffer = new Float32Array(buff);

    for (let i = 0; i < entityBuffer.length; i += structPropCount) {

        //translate buffer data into entity
        for (let key in struct) {
            entity[key] = entityBuffer[i + struct[key]];
        }

        //do physics
        entity.x += Math.sin(entity.angle * degToRad) * entity.vel;
        entity.y += Math.cos(entity.angle * degToRad) * entity.vel;
        entity.angVel += (Math.random() - 0.5) * 2 * entity.wiggly;
        entity.angVel *= 0.95;
        entity.angle += entity.angVel;

        //apply limits
        if (entity.x < 0) entity.x += width;
        if (entity.y < 0) entity.y += height;
        if (entity.x > width) entity.x -= width;
        if (entity.y > height) entity.y -= height;
        if (entity.angle < 0) entity.angle += 360;
        if (entity.angVel < 0) entity.angVel += 360;
        if (entity.angle > 360) entity.angle -= 360;
        if (entity.angVel > 360) entity.angVel -= 360;

        //translate back to buffer
        for (let key in struct) {
            entityBuffer[i + struct[key]] = entity[key];
        }
    }

    self.postMessage(buff, [buff]);
};