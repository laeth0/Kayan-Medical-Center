
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
    Box, Stack, Typography, ToggleButtonGroup, ToggleButton, TextField,
    InputAdornment, IconButton, Chip, Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid } from "@mui/x-data-grid";
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineContent, TimelineDot
} from "@mui/lab";
import api from "../../lib/apiClient.js";
import { toast } from "react-toastify";
import VisitDetailsDialog from "../../components/VisitDetailsDialog";


export default function PatientVisits() {
    const [mode, setMode] = useState("table");
    const [when, setWhen] = useState("past");
    const [q, setQ] = useState("");
    const [rows, setRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

    const [dialog, setDialog] = useState({ open: false, id: null });

    const fetchData = async () => {
        try {
            setLoading(true);
            const page = paginationModel.page + 1;
            const limit = paginationModel.pageSize;
            const { data } = await api.get("/visit/patient", {
                params: { when, doctor_q: q || "", page, limit }
            });
            setRows((data?.data || []).map(r => ({
                id: r.id,
                when: r.date,
                doctor: r.doctor,
                diagnosis: r.diagnosis,
                treatmentsCount: r.treatmentsCount,
                status: r.status,
            })));
            setRowCount(data?.total || 0);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load visits");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [when, paginationModel.page, paginationModel.pageSize]);
    const onRefresh = () => fetchData();

    const columns = useMemo(() => ([
        {
            field: "when",
            headerName: "Date",
            flex: 1,
            valueFormatter: (p) => p.value ? dayjs(p.value).format("MMM D, YYYY – HH:mm") : ""
        },
        { field: "doctor", headerName: "Doctor", flex: 1.2 },
        { field: "diagnosis", headerName: "Diagnosis", flex: 1.8 },
        {
            field: "status",
            headerName: "Status",
            width: 120,
            renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" />
        },
        {
            field: "actions",
            headerName: " ",
            sortable: false,
            width: 120,
            renderCell: (p) => (
                <Button size="small" onClick={() => setDialog({ open: true, id: p.row.id })}>
                    Details
                </Button>
            )
        }
    ]), []);

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight={900}>My Past Visits</Typography>
                    <ToggleButtonGroup value={mode} exclusive onChange={(_, v) => v && setMode(v)} size="small">
                        <ToggleButton value="table">Table</ToggleButton>
                        <ToggleButton value="timeline">Timeline</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                <Stack direction="row" spacing={1}>
                    <TextField
                        placeholder="Filter by doctor name (server)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                        }}
                        sx={{ flex: 1 }}
                    />
                    <IconButton onClick={onRefresh} aria-label="refresh">
                        <RefreshIcon />
                    </IconButton>
                </Stack>

                {mode === "table" ? (
                    <div style={{ height: 520, width: "100%" }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            paginationMode="server"
                            rowCount={rowCount}
                            paginationModel={paginationModel}
                            onPaginationModelChange={setPaginationModel}
                            loading={loading}
                            disableRowSelectionOnClick
                            pageSizeOptions={[5, 10, 25]}
                        />
                    </div>
                ) : (
                    <Box>
                        <Timeline position="alternate">
                            {rows.map((r, idx) => (
                                <TimelineItem key={r.id}>
                                    <TimelineSeparator>
                                        <TimelineDot color="primary" />
                                        {idx < rows.length - 1 && <TimelineConnector />}
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Stack spacing={0.5}>
                                            <Typography variant="subtitle2">
                                                {dayjs(r.when).format("MMM D, YYYY — HH:mm")}
                                            </Typography>
                                            <Typography variant="body2">Dr. {r.doctor}</Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap title={r.diagnosis}>
                                                {r.diagnosis || "—"}
                                            </Typography>
                                            <Button size="small" onClick={() => setDialog({ open: true, id: r.id })}>Details</Button>
                                        </Stack>
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                        </Timeline>
                        {!rows.length && (
                            <Typography variant="body2" color="text.secondary">No visits found.</Typography>
                        )}
                    </Box>
                )}

                <VisitDetailsDialog
                    open={dialog.open}
                    id={dialog.id}
                    onClose={() => setDialog({ open: false, id: null })}
                />
            </Stack>
        </Box>
    );
}
