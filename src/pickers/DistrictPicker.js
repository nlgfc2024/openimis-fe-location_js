import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import _debounce from "lodash/debounce";
import _ from "lodash";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { IconButton, Tooltip } from "@material-ui/core";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import { withModulesManager, formatMessage, AutoSuggestion } from "@openimis/fe-core";
import { selectDistrictLocation, clearLocations } from "../actions.js";
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

class DistrictPicker extends Component {
  constructor(props) {
    super(props);
    this.selectThreshold = props.modulesManager.getConf("fe-location", "DistrictPicker.selectThreshold", 10);
  }

  state = {
    sortAsc: true,
  };

  toggleSort = () => {
    this.setState((state) => ({ sortAsc: !state.sortAsc }));
  };

  onSuggestionSelected = (v) => {
    if (v && this.props.value !== v) this.props.selectDistrictLocation(v);
    this.props.onChange(v, locationLabel(v));
  };

  componentWillUnmount() {
    this.props.clearLocations(1);
  }

  render() {
    const {
      intl,
      classes,
      userHealthFacilityFullPath,
      reset,
      value,
      withLabel = true,
      label,
      withNull = false,
      nullLabel = null,
      filterLabels = true,
      region,
      districts,
      readOnly = false,
      required = false,
      title,
    } = this.props;
    const { sortAsc } = this.state;

    let items = userHealthFacilityFullPath && [userHealthFacilityFullPath.location] || districts || [];

    if (!!region) {
      items = items.filter((d) => {
        return d.parent.uuid === region.uuid;
      });
    }
    items = _.orderBy(items, ["name"], [sortAsc ? "asc" : "desc"]);

    return (
      <div className={classes.pickerRow}>
        <div className={classes.pickerField}>
          <AutoSuggestion
            module="location"
            items={items}
            label={!!withLabel && (label || formatMessage(intl, "location", "DistrictPicker.label"))}
            lookup={locationLabel}
            getSuggestionValue={locationLabel}
            renderSuggestion={(a) => <span>{locationLabel(a)}</span>}
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
                ? formatMessage(intl, "location", "location.DistrictPicker.null")
                : formatMessage(intl, "location", "location.DistrictPicker.none")
            }
            title={title}
          />
        </div>
        {!readOnly && (
          <Tooltip
            title={formatMessage(
              intl,
              "location",
              sortAsc ? "location.DistrictPicker.sortDescending" : "location.DistrictPicker.sortAscending",
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
  districts: state.loc.userL1s,
  userHealthFacilityFullPath: state.loc.userHealthFacilityFullPath,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      selectDistrictLocation,
      clearLocations,
    },
    dispatch,
  );

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(DistrictPicker)))),
);
