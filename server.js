let fs = require('fs'),
    path = require('path'),
    mimeSet = {
        "js": "application/javascript",
        "css": "text/css",
        "html": "text/html",
    },
    publicRoot = __dirname + '\\';

require('http').createServer((req, res) => {
    let fileToGet = path.join(publicRoot, req.url);

    if (fileToGet == publicRoot) {
        fileToGet = path.join(publicRoot, 'index.html');
    }

    console.log(fileToGet);

    if (!fs.existsSync(fileToGet)) {
    	res.writeHead(404);
    	return res.end();
    }

    //return the file
    res.writeHead(200, { 'Content-Type': mimeSet[ fileToGet.split('.').pop() ] || 'text/html' });
    return fs.createReadStream(fileToGet).pipe(res);
}).listen(3000);

console.log("Am runnin'.");