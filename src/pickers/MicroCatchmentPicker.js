import React, { useState } from "react";
import { useModulesManager, useTranslations, Autocomplete, useGraphqlQuery } from "@openimis/fe-core";

const microCatchmentLabel = (mc) => (mc ? [mc.code, mc.name].filter(Boolean).join(" - ") : "");

const MicroCatchmentPicker = (props) => {
  const {
    onChange,
    readOnly,
    required,
    withLabel = true,
    withPlaceholder,
    value,
    label,
    placeholder,
    filterOptions,
    filterSelectedOptions,
  } = props;

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("location", modulesManager);
  const [searchString, setSearchString] = useState("");

  const { data, isLoading, error } = useGraphqlQuery(
    `
    query MicroCatchmentPicker ($search: String) {
      microCatchments(first: 20, name_Icontains: $search, orderBy: ["name"]) {
        edges {
          node {
            id
            uuid
            code
            name
            district { id uuid code name }
            traditionalAuthorities { id location { id uuid code name } }
            gvhs { id location { id uuid code name } }
          }
        }
      }
    }
  `,
    { search: searchString },
  );

  return (
    <Autocomplete
      required={required}
      placeholder={placeholder ?? formatMessage("MicroCatchmentPicker.placeholder")}
      label={label ?? formatMessage("MicroCatchmentPicker.label")}
      error={error}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      options={data?.microCatchments?.edges.map((edge) => edge.node) ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={microCatchmentLabel}
      onChange={(option) => onChange(option, microCatchmentLabel(option))}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={setSearchString}
    />
  );
};

export default MicroCatchmentPicker;
