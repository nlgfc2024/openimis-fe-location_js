export function healthFacilityLabel(hf) {
  return !!hf ? `${hf.code} ${hf.name}` : "";
}

export function locationLabel(l) {
  return !!l ? `${l.code} ${l.name}` : "";
}

export const LOCATION_SUMMARY_PROJECTION = ["id", "uuid", "code", "name", "type"];

export const getHotspotMutationAction = (hotspot) =>
  hotspot?.uuid !== undefined && hotspot?.uuid !== null ? "update" : "create";

export const nestParentsProjections = (i) => {
  return `parent{${LOCATION_SUMMARY_PROJECTION}${i === 0 ? "" : "," + nestParentsProjections(i - 1)}}`;
};
