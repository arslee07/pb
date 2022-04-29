import { React, useCallback, useState } from 'react';
import { Button, ButtonGroup, Col } from 'react-bootstrap';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ViewCanvas from './components/ViewCanvas';
import InteractionCanvas from './components/InteractionCanvas';
import { ZoomIn, ZoomOut } from 'react-bootstrap-icons';

function App() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleCoordsChange = useCallback((x, y) => {
    setCoords({ x: x, y: y })
  }, []);

  const [zoom, setZoom] = useState(15);

  return (
    <div className='h-100 d-flex flex-column overflow-hidden'>

      <div className='d-flex flex-grow-1' style={{ minHeight: '0' }}>
        <div id="paper-wrapper" className="position-relative d-flex w-100 overflow-auto" style={{ imageRendering: "pixelated" }}>
          <div>
            <ViewCanvas zoom={zoom} />
            <InteractionCanvas onCoordsChanged={handleCoordsChange} zoom={zoom} />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "lightgrey", padding: "1rem" }}>
        <span>X: {coords.x} | Y: {coords.y}</span>
      </div>

    </div >
  );
}

export default App;
