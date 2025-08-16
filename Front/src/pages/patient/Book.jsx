import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Grid, TextField, MenuItem,
  Button, Chip, InputAdornment, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import { LocalHospital, Event, Notes } from "@mui/icons-material";
import api from "../../lib/apiClient";
import { toast } from "react-toastify";
import { VISIT_TYPES, BLUE } from "../../constant";

export default function PatientBook() {
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const [form, setForm] = useState({
    doctorId: "",
    date: "",
    time: "",
    visitType: VISIT_TYPES.IN_CLINIC,
    reason: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  const update = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const validate = () => {
    const e = {};
    if (!form.doctorId) e.doctorId = "Select a doctor";
    if (!form.date) e.date = "Pick a date";
    if (!form.time) e.time = "Pick a time";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoadingDoctors(true);
        const { data } = await api.get("/doctors");
        setDoctors(data || []);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load doctors");
      } finally {
        setLoadingDoctors(false);
      }
    })();

  }, []);

  const fetchSlots = async (doctorId = form.doctorId, date = form.date) => {
    if (!doctorId || !date) {
      setSlots([]); return;
    }

    try {
      setLoadingSlots(true);
      const { data } = await api.get("/doctors/slots", {
        params: { doctor_id: doctorId, date }
      });
      setSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load time slots");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [form.doctorId, form.date]);

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setBooking(true);
      setSlots((prev) => prev.filter((s) => s !== form.time));

      await api.post("/appointments", {
        doctor_id: form.doctorId,
        date: form.date,
        time: form.time,
        visitType: form.visitType,
        reason: form.reason || undefined,
        notes: form.notes || undefined
      });

      toast.success("Appointment booked");

      setForm((f) => ({ ...f, time: "" }));
      await fetchSlots();
    } catch (e) {
      await fetchSlots();
      toast.error(e?.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff", display: "grid", placeItems: "center", px: 2, py: 4 }}>
      <Card elevation={6} sx={{ width: "100%", maxWidth: 1000, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: BLUE.main }} />
            <Box>
              <Typography variant="h5" fontWeight={800}>Book a Visit</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a doctor, date, and time. One active visit per doctor at a time.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3} component="form" onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  select fullWidth label="Doctor" value={form.doctorId} onChange={update("doctorId")}
                  error={!!errors.doctorId} helperText={errors.doctorId || "Select your preferred doctor"}
                  InputProps={{ startAdornment: (<InputAdornment position="start"><LocalHospital /></InputAdornment>) }}
                >
                  {loadingDoctors ? (
                    <MenuItem disabled>Loading…</MenuItem>
                  ) : (
                    doctors.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip label={d.specialty} size="small"
                            sx={{ bgcolor: `${BLUE.main}16`, color: BLUE.main, fontWeight: 600 }} />
                          <Typography>{d.name}</Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth label="Date" type="date" value={form.date} onChange={update("date")}
                  error={!!errors.date} helperText={errors.date} InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Event /></InputAdornment>) }}
                />
              </Grid>

              <Grid item size={12}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {loadingSlots && <Chip label="Loading..." size="small" />}
                  {!loadingSlots && slots.map((slot) => {
                    const selected = form.time === slot;
                    return (
                      <Button
                        key={slot}
                        onClick={() => update("time")({ target: { value: slot } })}
                        variant={selected ? "contained" : "outlined"}
                        size="small"
                        sx={{
                          textTransform: "none",
                          borderColor: BLUE.main,
                          color: selected ? "#fff" : BLUE.main,
                          bgcolor: selected ? BLUE.main : "transparent",
                          "&:hover": { borderColor: BLUE.dark, bgcolor: selected ? BLUE.dark : "transparent" },
                        }}
                      >
                        {slot}
                      </Button>
                    );
                  })}
                  {!loadingSlots && !slots.length && form.doctorId && form.date && (
                    <Chip label="No available times" size="small" />
                  )}
                </Box>
              </Grid>

              <Grid item size={12}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Visit Type</Typography>
                <RadioGroup row value={form.visitType} onChange={update("visitType")} aria-label="visit type">
                  {[
                    { v: VISIT_TYPES.IN_CLINIC, label: "In Clinic" },
                    { v: VISIT_TYPES.FOLLOW_UP, label: "Follow up" },
                    { v: VISIT_TYPES.CONSULTATION, label: "Consultation" }
                  ].map((opt) => (
                    <FormControlLabel key={opt.v} value={opt.v}
                      control={<Radio sx={{ color: BLUE.main, "&.Mui-checked": { color: BLUE.main } }} />}
                      label={opt.label}
                    />
                  ))}
                </RadioGroup>
              </Grid>

              <Grid item size={12}>
                <TextField
                  fullWidth label="Reason / Symptoms" placeholder="e.g., chest pain, skin rash, fever…"
                  value={form.reason} onChange={update("reason")} multiline minRows={2}
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Notes /></InputAdornment>) }}
                />
              </Grid>

              <Grid item size={12}>
                <TextField fullWidth label="Notes (optional)" value={form.notes} onChange={update("notes")} multiline minRows={3} />
              </Grid>
            </Grid>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={booking}
              sx={{ textTransform: "none", fontWeight: 800, bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark }, borderRadius: 2, py: 1.2 }}
            >
              {booking ? "Booking..." : "Confirm & Reserve"}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1.5 }}>
              You can modify or cancel before your visit starts.
            </Typography>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
