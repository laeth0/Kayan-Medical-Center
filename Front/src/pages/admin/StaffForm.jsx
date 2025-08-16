import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Box, Paper, Grid, TextField, MenuItem, Stack, Button, Typography } from "@mui/material";
import { toast } from "react-toastify";
import api from "../../lib/apiClient";
import { GENDERS, ROLES } from "../../constant";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form, role, { isEdit = false } = {}) {
    const errors = {};
    if (!form.full_name?.trim() || form.full_name.trim().length < 2)
        errors.full_name = "Full name must be at least 2 characters";

    if (!emailRe.test(form.email || ""))
        errors.email = "Enter a valid email address";

    if (!isEdit) {
        if (!form.password || form.password.length < 1)
            errors.password = "Password must be at least 1 characters";
    }

    if (!form.phone?.trim())
        errors.phone = "Phone is required";

    if (!form.date_of_birth)
        errors.date_of_birth = "Date of birth is required";
    else if (Number.isNaN(Date.parse(form.date_of_birth)))
        errors.date_of_birth = "Invalid date";

    if (!GENDERS.includes(form.gender))
        errors.gender = "Select a gender";

    if (role === ROLES.DOCTOR) {
        const sm = Number(form.slot_minutes);
        if (Number.isNaN(sm) || sm < 5) errors.slot_minutes = "Slot minutes must be 5 or more";
    }
    return errors;
}

function extractFieldErrors(err) {
    const res = err?.response?.data;
    const fieldErrs = {};
    if (Array.isArray(res?.details)) {
        res.details.forEach(d => {
            const key = Array.isArray(d.path) ? d.path[0] : d.path;
            if (key && !fieldErrs[key]) fieldErrs[key] = d.message;
        });
    }
    return fieldErrs;
}

export default function StaffForm() {
    const { role: roleFromParams } = useParams();
    const navigate = useNavigate();
    const { search } = useLocation();
    const editId = new URLSearchParams(search).get("edit");

    const [role, setRole] = useState(roleFromParams || ROLES.DOCTOR);
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        specialty: "",
        license_no: "",
        slot_minutes: 30,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const isDoctor = role === ROLES.DOCTOR;
    const title = editId ? `Edit ${role}` : `Add ${role}`;

    function onChange(k, v) {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
    }

    useEffect(() => {
        if (!isDoctor) {
            setForm(f => ({ ...f, specialty: "", license_no: "", slot_minutes: 30 }));
            setErrors(e => {
                const { specialty, license_no, slot_minutes, ...rest } = e;
                return rest;
            });
        }
    }, [isDoctor]);

    useEffect(() => {
        (async () => {
            if (!editId) return;
            try {
                const { data } = await api.get(`/admin/getUser/${editId}`);
                setRole(data.role || ROLES.FINANCE);
                setForm({
                    full_name: data.full_name || "",
                    email: data.email || "",
                    password: "",
                    phone: data.phone || "",
                    date_of_birth: data.date_of_birth?.slice(0, 10) || "",
                    gender: data.gender || "",
                    specialty: data.specialty || "",
                    license_no: data.license_no || "",
                    slot_minutes: data.slot_minutes ?? 30,
                });
            } catch (e) {
                toast.error(e?.response?.data?.message || "Failed to load user");
            }
        })();
    }, [editId]);

    async function onSubmit() {
        setSubmitting(true);
        try {
            const clientErrs = validate(form, role, { isEdit: !!editId });
            if (Object.keys(clientErrs).length) {
                setErrors(clientErrs);
                setSubmitting(false);
                return;
            }

            const payload = { ...form, role };
            if (!isDoctor) {
                delete payload.specialty;
                delete payload.license_no;
                delete payload.slot_minutes;
            }

            if (editId) {
                await api.put(`/admin/updateUser/${editId}`, payload);
                toast.success("Updated successfully");
            } else {
                const x = await api.post(`/admin/createUser`, payload);
                console.log("Created user:", x.data);

                toast.success("Created successfully");
            }

            navigate(`/admin/${role === "doctor" ? "doctors" : "finance"}`);
        } catch (e) {
            const fieldErrs = extractFieldErrors(e);
            if (Object.keys(fieldErrs).length) setErrors(fieldErrs);
            toast.error(e?.response?.data?.message || "Save failed");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Box>
            <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>{title}</Typography>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                            select fullWidth label="Role" value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            {[ROLES.DOCTOR, ROLES.FINANCE].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid item size={8} sx={{ display: { xs: "none", md: "block" } }} />

                    <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Full name"
                            value={form.full_name}
                            onChange={e => onChange("full_name", e.target.value)}
                            fullWidth
                            error={!!errors.full_name}
                            helperText={errors.full_name}
                        />
                    </Grid>

                    <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Email"
                            value={form.email}
                            onChange={e => onChange("email", e.target.value)}
                            fullWidth
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                    </Grid>

                    {!editId && (
                        <Grid item size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Password"
                                type="password"
                                value={form.password}
                                onChange={e => onChange("password", e.target.value)}
                                fullWidth
                                error={!!errors.password}
                                helperText={errors.password}
                            />
                        </Grid>
                    )}

                    <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Phone"
                            value={form.phone}
                            onChange={e => onChange("phone", e.target.value)}
                            fullWidth
                            error={!!errors.phone}
                            helperText={errors.phone}
                        />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                            type="date"
                            label="Date of birth"
                            value={form.date_of_birth}
                            onChange={e => onChange("date_of_birth", e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.date_of_birth}
                            helperText={errors.date_of_birth}
                        />
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                        <TextField
                            select
                            label="Gender"
                            value={form.gender}
                            onChange={e => onChange("gender", e.target.value)}
                            fullWidth
                            error={!!errors.gender}
                            helperText={errors.gender}
                        >
                            {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                        </TextField>
                    </Grid>

                    {isDoctor && (
                        <>
                            <Grid item size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Specialty"
                                    value={form.specialty}
                                    onChange={e => onChange("specialty", e.target.value)}
                                    fullWidth
                                    error={!!errors.specialty}
                                    helperText={errors.specialty}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="License No."
                                    value={form.license_no}
                                    onChange={e => onChange("license_no", e.target.value)}
                                    fullWidth error={!!errors.license_no}
                                    helperText={errors.license_no}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 4 }}>
                                <TextField
                                    type="number"
                                    label="Slot minutes"
                                    value={form.slot_minutes}
                                    onChange={e => onChange("slot_minutes", e.target.value)}
                                    inputProps={{ min: 5, step: 5 }}
                                    fullWidth
                                    error={!!errors.slot_minutes}
                                    helperText={errors.slot_minutes}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                    <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button variant="contained" onClick={onSubmit}>Save</Button>
                </Stack>
            </Paper>
        </Box >
    );
}
