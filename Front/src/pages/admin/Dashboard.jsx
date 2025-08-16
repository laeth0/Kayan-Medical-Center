import { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import api from "../../lib/apiClient";

export default function Dashboard() {
    const [stats, setStats] = useState({ doctors: 0, finance: 0 });

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/admin/stats");
                setStats(data);
            } catch {
                setStats({ doctors: 0, finance: 0 });
            }
        })();
    }, []);


    const Card = ({ title, value }) => (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="overline">{title}</Typography>
            <Typography variant="h4" fontWeight={900}>{value}</Typography>
        </Paper>
    );

    return (
        <Box>
            <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Dashboard</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}><Card title="Doctors" value={stats.doctors} /></Grid>
                <Grid item xs={12} sm={6} md={3}><Card title="Finance" value={stats.finance} /></Grid>
            </Grid>
        </Box>
    );
}
