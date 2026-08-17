import {
  graphql,
  decodeId,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatGQLString,
  formatMutation,
  formatJsonField,
  graphqlWithVariables,
} from "@openimis/fe-core";

import { LOCATION_SUMMARY_PROJECTION, nestParentsProjections } from "./utils";

function _entityAndFilters(entity, filters) {
  return `${entity}${!!filters && filters.length ? `(${filters.join(",")})` : ""}`;
}

function _pageAndEdges(projections) {
  return `
    pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor}
    edges
    {
      node
      {
        ${projections.join(",")}
      }
    }`;
}

export function filterLocationByParents(district_uuid, region_uuid, filters, location_type) {
  let parentFilter = "";
  if (district_uuid) {
    if (location_type == "W") parentFilter = `parent_Uuid: "${district_uuid}"`;
    else if (location_type == "V") parentFilter = `parent_Parent_Uuid: "${district_uuid}"`;
  } else if (region_uuid) {
    if (location_type == "W") parentFilter = `parent_Parent_Uuid: "${region_uuid}"`;
    else if (location_type == "V") parentFilter = `parent_Parent_Parent_Uuid: "${region_uuid}"`;
  }
  filters.push(parentFilter);
  return true;
}

export function fetchUserDistricts() {
  let payload = formatQuery("userDistricts", null, ["id", "uuid", "code", "name", "parent{id, uuid, code, name}"]);
  return graphql(payload, "LOCATION_USER_DISTRICTS");
}

export function clearUserDistricts() {
  return (dispatch) => {
    dispatch({ type: `LOCATION_USER_DISTRICTS_CLEAR` });
  };
}

export const HEALTH_FACILITY_PICKER_PROJECTION = [
  "id",
  "uuid",
  "code",
  "name",
  "level",
  "servicesPricelist{id, uuid}",
  "itemsPricelist{id, uuid}",
  "contractStartDate",
  "contractEndDate",
  `location{${LOCATION_SUMMARY_PROJECTION.join(",")}, parent{${LOCATION_SUMMARY_PROJECTION.join(",")}}}`,
];

export const HEALTH_FACILITY_REFER_PICKER_PROJECTION = ["id", "uuid", "code", "name"];

function healthFacilityFullPath(key, mm, id) {
  let payload = formatPageQuery(
    "healthFacilities",
    [`id: "${btoa(`HealthFacilityGQLType:${id}`)}"`],
    mm.getRef("location.HealthFacilityPicker.projection"),
  );
  return graphql(payload, key);
}

export function fetchUserHealthFacilityFullPath(mm, id) {
  return healthFacilityFullPath("LOCATION_USER_HEALTH_FACILITY_FULL_PATH", mm, id);
}

export function fetchHealthFacilityFullPath(mm, id) {
  return healthFacilityFullPath("LOCATION_HEALTH_FACILITY_FULL_PATH", mm, decodeId(id));
}

export function fetchHealthFacility(mm, healthFacilityUuid, healthFacilityCode) {
  let filters = [
    !!healthFacilityUuid ? `uuid: "${healthFacilityUuid}"` : `code: "${healthFacilityCode}"`,
    "showHistory: true",
  ];
  let projections = [
    "id",
    "uuid",
    "code",
    "accCode",
    "name",
    "careType",
    "address",
    "phone",
    "fax",
    "email",
    "legalForm{code}",
    "level",
    "subLevel{code}",
    "location{id, uuid, code, name, parent{id, uuid, code, name}}",
    "servicesPricelist{id, uuid, name}",
    "itemsPricelist{id, uuid, name}",
    "catchments{id, location{id, uuid, code, name}, catchment}",
    "contractStartDate",
    "contractEndDate",
    "status",
    "validityFrom",
    "validityTo",
  ];
  const payload = formatPageQuery("healthFacilities", filters, projections);
  return graphql(payload, "LOCATION_HEALTH_FACILITY");
}

export function clearHealthFacility() {
  return (dispatch) => {
    dispatch({ type: "LOCATION_HEALTH_FACILITY_CLEAR" });
  };
}

