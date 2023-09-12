self.onmessage = (msg) => {
    let buff = msg.data,
        pixelData = new Uint8Array(buff);

    for (let i = 0; i < pixelData.length; i++) {
        if (pixelData[i]) {
            //pixelData[i]--;
        }
    }

    self.postMessage(buff, [buff]);
};