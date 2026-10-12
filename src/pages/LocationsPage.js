import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import { Grid } from "@material-ui/core";
import TypeLocationsPaper from "../components/TypeLocationsPaper";
import {
  fetchLocations,
  fetchLocationsStr,
  clearLocations,
  createOrUpdateLocation,
  deleteLocation,
  moveLocation
} from "../actions";
import {
  Helmet,
  withModulesManager,
  formatMessageWithValues,
  journalize,
  formatMessage
} from "@openimis/fe-core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { RIGHT_REGION_LOCATION_ADD } from "../constants";
import _ from "lodash";

const styles = (theme) => ({
  page: theme.page,
});

const ACTION_SAVE = "save";
const ACTION_MOVE = "move";
const ACTION_DELETE = "delete";

class LocationsPage extends Component {
  state = {
    editOpen: null,
    moveOpen: null,
    delOpen: null,
    index: null,
    location: null,
    parents: [],
    action: null,
    l0: null,
    l0s: [],
    l1: null,
    l1s: [],
    l2: null,
    l2s: [],
    l3: null,
    l3s: [],
  };

  constructor(props) {
    super(props);
    this.locationTypes = props.modulesManager.getConf("fe-location", "Location.types", ["R", "D", "W", "V"]);
  }

  componentDidMount() {
    this.props.fetchLocations(this.locationTypes, 0, null);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!_.isEqual(prevProps.l0s, this.props.l0s)) {
      this.setState((state, props) => ({
        l0: props.l0s[0],
        l0s: props.l0s,
        l1s: props.l1s,
        l2s: props.l2s,
        l3s: props.l3s,
      }));
    } else if (prevState.l0 !== this.state.l0) {
      if (!this.state.l0) {
        this.props.clearLocations(1);
      } else {
        this.props.fetchLocations(this.locationTypes, 1, this.state.l0);
      }
    } else if (!_.isEqual(prevProps.l1s, this.props.l1s)) {
      this.setState((state, props) => ({
        l1: !!props.l1s ? props.l1s[0] : null,
        l1s: props.l1s,
        l2s: props.l2s,
        l3s: props.l3s,
      }));
    } else if (prevState.l1 !== this.state.l1) {
      if (!this.state.l1) {
        this.props.clearLocations(2);
      } else {
        this.props.fetchLocations(this.locationTypes, 2, this.state.l1);
      }
    } else if (!_.isEqual(prevProps.l2s, this.props.l2s)) {
      this.setState((state, props) => ({
        l2: !!props.l2s ? props.l2s[0] : null,
        l2s: props.l2s,
        l3s: props.l3s,
      }));
    } else if (prevState.l2 !== this.state.l2) {
      if (!this.state.l2) {
        this.props.clearLocations(3);
      } else {
        this.props.fetchLocations(this.locationTypes, 3, this.state.l2);
      }
    } else if (!_.isEqual(prevProps.l3s, this.props.l3s)) {
      this.setState((state, props) => ({
        l3: !!props.l3s ? props.l3s[0] : null,
        l3s: props.l3s,
      }));
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      let state = { ...this.state };
      let ls = state[`l${this.locationTypes.indexOf(state.location.type)}s`];
      switch (state.action) {
        case ACTION_SAVE:
          if (!state.location.uuid) {
            ls.push(state.location);
          } else {
            delete ls.filter((l) => l.uuid == state.location.uuid)[0]["uuid"];
          }
          state.editOpen = null;
          break;
        case ACTION_MOVE:
          let displayed = ls.filter((l) => l.uuid == state.location.uuid);
          if (!!displayed.length) {
            delete displayed[0]["uuid"];
          }
          state.moveOpen = null;
          break;
        case ACTION_DELETE:
          delete ls[state.index]["uuid"];
          state.delOpen = null;
          break;
        default:
          //noop
          return;
      }
      this.setState({ ...state });
    }
  }

  onEdit = (l, level) => {
    let currentParents = [];
    for (let i = 0; i < level; i++) {
      currentParents.push(this.state[`l${i}`]);
    }
    this.setState({
      editOpen: level,
      location: l,
      currentParents,
    });
  };

  onMove = (l, level) => {
    let currentParents = [];
    for (let i = 0; i < level; i++) {
      currentParents.push(this.state[`l${i}`]);
    }
    this.setState({
      moveOpen: level,
      location: l,
      currentParents,
    });
  };

  onDelete = (data, idx, level) =>
    this.setState({
      delOpen: level,
      action: ACTION_DELETE,
      location: data,
      index: idx,
    });

  save = (data) => {
    data["type"] = this.locationTypes[this.state.editOpen];
    if (!!this.state.editOpen) {
      data["parentUuid"] = this.state[`l${this.state.editOpen - 1}`].uuid;
    }
    this.setState(
      {
        location: data,
        action: ACTION_SAVE,
      },
      (e) =>
        this.props.createOrUpdateLocation(
          data,
          formatMessageWithValues(
            this.props.intl,
            "location",
            !!data.uuid ? "UpdateLocation.mutationLabel" : "CreateLocation.mutationLabel",
            {
              code: data["code"],
              name: data["name"],
              parentUuid: data["parentUuid"],
            },
          ),
        ),
    );
  };

  move = (data) => {
    this.setState(
      {
        action: ACTION_MOVE,
      },
      (e) =>
        this.props.moveLocation(
          this.state.location,
          data,
          formatMessageWithValues(this.props.intl, "location", "MoveLocation.mutationLabel", {
            code: this.state.location.code,
            name: this.state.location.name,
            newParentCode: !!data ? data["code"] : null,
            newParentName: !!data ? data["name"] : null,
          }),
        ),
    );
  };

  delete = (opts) => {
    let data = this.state.location;
    this.props.deleteLocation(
      data,
      opts,
      formatMessageWithValues(this.props.intl, "location", "DeleteLocation.mutationLabel", {
        code: data["code"],
        name: data["name"],
      }),
    );
  };

  render() {
    const {
      classes,
      fetchingL0s,
      fetchedL0s,
      errorL0s,
      fetchingL1s,
      fetchedL1s,
      errorL1s,
      fetchingL2s,
      fetchedL2s,
      errorL2s,
      fetchingL3s,
      fetchedL3s,
      errorL3s,
    } = this.props;
    const { l0s, l1s, l2s, l3s } = this.state;
    const createRegionLocationRight = this.props?.rights.includes(RIGHT_REGION_LOCATION_ADD);
    return (
      <div className={classes.page}>
        <Helmet title={formatMessage(this.props.intl, "location", "location.locations.page.title")} />
        <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={4}>
                <TypeLocationsPaper
                  type={0}
                  onRefresh={() => this.props.fetchLocations(this.locationTypes, 0, null)}
                  onSearch={(search) => this.props.fetchLocationsStr(this.props.modulesManager, 0, null, null, null, search)}
                  onDelete={createRegionLocationRight ? (l, idx) => this.onDelete(l, idx, 0) : null}
                  onSelect={(l0) => this.setState({ l0 })}
                  onEdit={createRegionLocationRight ? (l) => this.onEdit(l, 0) : null}
                  onMove={createRegionLocationRight ? (l) => this.onMove(l, 0) : null}
                  editOpen={this.state.editOpen}
                  moveOpen={this.state.moveOpen}
                  delOpen={this.state.delOpen}
                  changeState={(state) => this.setState(state)}
                  save={this.save}
                  move={this.move}
                  del={this.delete}
                  fetching={fetchingL0s}
                  fetched={fetchedL0s}
                  error={errorL0s}
                  location={this.state.l0}
                  locations={l0s}
                  currentParents={this.state.currentParents}
                  stateLocation={this.state.location}
                  reassign={true}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <TypeLocationsPaper
                  type={1}
                  onRefresh={() => this.props.fetchLocations(this.locationTypes, 1, this.state.l0)}
                  onSearch={(search) => this.props.fetchLocationsStr(this.props.modulesManager, 1, null, null, this.state.l0, search)}
                  onDelete={createRegionLocationRight ? (l, idx) => this.onDelete(l, idx, 1) : null}
                  onSelect={(l1) => this.setState({ l1 })}
                  onEdit={createRegionLocationRight ? (l) => this.onEdit(l, 1) : null}
                  onMove={createRegionLocationRight ? (l, idx) => this.onMove(l, 1, idx) : null}
                  editOpen={this.state.editOpen}
                  moveOpen={this.state.moveOpen}
                  delOpen={this.state.delOpen}
                  changeState={(state) => this.setState(state)}
                  save={this.save}
                  move={this.move}
                  del={this.delete}
                  fetching={fetchingL1s}
                  fetched={fetchedL1s}
                  error={errorL1s}
                  location={this.state.l1}
                  locations={l1s}
                  currentParents={this.state.currentParents}
                  stateLocation={this.state.location}
                  reassign={true}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <TypeLocationsPaper
                  type={2}
                  onRefresh={() => this.props.fetchLocations(this.locationTypes, 2, this.state.l1)}
                  onSearch={(search) => this.props.fetchLocationsStr(this.props.modulesManager, 2, null, null, this.state.l1, search)}
                  onDelete={createRegionLocationRight ? (l, idx) => this.onDelete(l, idx, 2) : null}
                  onSelect={(l2) => this.setState({ l2 })}
                  onEdit={createRegionLocationRight ? (l) => this.onEdit(l, 2) : null}
                  onMove={createRegionLocationRight ? (l, idx) => this.onMove(l, 2, idx) : null}
                  editOpen={this.state.editOpen}
                  moveOpen={this.state.moveOpen}
                  delOpen={this.state.delOpen}
                  changeState={(state) => this.setState(state)}
                  save={this.save}
                  move={this.move}
                  del={this.delete}
                  fetching={fetchingL2s}
                  fetched={fetchedL2s}
                  error={errorL2s}
                  location={this.state.l2}
                  locations={l2s}
                  currentParents={this.state.currentParents}
                  stateLocation={this.state.location}
                  reassign={true}
                />
              </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <TypeLocationsPaper
              type={3}
              onRefresh={() => this.props.fetchLocations(this.locationTypes, 3, this.state.l2)}
              onSearch={(search) => this.props.fetchLocationsStr(this.props.modulesManager, 3, null, null, this.state.l2, search)}
              onDelete={createRegionLocationRight ? (l, idx) => this.onDelete(l, idx, 3) : null}
              onSelect={(l3) => this.setState({ l3 })}
              onEdit={createRegionLocationRight ? (l) => this.onEdit(l, 3) : null}
              onMove={createRegionLocationRight ? (l, idx) => this.onMove(l, 3, idx) : null}
              editOpen={this.state.editOpen}
              moveOpen={this.state.moveOpen}
              delOpen={this.state.delOpen}
              changeState={(state) => this.setState(state)}
              save={this.save}
              move={this.move}
              del={this.delete}
              fetching={fetchingL3s}
              fetched={fetchedL3s}
              error={errorL3s}
              location={this.state.l3}
              locations={l3s}
              currentParents={this.state.currentParents}
              stateLocation={this.state.location}
              withCaptation={true}
            />
          </Grid>
        </Grid>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  fetchingL0s: state.loc.fetchingL0s,
  fetchedL0s: state.loc.fetchedL0s,
  l0s: state.loc.l0s,
  errorL0s: state.loc.errorL0s,
  fetchingL1s: state.loc.fetchingL1s,
  fetchedL1s: state.loc.fetchedL1s,
  l1s: state.loc.l1s,
  errorL1s: state.loc.errorL1s,
  fetchingL2s: state.loc.fetchingL2s,
  fetchedL2s: state.loc.fetchedL2s,
  l2s: state.loc.l2s,
  errorL2s: state.loc.errorL2s,
  fetchingL3s: state.loc.fetchingL3s,
  fetchedL3s: state.loc.fetchedL3s,
  l3s: state.loc.l3s,
  errorL3s: state.loc.errorL3s,
  submittingMutation: state.loc.submittingMutation,
  mutation: state.loc.mutation,
  rights: state.core?.user?.i_user?.rights || [],
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchLocations,
      fetchLocationsStr,
      clearLocations,
      journalize,
      createOrUpdateLocation,
      deleteLocation,
      moveLocation,
    },
    dispatch,
  );
};

export default withModulesManager(
  injectIntl(connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(LocationsPage)))),
);
