import { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Stack, TextField, Button, Typography, Chip, InputAdornment
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import api from "../../lib/apiClient";
import { toast } from "react-toastify";
import { BLUE } from "../../constant";


export default function DoctorPastVisits() {
  const navigate = useNavigate();

  const today = new Date();
  const last30 = new Date(Date.now() - 29 * 24 * 3600 * 1000);
  const [from, setFrom] = useState(last30.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [q, setQ] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = useMemo(() => ([
    {
      field: "start_time", headerName: "Date", flex: 1,
      valueFormatter: ({ value }) => dayjs(value).isValid() ? dayjs(value).format("MMM D, YYYY") : "—",
    },
    {
      field: "patient", headerName: "Patient", flex: 1.4,
      renderCell: (p) => {
        const patient = p.value;
        return (
          <Stack>
            <Typography fontWeight={700}>{patient?.full_name || "—"}</Typography>
            <Typography variant="caption" color="text.secondary">{patient?.gender || "—"}</Typography>
          </Stack>
        );
      }
    },
    {
      field: "total_amount", headerName: "Total", width: 120,
      valueFormatter: ({ value }) => value,
    },
    {
      field: "status", headerName: "Status", width: 120,
      renderCell: (p) => <Chip size="small" label={p.value} sx={{ bgcolor: `${BLUE.main}16`, color: BLUE.main, fontWeight: 700 }} />
    },
    {
      field: "actions", headerName: "Actions", sortable: false, width: 140,
      renderCell: (p) => (
        <Button size="small" variant="contained"
          onClick={() => navigate(`/doctor/DoctorVisitDetails/${p.row.id}`)}
          sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark } }}>
          Details
        </Button>
      )
    }
  ]), [navigate]);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get("/visit/doctor", {
        params: { from, to, patient_q: q || undefined, page: 1, limit: 50 }
      });

      console.log("Loaded visits:", data);

      setRows((data?.data || []).map(d => ({ id: d.id, ...d })));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load visits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load() }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff", py: 4 }}>
      <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Previous Visits</Typography>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField type="date" label="From" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" label="To" value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField
            label="Patient name" value={q} onChange={e => setQ(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
            }}
          />
          <Button variant="contained" onClick={load}
            sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark } }}>
            Apply
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <div style={{ height: 540, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          />
        </div>
      </Paper>
    </Box>
  );
}
