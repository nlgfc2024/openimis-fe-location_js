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
import ZoneFilter from "./ZoneFilter";
import { fetchZoneSummaries, deleteZone } from "../zoneActions";
import { RIGHT_ZONE_ADD, RIGHT_ZONE_DELETE, RIGHT_ZONE_EDIT } from "../constants";
import { locationLabel } from "../utils";

class ZonesSearcher extends Component {
  state = { reset: 0, confirmedAction: null, pendingDelete: null };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf("fe-location", "zoneFilter.rowsPerPageOptions", [
      10,
      20,
      50,
      100,
    ]);
    this.defaultPageSize = props.modulesManager.getConf("fe-location", "zoneFilter.defaultPageSize", 10);
  }

  fetch = (params) => {
    this.lastQueryParams = params;
    return this.props.fetchZoneSummaries(params);
  };

  componentDidUpdate(prevProps) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      if (this.state.pendingDelete && this.props.mutation?.id) {
        this.props.coreAlert(
          formatMessage(this.props.intl, "location", "zone.alert.success"),
          formatMessageWithValues(this.props.intl, "location", "zone.delete.success", {
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

  rowIdentifier = (zone) => zone.uuid;

  headers = () => {
    const headers = [
      "zoneSummaries.code",
      "zoneSummaries.name",
      "zoneSummaries.district",
      "zoneSummaries.cluster",
      "zoneSummaries.villages",
      "zoneSummaries.description",
    ];
    if (this.props.rights.includes(RIGHT_ZONE_EDIT) || this.props.rights.includes(RIGHT_ZONE_DELETE)) {
      headers.push(null);
    }
    return headers;
  };

  sorts = () => [
    ["code", true],
    ["name", true],
    ["cluster__traditional_authority__parent__code", true],
    ["cluster__code", true],
    null,
    null,
  ];

  itemFormatters = () => {
    const formatters = [
      (zone) => zone.code,
      (zone) => zone.name,
      (zone) => {
        const district = zone.cluster?.traditionalAuthority?.parent;
        return district ? locationLabel(district) : formatMessage(this.props.intl, "location", "zoneSummaries.notAssigned");
      },
      (zone) => (zone.cluster ? locationLabel(zone.cluster) : formatMessage(this.props.intl, "location", "zoneSummaries.notAssigned")),
      (zone) => (zone.villages?.length ? zone.villages.map(locationLabel).join(", ") : null),
      (zone) => zone.description,
    ];
    if (this.props.rights.includes(RIGHT_ZONE_EDIT) || this.props.rights.includes(RIGHT_ZONE_DELETE)) {
      formatters.push((zone) => {
        if (zone.validityTo) return null;
        const editLabel = formatMessage(this.props.intl, "location", "editZone.buttonText");
        const deleteLabel = formatMessage(this.props.intl, "location", "deleteZone.buttonText");
        return (
          <span style={{ display: "inline-flex" }}>
            {this.props.rights.includes(RIGHT_ZONE_EDIT) && (
              <Tooltip title={editLabel}>
                <span>
                  <IconButton
                    aria-label={editLabel}
                    disabled={!!zone.clientMutationId}
                    onClick={() => this.props.onDoubleClick(zone)}
                  >
                    <EditIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {this.props.rights.includes(RIGHT_ZONE_DELETE) && (
              <Tooltip title={deleteLabel}>
                <span>
                  <IconButton
                    aria-label={deleteLabel}
                    disabled={!!zone.clientMutationId}
                    onClick={() => this.onDelete(zone)}
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

  onDelete = (zone) => {
    const confirm = () =>
      this.props.coreConfirm(
        formatMessage(this.props.intl, "location", "deleteZone.confirm.title"),
        formatMessageWithValues(this.props.intl, "location", "deleteZone.confirm.message", {
          code: zone.code,
          name: zone.name,
        }),
      );
    const confirmedAction = () => {
      this.setState({ pendingDelete: zone });
      this.props.deleteZone(
        zone,
        formatMessageWithValues(this.props.intl, "location", "DeleteZone.mutationLabel", { code: zone.code }),
      );
    };
    this.setState({ confirmedAction }, confirm);
  };

  rowLocked = (selection, zone) => zone.clientMutationId;

  searcherActions = () => [
    {
      label: formatMessage(this.props.intl, "location", "zones.searcherAddAction"),
      icon: <AddIcon />,
      authorized: this.props.rights.includes(RIGHT_ZONE_ADD),
      onClick: this.props.onAdd,
    },
  ];

  render() {
    const {
      intl,
      zones,
      zonesPageInfo,
      fetchingZones,
      fetchedZones,
      errorZones,
      onDoubleClick,
    } = this.props;
    const count = zonesPageInfo.totalCount;
    return (
      <Fragment>
        <Searcher
          module="location"
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          fetch={this.fetch}
          reset={this.state.reset}
          cacheFiltersKey="locationZonesSearcher"
          items={zones}
          rowIdentifier={this.rowIdentifier}
          rowLocked={this.rowLocked}
          itemsPageInfo={zonesPageInfo}
          fetchingItems={fetchingZones}
          fetchedItems={fetchedZones}
          errorItems={errorZones}
          FilterPane={ZoneFilter}
          tableTitle={formatMessageWithValues(intl, "location", "zoneSummaries", { count })}
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
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights.map(Number) : [],
  submittingMutation: state.loc.submittingMutation,
  mutation: state.loc.mutation,
  confirmed: state.core.confirmed,
  zones: state.loc.zones,
  zonesPageInfo: state.loc.zonesPageInfo,
  fetchingZones: state.loc.fetchingZones,
  fetchedZones: state.loc.fetchedZones,
  errorZones: state.loc.errorZones,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchZoneSummaries, deleteZone, coreConfirm, coreAlert, journalize }, dispatch);

export default withModulesManager(injectIntl(connect(mapStateToProps, mapDispatchToProps)(ZonesSearcher)));
