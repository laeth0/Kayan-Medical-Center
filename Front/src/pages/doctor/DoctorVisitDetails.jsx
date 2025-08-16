import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Container, Paper, Typography, Grid, Stack, Chip, Divider, Table, TableHead,
  TableRow, TableCell, TableBody, Avatar, Button
} from "@mui/material";
import dayjs from "dayjs";
import api from "../../lib/apiClient";
import { toast } from "react-toastify";

import { BLUE } from "../../constant";

function ageFromDOB(d) {
  if (!d) return "—";
  const dob = new Date(d);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return `${age}y`;
}

export default function DoctorVisitDetails() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);

  async function load() {
    try {
      const { data } = await api.get(`/visit/doctor/${visitId}`);
      setRow(data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load visit");
    }
  }
  useEffect(() => { load(); }, [visitId]);

  const total = useMemo(() => {
    if (!row?.treatments?.length) return 0;
    return row.treatments.reduce((s, t) => s + (Number(t.total_price) || 0), 0);
  }, [row]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff", py: 4 }}>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={900}>Visit Details</Typography>
          <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md="auto">
              <Avatar sx={{ width: 72, height: 72, bgcolor: BLUE.main }}>
                {row?.patient?.full_name?.[0]?.toUpperCase() || "P"}
              </Avatar>
            </Grid>
            <Grid item xs={12} md>
              <Typography variant="h6" fontWeight={900}>
                {row?.patient?.full_name || "—"}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: .5 }}>
                <Chip size="small" label={row?.patient?.gender || "—"} />
                <Chip size="small" label={ageFromDOB(row?.patient?.date_of_birth)} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {row?.patient?.email || "—"} • {row?.patient?.phone || "—"}
              </Typography>
            </Grid>
            <Grid item xs={12} md="auto">
              <Stack alignItems={{ xs: "flex-start", md: "flex-end" }}>
                <Chip label={row?.status || "—"} sx={{ bgcolor: `${BLUE.main}16`, color: BLUE.main, fontWeight: 800 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {row?.start_time ? dayjs(row.start_time).format("MMM D, YYYY • HH:mm") : "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {row?.end_time ? dayjs(row.end_time).format("MMM D, YYYY • HH:mm") : "—"}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Treatments</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(row?.treatments || []).map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.code || "—"}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.description || "—"}</TableCell>
                  <TableCell align="right">{t.quantity}</TableCell>
                  <TableCell align="right">${Number(t.unit_price).toFixed(2)}</TableCell>
                  <TableCell align="right">${Number(t.total_price).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {!(row?.treatments?.length) && (
                <TableRow><TableCell colSpan={6}><Typography color="text.secondary">No treatments recorded.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Chip label={`Total: $${total.toFixed(2)}`} sx={{ bgcolor: `${BLUE.main}16`, color: BLUE.main, fontWeight: 800 }} />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>Medical Notes</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography whiteSpace="pre-wrap">{row?.clinical_notes || "—"}</Typography>
        </Paper>
      </Container>
    </Box>
  );
}
