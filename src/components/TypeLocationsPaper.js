import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, List, ListItem, ListItemText, IconButton, ListItemSecondaryAction,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import SearchIcon from "@material-ui/icons/Search";
import MoveIcon from "@material-ui/icons/Shuffle";
import DeleteIcon from "@material-ui/icons/Delete";
import ReplayIcon from "@material-ui/icons/Replay";
import Tooltip from "@material-ui/core/Tooltip";
import { formatMessage, formatMessageWithValues, SearcherPane, ProgressOrError } from "@openimis/fe-core";
import EditLocationDialog from "./EditLocationDialog";
import MoveLocationDialog from "./MoveLocationDialog";
import DeleteLocationDialog from "../components/DeleteLocationDialog";
import {
  RIGHT_LOCATION_ADD,
  RIGHT_LOCATION_EDIT,
  RIGHT_LOCATION_DELETE,
  RIGHT_LOCATION_MOVE,
  RIGHT_REGION_LOCATION_ADD
} from "../constants";

const styles = (theme) => ({
  paper: theme.paper.body,
  paperHeader: theme.paper.header,
  paperHeaderTitle: theme.paper.title,
  paperHeaderMessage: theme.paper.message,
  paperHeaderAction: theme.paper.action,
  lockedRow: theme.table.lockedRow,
  locationText: {
    minWidth: 0,
    paddingRight: theme.spacing(10),
  },
  locationActions: {
    whiteSpace: "nowrap",
  },
});

class ActionDialogs extends Component {
  render() {
    const {
      intl,
      editOpen,
      moveOpen,
      delOpen,
      type,
      currentParents,
      stateLocation,
      locations,
      reassign = false,
      save,
      move,
      del,
      changeState,
      withCaptation = false,
    } = this.props;
    let args = {
      type: formatMessage(intl, "location", `locationType.${type}`),
      code: !!stateLocation ? stateLocation.code : null,
      name: !!stateLocation ? stateLocation.name : null,
    };
    let editTitle = formatMessageWithValues(
      intl,
      "location",
      !stateLocation ? "AddDialog.title" : "EditDialog.title",
      args,
    );
    if (!!currentParents) {
      let parent = currentParents[currentParents.length - 1];
      editTitle += formatMessageWithValues(intl, "location", "EditDialog.title.of", {
        code: !!parent ? parent.code : null,
        name: !!parent ? parent.name : null,
      });
    }
    let children = !!reassign ? formatMessage(intl, "location", `locationType.${type}.children`) : null;
    let directChildren = !!reassign ? formatMessage(intl, "location", `locationType.${type}.directChildren`) : null;
    let reassignLocations = !!reassign
      ? locations.filter((l) => !stateLocation || l.uuid !== stateLocation.uuid)
      : null;
    return (
      <Fragment>
        <EditLocationDialog
          title={editTitle}
          open={editOpen === type}
          location={stateLocation}
          onSave={save}
          onCancel={() => changeState({ editOpen: null })}
          withCaptation={withCaptation}
        />
        <MoveLocationDialog
          title={formatMessageWithValues(intl, "location", "MoveDialog.title", args)}
          open={moveOpen === type}
          location={stateLocation}
          locations={locations}
          currentParents={currentParents}
          onMove={move}
          changeState={changeState}
          onCancel={() => changeState({ moveOpen: null })}
          withCaptation={withCaptation}
        />
        <DeleteLocationDialog
          title={formatMessageWithValues(intl, "location", "DeleteDialog.title", args)}
          type={args.type}
          confirm={
            !!reassignLocations
              ? formatMessageWithValues(intl, "location", "DeleteDialog.confirm", {
                ...args,
                children,
              })
              : formatMessageWithValues(intl, "location", "DeleteDialog.confirmSimple", args)
          }
          drop={formatMessageWithValues(intl, "location", "DeleteDialog.drop", {
            ...args,
            children,
          })}
          reassign={formatMessageWithValues(intl, "location", "DeleteDialog.reassign", {
            ...args,
            directChildren,
          })}
          location={stateLocation}
          reassignLocations={reassignLocations}
          open={delOpen === type}
          onDelete={del}
          onCancel={() => changeState({ delOpen: null })}
        />
      </Fragment>
    );
  }
}

const StyledActionDialogs = injectIntl(ActionDialogs);

