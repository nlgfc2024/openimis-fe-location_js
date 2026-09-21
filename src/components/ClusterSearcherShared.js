import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { IconButton, Tooltip } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import {
  Searcher,
  withModulesManager,
  withHistory,
  formatMessage,
  formatMessageWithValues,
  coreConfirm,
  coreAlert,
} from "@openimis/fe-core";
import ClusterFilter from "./ClusterFilter";
import { deleteCluster, fetchClusters } from "../clusterActions";
import { RIGHT_CLUSTER_ADD, RIGHT_CLUSTER_EDIT, RIGHT_CLUSTER_DELETE } from "../constants";

const styles = (theme) => ({ page: theme.page });

class ClusterSearcherShared extends Component {
  state = {
    reset: 0,
    confirmedAction: null,
    pendingDelete: null,
    clusters: [],
    pageInfo: { totalCount: 0, hasNextPage: false },
    fetching: false,
    fetched: false,
    error: null,
  };

  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf("fe-location", "clusterFilter.rowsPerPageOptions", [10, 20, 50, 100]);
    this.defaultPageSize = props.modulesManager.getConf("fe-location", "clusterFilter.defaultPageSize", 10);
  }

  hasRight = (right) => this.props.rights.includes(right) || this.props.rights.includes(String(right));

  fetch = (params) => {
    const variables = { first: this.defaultPageSize };
    params.filter((param) => param.startsWith("after:")).forEach((param) => {
      variables.after = param.match(/"([^"]+)"/)?.[1];
    });
    params.filter((param) => param.startsWith("before:")).forEach((param) => {
      variables.before = param.match(/"([^"]+)"/)?.[1];
    });
    params.filter((param) => param.includes(":")).forEach((param) => {
      const match = param.match(/^(\w+):\s*"?([^\"]+)"?/);
      if (!match) return;
      if (["code", "name"].includes(match[1])) {
        variables.search = [variables.search, match[2]].filter(Boolean).join(" ");
      }
      if (["districtUuid", "traditionalAuthorityUuid"].includes(match[1])) variables[match[1]] = match[2];
    });

    this.setState({ fetching: true, fetched: false, error: null });
    return this.props.fetchClusters(variables).then((response) => {
      const errors = response?.payload?.errors;
      if (errors?.length) throw new Error(errors.map((error) => error.message).join("\n"));
      const data = response?.payload?.data?.clusters;
      if (!data) throw new Error(response?.payload?.message || "Unable to load clusters.");
      this.setState({
        clusters: (data.edges || []).map(({ node }) => node),
        pageInfo: { totalCount: data.pageInfo?.totalCount || data.edges?.length || 0, ...data.pageInfo },
        fetching: false,
        fetched: true,
      });
      return response;
    }).catch((error) => {
      this.setState({ fetching: false, fetched: false, error });
      throw error;
    });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.confirmed !== this.props.confirmed && this.props.confirmed && this.state.confirmedAction) {
      this.state.confirmedAction();
      this.setState({ confirmedAction: null });
    }
  }

  filtersToQueryParams = (state) => Object.keys(state.filters)
    .filter((key) => state.filters[key].filter)
    .map((key) => state.filters[key].filter)
    .concat(`first: ${state.pageSize}`);

  headers = () => ["cluster.code", "cluster.name", "cluster.district", "cluster.authority",
    this.hasRight(RIGHT_CLUSTER_EDIT) || this.hasRight(RIGHT_CLUSTER_DELETE) ? null : undefined]
    .filter((header) => header !== undefined);

  itemFormatters = () => {
    const formatters = [
      (cluster) => cluster.code,
      (cluster) => cluster.name,
      (cluster) => cluster.traditionalAuthority?.parent?.name || "",
      (cluster) => cluster.traditionalAuthority?.name || "",
    ];
    if (this.hasRight(RIGHT_CLUSTER_EDIT) || this.hasRight(RIGHT_CLUSTER_DELETE)) {
      formatters.push((cluster) => (
        <span style={{ display: "inline-flex" }}>
          {this.hasRight(RIGHT_CLUSTER_EDIT) && <Tooltip title={formatMessage(this.props.intl, "location", "cluster.edit")}>
            <span><IconButton aria-label={formatMessage(this.props.intl, "location", "cluster.edit")}
              onClick={() => this.props.onDoubleClick(cluster)}><EditIcon /></IconButton></span>
          </Tooltip>}
          {this.hasRight(RIGHT_CLUSTER_DELETE) && <Tooltip title={formatMessage(this.props.intl, "location", "cluster.delete")}>
            <span><IconButton aria-label={formatMessage(this.props.intl, "location", "cluster.delete")}
              onClick={() => this.onDelete(cluster)}><DeleteIcon /></IconButton></span>
          </Tooltip>}
        </span>
      ));
    }
    return formatters;
  };

  onDelete = (cluster) => {
    const confirmedAction = () => {
      this.setState({ pendingDelete: cluster });
      this.props.deleteCluster(cluster.uuid).then(() => {
        this.props.coreAlert(formatMessage(this.props.intl, "location", "cluster.alert.success"),
          formatMessageWithValues(this.props.intl, "location", "cluster.delete.success", { code: cluster.code }));
        this.setState((state) => ({ reset: state.reset + 1, pendingDelete: null }));
      });
    };
    this.setState({ confirmedAction }, () => this.props.coreConfirm(
      formatMessage(this.props.intl, "location", "cluster.delete.confirm.title"),
      formatMessageWithValues(this.props.intl, "location", "cluster.delete.confirm.message", cluster),
    ));
  };

  searcherActions = () => [{
    authorized: this.hasRight(RIGHT_CLUSTER_ADD),
    label: formatMessage(this.props.intl, "location", "cluster.add"),
    icon: <AddIcon />,
    onClick: this.props.onAdd,
  }];

  render() {
    const { classes, intl } = this.props;
    return (
      <div className={classes.page}>
        <Searcher module="location" FilterPane={ClusterFilter} fetch={this.fetch}
          reset={this.state.reset} items={this.state.clusters} itemsPageInfo={this.state.pageInfo}
          fetchingItems={this.state.fetching} fetchedItems={this.state.fetched} errorItems={this.state.error}
          tableTitle={formatMessageWithValues(intl, "location", "cluster.title", { count: this.state.pageInfo.totalCount || 0 })}
          headers={this.headers} itemFormatters={this.itemFormatters} filtersToQueryParams={this.filtersToQueryParams}
          rowsPerPageOptions={this.rowsPerPageOptions} defaultPageSize={this.defaultPageSize}
          rowIdentifier={(cluster) => cluster.uuid} onDoubleClick={this.props.onDoubleClick}
          searcherActionsPosition="header-right" searcherActions={this.searcherActions()} />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights || [],
  confirmed: state.core?.confirmed,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchClusters, deleteCluster, coreConfirm, coreAlert }, dispatch);

export default withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(
  injectIntl(withTheme(withStyles(styles)(ClusterSearcherShared))),
)));
