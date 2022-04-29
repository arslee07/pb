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

async function placePixel(x, y) {
    await fetch('http://192.168.0.123:4000/pixels', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({ position: y * 1000 + x, color: 0x000000 })
    });
};

export default function InteractionCanvas(props) {
    const interactionRef = useRef();

    // FIXME
    useEffect(() => {
        // bro what the fuck
        var wrapper = document.getElementById("paper-wrapper");

        var hold = { left: false, right: false, down: false, up: false, speed: false };
        function kbscroll() {
            let topd = (hold.down * 25 * (hold.speed ? 3 : 1)) + (hold.up * -25 * (hold.speed ? 3 : 1))
            let leftd = (hold.right * 25 * (hold.speed ? 3 : 1)) + (hold.left * -25 * (hold.speed ? 3 : 1))
            if (topd !== 0 || leftd !== 0) {
                wrapper.scrollTo(wrapper.scrollLeft + leftd, wrapper.scrollTop + topd);
            }
            window.requestAnimationFrame(kbscroll);
        }
        window.requestAnimationFrame(kbscroll);

        document.body.onkeydown = function (e) {
            var code = e.keyCode;
            if (code === 87 || code === 38) hold.up = true;   // w or up arrow
            if (code === 65 || code === 37) hold.left = true; // a or left arrow
            if (code === 83 || code === 40) hold.down = true; // s or down arrow
            if (code === 68 || code === 39) hold.right = true; // d or right arrow
            if (code === 16) hold.speed = true;                // shift
        };
        document.body.onkeyup = function (e) {
            var code = e.keyCode;
            if (code === 87 || code === 38) hold.up = false;
            if (code === 65 || code === 37) hold.left = false;
            if (code === 83 || code === 40) hold.down = false;
            if (code === 68 || code === 39) hold.right = false;
            if (code === 16) hold.speed = false;
        };
    }, []);

    return <canvas
        width={1000}
        height={1000}
        id="interaction-layer"
        className="no-highlights position-absolute"
        ref={interactionRef}
        style={{
            zIndex: "1",
            transformOrigin: "top left",
            transform: `scale(${props.zoom}, ${props.zoom})`
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
            placePixel(x, y)
        }} />
}