var wrapper = document.getElementById("paper-wrapper")
let pos = { top: 0, left: 0, x: 0, y: 0 };

var viewCanvas = document.getElementById("view-layer");
var interactionCanvas = document.getElementById("interaction-layer");
var viewCtx = viewCanvas.getContext("2d", { alpha: false });
var interactionCtx = interactionCanvas.getContext("2d");

let viewImageData = viewCtx.createImageData(1000, 1000);
let poinerImageData = interactionCtx.createImageData(1, 1);


function drawView(raw) {
    let compressed = new Uint8ClampedArray(raw);
    let pixels = pako.inflate(compressed);

    var data = viewImageData.data;
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

    viewCtx.putImageData(viewImageData, 0, 0)
}

var hold = { left: false, right: false, down: false, up: false, speed: false };
function kbscroll() {
    let topd = (hold.down * 25 * (hold.speed ? 3 : 1)) + (hold.up * -25 * (hold.speed ? 3 : 1))
    let leftd = (hold.right * 25 * (hold.speed ? 3 : 1)) + (hold.left * -25 * (hold.speed ? 3 : 1))
    wrapper.scrollTo(wrapper.scrollLeft + leftd, wrapper.scrollTop + topd);
    window.requestAnimationFrame(kbscroll);
}
window.requestAnimationFrame(kbscroll);

document.body.onkeydown = function (e) {
    var code = e.keyCode;
    if (code === 87 || code === 38) hold.up = true;   // w or up arrow
    if (code === 65 || code === 37) hold.left = true; // a or left arrow
    if (code === 83 || code === 40) hold.down = true; // s or down arrow
    if (code === 68 || code == 39) hold.right = true; // d or right arrow
    if (code == 16) hold.speed = true;                // shift
};
document.body.onkeyup = function (e) {
    var code = e.keyCode;
    if (code === 87 || code === 38) hold.up = false;
    if (code === 65 || code === 37) hold.left = false;
    if (code === 83 || code === 40) hold.down = false;
    if (code === 68 || code == 39) hold.right = false;
    if (code == 16) hold.speed = false;
};


async function placePixel(x, y) {
    await fetch('http://192.168.0.123:3000/pixels', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({ position: y * 1000 + x, color: 0x0000FF })
    });
};

function findXY(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const elementRelativeX = e.clientX - rect.left;
    const elementRelativeY = e.clientY - rect.top;
    const x = Math.floor(elementRelativeX * canvas.width / rect.width);
    const y = Math.floor(elementRelativeY * canvas.height / rect.height);
    return [x, y];
}

function drawPointer(x, y) {
    poinerImageData.data[0] = 0x00;
    poinerImageData.data[1] = 0x00;
    poinerImageData.data[2] = 0x00;
    poinerImageData.data[3] = 0x33;
    interactionCtx.putImageData(poinerImageData, x, y);
}

let socket = new WebSocket("ws://192.168.0.123:3000/pixels/stream");
socket.binaryType = "arraybuffer";
socket.onmessage = function (event) {
    drawView(event.data);
}

interactionCanvas.addEventListener('mousedown', function (e) {
    const [x, y] = findXY(e, interactionCanvas);
    placePixel(x, y)
});

interactionCanvas.addEventListener('mousemove', function (e) {
    const [x, y] = findXY(e, interactionCanvas);
    if (interactionCtx.previousCoords != undefined && (x != interactionCtx.previousCoords.x || y != interactionCtx.previousCoords.y)) {
        document.getElementById("coords").innerHTML = `X: ${x + 1} | Y: ${y + 1}`
        interactionCtx.clearRect(interactionCtx.previousCoords.x, interactionCtx.previousCoords.y, 1, 1);
        drawPointer(x, y);
    }
    interactionCtx.previousCoords = { x, y };
});
