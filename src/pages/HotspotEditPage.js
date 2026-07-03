import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessageWithValues, withModulesManager, withHistory, historyPush } from "@openimis/fe-core";
import { createOrUpdateHotspot } from "../actions";
import { RIGHT_LOCATION_ADD, RIGHT_LOCATION_EDIT } from "../constants";
import HotspotForm from "../components/HotspotForm";

const styles = (theme) => ({
  page: theme.page,
});

class HotspotEditPage extends Component {
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "location.route.hotspotEdit");
  };

  save = (hotspot) => {
    this.props.createOrUpdateHotspot(
      hotspot,
      formatMessageWithValues(
        this.props.intl,
        "location",
        !hotspot.uuid ? "CreateHotspot.mutationLabel" : "UpdateHotspot.mutationLabel",
        { code: hotspot.code },
      ),
    );
  };

  render() {
    const { modulesManager, history, classes, rights, hotspot_uuid } = this.props;
    return (
      <div className={classes.page}>
        <HotspotForm
          hotspot_uuid={hotspot_uuid}
          back={() => historyPush(modulesManager, history, "location.route.hotspots")}
          add={rights.includes(RIGHT_LOCATION_ADD) ? this.add : null}
          save={rights.includes(RIGHT_LOCATION_EDIT) ? this.save : null}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  hotspot_uuid: props.match.params.hotspot_uuid,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ createOrUpdateHotspot }, dispatch);

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(HotspotEditPage)))),
  ),
);
