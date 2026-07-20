import { Navigate } from "react-router-dom";

export function AuthScreen() {
  return <Navigate to="/login" replace />;
}