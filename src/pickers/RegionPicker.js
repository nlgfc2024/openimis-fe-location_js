import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import _debounce from "lodash/debounce";
import _ from "lodash";

import { formatMessage, AutoSuggestion, withModulesManager } from "@openimis/fe-core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { IconButton, Tooltip } from "@material-ui/core";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

import { fetchAllRegions, selectRegionLocation, clearLocations } from "../actions.js";
import { locationLabel } from "../utils";

const styles = (theme) => ({
  textField: {
    width: "100%",
  },
  pickerRow: {
    display: "flex",
    alignItems: "flex-end",
  },
  pickerField: {
    flex: 1,
    minWidth: 0,
  },
});

let allRegionsFlag = false;

class RegionPicker extends Component {
  constructor(props) {
    super(props);
    this.selectThreshold = props.modulesManager.getConf("fe-location", "RegionPicker.selectThreshold", 10);
  }

  state = {
    sortAsc: true,
  };

  toggleSort = () => {
    this.setState((state) => ({ sortAsc: !state.sortAsc }));
  };

  onSuggestionSelected = (v) => {
    if (v && this.props.value !== v) this.props.selectRegionLocation(v);
    this.props.onChange(v, locationLabel(v));
  };

  componentDidMount() {
    if (allRegionsFlag) this.props.fetchAllRegions();
  }

  componentWillUnmount() {
    this.props.clearLocations(0);
  }

  render() {
    const {
      intl,
      classes,
      value,
      reset,
      userHealthFacilityFullPath,
      regions,
      withLabel = true,
      label = null,
      withNull = false,
      nullLabel = null,
      filterLabels = true,
      preValues = [],
      withPlaceholder,
      placeholder = null,
      readOnly = false,
      required = false,
      allRegions,
      title,
    } = this.props;
    const { sortAsc } = this.state;

    allRegionsFlag = allRegions;

    let items = (userHealthFacilityFullPath && [userHealthFacilityFullPath.location.parent]) || regions || [];
    items = _.orderBy(items, ["name"], [sortAsc ? "asc" : "desc"]);

    return (
      <div className={classes.pickerRow}>
        <div className={classes.pickerField}>
          <AutoSuggestion
            module="location"
            items={items}
            preValues={preValues}
            label={!!withLabel && (label || formatMessage(intl, "location", "RegionPicker.label"))}
            placeholder={
              !!withPlaceholder ? placeholder || formatMessage(intl, "location", "RegionPicker.placehoder") : null
            }
            lookup={locationLabel}
            renderSuggestion={(a) => <span>{locationLabel(a)}</span>}
            getSuggestionValue={locationLabel}
            onSuggestionSelected={this.onSuggestionSelected}
            onClear={this.onSuggestionSelected}
            value={value}
            reset={reset}
            readOnly={readOnly}
            required={required}
            selectThreshold={this.selectThreshold}
            withNull={withNull}
            nullLabel={
              nullLabel || filterLabels
                ? formatMessage(intl, "location", "location.RegionPicker.null")
                : formatMessage(intl, "location", "location.RegionPicker.none")
            }
            title={title}
          />
        </div>
        {!readOnly && (
          <Tooltip
            title={formatMessage(
              intl,
              "location",
              sortAsc ? "location.RegionPicker.sortDescending" : "location.RegionPicker.sortAscending",
            )}
          >
            <IconButton size="small" onClick={this.toggleSort}>
              {sortAsc ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  regions: allRegionsFlag ? state.loc.allRegions : state.loc.userL0s || [],
  userHealthFacilityFullPath: state.loc.userHealthFacilityFullPath,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchAllRegions,
      selectRegionLocation,
      clearLocations,
    },
    dispatch,
  );

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(RegionPicker)))),
);
