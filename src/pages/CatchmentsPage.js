import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Helmet, formatMessage, historyPush, withHistory, withModulesManager } from "@openimis/fe-core";
import CatchmentSearcher from "../components/CatchmentSearcher";

const styles = (theme) => ({ page: theme.page });

class CatchmentsPage extends Component {
  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "location.route.catchment");
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.page}>
        <Helmet title={formatMessage(this.props.intl, "location", "catchments.page.title")} />
        <CatchmentSearcher onAdd={this.onAdd} />
      </div>
    );
  }
}

export default withModulesManager(
  withHistory(connect()(injectIntl(withTheme(withStyles(styles)(CatchmentsPage))))),
);
