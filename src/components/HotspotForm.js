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
import { fetchHotspot, fetchCreatedHotspot, clearHotspot } from "../actions";
import HotspotMasterPanel from "./HotspotMasterPanel";

const HOTSPOT_FORM_CONTRIBUTION_KEY = "location.Hotspot";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
});

class HotspotForm extends Component {
  state = {
    reload: false,
    lockNew: false,
    reset: 0,
    update: 0,
    hotspot_uuid: null,
    hotspot: this._newHotspot(),
    newHotspot: true,
    isSaved: false,
    redirectAfterSave: false,
  };

  _newHotspot() {
    return {};
  }

  componentDidMount() {
    if (this.props.hotspot_uuid) {
      this.setState((state, props) => ({ hotspot_uuid: props.hotspot_uuid }));
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.fetchedHotspot !== this.props.fetchedHotspot && !!this.props.fetchedHotspot && !!this.props.hotspot) {
      this.setState((state, props) => ({
        hotspot: props.hotspot,
        hotspot_uuid: props.hotspot.uuid,
        lockNew: false,
        newHotspot: false,
      }));
    } else if (prevState.hotspot_uuid !== this.state.hotspot_uuid) {
      this.props.fetchHotspot(this.state.hotspot_uuid, null);
    } else if (prevProps.hotspot_uuid && !this.props.hotspot_uuid) {
      this.setState({ hotspot: this._newHotspot(), lockNew: false, hotspot_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      const mutationSucceeded = !!this.props.mutation?.id;
      if (mutationSucceeded) {
        this.showSuccessAlert();
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

  showSuccessAlert = async () => {
    const isUpdate = !!this.state.hotspot_uuid;
    let savedHotspot = this.state.hotspot;

    if (!isUpdate) {
      const microCatchmentUuid = savedHotspot.microCatchment?.uuid;
      const villageUuid = savedHotspot.villages?.[0]?.uuid;
      if (microCatchmentUuid && villageUuid) {
        // The mutation can finish asynchronously. Retry briefly until the
        // backend-generated hotspot code is visible through GraphQL.
        for (let attempt = 0; attempt < 12 && !savedHotspot.code; attempt += 1) {
          try {
            const response = await this.props.fetchCreatedHotspot(microCatchmentUuid, villageUuid);
            const createdHotspots = parseData(response?.payload?.data?.hotspots) || [];
            if (createdHotspots.length) savedHotspot = createdHotspots[0];
          } catch (error) {
            // A transient lookup error must not suppress the success alert.
          }
          if (!savedHotspot.code) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
    }

    const displayCode = savedHotspot.code || savedHotspot.name || "";
    this.props.coreAlert(
      formatMessageWithValues(this.props.intl, "location", "hotspot.alert.success", {
        code: displayCode,
      }),
      formatMessageWithValues(
        this.props.intl,
        "location",
        isUpdate ? "hotspot.update.success" : "hotspot.create.success",
        { code: displayCode },
      ),
    );
    historyPush(this.props.modulesManager, this.props.history, "location.route.hotspots");
  };

  componentWillUnmount() {
    this.props.clearHotspot();
  }

  _add = () => {
    this.setState(
      (state) => ({
        hotspot: this._newHotspot(),
        lockNew: false,
        newHotspot: true,
        reset: state.reset + 1,
      }),
      () => {
        this.props.add();
        this.forceUpdate();
      },
    );
  };

  onEditedChanged = (hotspot) => {
    this.setState({ hotspot, newHotspot: false });
  };

  canSave = () => {
    if (this.state.isSaved) return false;
    if (!this.state.hotspot.name) return false;
    if (!this.state.hotspot.microCatchment) return false;
    if (!this.state.hotspot.villages?.length) return false;
    if (this.state.hotspot.validityTo) return false;
    return true;
  };

  reload = async () => {
    const { modulesManager, history, fetchHotspot } = this.props;
    const {
      isSaved,
      reload,
      hotspot_uuid: hotspotUuid,
      hotspot: { code: hotspotCode },
    } = this.state;

    if (hotspotUuid) {
      await fetchHotspot(hotspotUuid, hotspotCode);
      this.setState((prevState) => ({ ...prevState, isSaved: false, reload: !reload }));
      return;
    }

    if (isSaved) {
      const response = await fetchHotspot(hotspotUuid, hotspotCode);
      const createdHotspotUuid = parseData(response.payload.data.hotspots)[0].uuid;
      historyPush(modulesManager, history, "location.route.hotspot", [createdHotspotUuid]);
      this.setState((prevState) => ({ ...prevState, isSaved: false, reload: !reload }));
      return;
    }

    this.setState({
      reload: !reload,
      lockNew: false,
      reset: 0,
      update: 0,
      hotspot_uuid: null,
      hotspot: this._newHotspot(),
      newHotspot: true,
      isSaved: false,
      redirectAfterSave: false,
    });
  };

  _save = (hotspot) => {
    const isCreating = !hotspot.uuid;
    this.setState(
      {
        lockNew: true,
        isSaved: true,
        redirectAfterSave: true,
      },
      () => this.props.save(hotspot),
    );
  };

  render() {
    const { fetchingHotspot, fetchedHotspot, errorHotspot, add, save, back, classes } = this.props;
    const { hotspot_uuid, lockNew, hotspot, newHotspot, reset, update, isSaved, reload } = this.state;
    const readOnly = lockNew || !!hotspot.validityTo || isSaved;
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
          title={formatMessageWithValues(this.props.intl, "location", "hotspot.edit.page.title", {
            code: hotspot.code,
          })}
        />
        <ProgressOrError progress={fetchingHotspot} error={errorHotspot} />
        {(!!fetchedHotspot || !hotspot_uuid) && (
          <Fragment>
            <Form
              reload={reload}
              module="location"
              edited_id={hotspot_uuid}
              edited={hotspot}
              reset={reset}
              update={update}
              title="hotspot.edit.title"
              titleParams={{ code: hotspot.code }}
              back={back}
              add={!!add && !newHotspot ? this._add : null}
              save={!!save ? this._save : null}
              canSave={this.canSave}
              readOnly={readOnly}
              canEdit={!!save}
              onFormSave={this._save}
              canSaveForm={this.canSave}
              enableSaveButton={false}
              HeadPanel={HotspotMasterPanel}
              Panels={[]}
              onEditedChanged={this.onEditedChanged}
              actions={actions}
              contributedPanelsKey={HOTSPOT_FORM_CONTRIBUTION_KEY}
              openDirty={save}
            />
          </Fragment>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  hotspot: state.loc.hotspot,
  fetchingHotspot: state.loc.fetchingHotspot,
  fetchedHotspot: state.loc.fetchedHotspot,
  errorHotspot: state.loc.errorHotspot,
  submittingMutation: state.loc.submittingMutation,
  mutation: state.loc.mutation,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  { fetchHotspot, fetchCreatedHotspot, clearHotspot, coreAlert, journalize },
  dispatch,
);

export default withHistory(
  withModulesManager(connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(HotspotForm))))),
);
