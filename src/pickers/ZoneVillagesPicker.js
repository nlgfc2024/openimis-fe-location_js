import React from "react";
import { useModulesManager, useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const villageLabel = (v) => (v ? [v.code, v.name].filter(Boolean).join(" - ") : "");

/**
 * Multi-select picker of the villages that may be attached to a zone for a
 * given cluster (villages under the cluster's Traditional Authority). Backed by
 * the `zoneEligibleVillages` query so the list always matches the backend rule.
 */
const ZoneVillagesPicker = (props) => {
  const {
    onChange,
    readOnly,
    required,
    withLabel = true,
    withPlaceholder,
    value,
    label,
    placeholder,
    clusterUuid,
    zoneUuid,
    filterOptions,
    filterSelectedOptions,
  } = props;

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("location", modulesManager);

  const { data, isLoading, error } = useGraphqlQuery(
    `
    query ZoneEligibleVillages ($clusterUuid: String!, $zoneUuid: String) {
      zoneEligibleVillages(clusterUuid: $clusterUuid, zoneUuid: $zoneUuid) {
        id
        uuid
        code
        name
      }
    }
  `,
    { clusterUuid, zoneUuid },
    { skip: !clusterUuid },
  );

  return (
    <Autocomplete
      multiple
      required={required}
      placeholder={placeholder ?? formatMessage("ZoneVillagesPicker.placeholder")}
      label={formatMessage(label ?? "ZoneVillagesPicker.label")}
      error={error}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly || !clusterUuid}
      options={data?.zoneEligibleVillages ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={villageLabel}
      onChange={(options) => onChange(options)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      // Eligible villages are fully fetched per cluster; MUI filters them
      // client-side, so no server-side search callback is needed (but the prop is required).
      onInputChange={() => {}}
    />
  );
};

export default ZoneVillagesPicker;
