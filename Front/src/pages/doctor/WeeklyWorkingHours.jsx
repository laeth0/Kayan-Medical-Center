import { useEffect, useMemo, useState } from "react";
import {
    Box, Container, Typography, Paper, Grid, TextField, MenuItem,
    Button, Chip, Divider, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Tooltip
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import api from "../../lib/apiClient";
import { BLUE, WEEK_DAYS } from "../../constant.js";

export default function WeeklyWorkingHours() {
    const [weekday, setWeekday] = useState(WEEK_DAYS[0]);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [workingHours, setWorkingHours] = useState([]);

    async function loadWorkingHours() {
        try {
            const { data } = await api.get("/doctors/working-hours");
            setWorkingHours(data || []);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load working hours");
        }
    }

    useEffect(() => { loadWorkingHours() }, []);

    const sortedWorkingHours = useMemo(() => {
        const idx = d => WEEK_DAYS.indexOf(d);
        return [...workingHours].sort((a, b) => {
            if (idx(a.weekday) !== idx(b.weekday)) return idx(a.weekday) - idx(b.weekday);
            return a.start_time.localeCompare(b.start_time);
        });
    }, [workingHours]);

    const timeRangeOk = useMemo(() => startTime < endTime, [startTime, endTime]);

    async function addWorkingWindow() {
        if (!timeRangeOk) return toast.error("Start time must be before end time");
        try {
            const payload = { weekday, start_time: startTime, end_time: endTime };
            const { data } = await api.post("/doctors/working-hours", payload);
            setWorkingHours(prev => [...prev, data]);
            toast.success("Working window added");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to add window");
        }
    }

    async function removeWorkingWindow(id) {
        try {
            await api.delete(`/doctors/working-hours/${id}`);
            setWorkingHours(prev => prev.filter(x => x._id !== id));
            toast.success("Working window removed");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to remove window");
        }
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#fff", py: 4 }}>
            <Container maxWidth="lg">
                <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
                    Weekly working hours
                </Typography>

                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4} md={3}>
                            <TextField select fullWidth label="Weekday" value={weekday} onChange={e => setWeekday(e.target.value)}>
                                {WEEK_DAYS.map(d => <MenuItem key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={6} sm={4} md={3}>
                            <TextField
                                label="Start time" type="time" fullWidth value={startTime} onChange={e => setStartTime(e.target.value)}
                                inputProps={{ step: 300 }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={4} md={3}>
                            <TextField
                                label="End time" type="time" fullWidth value={endTime} onChange={e => setEndTime(e.target.value)}
                                inputProps={{ step: 300 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button onClick={addWorkingWindow} variant="contained" sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark } }}>
                                Add window
                            </Button>
                        </Grid>
                    </Grid>

                    {!timeRangeOk && (
                        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                            Start time must be before end time
                        </Typography>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography sx={{ mb: 1 }} fontWeight={700}>Existing windows</Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Weekday</TableCell>
                                <TableCell>Start</TableCell>
                                <TableCell>End</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedWorkingHours.map(w => (
                                <TableRow key={w._id}>
                                    <TableCell><Chip label={w.weekday} size="small" sx={{ bgcolor: `${BLUE.main}16`, color: BLUE.main, fontWeight: 700 }} /></TableCell>
                                    <TableCell>{w.start_time}</TableCell>
                                    <TableCell>{w.end_time}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Delete window">
                                            <IconButton onClick={() => removeWorkingWindow(w._id)} color="error"><DeleteOutlineIcon /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!sortedWorkingHours.length && (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Typography variant="body2" color="text.secondary">No working windows yet.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Paper>
            </Container>
        </Box>
    );
}
