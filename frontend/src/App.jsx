import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminHome from "./pages/AdminHome";
import UserHome from "./pages/UserHome";
import { isAuthenticated, getUser } from "./utils/auth";

function PrivateRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }

  return children;
}

function AdminRoute({ children }) {
  const user = getUser();

  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }

  if (user?.tipo !== "ADMIN" && user?.is_superuser !== true) {
    return <Navigate to="/user/home" />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/admin/home"
          element={
            <AdminRoute>
              <AdminHome />
            </AdminRoute>
          }
        />

        <Route
          path="/user/home"
          element={
            <PrivateRoute>
              <UserHome />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}