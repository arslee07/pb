import { React, useEffect, useRef } from 'react';
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

export default function ViewCanvas(props) {
    const ref = useRef();

    useEffect(() => {
        let viewCtx = ref.current.getContext("2d", { alpha: false });
        let viewImageData = viewCtx.createImageData(1000, 1000);

        let socket = new WebSocket("ws://192.168.0.123:4000/pixels/stream");
        socket.binaryType = "arraybuffer";
        socket.onmessage = function (event) {
            drawView(event.data, viewCtx, viewImageData);
        }

        return () => {
            socket.close();
        }
    }, []);

    return <canvas
        width={1000}
        height={1000}
        id="view-layer"
        className="no-highlights position-absolute"
        ref={ref}
        style={{
            transformOrigin: "top left",
            transform: `scale(${props.zoom}, ${props.zoom})`
        }}>
    </canvas>;
}