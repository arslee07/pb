import { React, useEffect, useRef } from 'react';

function findXY(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const elementRelativeX = e.clientX - rect.left;
    const elementRelativeY = e.clientY - rect.top;
    const x = Math.floor(elementRelativeX * canvas.width / rect.width);
    const y = Math.floor(elementRelativeY * canvas.height / rect.height);
    return [x, y];
}

function drawPointer(x, y, imageData, ctx) {
    imageData.data[0] = 0x00;
    imageData.data[1] = 0x00;
    imageData.data[2] = 0x00;
    imageData.data[3] = 0x33;
    ctx.putImageData(imageData, x, y);
}


export default function InteractionCanvas(props) {
    const interactionRef = useRef();


    let classes = `no-highlights position-fixed`

    return <canvas
        width={1000}
        height={1000}
        id="interaction-layer"
        className={classes}
        ref={interactionRef}
        style={{
            zIndex: "1",
        }}
        onMouseMove={function (e) {
            let ctx = interactionRef.current.getContext("2d");
            let imd = ctx.createImageData(1, 1);
            const [x, y] = findXY(e, interactionRef.current);
            if (ctx.previousCoords !== undefined && (x !== ctx.previousCoords.x || y !== ctx.previousCoords.y)) {
                ctx.clearRect(ctx.previousCoords.x, ctx.previousCoords.y, 1, 1);
                drawPointer(x, y, imd, ctx);
                props.onCoordsChanged(x + 1, y + 1);
            }
            ctx.previousCoords = { x, y };
        }}
        onMouseDown={function (e) {
            const [x, y] = findXY(e, interactionRef.current);
            props.onClick(x, y);
        }} />
}