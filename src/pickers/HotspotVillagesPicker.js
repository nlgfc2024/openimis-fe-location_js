import React from "react";
import { useModulesManager, useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const villageLabel = (v) => (v ? [v.code, v.name].filter(Boolean).join(" - ") : "");

/**
 * Multi-select picker of the villages that may be attached to a hotspot for a
 * given micro-catchment (villages under the micro-catchment's GVHs). Backed by
 * the `hotspotEligibleVillages` query so the list always matches the backend rule.
 */
const HotspotVillagesPicker = (props) => {
  const {
    onChange,
    readOnly,
    required,
    withLabel = true,
    withPlaceholder,
    value,
    label,
    placeholder,
    microCatchmentUuid,
    hotspotUuid,
    filterOptions,
    filterSelectedOptions,
  } = props;

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("location", modulesManager);

  const { data, isLoading, error } = useGraphqlQuery(
    `
    query HotspotEligibleVillages ($microCatchmentUuid: String!, $hotspotUuid: String) {
      hotspotEligibleVillages(microCatchmentUuid: $microCatchmentUuid, hotspotUuid: $hotspotUuid) {
        id
        uuid
        code
        name
      }
    }
  `,
    { microCatchmentUuid, hotspotUuid },
    { skip: !microCatchmentUuid },
  );

  return (
    <Autocomplete
      multiple
      required={required}
      placeholder={placeholder ?? formatMessage("HotspotVillagesPicker.placeholder")}
      label={formatMessage(label ?? "HotspotVillagesPicker.label")}
      error={error}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly || !microCatchmentUuid}
      options={data?.hotspotEligibleVillages ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={villageLabel}
      onChange={(options) => onChange(options)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      // Eligible villages are fully fetched per micro-catchment; MUI filters them
      // client-side, so no server-side search callback is needed (but the prop is required).
      onInputChange={() => {}}
    />
  );
};

export default HotspotVillagesPicker;
