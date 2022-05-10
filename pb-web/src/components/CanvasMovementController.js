import { React, useEffect, useState, useRef } from 'react';

export default function CanvasMovementController(props) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const ref = useRef();


  // FIXME
  useEffect(() => {
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


  useEffect(() => {
    const clamp = (v, min, max) => Math.max(Math.min(v, max), min);

    let cw = 1000 * props.zoom;
    let ch = 1000 * props.zoom;

    let gap = 32 * props.zoom;

    let tx, ty = (0, 0);

    const mm = function(e) {
      let wmin = Math.min(0, window.innerWidth - cw - gap);
      let wmax = Math.max(gap, window.innerWidth - cw);

      let hmin = Math.min(0, window.innerHeight - ch - gap);
      let hmax = Math.max(gap, window.innerHeight - ch);

      setX(x => clamp(x + e.movementX, wmin, wmax));
      setY(y => clamp(y + e.movementY, hmin, hmax));
    };

    const mu = function() {
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
    };

    const md = function() {
      document.addEventListener('mousemove', mm);
      document.addEventListener('mouseup', mu);
    };

    document.addEventListener('mousedown', md);

    return () => {
      tx = 0;
      ty = 0;
      document.removeEventListener('mouseup', mu);
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mousedown', md);
    };
  }, [props.zoom]);

  useEffect(() => {
    const clamp = (v, min, max) => Math.max(Math.min(v, max), min);

    let cw = 1000 * props.zoom;
    let ch = 1000 * props.zoom;

    let gap = 32 * props.zoom;

    let wmin = Math.min(0, window.innerWidth - cw - gap);
    let wmax = Math.max(gap, window.innerWidth - cw);

    let hmin = Math.min(0, window.innerHeight - ch - gap);
    let hmax = Math.max(gap, window.innerHeight - ch);

    setX(x => clamp(x, wmin, wmax));
    setY(y => clamp(y, hmin, hmax));
  }, [props.zoom]);

  return <div
    ref={ref}
    style={{
      transformOrigin: "0 0",
      transform: `translate(${x}px, ${y}px) scale(${props.zoom}, ${props.zoom})`,
    }}>
    {props.children}
  </div>;
}