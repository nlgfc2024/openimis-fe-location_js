import React, { useState } from "react";
import { useModulesManager, useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const clusterLabel = (cluster) => (cluster ? [cluster.code, cluster.name].filter(Boolean).join(" - ") : "");

export default function ClusterPicker({ onChange, value, label, readOnly, required, districtUuid, requireDistrict = false, withLabel = true }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("location", modulesManager);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useGraphqlQuery(
    `query ClusterPicker($search: String, $districtUuid: String) {
      clusters(first: 20, search: $search, districtUuid: $districtUuid) { edges { node { id uuid code name traditionalAuthority { id uuid code name parent { id uuid code name } } } } }
    }`,
    { search, districtUuid },
    { skip: requireDistrict && !districtUuid },
  );
  return <Autocomplete required={required} readOnly={readOnly || (requireDistrict && !districtUuid)} withLabel={withLabel}
    label={formatMessage(label || "ZoneForm.cluster")} error={error} isLoading={isLoading}
    options={(data?.clusters?.edges?.map((edge) => edge.node) || []).filter((cluster) =>
      districtUuid ? cluster.traditionalAuthority?.parent?.uuid === districtUuid : !requireDistrict)} value={value}
    getOptionLabel={clusterLabel} onChange={(option) => onChange(option, clusterLabel(option))}
    onInputChange={setSearch} />;
}
