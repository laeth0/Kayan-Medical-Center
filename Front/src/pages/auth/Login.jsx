import { useState } from "react";
import {
  Avatar, Box, Button, Checkbox, Container, CssBaseline, FormControlLabel,
  IconButton, InputAdornment, Link, Paper, Stack, TextField, Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from "../../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const canSubmit = email.trim() && password.trim();
  const navigate = useNavigate();
  const auth = useAuth();

  async function onSubmit(e) {

    e.preventDefault();
    setError("");
    try {
      const path = await auth.login(email, password, remember);

      toast.success("Login successful");

      navigate(path, { replace: true });

    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed. Check your email/password.";
      setError(msg);
      toast.error(msg);
      console.log("Login error:", err);

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
        <Container maxWidth="xs">
          <Paper elevation={10} sx={{ p: 4, borderRadius: 3, backdropFilter: "blur(4px)" }}>
            <Stack spacing={2} alignItems="center" mb={1}>
              <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h5" fontWeight={700}>
                Sign in
              </Typography>
              <Typography color="text.secondary" variant="body2" textAlign="center">
                Welcome back! Please enter your details.
              </Typography>
            </Stack>

            <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: "grid", gap: 2 }}>
              <TextField
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                autoComplete="email"
                autoFocus
                required
              />

              <TextField
                label="Password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                autoComplete="current-password"
                required
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

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Remember me"
                />
                <Link component={RouterLink} underline="hover" variant="body2">
                  Forgot password?
                </Link>
              </Box>

              {error && (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disableElevation
                disabled={!canSubmit}
                sx={{ mt: 1, py: 1.2, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                Sign in
              </Button>

              <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                Don’t have an account?{" "}
                <Link component={RouterLink} to="/register" underline="hover">
                  Create one
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
