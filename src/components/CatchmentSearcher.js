import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import { IconButton, Tooltip } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import {
  Searcher,
  coreConfirm,
  formatMessage,
  formatMessageWithValues,
  historyPush,
  journalize,
  withHistory,
  withModulesManager,
} from "@openimis/fe-core";
import { deleteCatchment, fetchCatchments } from "../actions";
import { RIGHT_CATCHMENT_DELETE, RIGHT_CATCHMENT_EDIT } from "../constants";
import CatchmentFilter from "./CatchmentFilter";

const styles = (theme) => ({
  searchResults: {
    "& .MuiTableHead-root .MuiTableCell-root": {
      fontSize: 16,
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
    },
  },
});

class CatchmentSearcher extends Component {
  state = { reset: 0, confirmedAction: null };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-location",
      "catchmentFilter.rowsPerPageOptions",
      [10, 20, 50, 100],
    );
    this.defaultPageSize = props.modulesManager.getConf("fe-location", "catchmentFilter.defaultPageSize", 10);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state) => ({ reset: state.reset + 1 }));
    } else if (prevProps.confirmed !== this.props.confirmed && this.props.confirmed && this.state.confirmedAction) {
      this.state.confirmedAction();
      this.setState({ confirmedAction: null });
    }
  }

  hasRight = (right) => this.props.rights.includes(right) || this.props.rights.includes(String(right));

  filtersToQueryParams = (state) => {
    const params = Object.values(state.filters)
      .filter((filter) => !!filter.filter)
      .map((filter) => filter.filter);
    params.push(`first: ${state.pageSize}`);
    if (state.afterCursor) params.push(`after: "${state.afterCursor}"`);
    if (state.beforeCursor) params.push(`before: "${state.beforeCursor}"`);
    if (state.orderBy) params.push(`orderBy: ["${state.orderBy}"]`);
    return params;
  };

  onDoubleClick = (catchment, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "location.route.catchment", [catchment.uuid], newTab);
  };

  onDelete = (catchment) => {
    const confirmedAction = () =>
      this.props.deleteCatchment(
        catchment,
        formatMessageWithValues(this.props.intl, "location", "catchment.delete.mutationLabel", {
          code: catchment.code,
        }),
      );

    this.setState({ confirmedAction }, () =>
      this.props.coreConfirm(
        formatMessage(this.props.intl, "location", "catchment.delete.confirm.title"),
        formatMessageWithValues(this.props.intl, "location", "catchment.delete.confirm.message", {
          code: catchment.code,
          name: catchment.name,
        }),
      ),
    );
  };

  actionButtons = (catchment) => (
    <span style={{ display: "inline-flex" }}>
      {this.hasRight(RIGHT_CATCHMENT_EDIT) && (
        <Tooltip title={formatMessage(this.props.intl, "location", "catchment.edit.button")}>
          <IconButton onClick={() => this.onDoubleClick(catchment)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
      )}
      {this.hasRight(RIGHT_CATCHMENT_DELETE) && (
        <Tooltip title={formatMessage(this.props.intl, "location", "catchment.delete.button")}>
          <IconButton onClick={() => this.onDelete(catchment)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </span>
  );

  headers = () => {
    const headers = ["catchment.code", "catchment.name", "catchment.districts"];
    if (this.hasRight(RIGHT_CATCHMENT_EDIT) || this.hasRight(RIGHT_CATCHMENT_DELETE)) headers.push(null);
    return headers;
  };

  itemFormatters = () => {
    const formatters = [
      (catchment) => catchment.code,
      (catchment) => catchment.name,
      (catchment) => (catchment.districts || []).map((district) => `${district.code} - ${district.name}`).join(", "),
    ];
    if (this.hasRight(RIGHT_CATCHMENT_EDIT) || this.hasRight(RIGHT_CATCHMENT_DELETE)) {
      formatters.push(this.actionButtons);
    }
    return formatters;
  };

  sorts = () => {
    const sorts = [["code", true], ["name", true], null];
    if (this.hasRight(RIGHT_CATCHMENT_EDIT) || this.hasRight(RIGHT_CATCHMENT_DELETE)) sorts.push(null);
    return sorts;
  };

  render() {
    const {
      catchments,
      catchmentsPageInfo,
      catchmentsTotalCount,
      classes,
      errorCatchments,
      fetchedCatchments,
      fetchingCatchments,
      intl,
    } = this.props;

    return (
      <div className={classes.searchResults}>
        <Searcher
          module="location"
          FilterPane={CatchmentFilter}
          fetch={this.props.fetchCatchments}
          reset={this.state.reset}
          items={catchments}
          itemsPageInfo={catchmentsPageInfo}
          fetchingItems={fetchingCatchments}
          fetchedItems={fetchedCatchments}
          errorItems={errorCatchments}
          tableTitle={formatMessageWithValues(intl, "location", "catchments.searcher.title", {
            count: catchmentsTotalCount || 0,
          })}
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          filtersToQueryParams={this.filtersToQueryParams}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          rowIdentifier={(row) => row.uuid}
          onDoubleClick={this.onDoubleClick}
          sorts={this.sorts}
          rowDisabled={(selection, row) => !!row.validityTo}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights || [],
  submittingMutation: state.loc.submittingMutation,
  mutation: state.loc.mutation,
  confirmed: state.core.confirmed,
  fetchingCatchments: state.loc.fetchingCatchments,
  fetchedCatchments: state.loc.fetchedCatchments,
  errorCatchments: state.loc.errorCatchments,
  catchments: state.loc.catchments,
  catchmentsPageInfo: state.loc.catchmentsPageInfo,
  catchmentsTotalCount: state.loc.catchmentsTotalCount,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchCatchments, deleteCatchment, coreConfirm, journalize }, dispatch);

export default withModulesManager(
  withHistory(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(CatchmentSearcher)))),
  ),
);
