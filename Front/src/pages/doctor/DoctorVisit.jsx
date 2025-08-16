import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Container, Paper, Typography, Grid, Stack,
    TextField, Button, Chip, IconButton, Table, TableHead,
    TableRow, TableCell, TableBody, Tooltip, Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast } from "react-toastify";
import api from "../../lib/apiClient";
import { BLUE } from "../../constant";


function yearsFrom(dob) {
    if (!dob) return "—";
    const birth = new Date(dob);
    const now = new Date();
    let y = now.getFullYear() - birth.getFullYear();
    const mDiff = now.getMonth() - birth.getMonth();
    const dDiff = now.getDate() - birth.getDate();
    if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) y--;
    return `${y}y`;
}

export default function DoctorVisit() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    const [appt, setAppt] = useState(null);
    const [loading, setLoading] = useState(true);

    const [visitStarted, setVisitStarted] = useState(false);

    const [elapsedSec, setElapsedSec] = useState(0);
    const [paused, setPaused] = useState(false);
    const timerRef = useRef(null);

    const [txName, setTxName] = useState("");
    const [txDesc, setTxDesc] = useState("");
    const [txQty, setTxQty] = useState(1);
    const [txPrice, setTxPrice] = useState("");
    const [treatments, setTreatments] = useState([]);

    const [notes, setNotes] = useState("");

    const total = useMemo(
        () => treatments.reduce((s, t) => s + (Number(t.quantity) * Number(t.unit_price) || 0), 0),
        [treatments]
    );

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/doctors/appointments/${appointmentId}`);
                setAppt(data);
                if (String(data?.status).toLowerCase() === "in_progress") {
                    setVisitStarted(true);
                    startTimer();
                }
            } catch (e) {
                toast.error(e?.response?.data?.message || "Failed to load appointment");
            } finally {
                setLoading(false);
            }
        })();
    }, [appointmentId]);

    function startTimer() {
        if (timerRef.current) return;
        setPaused(false);
        timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
    }
    function pauseTimer() {
        if (!timerRef.current) return;
        clearInterval(timerRef.current);
        timerRef.current = null;
        setPaused(true);
    }
    function resumeTimer() {
        if (timerRef.current) return;
        setPaused(false);
        timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
    }
    function stopTimer() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }
    useEffect(() => () => stopTimer(), []);

    async function handleStartVisit() {
        try {
            const { data } = await api.post("/visit/start", { appointmentId });
            setVisitStarted(true);
            startTimer();
            toast.success("Visit started");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to start visit");
        }
    }

    function addTreatment() {
        const qty = Number(txQty);
        const price = Number(txPrice);
        if (!txName.trim()) return toast.error("Treatment name is required");
        if (!Number.isFinite(qty) || qty < 1) return toast.error("Quantity must be ≥ 1");
        if (!Number.isFinite(price) || price < 0) return toast.error("Unit price must be ≥ 0");

        setTreatments(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: txName.trim(),
                description: txDesc.trim(),
                quantity: qty,
                unit_price: Number(price.toFixed(2)),
            },
        ]);
        setTxName(""); setTxDesc(""); setTxQty(1); setTxPrice("");
    }
    function removeTreatment(id) {
        setTreatments(prev => prev.filter(t => t.id !== id));
    }

    async function handleFinish() {
        try {
            stopTimer();
            const payload = {
                notes,
                durationSeconds: elapsedSec,
                treatments: treatments.map(t => ({
                    name: t.name,
                    description: t.description,
                    quantity: t.quantity,
                    cost: t.unit_price,
                }))
            };
            await api.post(`/visit/${appointmentId}/complete`, payload);
            toast.success("Visit completed");
            navigate("/doctor/appointments", { replace: true });
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to complete visit");
        }
    }

    const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
    const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0");
    const ss = String(elapsedSec % 60).padStart(2, "0");
    const canStart = appt && ["booked", "confirmed", "scheduled", "in_progress"].includes(String(appt.status).toLowerCase());

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f7fbff", py: 4 }}>
            <Container maxWidth="lg">
                <Paper
                    elevation={0}
                    sx={{
                        p: 3, mb: 3, borderRadius: 3,
                        background:
                            "linear-gradient(135deg, rgba(25,118,210,0.08), rgba(17,82,147,0.08))",
                        border: "1px solid #e7e7e7"
                    }}
                >
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box>
                                <Typography variant="h5" fontWeight={900}>
                                    {loading ? "Loading…" : (appt?.patient?.full_name || "Unknown")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {appt?.patient?.gender || "—"} • {yearsFrom(appt?.patient?.date_of_birth)} • {appt?.patient?.phone || "—"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Appt: {new Date(appt?.start_time || Date.now()).toLocaleString()}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack alignItems={{ xs: "flex-start", md: "flex-end" }}>
                            <Typography variant="overline" sx={{ letterSpacing: 1, color: "text.secondary" }}>Timer</Typography>
                            <Typography variant="h4" fontWeight={900}>
                                {hh}:{mm}:{ss}
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                                {!visitStarted && (
                                    <Button
                                        disabled={!canStart}
                                        variant="contained"
                                        onClick={handleStartVisit}
                                        sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark } }}
                                        startIcon={<PlayCircleOutlineIcon />}
                                    >
                                        Start Visit
                                    </Button>
                                )}
                                {visitStarted && !paused && (
                                    <Button variant="outlined" onClick={pauseTimer} startIcon={<PauseCircleOutlineIcon />}>
                                        Pause
                                    </Button>
                                )}
                                {visitStarted && paused && (
                                    <Button variant="outlined" onClick={resumeTimer} startIcon={<PlayCircleOutlineIcon />}>
                                        Resume
                                    </Button>
                                )}
                                {visitStarted && (
                                    <Button
                                        color="success"
                                        variant="contained"
                                        onClick={handleFinish}
                                        startIcon={<CheckCircleIcon />}
                                    >
                                        Finish & Save
                                    </Button>
                                )}
                            </Stack>
                        </Stack>
                    </Stack>
                </Paper>

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={7}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Treatments</Typography>

                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <TextField label="Name" value={txName} onChange={e => setTxName(e.target.value)} fullWidth />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField label="Description" value={txDesc} onChange={e => setTxDesc(e.target.value)} fullWidth />
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <TextField
                                        label="Qty"
                                        type="number"
                                        value={txQty}
                                        onChange={e => setTxQty(e.target.value)}
                                        inputProps={{ min: 1, step: 1 }}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <TextField
                                        label="Unit price"
                                        type="number"
                                        value={txPrice}
                                        onChange={e => setTxPrice(e.target.value)}
                                        inputProps={{ min: 0, step: "0.01" }}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={1}>
                                    <Button onClick={addTreatment} startIcon={<AddIcon />} variant="outlined" fullWidth>
                                        Add
                                    </Button>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell align="right">Qty</TableCell>
                                        <TableCell align="right">Unit</TableCell>
                                        <TableCell align="right">Line</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {treatments.map(t => {
                                        const line = Number(t.quantity) * Number(t.unit_price);
                                        return (
                                            <TableRow key={t.id}>
                                                <TableCell>{t.name}</TableCell>
                                                <TableCell>{t.description || "—"}</TableCell>
                                                <TableCell align="right">{t.quantity}</TableCell>
                                                <TableCell align="right">${Number(t.unit_price).toFixed(2)}</TableCell>
                                                <TableCell align="right">${line.toFixed(2)}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Remove">
                                                        <IconButton color="error" onClick={() => removeTreatment(t.id)}>
                                                            <DeleteOutlineIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {!treatments.length && (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <Typography variant="body2" color="text.secondary">No treatments added yet.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                                <Chip
                                    label={`Total: $${total.toFixed(2)}`}
                                    sx={{ bgcolor: `${BLUE.main}16`, color: BLUE.main, fontWeight: 800 }}
                                />
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Medical Notes</Typography>
                            <TextField
                                multiline minRows={10} fullWidth
                                placeholder="Doctor notes, diagnosis, next steps…"
                                value={notes} onChange={e => setNotes(e.target.value)}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                Notes will be saved with the completed visit.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
