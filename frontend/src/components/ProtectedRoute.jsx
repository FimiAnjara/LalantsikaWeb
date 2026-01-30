import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  let isAuthenticated = !!sessionStorage.getItem("auth_token");
  if (!isAuthenticated) {
    isAuthenticated = !!localStorage.getItem("auth_token");
  }
  return isAuthenticated ? children : <Navigate to="/manager/login" />;
};

export default ProtectedRoute;
