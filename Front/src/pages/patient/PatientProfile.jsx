import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
  Grid, Alert, Stack, TextField, Typography, MenuItem, Tooltip
} from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LocalPhoneOutlined from "@mui/icons-material/LocalPhoneOutlined";
import CakeOutlined from "@mui/icons-material/CakeOutlined";
import WcOutlined from "@mui/icons-material/WcOutlined";
import api from "../../lib/apiClient";
import { toast } from "react-toastify";
import { GENDERS } from "../../constant";


function InfoRow({ icon, label, value, after }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: "primary.main" }}>{icon}</Box>
      <Typography variant="body2" sx={{ minWidth: 120, color: "text.secondary" }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>{value}</Typography>
      {after}
    </Stack>
  );
}

export default function PatientProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(false);
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
  });
  const [errors, setErrors] = useState({});

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function load() {
    setLoading(true);
    setServerError("");
    try {
      const { data } = await api.get("/patient/profile");
      setForm({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth ? String(data.date_of_birth).slice(0, 10) : "",
        gender: data.gender || "",
      });
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to load profile";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const validate = useMemo(() => (f) => {
    const e = {};
    if (!f.full_name?.trim()) e.full_name = "Full name is required";
    if (!f.email?.trim()) e.email = "Email is required";
    if (!f.phone?.trim()) e.phone = "Phone is required";
    if (!f.date_of_birth) e.date_of_birth = "Date of birth is required";
    if (!GENDERS.includes(f.gender)) e.gender = "Select gender";
    return e;
  }, []);

  function applyServerDetails(details = []) {
    const map = {};
    for (const d of details) {
      if (d?.path) map[d.path] = d.message;
    }
    setErrors(map);
  }

  async function onSave() {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setServerError("");
    try {
      await api.put("/patient/profile", {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
      });
      toast.success("Profile updated");
      setEdit(false);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || "Update failed";
      toast.error(msg);
      setServerError(msg);
      const details = err?.response?.data?.details;
      if (Array.isArray(details)) applyServerDetails(details);
    } finally {
      setSaving(false);
    }
  }

  const dobNice = form.date_of_birth
    ? new Date(form.date_of_birth).toLocaleDateString()
    : "—";

  return (
    <Box>
      <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box
          sx={{
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
            px: { xs: 2, md: 3 },
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={900}>{form.full_name || "Patient"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your personal information
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              {!edit ? (
                <Tooltip title="Edit profile">
                  <Button
                    variant="contained"
                    startIcon={<EditOutlined />}
                    onClick={() => { setEdit(true); setErrors({}); }}
                  >
                    Update
                  </Button>
                </Tooltip>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<CloseOutlined />}
                    onClick={() => { setEdit(false); setErrors({}); load(); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveOutlined />}
                    onClick={onSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {!edit ? (
                  <Stack spacing={1.25}>
                    <InfoRow
                      icon={<EmailOutlined fontSize="small" />}
                      label="Email"
                      value={form.email || "—"}
                    />
                    <InfoRow
                      icon={<LocalPhoneOutlined fontSize="small" />}
                      label="Phone"
                      value={form.phone || "—"}
                    />
                    <InfoRow
                      icon={<CakeOutlined fontSize="small" />}
                      label="Date of birth"
                      value={dobNice}
                    />
                    <InfoRow
                      icon={<WcOutlined fontSize="small" />}
                      label="Gender"
                      value=""
                      after={
                        form.gender
                          ? <Chip
                            label={form.gender}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                          : <Typography variant="body1" sx={{ fontWeight: 600 }}>—</Typography>
                      }
                    />
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <TextField
                      label="Full name"
                      fullWidth
                      value={form.full_name}
                      onChange={e => onChange("full_name", e.target.value)}
                      error={!!errors.full_name}
                      helperText={errors.full_name}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      value={form.email}
                      onChange={e => onChange("email", e.target.value)}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                    <TextField
                      label="Phone"
                      fullWidth
                      value={form.phone}
                      onChange={e => onChange("phone", e.target.value)}
                      error={!!errors.phone}
                      helperText={errors.phone}
                    />
                  </Stack>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                {!edit ? (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Account insights
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label="Patient" size="small" color="info" variant="outlined" />
                      {form.gender && <Chip label={form.gender} size="small" variant="soft" />}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary">
                      Keep your profile up to date to help doctors contact you and personalize your care.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    <TextField
                      label="Date of birth"
                      type="date"
                      fullWidth
                      value={form.date_of_birth}
                      onChange={e => onChange("date_of_birth", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date_of_birth}
                      helperText={errors.date_of_birth}
                    />
                    <TextField
                      select
                      label="Gender"
                      fullWidth
                      value={form.gender}
                      onChange={e => onChange("gender", e.target.value)}
                      error={!!errors.gender}
                      helperText={errors.gender}
                    >
                      {GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </TextField>
                  </Stack>
                )}
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
