import { React, useCallback, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ViewCanvas from './components/ViewCanvas';
import InteractionCanvas from './components/InteractionCanvas';

function App() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleCoordsChange = useCallback((x, y) => {
    setCoords({ x: x, y: y })
  }, []);

  const [zoom, setZoom] = useState(15);

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        flex: '1',
        display: 'flex',
        minHeight: '0',
      }}>
        <div id="paper-wrapper" style={{
          position: "relative",
          display: "flex",
          width: "100%",
          overflowY: "auto",
          imageRendering: "pixelated",
        }}>
          <div>
            <ViewCanvas zoom={zoom} />
            <InteractionCanvas onCoordsChanged={handleCoordsChange} zoom={zoom} />
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: "lightgrey", padding: "1rem" }}>
        <span id="coords">X: {coords.x} | Y: {coords.y}</span>
      </div>
    </div >

  );
}

export default App;
