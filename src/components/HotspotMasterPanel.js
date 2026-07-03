import React from "react";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { ControlledField, PublishedComponent, FormPanel, TextInput, TextAreaInput } from "@openimis/fe-core";

const styles = (theme) => ({
  item: theme.paper.item,
});

class HotspotMasterPanel extends FormPanel {
  constructor(props) {
    super(props);
    const primaryVillage = props.edited?.villages?.[0] || props.edited?.village;
    const microCatchment = props.edited?.microCatchment || primaryVillage?.parent || null;
    this.state = {
      region: microCatchment?.parent?.parent || null,
      district: microCatchment?.parent || null,
      microCatchment,
    };
  }

  componentDidMount() {
    this.syncSelection(this.props.edited);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.edited?.uuid !== this.props.edited?.uuid ||
      prevProps.edited?.microCatchment?.uuid !== this.props.edited?.microCatchment?.uuid ||
      prevProps.edited?.village?.uuid !== this.props.edited?.village?.uuid
    ) {
      this.syncSelection(this.props.edited);
    }
  }

  syncSelection = (hotspot) => {
    const primaryVillage = hotspot?.villages?.[0] || hotspot?.village;
    const microCatchment = hotspot?.microCatchment || primaryVillage?.parent || null;
    this.setState({
      region: microCatchment?.parent?.parent || null,
      district: microCatchment?.parent || null,
      microCatchment,
    });
  };

  updateRegion = (region) => {
    this.setState({ region, district: null, microCatchment: null });
    this.updateAttributes({ microCatchment: null, villages: [], village: null });
  };

  updateDistrict = (district) => {
    this.setState({ region: district?.parent || this.state.region, district, microCatchment: null });
    this.updateAttributes({ microCatchment: null, villages: [], village: null });
  };

  updateMicroCatchment = (microCatchment) => {
    this.setState({
      region: microCatchment?.parent?.parent || this.state.region,
      district: microCatchment?.parent || this.state.district,
      microCatchment,
    });
    this.updateAttributes({ microCatchment, villages: [], village: null });
  };

  updateVillages = (villages) => {
    const selectedVillages = villages || [];
    this.updateAttributes({ villages: selectedVillages, village: selectedVillages[0] || null });
  };

  render() {
    const { classes, edited, readOnly = false } = this.props;
    const { region, district, microCatchment } = this.state;
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
                name="code"
                value={edited.code}
                readOnly={readOnly}
                required={true}
                onChange={(v) => this.updateAttribute("code", v)}
                inputProps={{ maxLength: 50 }}
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
                name="name"
                value={edited.name}
                readOnly={readOnly}
                required={true}
                onChange={(v) => this.updateAttribute("name", v)}
              />
            </Grid>
          }
        />
        <ControlledField
          module="location"
          id="Hotspot.region"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="location.RegionPicker"
                value={region}
                label="HotspotForm.region"
                readOnly={readOnly}
                withNull={true}
                onChange={this.updateRegion}
              />
            </Grid>
          }
        />
        <ControlledField
          module="location"
          id="Hotspot.district"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="location.DistrictPicker"
                value={district}
                region={region}
                label="HotspotForm.district"
                readOnly={readOnly}
                withNull={true}
                onChange={this.updateDistrict}
              />
            </Grid>
          }
        />
        <ControlledField
          module="location"
          id="Hotspot.microCatchment"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="location.LocationPicker"
                locationLevel={2}
                parentLocation={district}
                value={microCatchment}
                label="HotspotForm.microCatchment"
                readOnly={readOnly}
                required={true}
                onChange={this.updateMicroCatchment}
              />
            </Grid>
          }
        />
        <ControlledField
          module="location"
          id="Hotspot.village"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="location.LocationPicker"
                locationLevel={3}
                parentLocation={microCatchment}
                value={edited.villages || []}
                label="HotspotForm.villages"
                multiple={true}
                readOnly={readOnly}
                required={true}
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
