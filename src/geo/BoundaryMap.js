import React, { useMemo, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Typography } from "@material-ui/core";
import { fitPaths, polygonPaths } from "./geometry";

export default function BoundaryMap({ layers }) {
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [hidden, setHidden] = useState({});
  const prepared = useMemo(() => {
    const valid = [], errors = [];
    layers.forEach((layer) => {
      try { valid.push({ ...layer, paths: polygonPaths(layer.geojson) }); }
      catch (_) { errors.push(`${layer.name}: the published geometry cannot be rendered.`); }
    });
    return { ...fitPaths(valid), errors };
  }, [layers]);
  const move = (x, y) => setView((v) => ({ ...v, x: v.x + x, y: v.y + y }));
  return <Box>
    <Box display="flex" flexWrap="wrap">
      <Button onClick={() => setView((v) => ({ ...v, zoom: Math.min(16, v.zoom * 1.5) }))}>Zoom in</Button>
      <Button onClick={() => setView((v) => ({ ...v, zoom: Math.max(1, v.zoom / 1.5) }))}>Zoom out</Button>
      <Button onClick={() => setView({ zoom: 1, x: 0, y: 0 })}>Fit boundaries</Button>
      <Button onClick={() => move(40, 0)} aria-label="Pan west">←</Button>
      <Button onClick={() => move(-40, 0)} aria-label="Pan east">→</Button>
      <Button onClick={() => move(0, 40)} aria-label="Pan north">↑</Button>
      <Button onClick={() => move(0, -40)} aria-label="Pan south">↓</Button>
    </Box>
    {prepared.errors.map((error) => <Typography key={error} color="error" role="alert">{error}</Typography>)}
    <svg viewBox="0 0 800 480" role="img" aria-label="District and micro-catchment boundary map"
      style={{ width: "100%", maxHeight: 550, background: "#f0f5f8", border: "1px solid #b0bec5" }}>
      <g transform={`translate(${view.x},${view.y}) translate(400,240) scale(${view.zoom}) translate(-400,-240)`}>
        {prepared.layers.filter((l) => !hidden[l.id]).map((layer) => layer.paths.map((path, i) =>
          <path key={`${layer.id}-${i}`} d={path} fill={layer.color} fillOpacity="0.2" stroke={layer.color}
            strokeWidth="2" vectorEffect="non-scaling-stroke" fillRule="evenodd"><title>{layer.name}</title></path>))}
      </g>
    </svg>
    {!layers.length && <Typography>No available boundary layers. See publication status below.</Typography>}
    {layers.map((layer) => <FormControlLabel key={layer.id}
      control={<Checkbox checked={!hidden[layer.id]} onChange={() => setHidden((s) => ({ ...s, [layer.id]: !s[layer.id] }))} />}
      label={<span style={{ color: layer.color }}>{layer.name}</span>} />)}
    <Typography variant="caption">Boundary overlay · north up · WGS84 coordinates · no basemap</Typography>
  </Box>;
}
