import { useEffect, useState, useMemo } from "react";
import { Box, Stack, Button, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../lib/apiClient";

export default function FinanceList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const cols = useMemo(() => ([
    { field: "full_name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => navigate(`/admin/finance/new?edit=${p.row.id}`)}>Edit</Button>
          <Button size="small" color="error" onClick={() => handleDelete(p.row.id)}>Delete</Button>
        </Stack>
      )
    },
  ]), []);

  async function load() {
    setLoading(true);
    try {
      
      const { data } = await api.get("/admin/listUsers", {
        params: { role: "finance", page: 1, limit: 100 },
      });

      const tableRows = data?.data.map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
      }));

      setRows(tableRows);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load finance staff");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/deleteUser/${id}`);
      setRows((r) => r.filter(x => x.id !== id));
      toast.success("Finance user removed");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete");
    }
  }

  useEffect(() => { load() }, []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={900}>Finance</Typography>
        <Button variant="contained" onClick={() => navigate("/admin/finance/new")}>Add Finance</Button>
      </Stack>
      <div style={{ height: 520, width: "100%" }}>
        <DataGrid rows={rows} columns={cols} loading={loading} pageSizeOptions={[10, 25, 50]} />
      </div>
    </Box>
  );
}
