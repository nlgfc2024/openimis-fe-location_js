import { graphql, formatPageQuery, formatPageQueryWithCount, formatGQLString, formatMutation } from "@openimis/fe-core";

export function fetchZoneSummaries(filters) {
  const projections = [
    "id",
    "uuid",
    "code",
    "name",
    "description",
    "cluster{id, uuid, code, name, traditionalAuthority{id, uuid, code, name, parent{id, uuid, code, name}}}",
    "villages{id, uuid, code, name, parent{id, uuid, code, name, parent{id, uuid, code, name, parent{id, uuid, code, name}}}}",
    "validityFrom",
    "validityTo",
  ];
  const payload = formatPageQueryWithCount("zones", filters, projections);
  return graphql(payload, "LOCATION_ZONE_SEARCHER");
}
export function fetchZone(zoneUuid, zoneCode) {
  const filters = [zoneUuid ? `uuid: "${zoneUuid}"` : `code: "${zoneCode}"`];
  const projections = [
    "id",
    "uuid",
    "code",
    "name",
    "description",
    "cluster{id, uuid, code, name, traditionalAuthority{id, uuid, code, name, parent{id, uuid, code, name}}}",
    "villages{id, uuid, code, name, parent{id, uuid, code, name, parent{id, uuid, code, name, parent{id, uuid, code, name}}}}",
    "validityFrom",
    "validityTo",
  ];
  const payload = formatPageQuery("zones", filters, projections);
  return graphql(payload, "LOCATION_ZONE");
}

export function fetchCreatedZone(clusterUuid, villageUuid) {
  const filters = [
    `cluster_Uuid: "${clusterUuid}"`,
    `villageLinks_Location_Uuid: "${villageUuid}"`,
  ];
  const projections = ["id", "uuid", "code", "name"];
  const payload = formatPageQuery("zones", filters, projections);
  return graphql(payload, "LOCATION_CREATED_ZONE");
}

export function clearZone() {
  return (dispatch) => {
    dispatch({ type: "LOCATION_ZONE_CLEAR" });
  };
}

export function fetchZoneMutation(clientMutationId) {
  return graphql(formatPageQuery("mutationLogs", [
    `clientMutationId: "${clientMutationId}"`,
  ], ["status", "error"]), "LOCATION_ZONE_MUTATION_STATUS");
}

function formatZoneGQL(zone) {
  return `
    ${zone.uuid !== undefined && zone.uuid !== null ? `uuid: "${zone.uuid}"` : ""}
    ${zone.code ? `code: "${formatGQLString(zone.code)}"` : ""}
    name: "${formatGQLString(zone.name.trim())}"
    description: "${formatGQLString(zone.description || "")}"
    clusterUuid: "${zone.cluster.uuid}"
    villageUuids: [${zone.villages.map((village) => `"${village.uuid}"`).join(", ")}]
  `;
}

export function createOrUpdateZone(zone, clientMutationLabel) {
  const action = (zone.uuid ? "update" : "create");
  const mutation = formatMutation(`${action}Zone`, formatZoneGQL(zone), clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["LOCATION_MUTATION_REQ", `LOCATION_${action.toUpperCase()}_ZONE_RESP`, "LOCATION_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
}

export function deleteZone(zone, clientMutationLabel) {
  const mutation = formatMutation("deleteZone", `uuid: "${zone.uuid}"`, clientMutationLabel);
  const requestedDateTime = new Date();
  zone.clientMutationId = mutation.clientMutationId;
  return graphql(mutation.payload, ["LOCATION_MUTATION_REQ", "LOCATION_DELETE_ZONE_RESP", "LOCATION_MUTATION_ERR"], {
    clientMutationId: mutation.clientMutationId,
    clientMutationLabel,
    requestedDateTime,
  });
}
