import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { Typography } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessage, Helmet, historyPush, withHistory, withModulesManager } from "@openimis/fe-core";
import { RIGHT_CLUSTER_SEARCH, RIGHT_CLUSTER_ADD, RIGHT_CLUSTER_EDIT } from "../constants";
import ClusterForm from "../components/ClusterForm";

const styles = (theme) => ({
  page: theme.page,
});

class ClusterEditPage extends Component {
  hasRight = (right) => this.props.rights.includes(right) || this.props.rights.includes(String(right));

  render() {
    const { classes, intl, match, history, modulesManager } = this.props;
    const uuid = match?.params?.cluster_uuid;
    const canAccess = uuid ? this.hasRight(RIGHT_CLUSTER_SEARCH) : this.hasRight(RIGHT_CLUSTER_ADD);
    const readOnly = uuid ? !this.hasRight(RIGHT_CLUSTER_EDIT) : !this.hasRight(RIGHT_CLUSTER_ADD);
    const back = () => historyPush(modulesManager, history, "location.route.clusters");
    if (!canAccess) return <Typography color="error">{formatMessage(intl, "location", "cluster.accessDenied")}</Typography>;
    return (
      <div className={classes.page}>
        <Helmet title={formatMessage(intl, "location", uuid ? "cluster.edit" : "cluster.add")} />
        <ClusterForm key={uuid || "new"} uuid={uuid} readOnly={readOnly} back={back} />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights || [] });

export default withModulesManager(withHistory(connect(mapStateToProps)(injectIntl(withTheme(withStyles(styles)(ClusterEditPage))))));
