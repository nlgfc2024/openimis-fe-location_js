import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { IconButton, Tooltip } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import {
  Searcher,
  formatMessage,
  formatMessageWithValues,
  formatDateFromISO,
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
    "& .MuiButton-containedPrimary": {
      backgroundColor: "transparent",
      boxShadow: "none",
      color: theme.palette.primary.main,
      minWidth: "auto",
      padding: theme.spacing(0.75, 1.25),
    },
    "& .MuiButton-containedPrimary:hover": {
      backgroundColor: theme.palette.action.hover,
      boxShadow: "none",
    },
    "& .MuiButton-containedPrimary .MuiTypography-body2": {
      fontSize: 14,
    },
  },
});

class MicroCatchmentSearcher extends Component {
  state = { reset: 0, confirmedAction: null, uploading: false, district: null };

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

    if (prevProps.userDistricts !== this.props.userDistricts && !this.state.district) {
      const firstDistrict = this.props.userDistricts?.[0] || null;
      if (firstDistrict) {
        this.setState({ district: firstDistrict });
      }
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
      "microCatchment.dateFrom",
      "microCatchment.dateTo",
    ];
    if (this.hasRight(RIGHT_MICRO_CATCHMENT_EDIT) || this.hasRight(RIGHT_MICRO_CATCHMENT_DELETE)) {
      result.push(null);
    }
    return result;
  };

  itemFormatters = () => {
    const { intl, modulesManager, history } = this.props;
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
      (mc) => formatDateFromISO(modulesManager, intl, mc.dateFrom),
      (mc) => formatDateFromISO(modulesManager, intl, mc.dateTo),
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
    let result = [
      ["code", true],
      ["name", true],
      ["district", true],
      null,
      null,
      ["dateFrom", true],
      ["dateTo", true],
    ];
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

  showMessage = (key, detail) => {
    const message = formatMessage(this.props.intl, "location", key) || detail;
    // Append the detail (e.g. the backend's per-row import errors) when it adds
    // information beyond the generic translated message.
    window.alert(detail && detail !== message ? `${message}\n\n${detail}` : message);
  };

  getActiveDistrict = () => {
    if (this.state.district?.uuid) {
      return this.state.district;
    }

    const resultDistricts = (this.props.microCatchments || [])
      .map((mc) => mc.district)
      .filter((district) => !!district?.uuid);
    const uniqueResultDistricts = resultDistricts.filter(
      (district, index, districts) => districts.findIndex((item) => item.uuid === district.uuid) === index,
    );
    if (uniqueResultDistricts.length === 1) {
      return uniqueResultDistricts[0];
    }

    if ((this.props.userDistricts || []).length === 1) {
      return this.props.userDistricts[0];
    }

    return null;
  };

  onDownload = async () => {
    const district = this.getActiveDistrict();
    if (!district?.uuid) {
      this.showMessage("microCatchment.uploadDownload.missingDistrict", "Please select a district first.");
      return;
    }

    try {
      const url = new URL(`${window.location.origin}${baseApiUrl}/location/micro-catchments/export/`);
      const queryParams = new URLSearchParams({ district_uuid: district.uuid });
      url.search = queryParams.toString();

      const response = await fetch(url.toString(), { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error(formatMessage(this.props.intl, "location", "microCatchment.download.error") || "Download failed.");
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
      this.showMessage("microCatchment.download.error", error?.message || "Download failed.");
    }
  };

  onUploadClick = () => {
    if (!this.getActiveDistrict()?.uuid) {
      this.showMessage("microCatchment.uploadDownload.missingDistrict", "Please select a district first.");
      return;
    }
    this.fileInputRef.current?.click();
  };

  onDownloadTemplate = async () => {
    const district = this.getActiveDistrict();
    if (!district?.uuid) {
      this.showMessage("microCatchment.uploadDownload.missingDistrict", "Please select a district first.");
      return;
    }

    try {
      const url = new URL(`${window.location.origin}${baseApiUrl}/location/micro-catchments/template/`);
      url.search = new URLSearchParams({ district_uuid: district.uuid }).toString();
      const response = await fetch(url.toString(), { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error(formatMessage(this.props.intl, "location", "microCatchment.downloadTemplate.error") || "Template download failed.");
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
      this.showMessage("microCatchment.downloadTemplate.error", error?.message || "Template download failed.");
    }
  };

  onUploadFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const district = this.getActiveDistrict();
    if (!district?.uuid) {
      this.showMessage("microCatchment.uploadDownload.missingDistrict", "Please select a district first.");
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

      this.showMessage("microCatchment.upload.success", "Micro Catchments uploaded successfully.");
      this.fetch(this.lastQueryParams || []);
    } catch (error) {
      this.showMessage("microCatchment.upload.error", error?.message || "Micro Catchments upload failed.");
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
