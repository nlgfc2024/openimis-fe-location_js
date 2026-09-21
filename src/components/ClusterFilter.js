import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { TextInput, PublishedComponent, formatMessage } from "@openimis/fe-core";

const styles = (theme) => ({ form: { padding: 0 }, item: { padding: theme.spacing(1) } });

class ClusterFilter extends Component {
  _filterValue = (key) => this.props.filters?.[key]?.value || null;

  _change = (id, value, filter) => this.props.onChangeFilters([{ id, value, filter }]);

  _changeText = (id, value) => this._change(id, value, value ? `${id}: "${value}"` : null);

  _changeDistrict = (district) => this.props.onChangeFilters([
    { id: "districtUuid", value: district, filter: district ? `districtUuid: "${district.uuid}"` : null },
    { id: "traditionalAuthorityUuid", value: null, filter: null },
  ]);

  render() {
    const { classes, intl } = this.props;
    const district = this._filterValue("districtUuid");
    return (
      <Grid container className={classes.form}>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <TextInput module="location" label="cluster.code" value={this._filterValue("code") || ""}
            onChange={(value) => this._changeText("code", value)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <TextInput module="location" label="cluster.name" value={this._filterValue("name") || ""}
            onChange={(value) => this._changeText("name", value)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <PublishedComponent pubRef="location.MwDistrictPicker"
            label={formatMessage(intl, "location", "cluster.district")}
            value={district} onChange={this._changeDistrict} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <PublishedComponent pubRef="location.MwTAPicker"
            label={formatMessage(intl, "location", "cluster.authority")}
            value={this._filterValue("traditionalAuthorityUuid")} parentLocation={district}
            readOnly={!district}
            onChange={(value) => this._change("traditionalAuthorityUuid", value,
              value ? `traditionalAuthorityUuid: "${value.uuid}"` : null)} />
        </Grid>
      </Grid>
    );
  }
}

export default injectIntl(withTheme(withStyles(styles)(ClusterFilter)));