import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { Fab } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/Add";
import { Helmet, formatMessage, historyPush, withHistory, withModulesManager } from "@openimis/fe-core";
import CatchmentSearcher from "../components/CatchmentSearcher";
import { RIGHT_CATCHMENT_ADD } from "../constants";

const styles = (theme) => ({ page: theme.page, fab: theme.fab });

const hasRight = (rights, right) => rights.includes(right) || rights.includes(String(right));

class CatchmentsPage extends Component {
  onAdd = () => {
    historyPush(this.props.modulesManager, this.props.history, "location.route.catchment");
  };

  render() {
    const { classes, rights } = this.props;
    return (
      <div className={classes.page}>
        <Helmet title={formatMessage(this.props.intl, "location", "catchments.page.title")} />
        <CatchmentSearcher />
        {hasRight(rights, RIGHT_CATCHMENT_ADD) && (
          <Fab color="primary" className={classes.fab} onClick={this.onAdd}>
            <AddIcon />
          </Fab>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights || [] });

export default withModulesManager(
  withHistory(connect(mapStateToProps)(injectIntl(withTheme(withStyles(styles)(CatchmentsPage))))),
);
