import { graphqlWithVariables } from "@openimis/fe-core";

const fields = `uuid code name traditionalAuthority {
  id uuid code name parent { id uuid code name }
}`;

export const fetchClusters = (variables) => graphqlWithVariables(
  `query Clusters($search: String, $first: Int, $after: String, $before: String,
      $districtUuid: String, $traditionalAuthorityUuid: String) {
    clusters(search: $search, first: $first, after: $after, before: $before,
      districtUuid: $districtUuid, traditionalAuthorityUuid: $traditionalAuthorityUuid) {
      edges { node { ${fields} } }
      pageInfo { hasNextPage endCursor }
    }
  }`, variables, "LOCATION_CLUSTER_LIST",
);

export const saveCluster = (variables) => graphqlWithVariables(
  `mutation SaveCluster($uuid: String, $code: String, $name: String!,
      $districtUuid: String!, $traditionalAuthorityUuid: String!) {
    saveCluster(uuid: $uuid, code: $code, name: $name,
        districtUuid: $districtUuid, traditionalAuthorityUuid: $traditionalAuthorityUuid) {
      cluster { ${fields} }
    }
  }`, variables, "LOCATION_CLUSTER_SAVE",
);

export const fetchCluster = (uuid) => graphqlWithVariables(
  `query Cluster($uuid: String!) {
    clusters(uuid: $uuid, first: 1) { edges { node { ${fields} } } }
  }`, { uuid }, "LOCATION_CLUSTER_DETAIL",
);

export const deleteCluster = (uuid) => graphqlWithVariables(
  `mutation DeleteCluster($uuid: String!) { deleteCluster(uuid: $uuid) { uuid } }`,
  { uuid }, "LOCATION_CLUSTER_DELETE",
);

export function clusterResponse(response, field) {
  const errors = response?.payload?.errors;
  if (errors?.length) throw new Error(errors.map((error) => error.message).join("\n"));
  if (response?.error || !response?.payload?.data?.[field]) {
    throw new Error(response?.payload?.message || "Unable to complete the request. Please try again.");
  }
  return response.payload.data[field];
}
