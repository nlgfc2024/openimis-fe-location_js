import React, { Component, Fragment } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import ReplayIcon from "@material-ui/icons/Replay";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  ProgressOrError,
  Form,
  withModulesManager,
  withHistory,
  coreAlert,
  journalize,
  formatMessageWithValues,
  Helmet,
  parseData,
  historyPush,
} from "@openimis/fe-core";
import { fetchZone, fetchCreatedZone, fetchZoneMutation, clearZone } from "../zoneActions";
import ZoneMasterPanel from "./ZoneMasterPanel";

const ZONE_FORM_CONTRIBUTION_KEY = "location.Zone";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
});

class ZoneForm extends Component {
  state = {
    reload: false,
    lockNew: false,
    reset: 0,
    update: 0,
    zone_uuid: null,
    zone: this._newZone(),
    newZone: true,
    isSaved: false,
    redirectAfterSave: false,
  };

  _newZone() {
    return {};
  }

  componentDidMount() {
    if (this.props.zone_uuid) {
      this.setState((state, props) => ({ zone_uuid: props.zone_uuid }));
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.fetchedZone !== this.props.fetchedZone && !!this.props.fetchedZone && !!this.props.zone) {
      this.setState((state, props) => ({
        zone: props.zone,
        zone_uuid: props.zone.uuid,
        lockNew: false,
        newZone: false,
      }));
    } else if (prevState.zone_uuid !== this.state.zone_uuid) {
      this.props.fetchZone(this.state.zone_uuid, null);
    } else if (prevProps.zone_uuid && !this.props.zone_uuid) {
      this.setState({ zone: this._newZone(), lockNew: false, zone_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      const mutationSucceeded = !!this.props.mutation?.id;
      if (mutationSucceeded) {
        this.waitForSave(this.props.mutation.clientMutationId);
      } else {
        this.setState((state) => ({
          reset: state.reset + 1,
          lockNew: false,
          isSaved: false,
          redirectAfterSave: false,
        }));
      }
    }
  }

  waitForSave = async (clientMutationId) => {
    try {
      for (let attempt = 0; attempt < 60 && !this.unmounted; attempt += 1) {
        const response = await this.props.fetchZoneMutation(clientMutationId);
        const result = parseData(response?.payload?.data?.mutationLogs)?.[0];
        if (this.unmounted) return;
        if (result?.status === 2) {
          await this.showSuccessAlert();
          return;
        }
        if (result?.status === 1) {
          // The mutation journal displays the backend error. Keep the form
          // and entered values available for correction and retry.
          this.setState({ lockNew: false, isSaved: false, redirectAfterSave: false });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (!this.unmounted) this.props.coreAlert("Zone save pending", "The save is still pending. Check the activity journal before trying again.");
    } catch (error) {
      if (!this.unmounted) this.props.coreAlert("Unable to confirm Zone save", "Check the activity journal before trying again.");
    }
  };

  showSuccessAlert = async () => {
    const isUpdate = !!this.state.zone_uuid;
    let savedZone = this.state.zone;

    if (!isUpdate) {
      const clusterUuid = savedZone.cluster?.uuid;
      const villageUuid = savedZone.villages?.[0]?.uuid;
      if (clusterUuid && villageUuid) {
        // The mutation can finish asynchronously. Retry briefly until the
        // backend-generated zone code is visible through GraphQL.
        for (let attempt = 0; attempt < 12 && !savedZone.code; attempt += 1) {
          try {
            const response = await this.props.fetchCreatedZone(clusterUuid, villageUuid);
            const createdZones = parseData(response?.payload?.data?.zones) || [];
            if (createdZones.length) savedZone = createdZones[0];
          } catch (error) {
            // A transient lookup error must not suppress the success alert.
          }
          if (!savedZone.code) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
    }

    const displayCode = savedZone.code || savedZone.name || "";
    this.props.coreAlert(
      formatMessageWithValues(this.props.intl, "location", "zone.alert.success", {
        code: displayCode,
      }),
      formatMessageWithValues(
        this.props.intl,
        "location",
        isUpdate ? "zone.update.success" : "zone.create.success",
        { code: displayCode },
      ),
    );
    historyPush(this.props.modulesManager, this.props.history, "location.route.zones");
  };

  componentWillUnmount() {
    this.unmounted = true;
    this.props.clearZone();
  }

  _add = () => {
    this.setState(
      (state) => ({
        zone: this._newZone(),
        lockNew: false,
        newZone: true,
        reset: state.reset + 1,
      }),
      () => {
        this.props.add();
        this.forceUpdate();
      },
    );
  };

  onEditedChanged = (zone) => {
    this.setState({ zone, newZone: false });
  };

  canSave = () => {
    if (this.state.isSaved) return false;
    if (!this.state.zone.name?.trim()) return false;
    if (!this.state.zone.cluster) return false;
    if (!this.state.zone.villages?.length) return false;
    if (this.state.zone.validityTo) return false;
    return true;
  };

  reload = async () => {
    const { modulesManager, history, fetchZone } = this.props;
    const {
      isSaved,
      reload,
      zone_uuid: zoneUuid,
      zone: { code: zoneCode },
    } = this.state;

    if (zoneUuid) {
      await fetchZone(zoneUuid, zoneCode);
      this.setState((prevState) => ({ ...prevState, isSaved: false, reload: !reload }));
      return;
    }

    if (isSaved) {
      const response = await fetchZone(zoneUuid, zoneCode);
      const createdZoneUuid = parseData(response.payload.data.zones)[0].uuid;
      historyPush(modulesManager, history, "location.route.zone", [createdZoneUuid]);
      this.setState((prevState) => ({ ...prevState, isSaved: false, reload: !reload }));
      return;
    }

    this.setState({
      reload: !reload,
      lockNew: false,
      reset: 0,
      update: 0,
      zone_uuid: null,
      zone: this._newZone(),
      newZone: true,
      isSaved: false,
      redirectAfterSave: false,
    });
  };

  _save = (zone) => {
    const isCreating = !zone.uuid;
    this.setState(
      {
        lockNew: true,
        isSaved: true,
        redirectAfterSave: true,
      },
      () => this.props.save(zone),
    );
  };

  render() {
    const { fetchingZone, fetchedZone, errorZone, add, save, back, classes } = this.props;
    const { zone_uuid, lockNew, zone, newZone, reset, update, isSaved, reload } = this.state;
    const readOnly = !save || lockNew || !!zone.validityTo || isSaved;
    const actions = [
      {
        doIt: this.reload,
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly && !isSaved,
      },
    ];

    return (
      <div className={readOnly ? classes.lockedPage : null}>
        <Helmet
          title={formatMessageWithValues(this.props.intl, "location", "zone.edit.page.title", {
            code: zone.code,
          })}
        />
        <ProgressOrError progress={fetchingZone} error={errorZone} />
        {(!!fetchedZone || !zone_uuid) && (
          <Fragment>
            <Form
              reload={reload}
              module="location"
              edited_id={zone_uuid}
              edited={zone}
              reset={reset}
              update={update}
              title="zone.edit.title"
              titleParams={{ code: zone.code }}
              back={back}
              add={!!add && !newZone ? this._add : null}
              save={!!save ? this._save : null}
              canSave={this.canSave}
              readOnly={readOnly}
              canEdit={!!save}
              onFormSave={this._save}
              canSaveForm={this.canSave}
              enableSaveButton={false}
              HeadPanel={ZoneMasterPanel}
              Panels={[]}
              onEditedChanged={this.onEditedChanged}
              actions={actions}
              contributedPanelsKey={ZONE_FORM_CONTRIBUTION_KEY}
              openDirty={save}
            />
          </Fragment>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  zone: state.loc.zone,
  fetchingZone: state.loc.fetchingZone,
  fetchedZone: state.loc.fetchedZone,
  errorZone: state.loc.errorZone,
  submittingMutation: state.loc.submittingMutation,
  mutation: state.loc.mutation,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  { fetchZone, fetchCreatedZone, fetchZoneMutation, clearZone, coreAlert, journalize },
  dispatch,
);

export default withHistory(
  withModulesManager(connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(ZoneForm))))),
);
