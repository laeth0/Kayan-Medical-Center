import {
    AppBar, Toolbar, Container, Box, Typography, Button, Stack, Grid,
    Card, CardContent, IconButton, Link as MuiLink, Divider
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ScheduleIcon from "@mui/icons-material/Schedule";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROLES } from "../constant";
import { BLUE } from "../constant";


export default function Landing() {
    const { token, roles, logout } = useAuth();
    const navigate = useNavigate();

    const isPatient = Boolean(token) && roles.some(r => r === ROLES.PATIENT);
    const isDoctor = Boolean(token) && roles.some(r => r === ROLES.DOCTOR);
    const isAdmin = Boolean(token) && roles.some(r => r === ROLES.ADMIN);
    const isFinance = Boolean(token) && roles.some(r => r === ROLES.FINANCE);

    const handleLogout = () => {
        logout?.();
        navigate("/", { replace: true });
    };

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{ bgcolor: "#fff", color: "text.primary", borderBottom: "1px solid #e7e7e7" }}
            >
                <Toolbar sx={{ minHeight: 72 }}>
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

                    <Stack direction="row" spacing={2} sx={{ display: { xs: "none", md: "flex" } }} alignItems="center">
                        <MuiLink component={RouterLink} to="#about" underline="none" color="text.secondary">About</MuiLink>
                        <MuiLink component={RouterLink} to="#services" underline="none" color="text.secondary">Services</MuiLink>
                        <MuiLink component={RouterLink} to="#contact" underline="none" color="text.secondary">Contact</MuiLink>

                        {token ? (
                            <Button
                                onClick={handleLogout}
                                variant="outlined"
                                sx={{ borderColor: BLUE.main, color: BLUE.main }}
                            >
                                Logout
                            </Button>
                        ) : (
                            <Button
                                component={RouterLink}
                                to="/login"
                                variant="outlined"
                                sx={{ borderColor: BLUE.main, color: BLUE.main }}
                            >
                                Sign in
                            </Button>
                        )}

                    </Stack>
                </Toolbar>
            </AppBar>

            <Box sx={{ bgcolor: "#f7fbff", borderBottom: "1px solid #e7e7e7" }}>
                <Container sx={{ py: { xs: 6, md: 10 } }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <Typography variant="overline" sx={{ color: BLUE.main, letterSpacing: 1.2, fontWeight: 800 }}>
                                Welcoming Patients & Families
                            </Typography>
                            <Typography variant="h3" fontWeight={900} sx={{ mt: 1, lineHeight: 1.2 }}>
                                Compassionate, evidence-based care you can trust
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                                From same-day appointments to specialty clinics, our team puts your needs first, clear information,
                                timely access, and respectful, patient-centered care.
                            </Typography>
                            <Stack direction="row" spacing={3} sx={{ mt: 4 }} alignItems="center">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <VerifiedUserIcon sx={{ color: BLUE.main }} />
                                    <Typography variant="body2" color="text.secondary">Trusted clinicians</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <ScheduleIcon sx={{ color: BLUE.main }} />
                                    <Typography variant="body2" color="text.secondary">Flexible hours</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <FavoriteBorderIcon sx={{ color: BLUE.main }} />
                                    <Typography variant="body2" color="text.secondary">Patient-centered</Typography>
                                </Stack>
                            </Stack>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                                sx={{ mt: 3, flexWrap: "wrap" }}
                            >
                                {!token && (
                                    <>
                                        <Button
                                            component={RouterLink}
                                            to="/login"
                                            size="large"
                                            variant="contained"
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark }, textTransform: "none", fontWeight: 800 }}
                                        >
                                            Sign in
                                        </Button>

                                        <Button
                                            component={RouterLink}
                                            to="/register"
                                            size="large"
                                            variant="outlined"
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{ textTransform: "none", fontWeight: 800 }}
                                        >
                                            Create account
                                        </Button>
                                    </>
                                )}
                                {isAdmin && (
                                    <Button
                                        component={RouterLink}
                                        to="/admin"
                                        size="large"
                                        variant="contained"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark }, textTransform: "none", fontWeight: 800 }}
                                    >
                                        Admin dashboard
                                    </Button>
                                )}
                                {isDoctor && (
                                    <Button
                                        component={RouterLink}
                                        to="/doctor/appointments"
                                        size="large"
                                        variant="contained"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark }, textTransform: "none", fontWeight: 800 }}
                                    >
                                        Today’s appointments
                                    </Button>
                                )}
                                {isFinance && (
                                    <Button
                                        component={RouterLink}
                                        to="/finance"
                                        size="large"
                                        variant="contained"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark }, textTransform: "none", fontWeight: 800 }}
                                    >
                                        Finance dashboard
                                    </Button>
                                )}
                                {isPatient && (
                                    <Button
                                        component={RouterLink}
                                        to="/patient/book"
                                        size="large"
                                        variant="contained"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark }, textTransform: "none", fontWeight: 800 }}
                                    >
                                        Book an appointment
                                    </Button>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Container id="about" sx={{ py: { xs: 6, md: 10 } }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="overline" sx={{ color: BLUE.main, letterSpacing: 1.2, fontWeight: 800 }}>
                            About us
                        </Typography>
                        <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>
                            Care that respects your values
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                            We believe great healthcare is respectful, responsive, and aligned with each patient’s needs and preferences.
                            Our clinicians combine expertise with empathy to guide decisions that fit your life.
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                component={RouterLink}
                                to="/"
                                variant="contained"
                                sx={{ bgcolor: BLUE.main, "&:hover": { bgcolor: BLUE.dark } }}
                            >
                                Get started
                            </Button>
                            <Button component={RouterLink} to="" variant="text" endIcon={<ArrowForwardIcon />}>
                                Explore services
                            </Button>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Grid container spacing={2}>
                            {[
                                { title: "Primary care", desc: "Continuity for all ages and conditions." },
                                { title: "Specialty clinics", desc: "Cardiology, dermatology, pediatrics and more." },
                                { title: "Same-day visits", desc: "Quick access for minor illnesses and injuries." },
                                { title: "Diagnostics", desc: "On-site lab tests and imaging referrals." },
                            ].map((s) => (
                                <Grid key={s.title} item xs={12} sm={6}>
                                    <Card elevation={0} sx={{ border: "1px solid #e7e7e7", borderRadius: 3, height: "100%" }}>
                                        <CardContent>
                                            <Typography fontWeight={800}>{s.title}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{s.desc}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                </Grid>
            </Container>

            <Box id="services" sx={{ bgcolor: "#f7fbff", borderTop: "1px solid #e7e7e7", borderBottom: "1px solid #e7e7e7" }}>
                <Container sx={{ py: { xs: 6, md: 10 } }}>
                    <Typography variant="overline" sx={{ color: BLUE.main, letterSpacing: 1.2, fontWeight: 800 }}>
                        Services
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ mt: 1, mb: 3 }}>What we offer</Typography>
                    <Grid container spacing={2}>
                        {[
                            { title: "Cardiology", text: "Heart health screenings and follow-up care." },
                            { title: "Dermatology", text: "Skin checks, acne care, and minor procedures." },
                            { title: "Pediatrics", text: "Well-child visits, immunizations, and acute care." },
                            { title: "Women’s health", text: "Preventive care and personalized guidance." },
                            { title: "Men’s health", text: "Screenings, counseling, and wellness plans." },
                            { title: "Chronic care", text: "Diabetes, hypertension, and long-term management." },
                        ].map((item) => (
                            <Grid key={item.title} item size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card elevation={0} sx={{ border: "1px solid #e7e7e7", borderRadius: 3, height: "100%" }}>
                                    <CardContent>
                                        <Typography fontWeight={800}>{item.title}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.text}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            <Container id="contact" sx={{ py: { xs: 6, md: 10 } }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="overline" sx={{ color: BLUE.main, letterSpacing: 1.2, fontWeight: 800 }}>
                            Contact
                        </Typography>
                        <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>We’re here to help</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                            Call us for same-day availability, or book online any time. For emergencies, contact local emergency services immediately.
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 3 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <PhoneInTalkIcon sx={{ color: BLUE.main }} />
                                <Typography variant="body2" color="text.secondary">+970-59-000-0000</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <PlaceIcon sx={{ color: BLUE.main }} />
                                <Typography variant="body2" color="text.secondary">123 Health St, Hebron, Palestine</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <AccessTimeIcon sx={{ color: BLUE.main }} />
                                <Typography variant="body2" color="text.secondary">Sun–Thu: 8:00–18:00</Typography>
                            </Stack>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>

            <Box component="footer" sx={{ bgcolor: "#0f172a", color: "#e2e8f0", mt: 4, pt: 6 }}>
                <Container>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <LocalHospitalIcon />
                                <Typography variant="h6" fontWeight={800}>Kayan Medical Center</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ mt: 1.5, color: "#cbd5e1" }}>
                                Community-focused, patient-centered care.
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography fontWeight={800}>Explore</Typography>
                            <Stack spacing={1} sx={{ mt: 1 }}>
                                <MuiLink component={RouterLink} to="#about" color="#cbd5e1" underline="hover">About</MuiLink>
                                <MuiLink component={RouterLink} to="#services" color="#cbd5e1" underline="hover">Services</MuiLink>
                                <MuiLink component={RouterLink} to="#contact" color="#cbd5e1" underline="hover">Contact</MuiLink>
                            </Stack>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography fontWeight={800}>Follow</Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <IconButton aria-label="Facebook" color="inherit"><FacebookIcon /></IconButton>
                                <IconButton aria-label="Instagram" color="inherit"><InstagramIcon /></IconButton>
                                <IconButton aria-label="X" color="inherit"><XIcon /></IconButton>
                            </Stack>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 3, borderColor: "rgba(226,232,240,0.2)" }} />
                    <Typography variant="caption" sx={{ display: "block", pb: 4, color: "#94a3b8" }}>
                        © {new Date().getFullYear()} Kayan Medical Center. All rights reserved.
                    </Typography>
                </Container>
            </Box>
        </>
    );
}
