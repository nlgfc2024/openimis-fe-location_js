// Polygon-only Mercator projection. File properties never become executable markup.
export function polygonPaths(geojson) {
  const features = geojson?.type === "FeatureCollection" ? geojson.features : [geojson];
  if (!Array.isArray(features)) throw new Error("Invalid GeoJSON");
  let count = 0;
  return features.flatMap((feature) => {
    const geometry = feature?.type === "Feature" ? feature.geometry : feature;
    if (!["Polygon", "MultiPolygon"].includes(geometry?.type)) throw new Error("Unsupported geometry");
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map((polygon) => polygon.map((ring) => {
      if (!Array.isArray(ring) || ring.length < 4) throw new Error("Invalid polygon ring");
      return ring.map((point) => {
        count += 1;
        const [lng, lat] = point;
        if (count > 100000 || !Number.isFinite(lng) || !Number.isFinite(lat)
            || Math.abs(lng) > 180 || Math.abs(lat) > 85) throw new Error("Invalid coordinates");
        return [lng, -Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI];
      });
    }));
  });
}

export function fitPaths(layers) {
  const points = layers.flatMap((layer) => layer.paths.flat(2));
  if (!points.length) return { viewBox: "0 0 800 480", layers: [] };
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  // Avoid spreading large arrays into Math.min/max.
  const minX = xs.reduce((a, b) => Math.min(a, b));
  const minY = ys.reduce((a, b) => Math.min(a, b));
  const width = xs.reduce((a, b) => Math.max(a, b)) - minX || 0.001;
  const height = ys.reduce((a, b) => Math.max(a, b)) - minY || 0.001;
  const scale = Math.min(740 / width, 420 / height);
  return { viewBox: "0 0 800 480", layers: layers.map((layer) => ({ ...layer,
    paths: layer.paths.map((polygon) => polygon.map((ring) => ring.map(([x, y], i) =>
      `${i ? "L" : "M"}${((x - minX) * scale + 30).toFixed(2)},${((y - minY) * scale + 30).toFixed(2)}`,
    ).join(" ") + "Z").join(" ")),
  })) };
}
