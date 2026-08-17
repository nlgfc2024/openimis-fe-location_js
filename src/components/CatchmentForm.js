import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Button, Divider, Fab, Grid, Paper, Typography } from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import {
  FormattedMessage,
  PublishedComponent,
  TextInput,
  formatMessageWithValues,
  historyPush,
  journalize,
  withHistory,
  withModulesManager,
} from "@openimis/fe-core";
import { clearCatchment, createCatchment, fetchCatchment, updateCatchment } from "../actions";

const styles = (theme) => ({
  paper: theme.paper.paper,
  paperHeader: theme.paper.header,
  paperHeaderTitle: theme.paper.title,
  paperDivider: theme.paper.divider,
  item: theme.paper.item,
  fab: theme.fab,
});

class CatchmentForm extends Component {
  state = {
    catchment: { districts: [] },
    attemptedSave: false,
  };

  componentDidMount() {
    if (this.props.catchmentUuid) {
      this.props.fetchCatchment(this.props.catchmentUuid);
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.fetchedCatchment && this.props.fetchedCatchment && this.props.catchment) {
      this.setState({
        catchment: {
          ...this.props.catchment,
          districts: this.props.catchment.districts || [],
        },
      });
    }

    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      if (!this.props.catchmentUuid) {
        historyPush(this.props.modulesManager, this.props.history, "location.route.catchments");
      }
    }
  }

  componentWillUnmount() {
    this.props.clearCatchment();
  }

  update = (field, value) => {
    this.setState((state) => ({
      catchment: { ...state.catchment, [field]: value },
    }));
  };

  validationErrors = () => {
    const { catchment } = this.state;
    const errors = [];
    if (!catchment.code?.trim()) errors.push("Catchment code is required.");
    if (!catchment.name?.trim()) errors.push("Catchment name is required.");
    if (!catchment.districts?.length) errors.push("At least one District is required.");
    return errors;
  };

  canSave = () => !this.props.readOnly && this.validationErrors().length === 0;

  save = () => {
    this.setState({ attemptedSave: true });
    if (!this.canSave()) return;

    const { catchment } = this.state;
    const label = formatMessageWithValues(this.props.intl, "location", "catchment.mutationLabel", {
      code: catchment.code,
    });
    if (catchment.uuid) {
      this.props.updateCatchment(catchment, label);
    } else {
      this.props.createCatchment(catchment, label);
    }
  };

  render() {
    const { classes, readOnly = false } = this.props;
    const { catchment, attemptedSave } = this.state;
    const errors = this.validationErrors();

    return (
      <Fragment>
        <Paper className={classes.paper}>
          <Grid container className={classes.paperHeader}>
            <Grid item xs={12}>
              <Typography className={classes.paperHeaderTitle}>
                <FormattedMessage module="location" id="catchment.form.title" />
              </Typography>
            </Grid>
          </Grid>
          <Divider className={classes.paperDivider} />
          <Grid container className={classes.item} spacing={1}>
            <Grid item xs={12} sm={4} className={classes.item}>
              <TextInput
                module="location"
                label="catchment.code"
                value={catchment.code || ""}
                required
                readOnly={readOnly}
                onChange={(code) => this.update("code", code)}
              />
            </Grid>
            <Grid item xs={12} sm={8} className={classes.item}>
              <TextInput
                module="location"
                label="catchment.name"
                value={catchment.name || ""}
                required
                readOnly={readOnly}
                onChange={(name) => this.update("name", name)}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper className={classes.paper} style={{ marginTop: 8 }}>
          <Grid container className={classes.paperHeader}>
            <Grid item xs={12}>
              <Typography className={classes.paperHeaderTitle}>
                <FormattedMessage module="location" id="catchment.form.districts" />
              </Typography>
            </Grid>
          </Grid>
          <Divider className={classes.paperDivider} />
          <Grid container className={classes.item}>
            <Grid item xs={12} className={classes.item}>
              <PublishedComponent
                pubRef="location.MwDistrictPicker"
                multiple
                required
                readOnly={readOnly}
                value={catchment.districts || []}
                onChange={(districts) => this.update("districts", districts || [])}
              />
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={1} style={{ marginTop: 8 }}>
          <Grid item>
            <Button variant="outlined" onClick={this.props.back}>
              <FormattedMessage module="location" id="catchment.form.back" />
            </Button>
          </Grid>
        </Grid>

        {!readOnly && (
          <Fab color="primary" className={classes.fab} onClick={this.save} disabled={!this.canSave()}>
            <SaveIcon />
          </Fab>
        )}

        {attemptedSave && errors.length > 0 && (
          <Paper className={classes.paper} style={{ marginTop: 8, padding: 12, borderLeft: "4px solid #d32f2f" }}>
            {errors.map((error) => (
              <Typography key={error} color="error" variant="body2">
                {error}
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
  fetchedCatchment: state.loc.fetchedCatchment,
  catchment: state.loc.catchment,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchCatchment, clearCatchment, createCatchment, updateCatchment, journalize }, dispatch);

export default withModulesManager(
  withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(CatchmentForm))))),
);
