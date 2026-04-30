import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Home, Receipt, Users, LogOut } from "lucide-react";
import api from "../../api/axios";
import { logout, getUser } from "../../utils/auth";
import "../Login/styles.css";

export default function AdminHome() {
  const navigate = useNavigate();
  const user = getUser();

  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const response = await api.get("/dashboard/");
        setDashboard(response.data);
      } catch (error) {
        console.log(error);
      }
    }

    carregarDashboard();
  }, []);

  function sair() {
    logout();
    navigate("/");
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Painel Administrativo</h1>
      <p>Bem-vindo, {user?.nome || user?.username}</p>

      <button onClick={sair}>
        <LogOut size={16} /> Sair
      </button>

      <hr />

      {dashboard ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <Card icon={<Building2 />} title="Condomínios" value={dashboard.total_condominios} />
          <Card icon={<Home />} title="Unidades" value={dashboard.total_unidades} />
          <Card icon={<Receipt />} title="Cobranças" value={dashboard.total_cobrancas} />
          <Card icon={<Users />} title="Pagas" value={dashboard.total_pagas} />
          <Card icon={<Receipt />} title="Pendentes" value={dashboard.total_pendentes} />
          <Card icon={<Receipt />} title="Vencidas" value={dashboard.total_vencidas} />
        </div>
      ) : (
        <p>Carregando dashboard...</p>
      )}
    </div>
  );
}

function Card({ icon, title, value }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "14px",
      padding: "20px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
    }}>
      <div>{icon}</div>
      <h3>{title}</h3>
      <strong style={{ fontSize: "28px" }}>{value}</strong>
    </div>
  );
}