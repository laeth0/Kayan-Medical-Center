import {
  Avatar, Box, Button, Checkbox, Container, CssBaseline, FormControlLabel,
  FormHelperText, IconButton, InputAdornment, Link, Paper, Stack, TextField, Typography,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../lib/apiClient";
import { useState } from "react";
import useAuth from "../../hooks/useAuth";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [agree, setAgree] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const nameOk = fullName.trim().length >= 2;
  const emailOk = !!email;
  const passOk = password.length >= 1;
  const matchOk = password === confirm;
  const phoneOk = phone.trim().length >= 7;
  const genderOk = !!gender;
  const agreeOk = agree === true;

  const canSubmit = nameOk && emailOk && passOk && matchOk && phoneOk && genderOk && agreeOk;

  const navigate = useNavigate();
  const auth = useAuth();

  async function onSubmit(e) {

    e.preventDefault();
    if (!canSubmit) return;
    setError("");

    try {

      await apiClient.post("/register", {
        full_name: fullName,
        email,
        password,
        phone,
        date_of_birth: dob || undefined,
        gender,
      });

      toast.success("Account created");

      const path = await auth.login(email, password, remember);
      navigate(path, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed. Please try again.";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 2,
          background: "#dde1e5ff",
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={10} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, backdropFilter: "blur(4px)" }}>
            <Stack spacing={2} alignItems="center" mb={1}>
              <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                <PersonAddAlt1Icon />
              </Avatar>
              <Typography component="h1" variant="h5" fontWeight={700}>
                Create your account
              </Typography>
              <Typography color="text.secondary" variant="body2" textAlign="center">
                Sign up to book appointments and manage your visits.
              </Typography>
            </Stack>

            <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: "grid", gap: 2, mt: 1 }}>
              <TextField
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth required
                error={!!fullName && !nameOk}
              />

              <TextField
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth required
              />

              <TextField
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth required
                error={!!phone && !phoneOk}
              />

              <FormControl fullWidth required>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Date of birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth required
                helperText="Minimum 8 characters"
                error={!!password && !passOk}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass((s) => !s)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                        edge="end"
                      >
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirm password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                fullWidth required
                error={!!confirm && !matchOk}
                helperText={!!confirm && !matchOk ? "Passwords do not match" : " "}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm((s) => !s)}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        edge="end"
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <FormControlLabel
                  control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} color="primary" />}
                  label="I agree to the Terms & Privacy Policy"
                />
                <FormControlLabel
                  control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} color="primary" />}
                  label="Remember me"
                />
              </Stack>
              {!agreeOk && <FormHelperText error>You must accept the terms to continue</FormHelperText>}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disableElevation
                disabled={!canSubmit}
                sx={{ mt: 1, py: 1.2, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                fullWidth
              >
                Create account
              </Button>

              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Already have an account?{" "}
                <Link component={RouterLink} to="/login" underline="hover">
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
