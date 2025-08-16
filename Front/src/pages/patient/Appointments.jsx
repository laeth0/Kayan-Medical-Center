import dayjs from "dayjs";
import {
  Box, Button, Chip, CssBaseline, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, Tab, Tabs, TextField, Typography,
  InputAdornment
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import api from "../../lib/apiClient";
import { toast } from "react-toastify";
import { useEffect, useMemo, useRef, useState } from "react";

const STATUS_COLOR = { booked: "info", fulfilled: "success", cancelled: "error" };

export default function PatientAppointments() {
  const [tab, setTab] = useState("upcoming");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const debounceRef = useRef(null);

  async function fetchRows({ when = tab, query = q } = {}) {
    try {
      setLoading(true);
      const { data } = await api.get("/appointments/patient", {
        params: { when, q: query }
      });

      setRows(data?.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load appointments");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRows({ when: tab, query: q }); }, [tab]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRows({ when: tab, query: q });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const columns = useMemo(() => [
    {
      field: "startTime",
      headerName: "When",
      flex: 1,
      valueFormatter: (params) =>
        dayjs(params.value).isValid() ? dayjs(params.value).format("MMM D, YYYY – HH:mm") : ""
    },
    { field: "doctor", headerName: "Doctor", flex: 1.2 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      renderCell: (params) =>
        params?.value ? (
          <Chip label={params.value} color={STATUS_COLOR[params.value] || "default"} variant="outlined" size="small" />
        ) : null
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      flex: 0.8,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return null;
        const start = dayjs(row.startTime);
        const cancellable = row.status === "booked" && start.isAfter(dayjs());
        return (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="error"
              disabled={!cancellable}
              onClick={() => setConfirm({ open: true, id: row.id })}
            >
              Cancel
            </Button>
          </Stack>
        );
      }
    }
  ], []);

  async function handleCancelConfirm() {
    if (!confirm.id) return;
    try {
      await api.post(`/appointments/cancel/${confirm.id}`);
      toast.success("Appointment cancelled");
      await fetchRows({ when: tab, query: q });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Cancel failed");
    } finally {
      setConfirm({ open: false, id: null });
    }
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>My Appointments</Typography>

          <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
            <Tab label="Upcoming" value="upcoming" />
            <Tab label="Past" value="past" />
          </Tabs>

          <TextField
            placeholder="Search by doctor name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(r) => r.id}
              loading={loading}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10]}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            />
          </Box>
        </Stack>
      </Box>

      <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}>
        <DialogTitle>Cancel appointment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action will mark the appointment as cancelled.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ open: false, id: null })}>Keep</Button>
          <Button color="error" variant="contained" onClick={handleCancelConfirm}>Cancel it</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
