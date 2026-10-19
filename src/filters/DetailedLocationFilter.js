import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _debounce from "lodash/debounce";
import { withTheme, withStyles } from "@material-ui/core/styles";
import _ from "lodash";
import { Grid } from "@material-ui/core";
import { withModulesManager, ControlledField, PublishedComponent } from "@openimis/fe-core";
import { selectLocation } from "../actions";
import CoarseLocationFilter from "./CoarseLocationFilter";

import { DEFAULT_LOCATION_TYPES } from "../constants";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
  paperDivider: theme.paper.divider,
});

class DetailedLocationFilter extends Component {
  state = {
    reset: 0,
  };

  constructor(props) {
    super(props);
    this.locationTypes = props.modulesManager.getConf("fe-location", "Location.types", DEFAULT_LOCATION_TYPES);
  }

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : null;
  };

  _parentFilter = (v, l) => {
    if (!!v) {
      return {
        id: this.props.anchor,
        value: v,
        filter: `${this.props.anchor}: "${v.uuid}", ${this.props.anchor}Level: ${l}`,
      };
    } else {
      return { id: this.props.anchor, value: null, filter: null };
    }
  };

  _levelFilter = (l, v) => {
    if (!!v) {
      return {
        id: `${this.props.anchor}_${l}`,
        value: v,
        filter: null,
      };
    } else {
      return { id: `${this.props.anchor}_${l}`, value: null, filter: null };
    }
  };

  onChange = (l, v, s) => {
    let parentFilterValue = this._filterValue(`${this.props.anchor}_${l - 1}`);
    let filters = [!!v ? this._parentFilter(v, l) : this._parentFilter(parentFilterValue, l - 1)];
    let value = !!v ? v.parent : null;
    for (var i = l - 1; i >= 0; i--) {
      filters.push(this._levelFilter(i, !!value ? value : this._filterValue(`${this.props.anchor}_${i}`)));
      value = !!value ? value.parent : null;
    }
    filters.push(this._levelFilter(l, v));
    for (var i = this.locationTypes.length; i > l; i--) {
      filters.push(this._levelFilter(i, null));
    }
    this.props.onChangeFilters(filters);
    this.setState((state) => ({
      reset: state.reset + 1,
    }));
    this.props.selectLocation(v, l, this.locationTypes.length);
  };

  render() {
    const { classes, split = false, useLocationPickers = false } = this.props;
    let grid = split ? 12 : 6;
    const firstPickerLevel = useLocationPickers ? 0 : this.locationTypes.length - 2;
    const pickerCount = this.locationTypes.length - firstPickerLevel;
    const pickerWidth = Math.floor((useLocationPickers ? 12 : grid) / pickerCount);
    return (
      <Grid container className={classes.form}>
        {!useLocationPickers && (
          <Grid item xs={grid}>
            <CoarseLocationFilter reset={this.state.reset} {...this.props} onChange={this.onChange} />
          </Grid>
        )}
        {_.times(pickerCount, (i) => {
          const locationLevel = firstPickerLevel + i;
          return (
          <ControlledField
            module="location"
            id={`DetailedLocationFilter.location_${locationLevel}`}
            key={`location_${locationLevel}`}
            field={
              <Grid item xs={pickerWidth} className={classes.item}>
                <PublishedComponent
                  pubRef="location.LocationPicker"
                  value={this._filterValue(`${this.props.anchor}_${locationLevel}`)}
                  withNull={true}
                  reset={this.state.reset}
                  onChange={(v, s) => this.onChange(locationLevel, v, s)}
                  parentLocation={locationLevel > 0
                    ? this._filterValue(`${this.props.anchor}_${locationLevel - 1}`)
                    : null}
                  locationLevel={locationLevel}
                />
              </Grid>
            }
          />
          );
        })}
      </Grid>
    );
  }
}

const mapStateToProps = (state) => ({});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ selectLocation }, dispatch);
};

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(DetailedLocationFilter))),
);
