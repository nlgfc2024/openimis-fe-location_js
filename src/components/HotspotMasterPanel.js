import React from "react";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { ControlledField, FormPanel, TextInput, TextAreaInput } from "@openimis/fe-core";
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
    const { classes, edited, readOnly = false } = this.props;
    const microCatchment = edited?.microCatchment || null;
    return (
      <Grid container>
        <ControlledField
          module="location"
          id="Hotspot.code"
          field={
            <Grid item xs={2} className={classes.item}>
              <TextInput
                module="location"
                label="HotspotForm.code"
                value={edited.code}
                required
                readOnly={readOnly}
                onChange={(v) => this.updateAttribute("code", v)}
              />
            </Grid>
          }
        />
        <ControlledField
          module="location"
          id="Hotspot.name"
          field={
            <Grid item xs={3} className={classes.item}>
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
            <Grid item xs={3} className={classes.item}>
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
        {/* District (Location type R) and TAs (Location type D) — read-only, derived from the micro-catchment */}
        <ControlledField
          module="location"
          id="Hotspot.district"
          field={
            <Grid item xs={2} className={classes.item}>
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
            <Grid item xs={2} className={classes.item}>
              <TextInput
                module="location"
                label="HotspotForm.tas"
                value={taNames(microCatchment)}
                readOnly
              />
            </Grid>
          }
        />
        <ControlledField
          module="location"
          id="Hotspot.villages"
          field={
            <Grid item xs={5} className={classes.item}>
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
            <Grid item xs={4} className={classes.item}>
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
    );
  }
}

export default withTheme(withStyles(styles)(HotspotMasterPanel));
