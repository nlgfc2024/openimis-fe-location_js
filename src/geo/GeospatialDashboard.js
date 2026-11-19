import React, { useState } from "react";
import { Box, Button, MenuItem, Paper, TextField, Typography } from "@material-ui/core";
import useGeoQuery from "./useGeoQuery";
import BoundaryMap from "./BoundaryMap";

const FIELDS = `id sourceInstance msrId districtMsrId name code msrType matched microCatchmentUuid
  boundaryStatus revision geometryRelation geometrySource syncedAt`;
const OPTIONS = `query GeoOptions($type:String,$micro:String,$offset:Int!){
  msrGeoReferences(msrType:$type,microCatchmentUuid:$micro,offset:$offset,limit:100){totalCount items{${FIELDS}}}}`;
const SCOPE = `query GeoScope($source:String!,$district:String!,$offset:Int!,$micro:String){
  district:msrGeoReferences(sourceInstance:$source,msrType:"districts",districtMsrId:$district,limit:1){items{${FIELDS}}}
  catchments:msrGeoReferences(sourceInstance:$source,msrType:"catchments",isMicro:true,microCatchmentUuid:$micro,districtMsrId:$district,offset:$offset,limit:100){totalCount items{${FIELDS} isMicro}}}`;
const GEOMETRY = `query GeoGeometry($id:ID!){msrGeoGeometry(referenceId:$id){status revision relation source geojson}}`;
const STATUS_LABELS = {
  available: "Geometry available", unavailable: "No published geometry",
  delivery_unavailable: "Geometry delivery failed. Refresh publications to retry.",
  source_unconfigured: "The MSR source is not configured or enabled.",
  geometry_too_large: "Geometry exceeds the supported file size.",
  integrity_failure: "Geometry did not match its published checksum.",
};

function GeometryLayer({ reference, color, refresh, onLayer }) {
  const state = useGeoQuery(GEOMETRY, { id: reference.id }, refresh);
  const result = state.data?.msrGeoGeometry;
  React.useEffect(() => {
    onLayer(reference.id, result?.status === "available" ? { id: reference.id, color,
      name: `${reference.name} (${result.relation === "source_area_association" ? "source-area association" : result.relation || "unspecified relation"})`,
      geojson: result.geojson } : null);
    return () => onLayer(reference.id, null);
  }, [result, reference.id, color]);
  return <Box my={1}>
    <Typography><strong>{reference.name}</strong> · {reference.code} · {reference.matched ? "Matched" : "Unmatched"}</Typography>
    <Typography variant="body2">{state.loading ? "Loading current publication…" : state.error || STATUS_LABELS[result?.status] || "Unavailable"}
      {result && ` · revision ${result.revision} · ${result.relation || "no geometry relation"} · source ${result.source || "unspecified"}`}</Typography>
    <Typography variant="caption">Last synchronized: {reference.syncedAt || "unknown"} · MSR ID {reference.msrId}</Typography>
  </Box>;
}

function DistrictView({ district, microUuid, refresh }) {
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState("");
  const [layers, setLayers] = useState({});
  const state = useGeoQuery(SCOPE, { source: district.sourceInstance, district: district.districtMsrId, offset, micro: microUuid || null }, refresh);
  const refs = state.data?.catchments?.items?.filter((r) => r.isMicro && (!microUuid || r.microCatchmentUuid === microUuid)) || [];
  const micro = refs.find((r) => r.id === selected) || (microUuid ? refs[0] : null);
  const districtRef = state.data?.district?.items?.[0];
  const update = React.useCallback((id, layer) => setLayers((current) => {
    const next = { ...current }; if (layer) next[id] = layer; else delete next[id]; return next;
  }), []);
  const key = `${district.id}:${micro?.id || ""}:${refresh}:${offset}`;
  const visibleLayers = [districtRef, micro].filter(Boolean).map((r) => layers[r.id]).filter(Boolean);
  return <Box>
    {state.error && <Typography color="error" role="alert">{state.error}</Typography>}
    {!microUuid && <TextField select fullWidth label="Micro-catchment" value={micro?.id || ""}
      onChange={(e) => { setSelected(e.target.value); setLayers({}); }}>
      <MenuItem value="">District only</MenuItem>
      {refs.map((r) => <MenuItem key={r.id} value={r.id}>{r.name} — {r.code}{r.matched ? "" : " (unmatched)"}</MenuItem>)}
    </TextField>}
    {!microUuid && <Box>
      <Button disabled={!offset} onClick={() => { setSelected(""); setOffset(Math.max(0, offset - 100)); }}>Previous catchments</Button>
      <Button disabled={offset + 100 >= (state.data?.catchments?.totalCount || 0)} onClick={() => { setSelected(""); setOffset(offset + 100); }}>Next catchments</Button>
    </Box>}
    <BoundaryMap key={key} layers={state.loading || state.error ? [] : visibleLayers} />
    {districtRef && <GeometryLayer key={`d${key}`} reference={districtRef} color="#1565c0" refresh={refresh} onLayer={update} />}
    {micro && <GeometryLayer key={`m${key}`} reference={micro} color="#c65102" refresh={refresh} onLayer={update} />}
    {!state.loading && !refs.length && <Typography>No matching micro-catchment references on this page.</Typography>}
  </Box>;
}

export default function GeospatialDashboard({ microCatchmentUuid }) {
  const [refresh, setRefresh] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState("");
  const state = useGeoQuery(OPTIONS, { type: microCatchmentUuid ? null : "districts", micro: microCatchmentUuid || null, offset }, refresh);
  const options = state.data?.msrGeoReferences?.items || [];
  const district = options.find((r) => r.id === selected) || (microCatchmentUuid && options.length === 1 ? options[0] : null);
  return <Paper style={{ padding: 20 }}>
    <Box display="flex" justifyContent="space-between"><Typography variant="h5">Geospatial dashboard</Typography>
      <Button onClick={() => setRefresh((v) => v + 1)}>Refresh publications</Button></Box>
    {state.loading && <Typography>Loading permitted locations…</Typography>}
    {state.error && <Typography color="error" role="alert">{state.error}</Typography>}
    {(!microCatchmentUuid || options.length > 1) && <TextField select fullWidth label={microCatchmentUuid ? "MSR source match" : "District"} value={district?.id || ""} onChange={(e) => setSelected(e.target.value)}>
      <MenuItem value="">Select a district</MenuItem>
      {options.map((r) => <MenuItem key={r.id} value={r.id}>{r.name} — {r.code} ({r.sourceInstance})</MenuItem>)}
    </TextField>}
    {!microCatchmentUuid && <Box>
      <Button disabled={!offset} onClick={() => { setSelected(""); setOffset(Math.max(0, offset - 100)); }}>Previous districts</Button>
      <Button disabled={offset + 100 >= (state.data?.msrGeoReferences?.totalCount || 0)} onClick={() => { setSelected(""); setOffset(offset + 100); }}>Next districts</Button>
    </Box>}
    {!state.loading && !state.error && !options.length && <Typography>No synchronized locations are available within your access scope.</Typography>}
    {district && <DistrictView key={`${district.id}:${refresh}`} district={district} microUuid={microCatchmentUuid} refresh={refresh} />}
  </Paper>;
}
