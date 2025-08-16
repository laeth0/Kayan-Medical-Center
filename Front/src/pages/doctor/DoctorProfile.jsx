import { useEffect, useState, useMemo } from "react";
import {
    Box, Container, Paper, Typography, Grid, TextField, MenuItem,
    Stack, Button, Divider
} from "@mui/material";
import { toast } from "react-toastify";
import api from "../../lib/apiClient";
import { useNavigate } from "react-router-dom";
import { BLUE, GENDERS } from "../../constant";


export default function DoctorProfile() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        specialty: "",
        license_no: "",
        slot_minutes: 30,
    });

    const [loading, setLoading] = useState(true);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPassword2, setNewPassword2] = useState("");

    const canSaveProfile = useMemo(() => {
        return form.full_name.trim() && form.phone.trim() && form.gender;
    }, [form]);

    const canChangePassword = useMemo(() => {
        return (
            currentPassword.length >= 1 &&
            newPassword.length >= 8 &&
            newPassword === newPassword2
        );
    }, [currentPassword, newPassword, newPassword2]);

    function handleChange(key, val) {
        setForm((f) => ({ ...f, [key]: val }));
    }

    function toYYYYMMDD(d) {
        if (!d) return "";
        const dt = new Date(d);
        if (isNaN(dt)) return "";
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    async function loadProfile() {
        setLoading(true);
        try {
            const { data } = await api.get("/doctors/me/profile");
            setForm({
                full_name: data.full_name || "",
                email: data.email || "",
                phone: data.phone || "",
                date_of_birth: toYYYYMMDD(data.date_of_birth) || "",
                gender: data.gender || "",
                specialty: data.specialty || "",
                license_no: data.license_no || "",
                slot_minutes: Number(data.slot_minutes) || 30,
            });
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }

    async function saveProfile() {
        try {
            const payload = {
                full_name: form.full_name,
                phone: form.phone,
                date_of_birth: form.date_of_birth || null,
                gender: form.gender,
                specialty: form.specialty || "",
                license_no: form.license_no || "",
                slot_minutes: Number(form.slot_minutes) || 30,
            };
            await api.put("/doctors/me/profile", payload);
            toast.success("Profile saved");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to save profile");
        }
    }

    async function changePassword() {
        try {
            await api.put("/doctors/me/password", {
                current_password: currentPassword,
                new_password: newPassword,
            });
            toast.success("Password changed");
            setCurrentPassword(""); setNewPassword(""); setNewPassword2("");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to change password");
        }
    }

    useEffect(() => {
        loadProfile()
    }, []);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#fff", py: 4 }}>
            <Container maxWidth="md">
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h4" fontWeight={900}>Doctor Profile</Typography>
                    <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
                </Stack>

                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                        Profile information
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Full name" value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Email" value={form.email} disabled fullWidth
                                helperText="Email is not editable"
                            />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Date of birth" type="date" value={form.date_of_birth}
                                onChange={(e) => handleChange("date_of_birth", e.target.value)}
                                fullWidth InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Specialty" value={form.specialty} onChange={(e) => handleChange("specialty", e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="License number" value={form.license_no} onChange={(e) => handleChange("license_no", e.target.value)}
                                fullWidth
                            />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                type="number" label="Slot minutes"
                                value={form.slot_minutes}
                                onChange={(e) => handleChange("slot_minutes", e.target.value)}
                                inputProps={{ min: 5, step: 5 }}
                                helperText="Default appointment duration"
                                fullWidth
                            />
                        </Grid>

                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                select label="Gender" value={form.gender}
                                onChange={(e) => handleChange("gender", e.target.value)} fullWidth
                            >
                                {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>

                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                        <Button
                            onClick={saveProfile}
                            variant="contained"
                            disabled={!canSaveProfile || loading}
                            sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark } }}
                        >
                            Save changes
                        </Button>
                    </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                        Account security
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Current password" type="password"
                                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="New password (min 8 chars)" type="password"
                                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Confirm new password" type="password"
                                value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                    </Grid>

                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                        <Button
                            onClick={changePassword}
                            variant="outlined"
                            disabled={!canChangePassword || loading}
                        >
                            Change password
                        </Button>
                    </Stack>

                    <Divider sx={{ mt: 3 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                        Use a strong passphrase (≥ 8 chars). Longer is better.
                    </Typography>
                </Paper>
            </Container>
        </Box >
    );
}
