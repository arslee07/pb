var canvas = document.getElementById("paper");
var ctx = canvas.getContext("2d");

function rawToImageData(raw) {
    let compressed = new Uint8ClampedArray(raw);
    let pixels = pako.inflate(compressed);

    var imageData = ctx.createImageData(1000, 1000);
    var data = imageData.data;
    var len = data.length;
    var i = 0;
    var t = 0;

    for (; i < len; i += 4) {
        data[i] = pixels[t];
        data[i + 1] = pixels[t + 1];
        data[i + 2] = pixels[t + 2];
        data[i + 3] = 255;

        t += 3;
    }

    return imageData;
}

async function placePixel(x, y) {
    await fetch('http://localhost:3000/pixels', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({ position: y * 1000 + x, color: 0x0000FF })
    });
};

fetch('http://localhost:3000/pixels').then((resp) => resp.arrayBuffer()).then((data) => {
    imageData = rawToImageData(data)
    ctx.putImageData(imageData, 0, 0);
});


canvas.addEventListener('mousedown', function (e) {
    const rect = canvas.getBoundingClientRect();
    const elementRelativeX = e.clientX - rect.left;
    const elementRelativeY = e.clientY - rect.top;
    const x = Math.floor(elementRelativeX * canvas.width / rect.width);
    const y = Math.floor(elementRelativeY * canvas.height / rect.height);
    console.log("x: " + x + " y: " + y)

    placePixel(x, y)
});