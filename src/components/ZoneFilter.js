import React, { Component } from "react";
import _debounce from "lodash/debounce";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager, TextInput, formatGQLString } from "@openimis/fe-core";
import ClusterPicker from "../pickers/ClusterPicker";

const styles = (theme) => ({ form: { padding: 0 }, item: { padding: theme.spacing(1) } });

class ZoneFilter extends Component {
  debouncedOnChangeFilter = _debounce(this.props.onChangeFilters, this.props.modulesManager.getConf("fe-location", "debounceTime", 200));
  value = (key) => this.props.filters?.[key]?.value || null;
  filters = (overrides = {}) => {
    const current = { cluster: this.value("cluster"), code: this.value("code"), name: this.value("name"), ...overrides };
    return [
      { id: "cluster", value: current.cluster, filter: current.cluster ? `cluster_Uuid: "${current.cluster.uuid}"` : null },
      { id: "code", value: current.code, filter: current.code ? `code_Icontains: "${formatGQLString(current.code)}"` : null },
      { id: "name", value: current.name, filter: current.name ? `name_Icontains: "${formatGQLString(current.name)}"` : null },
    ];
  };
  render() {
    return <Grid container className={this.props.classes.form}>
      <Grid item xs={12} sm={4} className={this.props.classes.item}><ClusterPicker value={this.value("cluster")}
        label="ZoneForm.cluster" onChange={(cluster) => this.props.onChangeFilters(this.filters({ cluster }))} /></Grid>
      <Grid item xs={12} sm={4} className={this.props.classes.item}><TextInput module="location" label="ZoneFilter.code"
        value={this.value("code") || ""} onChange={(code) => this.debouncedOnChangeFilter(this.filters({ code }))} /></Grid>
      <Grid item xs={12} sm={4} className={this.props.classes.item}><TextInput module="location" label="ZoneFilter.name"
        value={this.value("name") || ""} onChange={(name) => this.debouncedOnChangeFilter(this.filters({ name }))} /></Grid>
    </Grid>;
  }
}

export default withModulesManager(withTheme(withStyles(styles)(ZoneFilter)));
