import { useEffect, useState, useMemo } from "react";
import { Box, Stack, Button, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../lib/apiClient";
import { ROLES } from "../../constant";

export default function DoctorsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);


  const columns = useMemo(() => ([
    { field: "full_name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "specialty", headerName: "Specialty", width: 160 },
    { field: "slot_minutes", headerName: "Slot (min)", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => navigate(`/admin/doctors/new?edit=${p.row.id}`)}>Edit</Button>
          <Button size="small" color="error" onClick={() => handleDelete(p.row.id)}>Delete</Button>
        </Stack>
      )
    },
  ]), []);


  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/listUsers", { params: { role: ROLES.DOCTOR } });
      setRows(data?.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await api.delete(`/admin/deleteUser/${id}`);

      if (res.status === 204 || res.status === 200) {
        setRows((r) => r.filter(x => x.id !== id));
        toast.success("Doctor removed");
      } else {
        toast.info(`Unexpected status: ${res.status}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={900}>Doctors</Typography>
        <Button variant="contained" onClick={() => navigate("/admin/doctor/new")}>Add Doctor</Button>
      </Stack>
      <div style={{ height: 520, width: "100%" }}>
        <DataGrid rows={rows} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} />
      </div>
    </Box>
  );
}
