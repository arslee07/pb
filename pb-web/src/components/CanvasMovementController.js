import { React, useEffect, useState } from 'react';

export default function CanvasMovementController(props) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);


  // FIXME
  useEffect(() => {
    // bro what the fuck
    const clamp = (v, min, max) => Math.max(Math.min(v, max), min);

    let hold = { left: false, right: false, down: false, up: false, speed: false };
    
    let cw = 1000 * props.zoom;
    let ch = 1000 * props.zoom;
        
    let gap = 32 * props.zoom;

    function kbscroll() {
      let topd = ((hold.down * (hold.speed ? 5 : 2)) + (hold.up * -1 * (hold.speed ? 5 : 2))) * props.zoom;
      let leftd = ((hold.right * (hold.speed ? 5 : 2)) + (hold.left * -1 * (hold.speed ? 5 : 2))) * props.zoom;
      if (topd !== 0 || leftd !== 0) {
        let wmin = Math.min(0, window.innerWidth - cw - gap);
        let wmax = Math.max(gap, window.innerWidth - cw);
        setX(x => clamp(x - leftd, wmin, wmax));

        let hmin = Math.min(0, window.innerHeight - ch - gap);
        let hmax = Math.max(gap, window.innerHeight - ch);
        setY(y => clamp(y - topd, hmin, hmax));
      }
      window.requestAnimationFrame(kbscroll);
    }
    window.requestAnimationFrame(kbscroll);

    let okd = function(e) {
      let code = e.keyCode;
      if (code === 87 || code === 38) hold.up = true;   // w or up arrow
      if (code === 65 || code === 37) hold.left = true; // a or left arrow
      if (code === 83 || code === 40) hold.down = true; // s or down arrow
      if (code === 68 || code === 39) hold.right = true; // d or right arrow
      if (code === 16) hold.speed = true;                // shift
    };

    let oku = function(e) {
      let code = e.keyCode;
      if (code === 87 || code === 38) hold.up = false;
      if (code === 65 || code === 37) hold.left = false;
      if (code === 83 || code === 40) hold.down = false;
      if (code === 68 || code === 39) hold.right = false;
      if (code === 16) hold.speed = false;
    };

    document.addEventListener("keydown", okd);
    document.addEventListener("keyup", oku);

    return () => {
      document.removeEventListener("keydown", okd);
      document.removeEventListener("keyup", oku);
      window.cancelAnimationFrame(kbscroll);
      hold = { left: false, right: false, down: false, up: false, speed: false };
    }
  }, [props.zoom]);

  return <div
    style={{
      transformOrigin: "0 0",
      transform: `translate(${x}px, ${y}px) scale(${props.zoom}, ${props.zoom})`,
    }}>
    {props.children}
  </div>;
}