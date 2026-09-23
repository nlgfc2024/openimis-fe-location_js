import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { formatMessage, Helmet, historyPush, withHistory, withModulesManager } from "@openimis/fe-core";
import ZonesSearcher from "../components/ZonesSearcher";

const styles = (theme) => ({ page: theme.page });
class ZonesPage extends Component {
  onAdd = () => historyPush(this.props.modulesManager, this.props.history, "location.route.zone");
  onDoubleClick = (zone) => historyPush(this.props.modulesManager, this.props.history, "location.route.zone", [zone.uuid]);
  render() { return <div className={this.props.classes.page}><Helmet title={formatMessage(this.props.intl, "location", "zones.page.title")} /><ZonesSearcher onAdd={this.onAdd} onDoubleClick={this.onDoubleClick} /></div>; }
}
export default withModulesManager(withHistory(injectIntl(withTheme(withStyles(styles)(ZonesPage)))));