export function fetchHealthFacilitySummaries(filters) {
  var projections = [
    "id",
    "uuid",
    "code",
    "accCode",
    "name",
    "careType",
    "phone",
    "fax",
    "email",
    "level",
    "legalForm{code}",
    "location{code,name, parent{code, name}}",
    "validityFrom",
    "validityTo",
    "clientMutationId",
  ];
  const payload = formatPageQueryWithCount("healthFacilities", filters, projections);
  return graphql(payload, "LOCATION_HEALTH_FACILITY_SEARCHER");
}

export function fetchHotspotSummaries(filters) {
  const projections = [
    "id",
    "uuid",
    "code",
    "name",
    "description",
    "microCatchment{id, uuid, code, name, district{id, uuid, code, name}, traditionalAuthorities{id, location{id, uuid, code, name}}, gvhs{id, location{id, uuid, code, name}}}",
    "villages{id, uuid, code, name, parent{id, uuid, code, name, parent{id, uuid, code, name, parent{id, uuid, code, name}}}}",
    "validityFrom",
    "validityTo",
  ];
  const payload = formatPageQueryWithCount("hotspots", filters, projections);
  return graphql(payload, "LOCATION_HOTSPOT_SEARCHER");
}

export function fetchHotspot(hotspotUuid, hotspotCode) {
  const filters = [hotspotUuid ? `uuid: "${hotspotUuid}"` : `code: "${hotspotCode}"`];
  const projections = [
    "id",
    "uuid",
    "code",
    "name",
    "description",
    "microCatchment{id, uuid, code, name, district{id, uuid, code, name}, traditionalAuthorities{id, location{id, uuid, code, name}}, gvhs{id, location{id, uuid, code, name}}}",
    "villages{id, uuid, code, name, parent{id, uuid, code, name, parent{id, uuid, code, name, parent{id, uuid, code, name}}}}",
    "validityFrom",
    "validityTo",
  ];
  const payload = formatPageQuery("hotspots", filters, projections);
  return graphql(payload, "LOCATION_HOTSPOT");
}

export function clearHotspot() {
  return (dispatch) => {
    dispatch({ type: "LOCATION_HOTSPOT_CLEAR" });
  };
}

export function fetchLocations(levels, type, parent) {
  let filters = [
    `
    type: "${levels[type]}",
    orderBy: "code"
  `,
  ];
  if (!!parent) {
    filters.push(`parent_Uuid: "${parent.uuid}"`);
  }
  let payload = formatPageQuery("locations", filters, [
    "id",
    "uuid",
    "type",
    "code",
    "name",
    "malePopulation",
    "femalePopulation",
    "otherPopulation",
    "families",
    "clientMutationId",
  ]);

  return graphql(payload, `LOCATION_LOCATIONS_${type}`);
}

export function fetchLocationsStr(mm, level, regions = null, districts = null, parent, str = "", first) {
  const types = mm.getConf("fe-location", "Location.types", ["R", "D", "W", "V"]);
  let filters = [`type: "${types[level]}"`, `str: "${str}"`, first && `first: '${first}'`].filter(Boolean);
  if (Boolean(parent)) {
    filters.push(`parent_Uuid: "${parent.uuid}"`);
  } else {
    filterLocationByParents(districts, regions, filters, types[level]);
  }
  let projections = ["id", "uuid", "type", "code", "name", nestParentsProjections(level)];
  return graphqlWithVariables(
    `
      {
        ${_entityAndFilters("locationsStr", filters)}
        {
          ${_pageAndEdges(projections)}
        }
      }
      `,
    {},
    `LOCATION_LOCATIONS_${level}`,
  );
}

export function fetchLocationsByUuids(uuids, maxLevel = 4) {
  if (!uuids || uuids.length === 0) {
    return { type: "LOCATION_LOCATIONS_BY_UUIDS_EMPTY" };
  }

  const uuidFilters = uuids.map((uuid) => `"${uuid}"`).join(",");
  const projections = ["id", "uuid", "type", "code", "name", nestParentsProjections(maxLevel - 1)];

  return graphqlWithVariables(
    `
      {
        locationsStr(uuid_In: [${uuidFilters}])
        {
          ${_pageAndEdges(projections)}
        }
      }
      `,
    {},
    `LOCATION_LOCATIONS_BY_UUIDS`,
  );
}

