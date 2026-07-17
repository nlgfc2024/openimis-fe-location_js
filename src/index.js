import LocationsPage from "./pages/LocationsPage";
import React from "react";
import HealthFacilitiesPage from "./pages/HealthFacilitiesPage";
import HealthFacilityEditPage from "./pages/HealthFacilityEditPage";
import HotspotsPage from "./pages/HotspotsPage";
import HotspotEditPage from "./pages/HotspotEditPage";
import MicroCatchmentsPage from "./pages/MicroCatchmentsPage";
import MicroCatchmentEditPage from "./pages/MicroCatchmentEditPage";
import { FormattedMessage } from "@openimis/fe-core";
import { LocalHospital, LocationOn, PinDrop } from "@material-ui/icons";
import UserHealthFacilityLoader from "./components/UserHealthFacilityLoader";
import UserDistrictsLoader from "./components/UserDistrictsLoader";
import HealthFacilityFullPath from "./components/HealthFacilityFullPath";
import HealthFacilityPicker from "./pickers/HealthFacilityPicker";
import HealthFacilityReferPicker from "./pickers/HealthFacilityReferPicker";
import HealthFacilityLevelPicker from "./pickers/HealthFacilityLevelPicker";
import HealthFacilityStatusPicker from "./pickers/HealthFacilityStatusPicker";
import HealthFacilitySubLevelPicker from "./pickers/HealthFacilitySubLevelPicker";
import HealthFacilityLegalFormPicker from "./pickers/HealthFacilityLegalFormPicker";
import HealthFacilityPriceListsPanel from "./components/HealthFacilityPriceListsPanel";
import CoarseLocationFilter from "./filters/CoarseLocationFilter";
import DetailedLocationFilter from "./filters/DetailedLocationFilter";
import CoarseLocation from "./components/CoarseLocation";
import FSPCoarseLocation from "./components/FSPCoarseLocation";
import DetailedLocation from "./components/DetailedLocation";
import DetailedHealthFacility from "./components/DetailedHealthFacility";
import RegionPicker from "./pickers/RegionPicker";
import DistrictPicker from "./pickers/DistrictPicker";
import LocationPicker from "./pickers/LocationPicker";
import LocationCascader from "./pickers/LocationCascader";
import FSPLocationPicker from "./pickers/FSPLocationPicker";
import LocationTypePicker from "./pickers/LocationTypePicker";
import MicroCatchmentPicker from "./pickers/MicroCatchmentPicker";
import messages_en from "./translations/en.json";
import reducer from "./reducer";
import {
  RIGHT_LOCATIONS,
  RIGHT_LOCATION_ADD,
  RIGHT_LOCATION_EDIT,
  RIGHT_HEALTH_FACILITY_ADD,
  RIGHT_HEALTH_FACILITIES,
  RIGHT_MICRO_CATCHMENT_ADD,
  RIGHT_MICRO_CATCHMENT_EDIT,
  RIGHT_MICRO_CATCHMENT_DELETE,
} from "./constants";

import { LOCATION_SUMMARY_PROJECTION, nestParentsProjections } from "./utils";
import { HEALTH_FACILITY_PICKER_PROJECTION, HEALTH_FACILITY_REFER_PICKER_PROJECTION } from "./actions";
import HotspotVillagesPicker from "./pickers/HotspotVillagesPicker";

const ROUTE_LOCATIONS = "location/locations";
const ROUTE_HEALTH_FACILITIES = "location/healthFacilities";
const ROUTE_HEALTH_FACILITY_EDIT = "location/healthFacility";
const ROUTE_HOTSPOTS = "location/hotspots";
const ROUTE_HOTSPOT_EDIT = "location/hotspot";
const ROUTE_MICRO_CATCHMENTS = "location/microCatchments";
const ROUTE_MICRO_CATCHMENT_EDIT = "location/microCatchment";

