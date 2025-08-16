import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    AppBar, Box, CssBaseline, Toolbar, Typography, IconButton, Drawer,
    List, ListItemButton, ListItemText, Divider, Button, useTheme, useMediaQuery,
    Stack
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import useAuth from "../hooks/useAuth";
import { Link as RouterLink } from "react-router-dom";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import {BLUE} from "../constant";

const drawerWidth = 240;

const nav = [
    { label: "Dashboard", to: "/admin" },
    { label: "Doctors", to: "/admin/doctors" },
    { label: "Finance", to: "/admin/finance" },
];


export default function AdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ px: 2, py: 2 }}>
                <Typography variant="h6" fontWeight={900}>Admin Console</Typography>
            </Box>
            <Divider />
            <List sx={{ flex: 1 }}>
                {nav.map((item) => (
                    <ListItemButton
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        sx={(p) => ({
                            "&.active": { bgcolor: p.palette.action.selected, fontWeight: 800 },
                        })}
                    >
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={() => { logout?.(); navigate("/", { replace: true }); }}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "#fafafa" }}>
            <CssBaseline />

            <AppBar
                position="fixed"
                color="default"
                sx={{ bgcolor: "#fff", color: "text.primary", borderBottom: 1, borderColor: "divider", zIndex: (t) => t.zIndex.drawer + 1 }}
            >
                <Toolbar sx={{ minHeight: 72 }}>
                    {!isMdUp && (
                        <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        component={RouterLink}
                        to="/"
                        style={{ textDecoration: "none", color: "inherit" }}
                    >
                        <LocalHospitalIcon sx={{ color: BLUE.main }} />
                        <Typography variant="h6" fontWeight={800}>Kayan Medical Center</Typography>
                    </Stack>
                    <Box sx={{ flexGrow: 1 }} />
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="admin navigation">
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: drawerWidth } }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    open
                    sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, position: "relative" } }}
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box component="main" sx={{ flex: 1, p: 3, mt: "72px" }}>
                <Outlet />
            </Box>
        </Box>
    );
}
