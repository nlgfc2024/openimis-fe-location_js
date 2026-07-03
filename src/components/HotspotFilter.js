import React, { Component } from "react";
import _debounce from "lodash/debounce";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager, TextInput, PublishedComponent } from "@openimis/fe-core";

const styles = (theme) => ({
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
});

class HotspotFilter extends Component {
  debouncedOnChangeFilter = _debounce(
    this.props.onChangeFilters,
    this.props.modulesManager.getConf("fe-location", "debounceTime", 200),
  );

  _filterValue = (key) => {
    const { filters } = this.props;
    return !!filters && !!filters[key] ? filters[key].value : null;
  };

  _filterTextFieldValue = (key) => {
    const { filters } = this.props;
    return !!filters && !!filters[key] ? filters[key].value : "";
  };

  _filterPayload = ({ catchment, district, microCatchment, hotspot } = {}) => [
    {
      id: "catchment",
      value: catchment,
      filter: !!catchment ? `microCatchment_Parent_Parent_Uuid: "${catchment.uuid}"` : null,
    },
    {
      id: "district",
      value: district,
      filter: !!district ? `microCatchment_Parent_Uuid: "${district.uuid}"` : null,
    },
    {
      id: "microCatchment",
      value: microCatchment,
      filter: !!microCatchment ? `microCatchment_Uuid: "${microCatchment.uuid}"` : null,
    },
    {
      id: "hotspot",
      value: hotspot,
      filter: !!hotspot ? `name_Icontains: "${hotspot}"` : null,
    },
  ];

  _onChangeCatchment = (catchment) => {
    this.props.onChangeFilters(this._filterPayload({
      catchment,
      district: null,
      microCatchment: null,
      hotspot: this._filterTextFieldValue("hotspot"),
    }));
  };

  _onChangeDistrict = (v) => {
    this.props.onChangeFilters(this._filterPayload({
      catchment: v?.parent || this._filterValue("catchment"),
      district: v,
      microCatchment: null,
      hotspot: this._filterTextFieldValue("hotspot"),
    }));
  };

  _onChangeMicroCatchment = (microCatchment) => {
    this.props.onChangeFilters(this._filterPayload({
      catchment: microCatchment?.parent?.parent || this._filterValue("catchment"),
      district: microCatchment?.parent || this._filterValue("district"),
      microCatchment,
      hotspot: this._filterTextFieldValue("hotspot"),
    }));
  };

  _onChangeHotspot = (v) => {
    this.debouncedOnChangeFilter(this._filterPayload({
      catchment: this._filterValue("catchment"),
      district: this._filterValue("district"),
      microCatchment: this._filterValue("microCatchment"),
      hotspot: v,
    }));
  };

  render() {
    const { classes } = this.props;
    return (
      <Grid container className={classes.form}>
        <Grid item xs={3} className={classes.item}>
          <PublishedComponent
            pubRef="location.RegionPicker"
            value={this._filterValue("catchment")}
            label="HotspotFilter.catchment"
            withNull={true}
            onChange={this._onChangeCatchment}
          />
        </Grid>
        <Grid item xs={3} className={classes.item}>
          <PublishedComponent
            pubRef="location.DistrictPicker"
            value={this._filterValue("district")}
            region={this._filterValue("catchment")}
            label="HotspotFilter.district"
            withNull={true}
            onChange={this._onChangeDistrict}
          />
        </Grid>
        <Grid item xs={3} className={classes.item}>
          <PublishedComponent
            pubRef="location.LocationPicker"
            locationLevel={2}
            parentLocation={this._filterValue("district")}
            value={this._filterValue("microCatchment")}
            label="HotspotFilter.microCatchment"
            onChange={this._onChangeMicroCatchment}
          />
        </Grid>
        <Grid item xs={3} className={classes.item}>
          <TextInput
            module="location"
            label="HotspotFilter.hotspot"
            name="hotspot"
            value={this._filterTextFieldValue("hotspot")}
            onChange={this._onChangeHotspot}
          />
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(withTheme(withStyles(styles)(HotspotFilter)));
