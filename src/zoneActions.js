import {
  graphql,
  graphqlWithVariables,
  formatPageQuery,
  formatPageQueryWithCount,
  formatGQLString,
  formatMutation,
} from "@openimis/fe-core";

export function waitForZoneMutation(clientMutationId) {
  return async (dispatch) => {
    let result = null;
    for (let attempt = 0; attempt <= 10; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
      const response = await dispatch(
        graphqlWithVariables(
          `query ($clientMutationId: String) {
            mutationLogs(clientMutationId: $clientMutationId) {
              edges { node { status clientMutationId jsonContent error } }
            }
          }`,
          { clientMutationId },
        ),
      );
      if (response?.error) return null;
      result = response?.payload?.data?.mutationLogs?.edges?.[0]?.node || null;
      if (result && result.status !== 0) break;
    }
    if (result?.status === 1 && result.error) {
      try {
        result.error = JSON.parse(result.error);
      } catch (error) {
        // Keep the raw backend error when it is not JSON.
      }
    }
    return result;
  };
}

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
