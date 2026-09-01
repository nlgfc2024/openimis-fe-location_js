import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Grid, Paper, Typography, Divider, Button, IconButton } from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import {
  withModulesManager,
  withHistory,
  historyPush,
  formatMessage,
  formatMessageWithValues,
  journalize,
  PublishedComponent,
  TextInput,
  FormattedMessage,
} from "@openimis/fe-core";
import { createMicroCatchment, updateMicroCatchment, fetchMicroCatchment, clearMicroCatchment } from "../actions";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderTitle: theme.paper.title,
  paperHeaderMessage: theme.paper.message,
  paperDivider: theme.paper.divider,
  item: theme.paper.item,
  lockedPage: theme.page.locked,
});

class MicroCatchmentForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      microCatchment: {},
      selectedTAs: [],
      selectedGVHs: [],
      attemptedSave: false,
    };
  }

  componentDidMount() {
    const { microCatchmentUuid } = this.props;
    if (microCatchmentUuid) {
      this.props.fetchMicroCatchment(microCatchmentUuid);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.fetchedMicroCatchment !== this.props.fetchedMicroCatchment && this.props.fetchedMicroCatchment) {
      const mc = this.props.microCatchment;
      if (mc) {
        this.setState({
          microCatchment: { ...mc },
          selectedTAs: (mc.traditionalAuthorities || []).map((ta) => ta.location),
          selectedGVHs: (mc.gvhs || []).map((gvh) => gvh.location),
        });
      }
    }
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      if (!this.props.microCatchmentUuid) {
        historyPush(this.props.modulesManager, this.props.history, "location.route.microCatchments");
      }
    }
  }

  componentWillUnmount() {
    this.props.clearMicroCatchment();
  }

  _updateMC = (attr, value) => {
    this.setState((state) => ({
      microCatchment: { ...state.microCatchment, [attr]: value },
    }));
  };

  _updateDistrict = (district) => {
    // Clear TAs and GVHs when district changes
    this.setState((state) => ({
      microCatchment: { ...state.microCatchment, district },
      selectedTAs: [],
      selectedGVHs: [],
    }));
  };

  _save = () => {
    this.setState({ attemptedSave: true });
    if (!this._canSave()) return;
    const { microCatchment, selectedTAs, selectedGVHs } = this.state;
    const payload = {
      ...microCatchment,
      taIds: selectedTAs.map((ta) => ta.id),
      gvhIds: selectedGVHs.map((gvh) => gvh.id),
    };
    const label = formatMessageWithValues(this.props.intl, "location", "microCatchment.mutation.label", {
      code: microCatchment.code || microCatchment.name || "new",
    });
    if (microCatchment.uuid) {
      this.props.updateMicroCatchment(payload, label);
    } else {
      this.props.createMicroCatchment(payload, label);
    }
  };

  _validationErrors = () => {
    const { microCatchment, selectedTAs, selectedGVHs } = this.state;
    const errors = [];

    if (!microCatchment.district) {
      errors.push("District is required.");
    }
    if (!selectedTAs.length) {
      errors.push("At least one Traditional Authority is required.");
    }
    if (!selectedGVHs.length) {
      errors.push("At least one GVH is required.");
    }

    const taUuids = new Set(selectedTAs.map((ta) => ta?.uuid).filter(Boolean));
    const hasCrossTASelection = selectedGVHs.some((gvh) => {
      const parentUuid = gvh?.parent?.uuid;
      return !!parentUuid && !taUuids.has(parentUuid);
    });
    if (hasCrossTASelection) {
      errors.push("All selected GVHs must belong to the selected Traditional Authorities.");
    }

    return errors;
  };

  _canSave = () => {
    const { readOnly = false } = this.props;
    const { microCatchment } = this.state;
    if (readOnly) return false;
    if (!microCatchment.name) return false;
    return this._validationErrors().length === 0;
  };

  render() {
    const { classes, intl, readOnly = false } = this.props;
    const { microCatchment, selectedTAs, selectedGVHs, attemptedSave } = this.state;
    const district = microCatchment.district || null;
    const isEditing = !!microCatchment.uuid;
    const validationErrors = this._validationErrors();

    return (
      <Fragment>
        <Paper className={classes.paper}>
          <Grid container alignItems="center" className={classes.paperHeader}>
            <Grid item>
              <IconButton onClick={this.props.back}>
                <ChevronLeftIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <Typography className={classes.paperHeaderTitle}>
                <FormattedMessage module="location" id="microCatchment.form.title" />
              </Typography>
            </Grid>
          </Grid>
          <Divider className={classes.paperDivider} />
          <Grid container className={classes.item} spacing={1}>
            {/* Code (only once generated on save) */}
            {!!microCatchment.code && (
              <Grid item xs={3} className={classes.item}>
                <TextInput module="location" label="microCatchment.code" value={microCatchment.code} readOnly />
              </Grid>
            )}
            {/* Name */}
            <Grid item xs={microCatchment.code ? 5 : 8} className={classes.item}>
              <TextInput
                module="location"
                label="microCatchment.name"
                value={microCatchment.name || ""}
                required
                readOnly={readOnly}
                onChange={(v) => this._updateMC("name", v)}
              />
            </Grid>
            {isEditing && (
              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="location"
                  label="microCatchment.type"
                  value={microCatchment.type || ""}
                  readOnly={readOnly}
                  onChange={(v) => this._updateMC("type", v)}
                />
              </Grid>
            )}
            {/* District (top level of the Malawi hierarchy = Location type R) */}
            <Grid item xs={4} className={classes.item}>
              <PublishedComponent
                pubRef="location.RegionPicker"
                value={district}
                readOnly={readOnly}
                required
                onChange={(v) => this._updateDistrict(v)}
              />
            </Grid>
            {/* Traditional Authorities */}
            <Grid item xs={12} className={classes.item}>
              <PublishedComponent
                pubRef="location.LocationPicker"
                locationLevel={1}
                label={formatMessage(intl, "location", "microCatchment.traditionalAuthority")}
                multiple
                value={selectedTAs}
                parentLocation={district}
                readOnly={readOnly || !district}
                onChange={(v) => this.setState({ selectedTAs: v || [] })}
              />
            </Grid>
            {/* GVHs */}
            <Grid item xs={12} className={classes.item}>
              <PublishedComponent
                pubRef="location.LocationPicker"
                locationLevel={2}
                label={formatMessage(intl, "location", "microCatchment.gvh")}
                multiple
                value={selectedGVHs}
                parentLocations={selectedTAs.map((ta) => ta.uuid)}
                readOnly={readOnly || selectedTAs.length === 0}
                onChange={(v) => this.setState({ selectedGVHs: v || [] })}
              />
            </Grid>
          </Grid>

          {!readOnly && (
            <Grid container spacing={1} className={classes.item}>
              <Grid item>
                <Button color="primary" variant="contained" onClick={this._save} disabled={!this._canSave()}>
                  <FormattedMessage module="location" id="microCatchment.form.save" />
                </Button>
              </Grid>
            </Grid>
          )}
        </Paper>

        {attemptedSave && validationErrors.length > 0 && (
          <Paper className={classes.paper} style={{ marginTop: 8, padding: 12, borderLeft: "4px solid #d32f2f" }}>
            <Typography color="error" variant="subtitle2">
              Please fix the following before saving:
            </Typography>
            {validationErrors.map((err) => (
              <Typography key={err} color="error" variant="body2">
                {err}
              </Typography>
            ))}
          </Paper>
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  submittingMutation: state.loc.submittingMutation,
  mutation: state.loc.mutation,
  fetchingMicroCatchment: state.loc.fetchingMicroCatchment,
  fetchedMicroCatchment: state.loc.fetchedMicroCatchment,
  microCatchment: state.loc.microCatchment,
  errorMicroCatchment: state.loc.errorMicroCatchment,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchMicroCatchment,
      clearMicroCatchment,
      createMicroCatchment,
      updateMicroCatchment,
      journalize,
    },
    dispatch,
  );

export default withModulesManager(
  withHistory(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(MicroCatchmentForm)))),
  ),
);
