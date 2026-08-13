import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { TextInput, PublishedComponent, formatMessage } from "@openimis/fe-core";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
});

class MicroCatchmentFilter extends Component {
  debouncedOnChangeFilter = this.props.onChangeFilters;

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : null;
  };

  _onChangeFilter = (k, v, s) => {
    this.debouncedOnChangeFilter([
      {
        id: k,
        value: v,
        filter: s,
      },
    ]);
  };

  _onChangeStringFilter = (k, v, lookup = true) => {
    this._onChangeFilter(k, v, !!v ? `${k}: ${lookup ? `"${v}"` : v}` : null);
  };

  _onChangeDistrict = (district) => {
    this.debouncedOnChangeFilter([
      {
        id: "district_Uuid",
        value: district,
        filter: district ? `district_Uuid: "${district.uuid}"` : null,
      },
      {
        id: "traditionalAuthorities_Location_Uuid",
        value: null,
        filter: null,
      },
    ]);
    if (this.props.onDistrictChange) {
      this.props.onDistrictChange(district || null);
    }
  };

  render() {
    const { classes, intl } = this.props;
    const selectedDistrict = this._filterValue("district_Uuid");
    const selectedTraditionalAuthority = this._filterValue("traditionalAuthorities_Location_Uuid");

    return (
      <Grid container className={classes.form}>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <TextInput
            module="location"
            label="microCatchment.code"
            value={this._filterValue("code")}
            onChange={(v) => this._onChangeStringFilter("code", v)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <TextInput
            module="location"
            label="microCatchment.nameFilter"
            value={this._filterValue("name")}
            onChange={(v) => this._onChangeStringFilter("name", v)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <PublishedComponent
            pubRef="location.MwDistrictPicker"
            label={formatMessage(intl, "location", "microCatchment.district")}
            value={selectedDistrict}
            onChange={this._onChangeDistrict}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <PublishedComponent
            pubRef="location.MwTAPicker"
            label={formatMessage(intl, "location", "microCatchment.ta")}
            value={selectedTraditionalAuthority}
            parentLocation={selectedDistrict}
            readOnly={!selectedDistrict}
            onChange={(v) =>
              this._onChangeFilter(
                "traditionalAuthorities_Location_Uuid",
                v,
                v ? `traditionalAuthorities_Location_Uuid: "${v?.uuid}"` : null,
              )
            }
          />
        </Grid>
      </Grid>
    );
  }
}

export default injectIntl(withTheme(withStyles(styles)(MicroCatchmentFilter)));
