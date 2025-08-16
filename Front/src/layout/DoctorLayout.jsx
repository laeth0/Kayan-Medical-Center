import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AppBar, Box, Button, Container, Divider, IconButton, Menu, MenuItem,
  Stack, Toolbar, Typography, useScrollTrigger
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import useAuth from "../hooks/useAuth";
import { Link as RouterLink } from "react-router-dom";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import { BLUE } from "../constant";


function ElevationOnScroll({ children }) {
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0 });
  return <Box sx={{ "& .MuiAppBar-root": { boxShadow: trigger ? 3 : 0 } }}>{children}</Box>;
}

const navItems = [
  { label: "Appointments", to: "/doctor/appointments" },
  { label: "Working Hours", to: "/doctor/working-hours" },
  { label: "Visits", to: "/doctor/DoctorPastVisits" },
  { label: "Profile", to: "/doctor/profile" },
];

export default function DoctorLayout() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { logout?.(); navigate("/", { replace: true }); };

  const linkSx = ({ isActive }) => ({
    fontWeight: isActive ? 800 : 600,
    textTransform: "none",
    letterSpacing: 0.1,
    opacity: isActive ? 1 : 0.85,
    "&:hover": { opacity: 1 },
  });

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#fafafa", display: "flex", flexDirection: "column" }}>
      <ElevationOnScroll>
        <AppBar
          position="fixed"
          color="default"
          sx={{
            bgcolor: "#fff",
            color: "text.primary",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ minHeight: 72 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              component={RouterLink}
              to="/"
              style={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
            >
              <LocalHospitalIcon sx={{ color: BLUE.main }} />
              <Typography variant="h6" fontWeight={800}>Kayan Medical Center</Typography>
            </Stack>

            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, alignItems: "center" }}>
              {navItems.map((item) => (
                <Button key={item.to} color="inherit" component={NavLink} to={item.to} sx={linkSx}>
                  {item.label}
                </Button>
              ))}
              <Button
                onClick={handleLogout}
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon />}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Logout
              </Button>
            </Box>


            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton color="inherit" onClick={handleMenu} aria-label="open menu">
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                {navItems.map((item) => (
                  <MenuItem
                    key={item.to}
                    component={NavLink}
                    to={item.to}
                    onClick={handleClose}
                    sx={{ fontWeight: 600 }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={() => { handleClose(); handleLogout(); }}>
                  <LogoutIcon fontSize="small" style={{ marginRight: 8 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      </ElevationOnScroll>

      <Toolbar />

      <Container sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ bgcolor: "background.paper", borderTop: 1, borderColor: "divider", mt: "auto" }}>
        <Container sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Kayan Medical Center — All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
