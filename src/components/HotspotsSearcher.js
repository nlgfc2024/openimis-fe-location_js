import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import DeleteIcon from "@material-ui/icons/Delete";
import { Button } from "@material-ui/core";
import {
  withModulesManager,
  formatMessage,
  formatMessageWithValues,
  formatDateFromISO,
  journalize,
  coreConfirm,
  Searcher,
} from "@openimis/fe-core";
import HotspotFilter from "./HotspotFilter";
import { fetchHotspotSummaries, deleteHotspot } from "../actions";
import { RIGHT_LOCATION_DELETE } from "../constants";
import { locationLabel } from "../utils";

class HotspotsSearcher extends Component {
  state = { reset: 0, confirmedAction: null };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf("fe-location", "hotspotFilter.rowsPerPageOptions", [
      10,
      20,
      50,
      100,
    ]);
    this.defaultPageSize = props.modulesManager.getConf("fe-location", "hotspotFilter.defaultPageSize", 10);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((prevState) => ({ ...prevState, reset: prevState.reset + 1 }));
    } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    }
  }

  rowIdentifier = (hotspot) => hotspot.uuid;

  headers = () => {
    const headers = [
      "hotspotSummaries.code",
      "hotspotSummaries.name",
      "hotspotSummaries.catchment",
      "hotspotSummaries.district",
      "hotspotSummaries.microCatchment",
      "hotspotSummaries.villages",
      "hotspotSummaries.description",
      "hotspotSummaries.validityFrom",
      "hotspotSummaries.validityTo",
    ];
    if (this.props.rights.includes(RIGHT_LOCATION_DELETE)) {
      headers.push(null);
    }
    return headers;
  };

  sorts = () => [
    ["code", true],
    ["name", true],
    null,
    ["micro_catchment__district__code", true],
    ["micro_catchment__code", true],
    null,
    null,
    ["validityFrom", false],
    ["validityTo", false],
  ];

  itemFormatters = () => {
    const formatters = [
      (hotspot) => hotspot.code,
      (hotspot) => hotspot.name,
      (hotspot) =>
        (hotspot.microCatchment?.traditionalAuthorities || [])
          .map((ta) => ta?.location?.name)
          .filter(Boolean)
          .join(", ") || null,
      (hotspot) => (hotspot.microCatchment?.district ? locationLabel(hotspot.microCatchment.district) : null),
      (hotspot) => (hotspot.microCatchment ? locationLabel(hotspot.microCatchment) : null),
      (hotspot) => (hotspot.villages?.length ? hotspot.villages.map(locationLabel).join(", ") : null),
      (hotspot) => hotspot.description,
      (hotspot) => formatDateFromISO(this.props.modulesManager, this.props.intl, hotspot.validityFrom),
      (hotspot) => formatDateFromISO(this.props.modulesManager, this.props.intl, hotspot.validityTo),
    ];
    if (this.props.rights.includes(RIGHT_LOCATION_DELETE)) {
      formatters.push((hotspot) =>
        hotspot.validityTo ? null : (
          <Button startIcon={<DeleteIcon />} disabled={!!hotspot.clientMutationId} onClick={() => this.onDelete(hotspot)}>
            {formatMessage(this.props.intl, "location", "deleteHotspot.buttonText")}
          </Button>
        ),
      );
    }
    return formatters;
  };

  onDelete = (hotspot) => {
    const confirm = () =>
      this.props.coreConfirm(
        formatMessage(this.props.intl, "location", "deleteHotspot.confirm.title"),
        formatMessageWithValues(this.props.intl, "location", "deleteHotspot.confirm.message", {
          code: hotspot.code,
          name: hotspot.name,
        }),
      );
    const confirmedAction = () =>
      this.props.deleteHotspot(
        hotspot,
        formatMessageWithValues(this.props.intl, "location", "DeleteHotspot.mutationLabel", { code: hotspot.code }),
      );
    this.setState({ confirmedAction }, confirm);
  };

  rowLocked = (selection, hotspot) => hotspot.clientMutationId;

  render() {
    const {
      intl,
      hotspots,
      hotspotsPageInfo,
      fetchingHotspots,
      fetchedHotspots,
      errorHotspots,
      onDoubleClick,
    } = this.props;
    const count = hotspotsPageInfo.totalCount;
    return (
      <Fragment>
        <Searcher
          module="location"
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          fetch={this.props.fetchHotspotSummaries}
          reset={this.state.reset}
          cacheFiltersKey="locationHotspotsSearcher"
          items={hotspots}
          rowIdentifier={this.rowIdentifier}
          rowLocked={this.rowLocked}
          itemsPageInfo={hotspotsPageInfo}
          fetchingItems={fetchingHotspots}
          fetchedItems={fetchedHotspots}
          errorItems={errorHotspots}
          FilterPane={HotspotFilter}
          tableTitle={formatMessageWithValues(intl, "location", "hotspotSummaries", { count })}
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          sorts={this.sorts}
          onDoubleClick={onDoubleClick}
        />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  submittingMutation: state.loc.submittingMutation,
  mutation: state.loc.mutation,
  confirmed: state.core.confirmed,
  hotspots: state.loc.hotspots,
  hotspotsPageInfo: state.loc.hotspotsPageInfo,
  fetchingHotspots: state.loc.fetchingHotspots,
  fetchedHotspots: state.loc.fetchedHotspots,
  errorHotspots: state.loc.errorHotspots,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchHotspotSummaries, deleteHotspot, coreConfirm, journalize }, dispatch);

export default withModulesManager(injectIntl(connect(mapStateToProps, mapDispatchToProps)(HotspotsSearcher)));
