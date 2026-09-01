import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import {
  Searcher,
  formatMessage,
  formatMessageWithValues,
  baseApiUrl,
  withModulesManager,
  withHistory,
  historyPush,
  journalize,
  coreConfirm,
} from "@openimis/fe-core";
import { fetchMicroCatchments, deleteMicroCatchment } from "../actions";
import MicroCatchmentFilter from "./MicroCatchmentFilter";
import {
  RIGHT_MICRO_CATCHMENT_ADD,
  RIGHT_MICRO_CATCHMENT_DELETE,
  RIGHT_MICRO_CATCHMENT_EDIT,
  RIGHT_MICRO_CATCHMENT_IMPORT,
  RIGHT_MICRO_CATCHMENT_EXPORT,
} from "../constants";

const styles = (theme) => ({
  page: theme.page,
  table: theme.table,
  searchResults: {
    "& .MuiTableHead-root .MuiTableCell-root": {
      fontSize: 16,
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
    },
    // Compact sizing on every action button so the four of them fit on one row.
    "& .MuiGrid-item .MuiButton-root": {
      minWidth: "auto",
      padding: theme.spacing(0.75, 1.25),
    },
    "& .MuiGrid-item .MuiButton-root .MuiTypography-body2": {
      fontSize: 14,
    },
    // Only the download/template/upload actions get the low-emphasis look; the "Add" action
    // (always first) stays the default solid style to match the other modules' Add button.
    "& .MuiGrid-item:not(:first-child) > .MuiButton-containedPrimary": {
      backgroundColor: "transparent",
      boxShadow: "none",
      color: theme.palette.primary.main,
    },
    "& .MuiGrid-item:not(:first-child) > .MuiButton-containedPrimary:hover": {
      backgroundColor: theme.palette.action.hover,
      boxShadow: "none",
    },
  },
  alertTitle: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2, 3),
  },
  alertContent: {
    minWidth: 380,
    padding: theme.spacing(3),
  },
  alertActions: {
    padding: theme.spacing(1, 3, 2),
  },
});