class ResultPane extends Component {
  render() {
    const {
      classes,
      rights,
      type,
      fetching,
      fetched,
      error,
      locations,
      location,
      onSelect,
      onEdit,
      onDelete,
      onMove,
      InlineInput,
      inlineValue,
      onChange,
      readOnly,
    } = this.props;
    return (
      <Fragment>
        <ProgressOrError progress={fetching} error={error} />
        {!!fetched && !!locations && !error && (
          <List component="nav">
            {locations.map((l, idx) => (
              <ListItem
                key={`location-${type}-${idx}`}
                button
                selected={location && location.id === l.id}
                onClick={(e) => !!l.uuid && !!onSelect && !readOnly && onSelect(l)}
                onDoubleClick={(e) => !!l.uuid && !readOnly && rights.includes(RIGHT_LOCATION_EDIT) && onEdit(l)}
                className={!l.uuid || !!l.clientMutationId ? classes.lockedRow : null}
              >
                <Tooltip title={l.code ? `${l.code} - ${l.name}` : l.name || ""}>
                  <ListItemText
                    className={classes.locationText}
                    primary={l.name}
                    primaryTypographyProps={{ noWrap: true }}
                    tabIndex={0}
                  />
                </Tooltip>
                {!!l.uuid && (
                  <ListItemSecondaryAction className={classes.locationActions}>
                    {!!onMove && rights.includes(RIGHT_LOCATION_MOVE) && (
                      <Tooltip title="Move">
                        <IconButton onClick={(e) => onMove(l)}>
                          <MoveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!!onDelete && rights.includes(RIGHT_LOCATION_DELETE) && (
                      <Tooltip title="Delete">
                        <IconButton edge="end" onClick={(e) => onDelete(l, idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!!InlineInput && (
                      <InlineInput location={l} onChange={onChange} inlineValue={inlineValue} readOnly={readOnly} />
                    )}
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Fragment>
    );
  }
}

const StyledResultPane = withTheme(withStyles(styles)(ResultPane));

class TypeLocationsPaper extends Component {
  state = {
    search: "",
    searchDialogOpen: false,
  };

  applySearch = () => {
    const { onRefresh, onSearch } = this.props;
    if (onSearch) {
      onSearch(this.state.search);
    } else {
      onRefresh();
    }
    this.setState({ searchDialogOpen: false });
  };

  openSearchDialog = () => this.setState({ searchDialogOpen: true });

  closeSearchDialog = () => this.setState({ searchDialogOpen: false });

  render() {
    const {
      classes,
      rights,
      title,
      onRefresh,
      onEdit,
      readOnly,
      location,
      onSearch,
      ...others
    } = this.props;
    const createRegionLocationRight = this.props?.rights.includes(RIGHT_REGION_LOCATION_ADD);
    let actions = [];
    const isNotRegionOrDistrict = ![0, 1].includes(this.props.type);
    if (
      !readOnly &&
      Boolean(onEdit) &&
      (
        createRegionLocationRight ||
        rights.includes(RIGHT_LOCATION_ADD) &&
        isNotRegionOrDistrict
      )
    ) {
      actions.push({
        action: (e) => onEdit(null),
        icon: <AddIcon />,
      });
    }
    actions.push({
      action: this.openSearchDialog,
      icon: <SearchIcon />,
      label: formatMessage(this.props.intl, "location", "locations.searcher.searchButton"),
      variant: "outlined",
      borderless: false,
    });
    return (
      <Paper className={classes.paper}>
        {!readOnly && <StyledActionDialogs {...others} />}
        <SearcherPane
          module="location"
          title={title || `locations.searcher.title.${this.props.type}`}
          SearchIcon={ReplayIcon}
          refresh={onRefresh}
          actions={actions}
          readOnly={readOnly}
          resultsPane={<StyledResultPane onEdit={onEdit} rights={rights} readOnly={readOnly} {...others} />}
        />
        <Dialog open={this.state.searchDialogOpen} onClose={this.closeSearchDialog} fullWidth maxWidth="xs">
          <DialogTitle>{formatMessage(this.props.intl, "location", "locations.searcher.dialogTitle")}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label={formatMessage(this.props.intl, "location", "locations.searcher.search")}
              value={this.state.search}
              onChange={(event) => this.setState({ search: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  this.applySearch();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.closeSearchDialog}>
              {formatMessage(this.props.intl, "location", "locations.searcher.cancel")}
            </Button>
            <Button color="primary" variant="contained" onClick={this.applySearch}>
              {formatMessage(this.props.intl, "location", "locations.searcher.searchButton")}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export default injectIntl(withTheme(connect(mapStateToProps)(withStyles(styles)(TypeLocationsPaper))));