const hasRight = (rights, right) => rights.includes(right) || rights.includes(String(right));
const hasMicroCatchmentAccess = (rights = []) =>
  [RIGHT_MICRO_CATCHMENT_ADD, RIGHT_MICRO_CATCHMENT_EDIT, RIGHT_MICRO_CATCHMENT_DELETE].some((right) =>
    hasRight(rights, right)
  );

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "reducers": [{ key: "loc", reducer: reducer }], // location is the default used by syncHistoryWithStore...
  "refs": [
    { key: "location.route.healthFacilities", ref: ROUTE_HEALTH_FACILITIES },
    { key: "location.route.healthFacilityEdit", ref: ROUTE_HEALTH_FACILITY_EDIT },
    { key: "location.route.hotspots", ref: ROUTE_HOTSPOTS },
    { key: "location.route.hotspotEdit", ref: ROUTE_HOTSPOT_EDIT },
    { key: "location.HealthFacilityFullPath", ref: HealthFacilityFullPath },
    { key: "location.HealthFacilityPicker", ref: HealthFacilityPicker },
    { key: "location.HealthFacilityPicker.projection", ref: HEALTH_FACILITY_PICKER_PROJECTION },
    { key: "location.HealthFacilityReferPicker", ref: HealthFacilityReferPicker },
    { key: "location.HealthFacilityReferPicker.projection", ref: HEALTH_FACILITY_REFER_PICKER_PROJECTION },
    { key: "location.HealthFacilityPicker.sort", ref: "healthFacility__code" },
    { key: "location.HealthFacilityLevelPicker", ref: HealthFacilityLevelPicker },
    { key: "location.HealthFacilityLevelPicker.projection", ref: null },
    { key: "location.HealthFacilitySubLevelPicker", ref: HealthFacilitySubLevelPicker },
    { key: "location.HealthFacilityStatusPicker", ref: HealthFacilityStatusPicker },
    { key: "location.HealthFacilitySubLevelPicker.projection", ref: null },
    { key: "location.HealthFacilityLegalFormPicker", ref: HealthFacilityLegalFormPicker },
    { key: "location.HealthFacilityLegalFormPicker.projection", ref: ["code", "legalForm"] },
    { key: "location.RegionPicker", ref: RegionPicker },
    { key: "location.DistrictPicker", ref: DistrictPicker },
    { key: "location.LocationPicker", ref: LocationPicker },
    { key: "location.LocationCascader", ref: LocationCascader },
    { key: "location.FSPLocationPicker", ref: FSPLocationPicker },
    { key: "location.HealthFacilityGQLType", ref: "HealthFacilityGQLType" },
    { key: "location.HealthFacilityPriceListsPanel", ref: HealthFacilityPriceListsPanel },
    { key: "location.LocationTypePicker", ref: LocationTypePicker },
    { key: "location.MicroCatchmentPicker", ref: MicroCatchmentPicker },
    { key: "location.HotspotVillagesPicker", ref: HotspotVillagesPicker },
    { key: "location.LocationGQLType", ref: "LocationGQLType" },
    { key: "location.Location.MaxLevels", ref: "4" },
    { key: "location.LocationsPage", ref: LocationsPage },
    { key: "location.HealthFacilitiesPage", ref: HealthFacilitiesPage },
    { key: "location.HotspotsPage", ref: HotspotsPage },
    { key: "location.CoarseLocationFilter", ref: CoarseLocationFilter },
    { key: "location.DetailedLocationFilter", ref: DetailedLocationFilter },
    { key: "location.CoarseLocation", ref: CoarseLocation },
    { key: "location.FSPCoarseLocation", ref: FSPCoarseLocation },
    { key: "location.DetailedLocation", ref: DetailedLocation },
    { key: "location.DetailedHealthFacility", ref: DetailedHealthFacility },
    
    { key: "location.route.healthFacility", ref: ROUTE_HEALTH_FACILITY_EDIT },
    { key: "location.route.hotspot", ref: ROUTE_HOTSPOT_EDIT },
    { key: "location.route.microCatchments", ref: ROUTE_MICRO_CATCHMENTS },
    { key: "location.route.microCatchment", ref: ROUTE_MICRO_CATCHMENT_EDIT },
  ],
  "core.Router": [
    {
      path: ROUTE_LOCATIONS,
      component: LocationsPage,
      rights: [RIGHT_LOCATIONS],
      icon: "LocationOn",
      text: "location.locations.page.title",
    },
    {
      path: ROUTE_HOTSPOTS,
      component: HotspotsPage,
      rights: [RIGHT_LOCATIONS],
      icon: "LocationOn",
      text: "location.hotspots.page.title",
    },
    {
      path: ROUTE_HOTSPOT_EDIT,
      component: HotspotEditPage,
      rights: [RIGHT_LOCATION_ADD],
      icon: "LocationOn",
    },
    {
      path: ROUTE_HOTSPOT_EDIT + "/:hotspot_uuid?",
      component: HotspotEditPage,
      rights: [RIGHT_LOCATION_EDIT],
      icon: "LocationOn",
    },
    {
      path: ROUTE_HEALTH_FACILITIES,
      component: HealthFacilitiesPage,
      rights: [RIGHT_HEALTH_FACILITIES],
      icon: "LocalHospital",
      text: "location.healthFacilities.page.title",
    },
    {
      path: ROUTE_HEALTH_FACILITY_EDIT,
      component: HealthFacilityEditPage,
      rights: [RIGHT_HEALTH_FACILITY_ADD],
      icon: "LocalHospital",
    },
    {
      path: ROUTE_HEALTH_FACILITY_EDIT + "/:healthFacility_uuid?",
      component: HealthFacilityEditPage,
      rights: [RIGHT_LOCATIONS],
      icon: "LocalHospital",
    },
    { path: ROUTE_MICRO_CATCHMENTS, component: MicroCatchmentsPage },
    { path: ROUTE_MICRO_CATCHMENT_EDIT, component: MicroCatchmentEditPage },
    { path: ROUTE_MICRO_CATCHMENT_EDIT + "/:microCatchment_uuid?", component: MicroCatchmentEditPage },
  ],
  "admin.MainMenu": [
    {
      text: <FormattedMessage module="location" id="menu.microCatchments" />,
      icon: <LocationOn />,
      route: `/${ROUTE_MICRO_CATCHMENTS}`,
      id: "location.microCatchments",
      filter: (rights) => hasMicroCatchmentAccess(rights),
    },
    {
      text: <FormattedMessage module="admin" id="menu.locations" />,
      icon: <PinDrop />,
      route: `/${ROUTE_LOCATIONS}`,
      id: "admin.locations",
      filter: (rights) => rights.includes(RIGHT_LOCATIONS),
      withDivider: true,
    },
    {
      text: <FormattedMessage module="location" id="hotspots.page.title" />,
      icon: <LocationOn />,
      route: `/${ROUTE_HOTSPOTS}`,
      id: "admin.hotspots",
      filter: (rights) => rights.includes(RIGHT_LOCATIONS),
      withDivider: true,
    },
    {
      text: <FormattedMessage module="admin" id="menu.healthFacilities" />,
      icon: <LocalHospital />,
      route: `/${ROUTE_HEALTH_FACILITIES}`,
      id: "admin.healthFacilities",
      filter: (rights) => rights.includes(RIGHT_HEALTH_FACILITIES),
      withDivider: true,
    },
  ],
  "core.Boot": [UserHealthFacilityLoader, UserDistrictsLoader],
  "invoice.SubjectAndThirdpartyPicker": [
    {
      type: "health facility",
      picker: HealthFacilityPicker,
      pickerProjection: HEALTH_FACILITY_PICKER_PROJECTION,
    },
  ],
};

export const LocationModule = (cfg) => {
  let config = { ...DEFAULT_CONFIG, ...cfg };
  var levels = config.refs.filter((c) => c.key === "location.Location.MaxLevels")[0].ref;
  config.refs.push({
    key: "location.Location.FlatProjection",
    ref: [...LOCATION_SUMMARY_PROJECTION, nestParentsProjections(levels - 2)],
  });
  return config;
};
