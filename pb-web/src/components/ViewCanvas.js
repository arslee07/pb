import { React, useEffect, useRef, useState } from 'react';
import { inflate } from 'pako';

function drawView(raw, ctx, imageData) {
    let compressed = new Uint8ClampedArray(raw);
    let pixels = inflate(compressed);

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

    ctx.putImageData(imageData, 0, 0)
}

function drawPixel(color, position, ctx, imageData) {
    var red = color >> 16;
    var green = color - (red << 16) >> 8;
    var blue = color - (red << 16) - (green << 8);

    let [y, x] = [(position - position % 1000) / 1000, position % 1000];

    imageData.data[0] = red;
    imageData.data[1] = green;
    imageData.data[2] = blue;
    imageData.data[3] = 255;

    ctx.putImageData(imageData, x, y);
}

export default function ViewCanvas() {
    const ref = useRef();

    useEffect(() => {
        let viewCtx = ref.current.getContext("2d", { alpha: false });
        let viewImageData = viewCtx.createImageData(1000, 1000);
        let pixelImageData = viewCtx.createImageData(1, 1);

        fetch('http://192.168.0.123:4000/pixels').then((resp) => resp.arrayBuffer()).then((data) => {
            drawView(data, viewCtx, viewImageData);
        });

        let socket = new WebSocket("ws://192.168.0.123:4000/pixels/stream");
        socket.onmessage = function (event) {
            let data = JSON.parse(event.data);
            drawPixel(data.color, data.position, viewCtx, pixelImageData);
        }

        return () => {
            socket.close();
        }
    }, []);

    return <canvas
        width={1000}
        height={1000}
        id="view-layer"
        className="no-highlights position-fixed shado"
        ref={ref}>
    </canvas>;
}