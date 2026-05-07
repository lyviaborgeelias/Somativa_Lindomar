import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Condominios from "./pages/Condominios";
import Unidades from "./pages/Unidades";
import Cobrancas from "./pages/Cobrancas";
import Inadimplencia from "./pages/Inadimplencia";
import Acordos from "./pages/Acordos";
import { isAuthenticated } from "./utils/auth";

function PrivateRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" />} />

        <Route
          path="/condominios"
          element={
            <PrivateRoute>
              <Condominios />
            </PrivateRoute>
          }
        />

        <Route
          path="/unidades"
          element={
            <PrivateRoute>
              <Unidades />
            </PrivateRoute>
          }
        />

        <Route
          path="/cobrancas"
          element={
            <PrivateRoute>
              <Cobrancas />
            </PrivateRoute>
          }
        />

        <Route
          path="/inadimplencia"
          element={
            <PrivateRoute>
              <Inadimplencia />
            </PrivateRoute>
          }
        />

        <Route
          path="/acordos"
          element={
            <PrivateRoute>
              <Acordos />
            </PrivateRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}