class MicroCatchmentSearcher extends Component {
  state = { reset: 0, confirmedAction: null, uploading: false, district: null, alert: null };

  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-location",
      "microCatchmentFilter.rowsPerPageOptions",
      [10, 20, 50, 100],
    );
    this.defaultPageSize = props.modulesManager.getConf("fe-location", "microCatchmentFilter.defaultPageSize", 10);
  }

  fetch = (params) => {
    this.lastQueryParams = params;
    this.props.fetchMicroCatchments(params);
  };

  componentDidUpdate(prevProps) {
    if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state) => ({ reset: state.reset + 1 }));
    } else if (prevProps.confirmed !== this.props.confirmed && this.props.confirmed && this.state.confirmedAction) {
      this.state.confirmedAction();
      this.setState({ confirmedAction: null });
    }
  }

  onFiltersApplied = (filters) => {
    const districtFromFilter = filters?.district_Uuid?.value || null;
    if (districtFromFilter?.uuid !== this.state.district?.uuid) {
      this.setState({ district: districtFromFilter });
    }
  };

  onDistrictFilterChange = (district) => {
    if ((district?.uuid || null) !== (this.state.district?.uuid || null)) {
      this.setState({ district: district || null });
    }
  };

  hasRight = (right) => this.props.rights.includes(right) || this.props.rights.includes(String(right));

  rowIdentifier = (r) => r.uuid;

  filtersToQueryParams = (state) => {
    let params = Object.keys(state.filters)
      .filter((f) => !!state.filters[f]["filter"])
      .map((f) => state.filters[f]["filter"]);
    params.push(`first: ${state.pageSize}`);
    if (!!state.afterCursor) {
      params.push(`after: "${state.afterCursor}"`);
    }
    if (!!state.beforeCursor) {
      params.push(`before: "${state.beforeCursor}"`);
    }
    if (!!state.orderBy) {
      params.push(`orderBy: ["${state.orderBy}"]`);
    }
    return params;
  };

  headers = () => {
    let result = [
      "microCatchment.code",
      "microCatchment.name",
      "microCatchment.district",
      "microCatchment.ta",
      "microCatchment.gvh",
    ];
    if (this.hasRight(RIGHT_MICRO_CATCHMENT_EDIT) || this.hasRight(RIGHT_MICRO_CATCHMENT_DELETE)) {
      result.push(null);
    }
    return result;
  };

  itemFormatters = () => {
    const { intl } = this.props;
    let result = [
      (mc) => mc.code,
      (mc) => mc.name,
      (mc) => mc.district?.name || "",
      (mc) =>
        (mc.traditionalAuthorities || [])
          .map((ta) => ta?.location?.name)
          .filter(Boolean)
          .join(", "),
      (mc) =>
        (mc.gvhs || [])
          .map((gvh) => gvh?.location?.name)
          .filter(Boolean)
          .join(", "),
    ];
    if (this.hasRight(RIGHT_MICRO_CATCHMENT_EDIT) || this.hasRight(RIGHT_MICRO_CATCHMENT_DELETE)) {
      result.push((mc) => {
        if (mc.validityTo) return null;
        return (
          <span style={{ display: "inline-flex" }}>
            {this.hasRight(RIGHT_MICRO_CATCHMENT_EDIT) && (
              <Tooltip title={formatMessage(intl, "location", "microCatchment.edit.button")}>
                <span>
                  <IconButton
                    aria-label={formatMessage(intl, "location", "microCatchment.edit.button")}
                    disabled={!!mc.clientMutationId}
                    onClick={() => this.onDoubleClick(mc)}
                  >
                    <EditIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {this.hasRight(RIGHT_MICRO_CATCHMENT_DELETE) && (
              <Tooltip title={formatMessage(intl, "location", "microCatchment.delete.button")}>
                <span>
                  <IconButton
                    aria-label={formatMessage(intl, "location", "microCatchment.delete.button")}
                    disabled={!!mc.clientMutationId}
                    onClick={() => this.onDelete(mc)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </span>
        );
      });
    }
    return result;
  };

  onDelete = (mc) => {
    const confirmedAction = () =>
      this.props.deleteMicroCatchment(
        mc,
        formatMessageWithValues(this.props.intl, "location", "microCatchment.delete.mutationLabel", { code: mc.code }),
      );

    this.setState({ confirmedAction }, () =>
      this.props.coreConfirm(
        formatMessage(this.props.intl, "location", "microCatchment.delete.confirm.title"),
        formatMessageWithValues(this.props.intl, "location", "microCatchment.delete.confirm.message", {
          code: mc.code,
          name: mc.name,
        }),
      ),
    );
  };

  sorts = () => {
    let result = [["code", true], ["name", true], ["district", true], null, null];
    if (this.hasRight(RIGHT_MICRO_CATCHMENT_EDIT) || this.hasRight(RIGHT_MICRO_CATCHMENT_DELETE)) {
      result.push(null);
    }
    return result;
  };

  rowDisabled = (selection, i) => !!i.validityTo;

  rowLocked = (selection, i) => !!i.clientMutationId;

  onDoubleClick = (mc, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "location.route.microCatchment", [mc.uuid], newTab);
  };

  showMessage = (titleKey, messageKey, detail) => {
    const message = formatMessage(this.props.intl, "location", messageKey) || detail;
    this.setState({
      alert: {
        title: formatMessage(this.props.intl, "location", titleKey),
        message: detail && detail !== message ? `${message}\n\n${detail}` : message,
      },
    });
  };

  closeAlert = () => this.setState({ alert: null });

  getActiveDistrict = () => {
    if (this.state.district?.uuid) return this.state.district;
    const districts = this.props.userDistricts || [];
    return districts.length === 1 ? districts[0] : null;
  };

  onDownload = async () => {
    const district = this.getActiveDistrict();
    if (!district?.uuid) {
      this.showMessage(
        "microCatchment.alert.actionRequired",
        "microCatchment.download.missingDistrict",
        "Please select a district before downloading micro catchments.",
      );
      return;
    }

    try {
      const url = new URL(`${window.location.origin}${baseApiUrl}/location/micro-catchments/export/`);
      const queryParams = new URLSearchParams({ district_uuid: district.uuid });
      url.search = queryParams.toString();

      const response = await fetch(url.toString(), { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error(
          formatMessage(this.props.intl, "location", "microCatchment.download.error") || "Download failed.",
        );
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `micro_catchments_${district.code || "district"}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      this.showMessage(
        "microCatchment.alert.error",
        "microCatchment.download.error",
        error?.message || "Download failed.",
      );
    }
  };

  onUploadClick = () => {
    if (!this.getActiveDistrict()?.uuid) {
      this.showMessage(
        "microCatchment.alert.actionRequired",
        "microCatchment.upload.missingDistrict",
        "Please select a district before uploading micro catchments.",
      );
      return;
    }
    this.fileInputRef.current?.click();
  };

  onDownloadTemplate = async () => {
    const district = this.getActiveDistrict();
    if (!district?.uuid) {
      this.showMessage(
        "microCatchment.alert.actionRequired",
        "microCatchment.downloadTemplate.missingDistrict",
        "Please select a district before downloading the micro-catchment template.",
      );
      return;
    }

    try {
      const url = new URL(`${window.location.origin}${baseApiUrl}/location/micro-catchments/template/`);
      url.search = new URLSearchParams({ district_uuid: district.uuid }).toString();
      const response = await fetch(url.toString(), { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error(
          formatMessage(this.props.intl, "location", "microCatchment.downloadTemplate.error") ||
            "Template download failed.",
        );
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `micro_catchment_template_${district.code || "district"}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      this.showMessage(
        "microCatchment.alert.error",
        "microCatchment.downloadTemplate.error",
        error?.message || "Template download failed.",
      );
    }
  };

  onUploadFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const district = this.getActiveDistrict();
    if (!district?.uuid) {
      this.showMessage(
        "microCatchment.alert.actionRequired",
        "microCatchment.upload.missingDistrict",
        "Please select a district before uploading micro catchments.",
      );
      return;
    }

    this.setState({ uploading: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("district_uuid", district.uuid);

      const response = await fetch(`${baseApiUrl}/location/micro-catchments/import/`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        const errors = Array.isArray(payload?.errors) ? payload.errors.join("\n") : "Upload failed.";
        throw new Error(errors);
      }

      this.showMessage(
        "microCatchment.alert.success",
        "microCatchment.upload.success",
        "Micro Catchments uploaded successfully.",
      );
      this.fetch(this.lastQueryParams || []);
    } catch (error) {
      this.showMessage(
        "microCatchment.alert.error",
        "microCatchment.upload.error",
        error?.message || "Micro Catchments upload failed.",
      );
    } finally {
      event.target.value = "";
      this.setState({ uploading: false });
    }
  };

  searcherActions = () => {
    const canImport = this.hasRight(RIGHT_MICRO_CATCHMENT_IMPORT);
    const canExport = this.hasRight(RIGHT_MICRO_CATCHMENT_EXPORT);
    return [
      {
        authorized: this.hasRight(RIGHT_MICRO_CATCHMENT_ADD),
        label: formatMessage(this.props.intl, "location", "microCatchments.searcherAddAction"),
        icon: <AddIcon />,
        onClick: this.props.onAdd,
      },
      {
        authorized: canExport,
        label: formatMessage(this.props.intl, "location", "microCatchment.download.button"),
        icon: null,
        onClick: this.onDownload,
      },
      {
        authorized: canImport,
        label: formatMessage(this.props.intl, "location", "microCatchment.downloadTemplate.button"),
        icon: null,
        onClick: this.onDownloadTemplate,
      },
      {
        authorized: canImport,
        label: formatMessage(this.props.intl, "location", "microCatchment.upload.button"),
        icon: null,
        onClick: this.onUploadClick,
      },
    ];
  };

  renderFilterPane = (props) => <MicroCatchmentFilter {...props} onDistrictChange={this.onDistrictFilterChange} />;

  render() {
    const {
      intl,
      fetchingMicroCatchments,
      fetchedMicroCatchments,
      errorMicroCatchments,
      microCatchments,
      microCatchmentsPageInfo,
      microCatchmentsTotalCount,
      classes,
    } = this.props;

    return (
      <div className={classes.searchResults}>
        <Searcher
          module="location"
          FilterPane={this.renderFilterPane}
          fetch={this.fetch}
          reset={this.state.reset}
          items={microCatchments}
          itemsPageInfo={microCatchmentsPageInfo}
          fetchingItems={fetchingMicroCatchments}
          fetchedItems={fetchedMicroCatchments}
          errorItems={errorMicroCatchments}
          tableTitle={formatMessageWithValues(intl, "location", "microCatchments.searcher.title", {
            count: microCatchmentsTotalCount || 0,
          })}
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          filtersToQueryParams={this.filtersToQueryParams}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          rowIdentifier={this.rowIdentifier}
          onDoubleClick={this.onDoubleClick}
          sorts={this.sorts}
          rowDisabled={this.rowDisabled}
          rowLocked={this.rowLocked}
          onFiltersApplied={this.onFiltersApplied}
          enableActionButtons={true}
          searcherActionsPosition="header-right"
          searcherActions={this.searcherActions()}
        />
        <input
          ref={this.fileInputRef}
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={this.onUploadFileSelected}
          style={{ display: "none" }}
        />
        <Dialog
          open={!!this.state.alert}
          onClose={this.closeAlert}
          aria-labelledby="micro-catchment-alert-title"
          maxWidth="sm"
        >
          <DialogTitle id="micro-catchment-alert-title" className={classes.alertTitle}>
            {this.state.alert?.title}
          </DialogTitle>
          <DialogContent className={classes.alertContent}>
            <Typography style={{ whiteSpace: "pre-line" }}>{this.state.alert?.message}</Typography>
          </DialogContent>
          <DialogActions className={classes.alertActions}>
            <Button onClick={this.closeAlert} color="primary" variant="contained" autoFocus>
              {formatMessage(intl, "location", "microCatchment.alert.ok")}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights || [],
  userDistricts: state.loc.userL1s || [],
  submittingMutation: state.loc.submittingMutation,
  mutation: state.loc.mutation,
  confirmed: state.core.confirmed,
  fetchingMicroCatchments: state.loc.fetchingMicroCatchments,
  fetchedMicroCatchments: state.loc.fetchedMicroCatchments,
  errorMicroCatchments: state.loc.errorMicroCatchments,
  microCatchments: state.loc.microCatchments,
  microCatchmentsPageInfo: state.loc.microCatchmentsPageInfo,
  microCatchmentsTotalCount: state.loc.microCatchmentsTotalCount,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchMicroCatchments, deleteMicroCatchment, coreConfirm, journalize }, dispatch);

export default withModulesManager(
  withHistory(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(MicroCatchmentSearcher)))),
  ),
);
