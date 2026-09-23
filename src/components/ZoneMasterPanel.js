import React from "react";
import { Grid, Button } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { ControlledField, FormPanel, FormattedMessage, TextInput, TextAreaInput } from "@openimis/fe-core";
import ClusterPicker from "../pickers/ClusterPicker";
import MwDistrictPicker from "../pickers/MwDistrictPicker";
import ZoneVillagesPicker from "../pickers/ZoneVillagesPicker";

const styles = (theme) => ({
  item: theme.paper.item,
});

const taNames = (cluster) =>
  cluster?.traditionalAuthority?.name || "";

class ZoneMasterPanel extends FormPanel {
  updateDistrict = (district) => {
    this.updateAttributes({ district, cluster: null, villages: [] });
  };

  updateCluster = (cluster) => {
    // Changing the cluster invalidates any previously selected villages.
    this.updateAttributes({ cluster, villages: [] });
  };

  updateVillages = (villages) => {
    this.updateAttributes({ villages: villages || [] });
  };

  render() {
    const { classes, edited, readOnly = false, canEdit, onFormSave, canSaveForm } = this.props;
    const cluster = edited?.cluster || null;
    const district = edited?.district || cluster?.traditionalAuthority?.parent || null;
    return (
      <Grid container>
        {/* Code / Name */}
        <Grid item xs={12}>
          <Grid container>
            {!!edited.code && (
              <ControlledField
                module="location"
                id="Zone.code"
                field={
                  <Grid item xs={3} className={classes.item}>
                    <TextInput module="location" label="ZoneForm.code" value={edited.code} readOnly />
                  </Grid>
                }
              />
            )}
            <ControlledField
              module="location"
              id="Zone.name"
              field={
                <Grid item xs={edited.code ? 9 : 12} className={classes.item}>
                  <TextInput
                    module="location"
                    label="ZoneForm.name"
                    value={edited.name}
                    required
                    readOnly={readOnly}
                    onChange={(v) => this.updateAttribute("name", v)}
                  />
                </Grid>
              }
            />
          </Grid>
        </Grid>

        {/* District, Cluster and Traditional Authority */}
        <Grid item xs={12}>
          <Grid container>
            <ControlledField
              module="location"
              id="Zone.district"
              field={
                <Grid item xs={4} className={classes.item}>
                  <MwDistrictPicker
                    value={district}
                    required
                    readOnly={readOnly}
                    onChange={this.updateDistrict}
                  />
                </Grid>
              }
            />
            <ControlledField
              module="location"
              id="Zone.cluster"
              field={
                <Grid item xs={4} className={classes.item}>
                  <ClusterPicker
                    value={cluster}
                    label="ZoneForm.cluster"
                    key={district?.uuid || "no-district"}
                    districtUuid={district?.uuid}
                    requireDistrict
                    readOnly={readOnly}
                    required
                    onChange={this.updateCluster}
                  />
                </Grid>
              }
            />
            <ControlledField
              module="location"
              id="Zone.tas"
              field={
                <Grid item xs={4} className={classes.item}>
                  <TextInput module="location" label="ZoneForm.tas" value={taNames(cluster)} readOnly />
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
              id="Zone.villages"
              field={
                <Grid item xs={6} className={classes.item}>
                  <ZoneVillagesPicker
                    value={edited.villages || []}
                    label="ZoneForm.villages"
                    clusterUuid={cluster?.uuid}
                    zoneUuid={edited.uuid}
                    readOnly={readOnly}
                    required
                    onChange={this.updateVillages}
                  />
                </Grid>
              }
            />
            <ControlledField
              module="location"
              id="Zone.description"
              field={
                <Grid item xs={6} className={classes.item}>
                  <TextAreaInput
                    module="location"
                    label="ZoneForm.description"
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
              <FormattedMessage module="location" id="ZoneForm.save" />
            </Button>
          </Grid>
        )}
      </Grid>
    );
  }
}

export default withTheme(withStyles(styles)(ZoneMasterPanel));
