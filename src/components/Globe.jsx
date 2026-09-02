import { useEffect, useRef, useState } from 'react';
import GlobeGL from 'react-globe.gl';

// Purely the visual feedback surface — guessing happens through the text
// input, not by clicking the globe (matching Globle: clicking the globe
// is how you *start* the game, typing is how you play it). polygonLabel
// is deliberately blank so hovering never leaks the entity's name.
export default function Globe({ entities, colorFor }) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [size, setSize] = useState({ width: 600, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver((entriesList) => {
      const entry = entriesList[0];
      if (entry) {
        setSize({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="globe-container">
      <GlobeGL
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        polygonsData={entities}
        polygonGeoJsonGeometry={(d) => d.geometry}
        polygonCapColor={colorFor}
        polygonSideColor={() => 'rgba(15, 18, 30, 0.6)'}
        polygonStrokeColor={() => '#0b0f19'}
        polygonLabel={() => ''}
        polygonAltitude={0.006}
        polygonsTransitionDuration={300}
        showAtmosphere
        atmosphereColor="#6fb7ff"
        atmosphereAltitude={0.18}
      />
    </div>
  );
}
