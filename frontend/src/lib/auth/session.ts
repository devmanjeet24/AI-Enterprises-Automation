import type { AppDispatch } from "@/store";
import { getCurrentUser, login, register, type RegisterRequest } from "@/lib/api/auth";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth/storage";
import { clearAuth, setCredentials, setUser } from "@/store/slices/auth-slice";

export async function establishSession(
  dispatch: AppDispatch,
  accessToken: string,
): Promise<void> {
  setStoredToken(accessToken);
  dispatch(setCredentials({ accessToken }));

  const user = await getCurrentUser(accessToken);
  dispatch(setUser(user));
}

export async function loginAndEstablishSession(
  dispatch: AppDispatch,
  email: string,
  password: string,
): Promise<void> {
  const { access_token } = await login({ email, password });
  await establishSession(dispatch, access_token);
}

export async function registerAndEstablishSession(
  dispatch: AppDispatch,
  data: RegisterRequest,
): Promise<void> {
  const { access_token } = await register(data);
  await establishSession(dispatch, access_token);
}

export async function restoreSession(dispatch: AppDispatch): Promise<boolean> {
  const token = getStoredToken();
  if (!token) {
    return false;
  }

  try {
    dispatch(setCredentials({ accessToken: token }));
    const user = await getCurrentUser(token);
    dispatch(setUser(user));
    return true;
  } catch {
    clearStoredToken();
    dispatch(clearAuth());
    return false;
  }
}

export function logout(dispatch: AppDispatch): void {
  clearStoredToken();
  dispatch(clearAuth());
}
