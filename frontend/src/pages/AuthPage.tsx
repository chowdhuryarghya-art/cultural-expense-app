import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useState } from "react";
import type { FormEvent } from "react";
import type { AuthUser } from "../auth";
import api from "../api";

interface Props {
  onAuthenticated: (token: string, user: AuthUser) => void;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface AuthErrorResponse {
  error?: string;
}

export default function AuthPage({ onAuthenticated }: Props) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (isRegistering && password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    if (password.length < 10 || password.length > 128) {
      setErrorMessage("Password must be between 10 and 128 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post<AuthResponse>(
        isRegistering ? "/auth/register" : "/auth/login",
        {
          ...(isRegistering ? { displayName: displayName.trim() } : {}),
          email: email.trim().toLowerCase(),
          password,
        },
      );
      onAuthenticated(response.data.token, response.data.user);
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError<AuthErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.error ??
            (isRegistering ? "Could not create account" : "Could not sign in"),
        );
      } else {
        setErrorMessage(isRegistering ? "Could not create account" : "Could not sign in");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsRegistering((current) => !current);
    setErrorMessage("");
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 5, md: 10 } }}>
      <Paper sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={3} component="form" onSubmit={submit}>
          <Box>
            <Typography
              variant="overline"
              color="primary.light"
              sx={{ fontWeight: 700, letterSpacing: 1.4 }}
            >
              CULTURAL FINANCE
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
              {isRegistering ? "Create your account" : "Welcome back"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {isRegistering
                ? "Register to manage event income and expenses."
                : "Sign in to continue to your event finances."}
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isRegistering && (
            <TextField
              label="Name"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
          )}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            slotProps={{ htmlInput: { maxLength: 254 } }}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            slotProps={{ htmlInput: { minLength: 10, maxLength: 128 } }}
            helperText={isRegistering ? "Use at least 10 characters." : undefined}
          />
          {isRegistering && (
            <TextField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              slotProps={{ htmlInput: { minLength: 10, maxLength: 128 } }}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : isRegistering ? (
              "Register"
            ) : (
              "Sign in"
            )}
          </Button>
          <Button type="button" onClick={switchMode} disabled={isSubmitting}>
            {isRegistering
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
