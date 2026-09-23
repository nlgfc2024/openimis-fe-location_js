import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useIntl } from "react-intl";
import { Button, CircularProgress, Divider, Grid, IconButton, Paper, TextField, Typography } from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import { coreAlert, formatMessage, formatMessageWithValues } from "@openimis/fe-core";
import { makeStyles } from "@material-ui/core/styles";
import MwDistrictPicker from "../pickers/MwDistrictPicker";
import MwTAPicker from "../pickers/MwTAPicker";
import { clusterResponse, fetchCluster, saveCluster } from "../clusterActions";

const useStyles = makeStyles((theme) => ({
  paper: theme.paper.paper, header: theme.paper.header, title: theme.paper.title,
  item: theme.paper.item, divider: theme.paper.divider,
}));

export default function ClusterForm({ uuid, back, readOnly }) {
  const classes = useStyles();
  const intl = useIntl();
  const dispatch = useDispatch();
  const t = (key) => formatMessage(intl, "location", `cluster.${key}`);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [authority, setAuthority] = useState(null);
  const [district, setDistrict] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!uuid);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!uuid) return undefined;
    let active = true;
    setLoading(true); setLoadError("");
    dispatch(fetchCluster(uuid)).then((response) => {
      const cluster = clusterResponse(response, "clusters").edges[0]?.node;
      if (!cluster) throw new Error(t("notFound"));
      if (active) {
        setCode(cluster.code); setName(cluster.name);
        setAuthority(cluster.traditionalAuthority); setDistrict(cluster.traditionalAuthority?.parent || null);
      }
    }).catch((error) => {
      if (active) { setLoadError(error.message); dispatch(coreAlert(t("alert.error"), error.message)); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dispatch, intl, uuid, retry]);

  const canSave = !readOnly && !loading && !loadError && !saving && name.trim() && district && authority;
  const save = async (event) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const result = clusterResponse(await dispatch(saveCluster({
        uuid: uuid || null, ...(uuid ? { code: code.trim() } : {}), name: name.trim(),
        districtUuid: district.uuid, traditionalAuthorityUuid: authority.uuid,
      })), "saveCluster");
      if (!result.cluster) throw new Error(t("saveError"));
      dispatch(coreAlert(t("alert.success"), formatMessageWithValues(
        intl, "location", uuid ? "cluster.update.success" : "cluster.create.success", { code: result.cluster.code },
      )));
      back();
    } catch (error) {
      dispatch(coreAlert(t("alert.error"), error.message)); setSaving(false);
    }
  };

  return (
    <Paper className={classes.paper}>
      <Grid container alignItems="center" className={classes.header}>
        <Grid item><IconButton aria-label={t("back")} onClick={back} disabled={saving}><ChevronLeftIcon /></IconButton></Grid>
        <Grid item><Typography className={classes.title}>{t(uuid ? "edit" : "add")}</Typography></Grid>
      </Grid>
      <Divider className={classes.divider} />
      {loading ? <CircularProgress aria-label={t("loading")} /> : loadError ? (
        <div className={classes.item}><Typography color="error" role="alert">{loadError}</Typography>
          <Button onClick={() => setRetry((value) => value + 1)}>{t("retry")}</Button></div>
      ) : (
        <form onSubmit={save}><Grid container spacing={2} className={classes.item}>
          <Grid item xs={12} sm={6}><MwDistrictPicker value={district} label={t("district")} required
            readOnly={saving || readOnly} onChange={(value) => { setDistrict(value); setAuthority(null); }} /></Grid>
          <Grid item xs={12} sm={6}><MwTAPicker key={district?.uuid || "no-district"} value={authority}
            parentLocation={district} label={t("authority")} required readOnly={saving || readOnly || !district}
            onChange={setAuthority} filterOptions={(options) => options.filter((option) => option.parent?.uuid === district?.uuid)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t("code")} value={code}
            disabled inputProps={{ maxLength: 50 }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth required label={t("name")} value={name}
            disabled={saving || readOnly} inputProps={{ maxLength: 255 }} onChange={(event) => setName(event.target.value)} /></Grid>
          <Grid item xs={12}><Button onClick={back} disabled={saving}>{t("cancel")}</Button>
            {!readOnly && <Button type="submit" color="primary" variant="contained" disabled={!canSave}>{t(saving ? "saving" : "save")}</Button>}</Grid>
        </Grid></form>
      )}
    </Paper>
  );
}