export function fetchParentLocationsStr(
  modulesManager,
  level,
  parentUuids,
  searchString,
  first,
  regions = null,
  districts = null,
) {
  const types = modulesManager.getConf("fe-location", "Location.types", ["R", "D", "W", "V"]);
  const filters = [`type: "${types[level]}"`, `str: "${searchString}"`, first && `first: ${first}`].filter(Boolean);
  if (parentUuids) {
    filters.push(`parent_Uuid_In: ["${parentUuids.join('", "')}"]`);
  }
  const projections = ["id", "uuid", "type", "code", "name", nestParentsProjections(level)];
  const payload = formatPageQuery("locationsStr", filters, projections);
  return graphql(payload, `LOCATION_LOCATIONS_${level}`);
}

export function clearLocations(type) {
  return (dispatch) => {
    dispatch({ type: `LOCATION_LOCATIONS_${type}_CLEAR` });
  };
}

function formatLocationGQL(location) {
  return `
    ${location.uuid !== undefined && location.uuid !== null ? `uuid: "${location.uuid}"` : ""}
    code: "${formatGQLString(location.code)}"
    name: "${formatGQLString(location.name)}"
    ${!!location.parentUuid ? `parentUuid: "${location.parentUuid}"` : ""}
    ${!!location.malePopulation ? `malePopulation: ${location.malePopulation}` : ""}
    ${!!location.femalePopulation ? `femalePopulation: ${location.femalePopulation}` : ""}
    ${!!location.otherPopulation ? `otherPopulation: ${location.otherPopulation}` : ""}
    ${!!location.families ? `families: ${location.families}` : ""}
    type: "${location.type}"
  `;
}

