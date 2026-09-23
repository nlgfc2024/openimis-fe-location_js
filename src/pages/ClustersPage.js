import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessage, Helmet, historyPush, withHistory, withModulesManager } from "@openimis/fe-core";
import ClusterSearcher from "../components/ClusterSearcherShared";

const styles = (theme) => ({ page: theme.page });

class ClustersPage extends Component {
  onAdd = () => historyPush(this.props.modulesManager, this.props.history, "location.route.cluster");

  onDoubleClick = (cluster) => historyPush(
    this.props.modulesManager, this.props.history, "location.route.cluster", [cluster.uuid],
  );

  render() {
    const { classes, intl } = this.props;
    return (
      <div className={classes.page}>
        <Helmet title={formatMessage(intl, "location", "cluster.title")} />
        <ClusterSearcher onAdd={this.onAdd} onDoubleClick={this.onDoubleClick} />
      </div>
    );
  }
}

export default withModulesManager(withHistory(injectIntl(withTheme(withStyles(styles)(ClustersPage)))));