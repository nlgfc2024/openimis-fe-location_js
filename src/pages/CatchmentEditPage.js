import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Helmet, formatMessage, historyPush, withHistory, withModulesManager } from "@openimis/fe-core";
import CatchmentForm from "../components/CatchmentForm";
import { RIGHT_CATCHMENT_ADD, RIGHT_CATCHMENT_EDIT } from "../constants";

const styles = (theme) => ({ page: theme.page });
const hasRight = (rights, right) => rights.includes(right) || rights.includes(String(right));

class CatchmentEditPage extends Component {
  back = () => {
    historyPush(this.props.modulesManager, this.props.history, "location.route.catchments");
  };

  render() {
    const { catchmentUuid, classes, intl, rights } = this.props;
    const readOnly = catchmentUuid ? !hasRight(rights, RIGHT_CATCHMENT_EDIT) : !hasRight(rights, RIGHT_CATCHMENT_ADD);

    return (
      <div className={classes.page}>
        <Helmet
          title={formatMessage(
            intl,
            "location",
            catchmentUuid ? "catchment.edit.page.title" : "catchment.new.page.title",
          )}
        />
        <CatchmentForm catchmentUuid={catchmentUuid} readOnly={readOnly} back={this.back} />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: state.core?.user?.i_user?.rights || [],
  catchmentUuid: props.match?.params?.catchment_uuid,
});

export default withHistory(
  withModulesManager(connect(mapStateToProps)(injectIntl(withTheme(withStyles(styles)(CatchmentEditPage))))),
);
