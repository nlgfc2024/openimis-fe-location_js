import React from "react";
import { PublishedComponent, useModulesManager } from "@openimis/fe-core";
import GeospatialDashboard from "./GeospatialDashboard";

export default function GeospatialBridge(props) {
  const manager = useModulesManager();
  return manager.getConf("fe-mapping", "enabled", false) === true
    ? <PublishedComponent pubRef="mapping.MappingMap" {...props} />
    : <GeospatialDashboard {...props} />;
}
