import { useEffect, useState } from "react";
import {
  clearStoredToken,
  getApiErrorMessage,
  getCurrentUser,
  loginAccount,
  registerUserAccount,
} from "../apis";
import type { CurrentUser } from "../types/auth";

export type AuthMode = "login" | "register";

export function useMobileAuthStore() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((user) => {
        if (isActive) {
          setCurrentUser(user);
          setAuthError(null);
        }
      })
      .catch(() => {
        if (isActive) {
          clearStoredToken();
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsRestoring(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function login(username: string, password: string) {
    setIsAuthSubmitting(true);
    setAuthError(null);

    try {
      const data = await loginAccount({ username, password });
      window.localStorage.setItem("hotel_auth_token", data.token);
      setCurrentUser(data.user);
      setIsAuthOpen(false);
    } catch (error: unknown) {
      clearStoredToken();
      setCurrentUser(null);
      setAuthError(getApiErrorMessage(error));
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function register(username: string, password: string) {
    setIsAuthSubmitting(true);
    setAuthError(null);

    try {
      await registerUserAccount({ username, password });
      await login(username, password);
    } catch (error: unknown) {
      clearStoredToken();
      setCurrentUser(null);
      setAuthError(getApiErrorMessage(error));
      setIsAuthSubmitting(false);
    }
  }

  function logout() {
    clearStoredToken();
    setCurrentUser(null);
    setAuthError(null);
    setAuthMode("login");
  }

  return {
    authError,
    authMode,
    currentUser,
    isAuthOpen,
    isAuthSubmitting,
    isRestoring,
    login,
    logout,
    register,
    setAuthMode,
    setIsAuthOpen,
  };
}
