import { React, useCallback, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ViewCanvas from './components/ViewCanvas';
import InteractionCanvas from './components/InteractionCanvas';
import { Button, ButtonGroup } from 'react-bootstrap';
import { BlockPicker } from 'react-color';
import { List, ZoomIn, ZoomOut, Eyedropper } from 'react-bootstrap-icons';

const zooms = [1, 2, 5, 10, 15, 25, 50];

function App() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleCoordsChange = useCallback((x, y) => {
    setCoords({ x: x, y: y })
  }, []);

  const [zoomIndex, setZoomIndex] = useState(0);

  return (
    <div className='h-100'>
      <div id="paper-wrapper" className="position-relative overflow-auto h-100 d-flex w-100" style={{ imageRendering: "pixelated" }}>
        <div>
          <ViewCanvas zoom={zooms[zoomIndex]} />
          <InteractionCanvas onCoordsChanged={handleCoordsChange} zoom={zooms[zoomIndex]} />
        </div>
      </div>
      <div>
        <div className='position-absolute ms-md-2 mt-md-2 ms-2 mt-2 mx-auto' style={{ zIndex: "3", left: "0", top: "0" }}>
          <div class="py-1 px-2 rounded mb-2 bg-primary text-white">({coords.x}; {coords.y}) x{zooms[zoomIndex]}</div>
        </div>
        <div className='position-absolute me-md-4 mb-md-4 me-2 mb-2' style={{ zIndex: "3", right: "0", bottom: "0" }}>
          <ButtonGroup>
            <Button onClick={() => setZoomIndex(Math.min(zoomIndex + 1, zooms.length - 1))}><ZoomIn /></Button>
            <Button onClick={() => setZoomIndex(Math.max(zoomIndex - 1, 0))}><ZoomOut /></Button>
          </ButtonGroup>
        </div>
        <div className='position-absolute me-md-4 mt-md-2 me-2 mt-2' style={{ zIndex: "3", right: "0", top: "0" }}>
          <Button><List /></Button>
        </div>
        <div className='position-absolute ms-md-2 mb-md-4 ms-2 mb-2' style={{ zIndex: "3", left: "0", bottom: "0" }}>
          <Button><Eyedropper /></Button>
        </div>
      </div>
    </div >
  );
}

export default App;
