import React, { Component } from "react";
import { Grid } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import { TextInput, PublishedComponent, formatMessage } from "@openimis/fe-core";

const styles = (theme) => ({ item: { padding: theme.spacing(1) } });

class CatchmentFilter extends Component {
  value = (key) => this.props.filters?.[key]?.value || null;

  change = (id, value, filter) => this.props.onChangeFilters([{ id, value, filter }]);

  render() {
    const { classes, intl } = this.props;
    return (
      <Grid container>
        <Grid item xs={12} sm={6} className={classes.item}>
          <TextInput
            module="location"
            label="catchment.search"
            value={this.value("search") || ""}
            onChange={(value) => this.change("search", value, value ? `search: \"${value}\"` : null)}
          />
        </Grid>
        <Grid item xs={12} sm={6} className={classes.item}>
          <PublishedComponent
            pubRef="location.MwDistrictPicker"
            label={formatMessage(intl, "location", "catchment.district")}
            value={this.value("districtUuid")}
            onChange={(district) =>
              this.change("districtUuid", district, district ? `districtUuid: \"${district.uuid}\"` : null)
            }
          />
        </Grid>
      </Grid>
    );
  }
}

export default injectIntl(withTheme(withStyles(styles)(CatchmentFilter)));
