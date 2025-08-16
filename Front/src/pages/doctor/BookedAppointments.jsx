import { useEffect, useMemo, useState } from "react";
import {
  Box, Container, Typography, Paper, Stack, TextField, Button,
  Chip, Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../lib/apiClient";
import { BLUE } from "../../constant";


export default function BookedAppointments() {
  const navigate = useNavigate();

  const todayISO = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);

  const [appointments, setAppointments] = useState([]);

  async function loadAppointments() {
    try {
      const params = { from: fromDate, to: toDate };
      const { data } = await api.get("/doctors/appointments", { params });
      console.log("Loaded appointments:", data);

      setAppointments(data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load appointments");
    }
  }

  useEffect(() => {
    loadAppointments();
  }, [fromDate, toDate]);

  const rows = useMemo(() => appointments, [appointments]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff", py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
          Booked appointments
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="From" type="date" value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To" type="date" value={toDate}
              onChange={e => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button onClick={loadAppointments} variant="outlined">Refresh</Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Visit type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(a => (
                <TableRow key={a._id}>
                  <TableCell>{new Date(a.start_time).toLocaleString()}</TableCell>
                  <TableCell>{new Date(a.end_time).toLocaleString()}</TableCell>
                  <TableCell>{a.patient?.full_name || "—"}</TableCell>
                  <TableCell>
                    <Chip label={a.status} size="small" sx={{ bgcolor: `${BLUE.main}16`, color: BLUE.main, fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>{a.VisitType || "—"}</TableCell>
                  <TableCell>{a.reason || "—"}</TableCell>
                  <TableCell align="right">
                    {["booked", "confirmed", "scheduled"].includes(String(a.status).toLowerCase()) ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate(`/doctor/visit/${a._id}`)}
                        sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark } }}
                      >
                        Start visit
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">No appointments in this range.</Typography>
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
