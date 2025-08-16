import {
  Box,
  Button,
  Container,
  CssBaseline,
  Stack,
  Typography,
} from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 2,
          background:
            "linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)",
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              bgcolor: "background.paper",
              color: "text.primary",
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              boxShadow: 10,
              textAlign: "center",
            }}
          >
            <Stack spacing={2} alignItems="center">
              <SearchOffIcon sx={{ fontSize: 72, color: "primary.main" }} />
              <Typography variant="h3" fontWeight={800}>
                404
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                Page not found
              </Typography>
              <Typography color="text.secondary">
                Sorry, the page you’re looking for doesn’t exist or was moved.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mt: 1, width: "100%", justifyContent: "center" }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{ px: 3, py: 1, textTransform: "none", fontWeight: 700 }}
                >
                  Go back
                </Button>

                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/"
                  sx={{ px: 3, py: 1, textTransform: "none", fontWeight: 700 }}
                >
                  Go home
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Container>
      </Box>
    </>
  );
}
