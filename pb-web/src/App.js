import { React, useCallback, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ViewCanvas from './components/ViewCanvas';
import InteractionCanvas from './components/InteractionCanvas';
import MovementWrapper from './components/MovementWrapper';
import { Button, ButtonGroup, Modal } from 'react-bootstrap';
import { HexColorPicker, HexColorInput } from "react-colorful";
import { List, Eyedropper } from 'react-bootstrap-icons';

async function placePixel(x, y, color) {
  await fetch('http://192.168.0.123:4000/pixels', {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'PUT',
    body: JSON.stringify({ position: y * 1000 + x, color: color })
  });
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
  const [color, setColor] = useState("#000000");

  return (
    <div>
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
          <Button><List /></Button>
        </div>
        <div className='position-fixed overflow-hidden ms-md-2 mb-md-2 ms-2 mb-2' style={{ left: "0", bottom: "0" }}>
          <ButtonGroup>
            <div className='me-1 pe-4 ps-3 rounded border border-secondary' style={{ backgroundColor: color }} onClick={() => setShowPicker(true)}></div>
            <Button onClick={() => setShowPicker(true)} className="rounded"><Eyedropper /></Button>
          </ButtonGroup>
        </div>
      </div>

      <Modal show={showPicker} onHide={() => { setShowPicker(false) }}>
        <Modal.Header closeButton>
          <Modal.Title>Pick a color</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <HexColorPicker color={color} onChange={(color) => { setColor(color) }} className="w-auto" />
          <HexColorInput color={color} onChange={setColor} className="w-100 mt-2" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => { setShowPicker(false) }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}

export default App;
