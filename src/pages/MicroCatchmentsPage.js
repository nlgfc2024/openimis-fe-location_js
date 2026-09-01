import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  historyPush,
  withModulesManager,
  withHistory,
  Helmet,
  formatMessage,
} from "@openimis/fe-core";
import MicroCatchmentSearcher from "../components/MicroCatchmentSearcher";

const styles = (theme) => ({
  page: theme.page,
});

class MicroCatchmentsPage extends Component {
  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "location.route.microCatchment");
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.page}>
        <Helmet title={formatMessage(this.props.intl, "location", "microCatchments.page.title")} />
        <MicroCatchmentSearcher onAdd={this.onAdd} />
      </div>
    );
  }
}

export default withModulesManager(
  withHistory(
    connect()(
      injectIntl(withTheme(withStyles(styles)(MicroCatchmentsPage)))
    )
  )
);
