import React from "react";
import { Grid, Button } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { ControlledField, FormPanel, FormattedMessage, TextInput, TextAreaInput } from "@openimis/fe-core";
import MicroCatchmentPicker from "../pickers/MicroCatchmentPicker";
import HotspotVillagesPicker from "../pickers/HotspotVillagesPicker";

const styles = (theme) => ({
  item: theme.paper.item,
});

const taNames = (microCatchment) =>
  (microCatchment?.traditionalAuthorities || [])
    .map((ta) => ta?.location?.name)
    .filter(Boolean)
    .join(", ");

class HotspotMasterPanel extends FormPanel {
  updateMicroCatchment = (microCatchment) => {
    // Changing the micro-catchment invalidates any previously selected villages.
    this.updateAttributes({ microCatchment, villages: [] });
  };

  updateVillages = (villages) => {
    this.updateAttributes({ villages: villages || [] });
  };

  render() {
    const { classes, edited, readOnly = false, canEdit, onFormSave, canSaveForm } = this.props;
    const microCatchment = edited?.microCatchment || null;
    return (
      <Grid container>
        {/* Code / Name / Micro-Catchment */}
        <Grid item xs={12}>
          <Grid container>
            {!!edited.code && (
              <ControlledField
                module="location"
                id="Hotspot.code"
                field={
                  <Grid item xs={3} className={classes.item}>
                    <TextInput module="location" label="HotspotForm.code" value={edited.code} readOnly />
                  </Grid>
                }
              />
            )}
            <ControlledField
              module="location"
              id="Hotspot.name"
              field={
                <Grid item xs={edited.code ? 5 : 8} className={classes.item}>
                  <TextInput
                    module="location"
                    label="HotspotForm.name"
                    value={edited.name}
                    required
                    readOnly={readOnly}
                    onChange={(v) => this.updateAttribute("name", v)}
                  />
                </Grid>
              }
            />
            <ControlledField
              module="location"
              id="Hotspot.microCatchment"
              field={
                <Grid item xs={4} className={classes.item}>
                  <MicroCatchmentPicker
                    value={microCatchment}
                    label="HotspotForm.microCatchment"
                    readOnly={readOnly}
                    required
                    onChange={this.updateMicroCatchment}
                  />
                </Grid>
              }
            />
          </Grid>
        </Grid>

        {/* District and TAs — read-only, derived from the micro-catchment */}
        <Grid item xs={12}>
          <Grid container>
            <ControlledField
              module="location"
              id="Hotspot.district"
              field={
                <Grid item xs={6} className={classes.item}>
                  <TextInput
                    module="location"
                    label="HotspotForm.district"
                    value={microCatchment?.district?.name || ""}
                    readOnly
                  />
                </Grid>
              }
            />
            <ControlledField
              module="location"
              id="Hotspot.tas"
              field={
                <Grid item xs={6} className={classes.item}>
                  <TextInput module="location" label="HotspotForm.tas" value={taNames(microCatchment)} readOnly />
                </Grid>
              }
            />
          </Grid>
        </Grid>

        {/* Villages and Description */}
        <Grid item xs={12}>
          <Grid container>
            <ControlledField
              module="location"
              id="Hotspot.villages"
              field={
                <Grid item xs={6} className={classes.item}>
                  <HotspotVillagesPicker
                    value={edited.villages || []}
                    label="HotspotForm.villages"
                    microCatchmentUuid={microCatchment?.uuid}
                    hotspotUuid={edited.uuid}
                    readOnly={readOnly}
                    required
                    onChange={this.updateVillages}
                  />
                </Grid>
              }
            />
            <ControlledField
              module="location"
              id="Hotspot.description"
              field={
                <Grid item xs={6} className={classes.item}>
                  <TextAreaInput
                    module="location"
                    label="HotspotForm.description"
                    value={edited.description}
                    rows="2"
                    readOnly={readOnly}
                    onChange={(v) => this.updateAttribute("description", v)}
                  />
                </Grid>
              }
            />
          </Grid>
        </Grid>

        {!readOnly && canEdit && (
          <Grid item xs={12} className={classes.item}>
            <Button
              color="primary"
              variant="contained"
              onClick={() => onFormSave(edited)}
              disabled={!canSaveForm || !canSaveForm()}
            >
              <FormattedMessage module="location" id="HotspotForm.save" />
            </Button>
          </Grid>
        )}
      </Grid>
    );
  }
}

export default withTheme(withStyles(styles)(HotspotMasterPanel));
