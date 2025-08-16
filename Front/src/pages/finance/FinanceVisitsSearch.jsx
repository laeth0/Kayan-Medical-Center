import { useEffect, useMemo, useState } from "react";
import {
    Box, Paper, Grid, TextField, Button, Stack, Typography,
    InputAdornment, Chip, Card, CardContent, Divider, Tooltip, Skeleton
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh"; import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PersonIcon from "@mui/icons-material/Person";
import dayjs from "dayjs";
import api from "../../lib/apiClient";
import { toast } from "react-toastify";
import { BLUE } from "../../constant";

export default function FinanceVisitsSearch() {
    const [doctorQ, setDoctorQ] = useState("");
    const [patientQ, setPatientQ] = useState("");
    const today = new Date().toISOString().slice(0, 10);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [pageModel, setPageModel] = useState({ page: 0, pageSize: 10 });

    const columns = useMemo(() => ([
        {
            field: "date",
            headerName: "Date",
            flex: 1,
            valueFormatter: (p) => (dayjs(p.value).isValid() ? dayjs(p.value).format("MMM D, YYYY – HH:mm") : "")
        },
        { field: "patient", headerName: "Patient", flex: 1.2 },
        { field: "doctor", headerName: "Doctor", flex: 1.2 },
        {
            field: "total_amount",
            headerName: "Total",
            width: 150,
            renderCell: (p) => (
                <Chip
                    variant="outlined"
                    icon={<MonetizationOnIcon />}
                    label={`$${Number(p.value || 0).toFixed(2)}`}
                    sx={{ borderColor: BLUE.main, color: BLUE.main, fontWeight: 700 }}
                    size="small"
                />
            )
        },
    ]), []);

    async function load() {
        setLoading(true);
        try {
            const params = {
                doctor_q: doctorQ || "",
                patient_q: patientQ || "",
                from: from || "",
                to: to || "",
                page: pageModel.page + 1,
                limit: pageModel.pageSize,
            };
            const { data } = await api.get("/finance/visits", { params });
            setRows((data?.data || []).map(r => ({ id: r.id, ...r })));
            setTotal(data?.total || 0);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load visits");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);
    useEffect(() => { load(); }, [pageModel.page, pageModel.pageSize]);

    function onSearch() {
        setPageModel(pm => ({ ...pm, page: 0 }));
        setTimeout(load, 0);
    }

    const activeFilters = [
        doctorQ && { label: `Doctor: ${doctorQ}`, onClear: () => setDoctorQ("") },
        patientQ && { label: `Patient: ${patientQ}`, onClear: () => setPatientQ("") },
        (from || to) && { label: `Date: ${from || "—"} → ${to || "—"}`, onClear: () => { setFrom(""); setTo(""); } },
    ].filter(Boolean);

    const SummaryCard = ({ icon, title, value }) => (
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e7e7e7", bgcolor: "#ffffffcc", backdropFilter: "blur(6px)" }}>
            <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    {icon}
                    <Box>
                        <Typography variant="overline" sx={{ letterSpacing: 1, color: "text.secondary" }}>{title}</Typography>
                        <Typography variant="h5" fontWeight={900}>{value}</Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ py: 2 }}>
            <Box
                sx={{
                    mb: 2,
                    p: 3,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #1e293b 0%, #0ea5e9 100%)",
                    color: "white",
                }}
            >
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
                    <Box>
                        <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.2 }}>Finance</Typography>
                        <Typography variant="h5" fontWeight={900}>Visits Search</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Search by doctor, patient and date range. Use the toolbar to export or show/hide columns.
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            <Paper
                variant="outlined"
                sx={{
                    p: 2.5, borderRadius: 3, mb: 2,
                    bgcolor: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(6px)"
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Doctor name"
                            value={doctorQ}
                            onChange={(e) => setDoctorQ(e.target.value)}
                            fullWidth
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Patient name"
                            value={patientQ}
                            onChange={(e) => setPatientQ(e.target.value)}
                            fullWidth
                            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <TextField
                            type="date"
                            label="From"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon /></InputAdornment> }}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <TextField
                            type="date"
                            label="To"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon /></InputAdornment> }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" flexWrap="wrap">
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {activeFilters.map((f, i) => (
                                    <Chip
                                        key={i}
                                        label={f.label}
                                        onDelete={f.onClear}
                                        sx={{ bgcolor: `${BLUE.main}14`, color: BLUE.main, border: `1px solid ${BLUE.main}33` }}
                                    />
                                ))}
                                {!activeFilters.length && (
                                    <Typography variant="caption" color="text.secondary">No active filters</Typography>
                                )}
                            </Stack>

                            <Stack direction="row" spacing={1}>
                                <Tooltip title="Refresh results">
                                    <span>
                                        <Button
                                            variant="outlined"
                                            startIcon={<RefreshIcon />}
                                            onClick={load}
                                            disabled={loading}
                                        >
                                            {loading ? "Refreshing..." : "Refresh"}
                                        </Button>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Reset all filters">
                                    <Button
                                        variant="outlined"
                                        onClick={() => { setDoctorQ(""); setPatientQ(""); setFrom(""); setTo(""); onSearch(); }}
                                    >
                                        Clear
                                    </Button>
                                </Tooltip>
                                <Button
                                    variant="contained"
                                    onClick={onSearch}
                                    sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark }, fontWeight: 800 }}
                                >
                                    Search
                                </Button>
                            </Stack>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                <Divider sx={{ mb: 1.5 }} />
                <div style={{ height: 560, width: "100%" }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        rowCount={total}
                        paginationMode="server"
                        paginationModel={pageModel}
                        onPaginationModelChange={setPageModel}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: true,
                                quickFilterProps: { debounceMs: 300 },
                            },
                        }}
                        sx={{
                            borderRadius: 2,
                            "& .MuiDataGrid-row:nth-of-type(2n)": { backgroundColor: "#fafafa" },
                            "& .MuiDataGrid-toolbarContainer": {
                                p: 1,
                                gap: 1,
                                borderRadius: 2,
                                bgcolor: "#f8fafc",
                            },
                        }}
                    />
                </div>
            </Paper>

            <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "text.secondary" }}>
                Tip: The DataGrid toolbar offers quick filter and column visibility out of the box.
            </Typography>
        </Box>
    );
}
