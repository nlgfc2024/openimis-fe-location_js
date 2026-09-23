import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import { IconButton, Tooltip } from "@material-ui/core";
import {
  withModulesManager,
  formatMessage,
  formatMessageWithValues,
  journalize,
  coreConfirm,
  coreAlert,
  Searcher,
} from "@openimis/fe-core";
import HotspotFilter from "./HotspotFilter";
import { fetchHotspotSummaries, deleteHotspot } from "../actions";
import { RIGHT_HOTSPOT_ADD, RIGHT_HOTSPOT_DELETE, RIGHT_HOTSPOT_EDIT } from "../constants";
import { locationLabel } from "../utils";

class HotspotsSearcher extends Component {
  state = { reset: 0, confirmedAction: null, pendingDelete: null };

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

  fetch = (params) => {
    this.lastQueryParams = params;
    return this.props.fetchHotspotSummaries(params);
  };

  componentDidUpdate(prevProps) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      if (this.state.pendingDelete && this.props.mutation?.id) {
        this.props.coreAlert(
          formatMessage(this.props.intl, "location", "hotspot.alert.success"),
          formatMessageWithValues(this.props.intl, "location", "hotspot.delete.success", {
            code: this.state.pendingDelete.code,
          }),
        );
        if (this.lastQueryParams) this.fetch(this.lastQueryParams);
      }
      this.setState((prevState) => ({
        reset: prevState.reset + 1,
        pendingDelete: null,
      }));
    } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
      this.setState({ confirmedAction: null });
    }
  }

  rowIdentifier = (hotspot) => hotspot.uuid;

  headers = () => {
    const headers = [
      "hotspotSummaries.code",
      "hotspotSummaries.name",
      "hotspotSummaries.district",
      "hotspotSummaries.microCatchment",
      "hotspotSummaries.villages",
      "hotspotSummaries.description",
    ];
    if (this.props.rights.includes(RIGHT_HOTSPOT_EDIT) || this.props.rights.includes(RIGHT_HOTSPOT_DELETE)) {
      headers.push(null);
    }
    return headers;
  };

  sorts = () => [
    ["code", true],
    ["name", true],
    ["micro_catchment__district__code", true],
    ["micro_catchment__code", true],
    null,
    null,
  ];

  itemFormatters = () => {
    const formatters = [
      (hotspot) => hotspot.code,
      (hotspot) => hotspot.name,
      (hotspot) => (hotspot.microCatchment?.district ? locationLabel(hotspot.microCatchment.district) : null),
      (hotspot) => (hotspot.microCatchment ? locationLabel(hotspot.microCatchment) : null),
      (hotspot) => (hotspot.villages?.length ? hotspot.villages.map(locationLabel).join(", ") : null),
      (hotspot) => hotspot.description,
    ];
    if (this.props.rights.includes(RIGHT_HOTSPOT_EDIT) || this.props.rights.includes(RIGHT_HOTSPOT_DELETE)) {
      formatters.push((hotspot) => {
        if (hotspot.validityTo) return null;
        const editLabel = formatMessage(this.props.intl, "location", "editHotspot.buttonText");
        const deleteLabel = formatMessage(this.props.intl, "location", "deleteHotspot.buttonText");
        return (
          <span style={{ display: "inline-flex" }}>
            {this.props.rights.includes(RIGHT_HOTSPOT_EDIT) && (
              <Tooltip title={editLabel}>
                <span>
                  <IconButton
                    aria-label={editLabel}
                    disabled={!!hotspot.clientMutationId}
                    onClick={() => this.props.onDoubleClick(hotspot)}
                  >
                    <EditIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {this.props.rights.includes(RIGHT_HOTSPOT_DELETE) && (
              <Tooltip title={deleteLabel}>
                <span>
                  <IconButton
                    aria-label={deleteLabel}
                    disabled={!!hotspot.clientMutationId}
                    onClick={() => this.onDelete(hotspot)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </span>
        );
      });
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
    const confirmedAction = () => {
      this.setState({ pendingDelete: hotspot });
      this.props.deleteHotspot(
        hotspot,
        formatMessageWithValues(this.props.intl, "location", "DeleteHotspot.mutationLabel", { code: hotspot.code }),
      );
    };
    this.setState({ confirmedAction }, confirm);
  };

  rowLocked = (selection, hotspot) => hotspot.clientMutationId;

  searcherActions = () => [
    {
      label: formatMessage(this.props.intl, "location", "hotspots.searcherAddAction"),
      icon: <AddIcon />,
      authorized: this.props.rights.includes(RIGHT_HOTSPOT_ADD),
      onClick: this.props.onAdd,
    },
  ];

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
          fetch={this.fetch}
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
          enableActionButtons
          searcherActionsPosition="header-right"
          searcherActions={this.searcherActions()}
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
  bindActionCreators({ fetchHotspotSummaries, deleteHotspot, coreConfirm, coreAlert, journalize }, dispatch);

export default withModulesManager(injectIntl(connect(mapStateToProps, mapDispatchToProps)(HotspotsSearcher)));
