import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import api from "../../api/axios";
import { logout, getUser } from "../../utils/auth";
import "../Login/styles.css";

export default function UserHome() {
  const navigate = useNavigate();
  const user = getUser();

  const [cobrancas, setCobrancas] = useState([]);

  useEffect(() => {
    async function carregarCobrancas() {
      try {
        const response = await api.get("/cobrancas/");
        setCobrancas(response.data.results || response.data);
      } catch (error) {
        console.log(error);
      }
    }

    carregarCobrancas();
  }, []);

  function sair() {
    logout();
    navigate("/");
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Área do Usuário</h1>
      <p>Bem-vindo, {user?.nome || user?.username}</p>

      <button onClick={sair}>
        <LogOut size={16} /> Sair
      </button>

      <hr />

      <h2>Cobranças</h2>

      <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Unidade</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Vencimento</th>
          </tr>
        </thead>

        <tbody>
          {cobrancas.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.unidade?.numero}</td>
              <td>R$ {item.valor}</td>
              <td>{item.status}</td>
              <td>{item.data_vencimento}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}