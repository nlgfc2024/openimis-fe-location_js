import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessageWithValues, withModulesManager, withHistory, historyPush } from "@openimis/fe-core";
import { createOrUpdateZone } from "../zoneActions";
import { RIGHT_ZONE_ADD, RIGHT_ZONE_EDIT } from "../constants";
import ZoneForm from "../components/ZoneForm";

const styles = (theme) => ({
  page: theme.page,
});

class ZoneEditPage extends Component {
  add = () => {
    historyPush(this.props.modulesManager, this.props.history, "location.route.zoneEdit");
  };

  save = (zone) => {
    this.props.createOrUpdateZone(
      zone,
      formatMessageWithValues(
        this.props.intl,
        "location",
        !zone.uuid ? "CreateZone.mutationLabel" : "UpdateZone.mutationLabel",
        { code: zone.code },
      ),
    );
  };

  render() {
    const { modulesManager, history, classes, rights, zone_uuid } = this.props;
    return (
      <div className={classes.page}>
        <ZoneForm
          zone_uuid={zone_uuid}
          back={() => historyPush(modulesManager, history, "location.route.zones")}
          add={rights.includes(RIGHT_ZONE_ADD) ? this.add : null}
          save={rights.includes(zone_uuid ? RIGHT_ZONE_EDIT : RIGHT_ZONE_ADD) ? this.save : null}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights.map(Number) : [],
  zone_uuid: props.match.params.zone_uuid,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ createOrUpdateZone }, dispatch);

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(ZoneEditPage)))),
  ),
);