export function createOrUpdateLocation(location, clientMutationLabel) {
  let action = location.uuid !== undefined && location.uuid !== null ? "update" : "create";
  let mutation = formatMutation(`${action}Location`, formatLocationGQL(location), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", `LOCATION_${action.toUpperCase()}_LOCATION_RESP`, "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function deleteLocation(location, opts, clientMutationLabel) {
  let payload = `
    uuid: "${location.uuid}"
    code: "${location.code}"
    ${opts.action === "drop" ? "" : `newParentUuid: "${opts.newParent}"`}
  `;
  let mutation = formatMutation("deleteLocation", payload, clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", "LOCATION_DELETE_LOCATION_RESP", "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function moveLocation(location, newParent, clientMutationLabel) {
  let payload = `
    uuid: "${location.uuid}"
    ${!!newParent ? `newParentUuid: "${newParent.uuid}"` : ""}
  `;
  let mutation = formatMutation("moveLocation", payload, clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(mutation.payload, ["LOCATION_MUTATION_REQ", "LOCATION_MOVE_LOCATION_RESP", "LOCATION_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

function formatCatchment(catchment) {
  return `{
    ${!!catchment.id ? `id: ${catchment.id}` : ""}
    locationId: ${decodeId(catchment.location.id)}
    catchment: ${catchment.catchment}
  }`;
}

function formatCatchments(catchments) {
  if (!catchments || !catchments.length) return "";
  return `catchments: [
    ${catchments.map((c) => formatCatchment(c)).join("\n")}
  ]`;
}

function formatHealthFacilityGQL(hf) {
  return `
    ${hf.uuid !== undefined && hf.uuid !== null ? `uuid: "${hf.uuid}"` : ""}
    code: "${formatGQLString(hf.code)}"
    name: "${formatGQLString(hf.name)}"
    locationId: ${decodeId(hf.location.id)}
    level: "${hf.level}"
    legalFormId: "${hf.legalForm.code}"
    careType: "${hf.careType}"
    ${!!hf.accCode ? `accCode: "${hf.accCode}"` : ""}
    ${!!hf.subLevel ? `subLevelId: "${hf.subLevel.code}"` : ""}
    ${!!hf.address ? `address: "${formatGQLString(hf.address)}"` : ""}
    ${!!hf.phone ? `phone: "${formatGQLString(hf.phone)}"` : ""}
    ${!!hf.fax ? `fax: "${formatGQLString(hf.fax)}"` : ""}
    ${!!hf.email ? `email: "${formatGQLString(hf.email)}"` : ""}
    ${!!hf.servicesPricelist ? `servicesPricelistId: ${decodeId(hf.servicesPricelist.id)}` : ""}
    ${!!hf.itemsPricelist ? `itemsPricelistId: ${decodeId(hf.itemsPricelist.id)}` : ""}
    ${!!hf.mutationExtensions ? `mutationExtensions: ${formatJsonField(hf.mutationExtensions)}` : ""}
    ${!!hf.contractStartDate ? `contractStartDate: "${hf.contractStartDate}"` : ""}
    ${!!hf.contractEndDate ? `contractEndDate: "${hf.contractEndDate}"` : ""}
    ${!!hf.status ? `status: "${hf.status}"` : ""}
    ${formatCatchments(hf.catchments)}
  `;
}

export function createOrUpdateHealthFacility(hf, clientMutationLabel) {
  let action = hf.uuid !== undefined && hf.uuid !== null ? "update" : "create";
  let mutation = formatMutation(`${action}HealthFacility`, formatHealthFacilityGQL(hf), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", `LOCATION_${action.toUpperCase()}_HEALTH_FACILITY_RESP`, "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function deleteHealthFacility(hf, clientMutationLabel) {
  let payload = `
    uuid: "${hf.uuid}"
    code: "${hf.code}"
  `;
  let mutation = formatMutation("deleteHealthFacility", payload, clientMutationLabel);
  var requestedDateTime = new Date();
  hf.clientMutationId = mutation.clientMutationId;
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", "LOCATION_DELETE_HEALTH_FACILITY_RESP", "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

function formatHotspotGQL(hotspot) {
  return `
    ${hotspot.uuid !== undefined && hotspot.uuid !== null ? `uuid: "${hotspot.uuid}"` : ""}
    code: "${formatGQLString(hotspot.code)}"
    name: "${formatGQLString(hotspot.name)}"
    ${!!hotspot.description ? `description: "${formatGQLString(hotspot.description)}"` : ""}
    microCatchmentUuid: "${hotspot.microCatchment.uuid}"
    villageUuids: [${hotspot.villages.map((village) => `"${village.uuid}"`).join(", ")}]
  `;
}

export function createOrUpdateHotspot(hotspot, clientMutationLabel) {
  const action = hotspot.uuid !== undefined && hotspot.uuid !== null ? "update" : "create";
  const mutation = formatMutation("createHotspot", formatHotspotGQL(hotspot), clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", `LOCATION_${action.toUpperCase()}_HOTSPOT_RESP`, "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function deleteHotspot(hotspot, clientMutationLabel) {
  const mutation = formatMutation("deleteHotspot", `uuid: "${hotspot.uuid}"`, clientMutationLabel);
  const requestedDateTime = new Date();
  hotspot.clientMutationId = mutation.clientMutationId;
  return graphql(mutation.payload, ["LOCATION_MUTATION_REQ", "LOCATION_DELETE_HOTSPOT_RESP", "LOCATION_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}

export function selectLocation(location, level, maxLevels) {
  return (dispatch) => {
    dispatch({ type: `LOCATION_FILTER_SELECTED`, payload: { location, level, maxLevels } });
  };
}

export function selectDistrictLocation(location) {
  return (dispatch) => {
    dispatch({ type: `LOCATION_FILTER_DISTRICT_SELECTED`, payload: { location } });
  };
}

export function selectRegionLocation(location) {
  return (dispatch) => {
    dispatch({ type: `LOCATION_FILTER_REGION_SELECTED`, payload: { location } });
  };
}

export function fetchAllRegions() {
  let filters = [`type: "R"`];

  let payload = formatPageQuery("locations", filters, ["id", "uuid", "code", "name"]);

  return graphql(payload, `LOCATION_REGIONS`);
}

export function fetchAvailableLocations(mm, level) {
  const types = mm.getConf("fe-location", "Location.types", ["R", "D", "W", "V"]);
  let filters = [`type: "${types[level]}"`];

  let projection = ["id", "uuid", "type", "code", "name", nestParentsProjections(level)];

  const payload = formatPageQuery("locationsAll", filters, projection);

  return graphql(payload, `LOCATION_ALL_LOCATION_${level}`);
}

export function HFCodeValidationCheck(mm, variables) {
  return graphqlWithVariables(
    `
      query ($healthFacilityCode: String!) {
        isValid: validateHealthFacilityCode(healthFacilityCode: $healthFacilityCode)
      }
    `,
    variables,
    `LOCATION_HF_CODE_FIELDS_VALIDATION`,
  );
}

export function HFCodeSetValid() {
  return (dispatch) => {
    dispatch({ type: `LOCATION_HF_CODE_FIELDS_VALIDATION_SET_VALID` });
  };
}

export function HFCodeValidationClear() {
  return (dispatch) => {
    dispatch({ type: `LOCATION_HF_CODE_FIELDS_VALIDATION_CLEAR` });
  };
}

export function locationCodeValidationCheck(mm, variables) {
  return graphqlWithVariables(
    `
    query ($locationCode: String!) {
      isValid: validateLocationCode(locationCode: $locationCode)
 }
    `,
    variables,
    `LOCATION_CODE_FIELDS_VALIDATION`,
  );
}

export function locationCodeValidationClear() {
  return (dispatch) => {
    dispatch({ type: `LOCATION_CODE_FIELDS_VALIDATION_CLEAR` });
  };
}

export function locationCodeSetValid() {
  return (dispatch) => {
    dispatch({ type: `LOCATION_CODE_SET_VALID` });
  };
}

export function fetchMicroCatchments(filters) {
  var projections = [
    "id",
    "uuid",
    "code",
    "name",
    "type",
    "dateFrom",
    "dateTo",
    "district{id,uuid,code,name}",
    "traditionalAuthorities{id,location{id,uuid,code,name}}",
    "gvhs{id,location{id,uuid,code,name}}",
    "validityFrom",
    "validityTo",
    "clientMutationId",
  ];
  const payload = formatPageQueryWithCount("microCatchments", filters, projections);
  return graphql(payload, "LOCATION_MICRO_CATCHMENT_SEARCHER");
}

export function fetchMicroCatchment(uuid) {
  var projections = [
    "id",
    "uuid",
    "code",
    "name",
    "type",
    "dateFrom",
    "dateTo",
    "district{id,uuid,code,name}",
    "traditionalAuthorities{id,location{id,uuid,code,name}}",
    "gvhs{id,location{id,uuid,code,name}}",
    "validityFrom",
    "validityTo",
    "clientMutationId",
  ];
  const filters = [`uuid: "${uuid}"`, "showHistory: false"];
  const payload = formatPageQueryWithCount("microCatchments", filters, projections);
  return graphql(payload, "LOCATION_MICRO_CATCHMENT");
}

export function clearMicroCatchment() {
  return (dispatch) => {
    dispatch({ type: "LOCATION_MICRO_CATCHMENT_CLEAR" });
  };
}

function toDbId(id) {
  if (id === undefined || id === null || id === "") return null;
  if (typeof id === "number") return id;
  const asNumber = Number(id);
  if (Number.isInteger(asNumber)) return asNumber;
  try {
    const decoded = decodeId(id);
    const decodedNumber = Number(decoded);
    return Number.isInteger(decodedNumber) ? decodedNumber : null;
  } catch (e) {
    return null;
  }
}

function formatMicroCatchmentGQL(mc) {
  const districtId = toDbId(mc.district?.id);
  const taIds = (mc.taIds || []).map((id) => toDbId(id)).filter((id) => id !== null);
  const gvhIds = (mc.gvhIds || []).map((id) => toDbId(id)).filter((id) => id !== null);
  return `
    ${mc.uuid !== undefined && mc.uuid !== null ? `uuid: "${mc.uuid}"` : ""}
    code: "${formatGQLString(mc.code)}"
    name: "${formatGQLString(mc.name)}"
    ${mc.type !== undefined && mc.type !== null ? `type: "${formatGQLString(mc.type)}"` : ""}
    ${districtId !== null ? `districtId: ${districtId}` : ""}
    ${mc.dateFrom !== undefined && mc.dateFrom !== null ? `dateFrom: "${mc.dateFrom}"` : ""}
    ${mc.dateTo !== undefined && mc.dateTo !== null ? `dateTo: "${mc.dateTo}"` : ""}
    ${taIds.length > 0 ? `taIds: [${taIds.join(",")}]` : ""}
    ${gvhIds.length > 0 ? `gvhIds: [${gvhIds.join(",")}]` : ""}
  `;
}

export function createMicroCatchment(mc, clientMutationLabel) {
  let mutation = formatMutation("createMicroCatchment", formatMicroCatchmentGQL(mc), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", "LOCATION_CREATE_MICRO_CATCHMENT_RESP", "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function updateMicroCatchment(mc, clientMutationLabel) {
  let mutation = formatMutation("updateMicroCatchment", formatMicroCatchmentGQL(mc), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", "LOCATION_UPDATE_MICRO_CATCHMENT_RESP", "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function deleteMicroCatchment(mc, clientMutationLabel) {
  let payload = `uuid: "${mc.uuid}" code: "${mc.code}"`;
  let mutation = formatMutation("deleteMicroCatchment", payload, clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", "LOCATION_DELETE_MICRO_CATCHMENT_RESP", "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

const CATCHMENT_PROJECTION = [
  "id",
  "uuid",
  "code",
  "name",
  "districts{id,uuid,code,name}",
  "validityFrom",
  "validityTo",
];

export function fetchCatchments(filters) {
  return graphql(formatPageQueryWithCount("catchments", filters, CATCHMENT_PROJECTION), "LOCATION_CATCHMENT_SEARCHER");
}

export function fetchCatchment(uuid) {
  const payload = formatPageQueryWithCount(
    "catchments",
    [`uuid: \"${uuid}\"`, "showHistory: false"],
    CATCHMENT_PROJECTION,
  );
  return graphql(payload, "LOCATION_CATCHMENT");
}

export const clearCatchment = () => (dispatch) => dispatch({ type: "LOCATION_CATCHMENT_CLEAR" });

function formatCatchmentGQL(catchment) {
  const districtIds = (catchment.districts || []).map((district) => toDbId(district.id)).filter((id) => id !== null);
  return `
    ${catchment.uuid ? `uuid: \"${catchment.uuid}\"` : ""}
    code: \"${formatGQLString(catchment.code)}\"
    name: \"${formatGQLString(catchment.name)}\"
    districtIds: [${districtIds.join(",")}]
  `;
}

function catchmentMutation(action, catchment, clientMutationLabel, responseType) {
  const mutation = formatMutation(action, formatCatchmentGQL(catchment), clientMutationLabel);
  return graphql(mutation.payload, ["LOCATION_MUTATION_REQ", responseType, "LOCATION_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime: new Date(),
  });
}

export const createCatchment = (catchment, label) =>
  catchmentMutation("createCatchment", catchment, label, "LOCATION_CREATE_CATCHMENT_RESP");

export const updateCatchment = (catchment, label) =>
  catchmentMutation("updateCatchment", catchment, label, "LOCATION_UPDATE_CATCHMENT_RESP");

export function deleteCatchment(catchment, clientMutationLabel) {
  const mutation = formatMutation(
    "deleteCatchment",
    `uuid: \"${catchment.uuid}\" code: \"${formatGQLString(catchment.code)}\"`,
    clientMutationLabel,
  );
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", "LOCATION_DELETE_CATCHMENT_RESP", "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime: new Date(),
    },
  );
}
