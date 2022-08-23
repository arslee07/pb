import { React, useCallback, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ViewCanvas from './components/ViewCanvas';
import InteractionCanvas from './components/InteractionCanvas';
import MovementWrapper from './components/MovementWrapper';
import { Button, ButtonGroup } from 'react-bootstrap';
import { List, Eyedropper } from 'react-bootstrap-icons';
import { toast, ToastContainer } from 'react-toastify';
import MenuModal from './modals/MenuModal';
import ColorPickerModal from './modals/ColorPickerModal';

async function placePixel(x, y, color) {
  let res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/pixels`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Token': JSON.parse(window.localStorage.getItem("token")),
    },
    method: 'PUT',
    body: JSON.stringify({ position: y * 1000 + x, color: color })
  });
  
  let b = await res.json();

  if (res.status === 401) {
    toast("Failed to place a pixel: invalid or unset token", { type: "error" })
  }
  
  if (res.status === 429) {
    toast(`You are in a cooldown! Please wait ${b.time_left} seconds`, { type: "error" })
  }
};

function colorToNum(color) {
  return parseInt("0x" + color.substring(1));
}

function App() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleCoordsChange = useCallback((x, y) => {
    setCoords({ x: x, y: y })
  }, []);

  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [color, setColor] = useState("#000000");

  return (
    <div>
      <ToastContainer bodyStyle={{ font: "unset" }} autoClose={3000} />

      <MovementWrapper>
        <ViewCanvas />
        <InteractionCanvas onCoordsChanged={handleCoordsChange}
          onClick={(x, y) => { placePixel(x, y, colorToNum(color)) }} />
      </MovementWrapper>

      <div className='position-fixed' style={{ zIndex: "3" }}>
        <div className='position-fixed overflow-hidden ms-md-2 mt-md-2 ms-2 mt-2 mx-auto' style={{ left: "0", top: "0" }}>
          <div className="py-1 px-2 rounded mb-2 bg-primary text-white">({coords.x}; {coords.y})</div>
        </div>
        <div className='position-fixed overflow-hidden me-md-2 mb-md-2 me-2 mb-2' style={{ right: "0", bottom: "0" }}>
          <Button onClick={() => setShowMenu(true)}><List /></Button>
        </div>
        <div className='position-fixed overflow-hidden ms-md-2 mb-md-2 ms-2 mb-2' style={{ left: "0", bottom: "0" }}>
          <ButtonGroup>
            <div className='me-1 pe-4 ps-3 rounded border border-secondary' style={{ backgroundColor: color }} onClick={() => setShowPicker(true)}></div>
            <Button onClick={() => setShowPicker(true)} className="rounded"><Eyedropper /></Button>
          </ButtonGroup>
        </div>
      </div>

      <MenuModal show={showMenu} onHide={() => { setShowMenu(false) }} />
      <ColorPickerModal show={showPicker} onHide={() => { setShowPicker(false) }} color={color} onChange={setColor} />
    </div >
  );
}

export default App;
