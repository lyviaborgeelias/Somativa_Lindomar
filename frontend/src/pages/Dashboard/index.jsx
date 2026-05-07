import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Home,
  Receipt,
  AlertTriangle,
  HandCoins,
  LogOut,
  LayoutDashboard,
  FileText,
  Wallet,
  TrendingDown,
} from "lucide-react";
import api from "../../api/axios";
import { getUser, logout } from "../../utils/auth";
import "./styles.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [dashboard, setDashboard] = useState(null);
  const [inadimplencia, setInadimplencia] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const dashResponse = await api.get("/dashboard/");
      setDashboard(dashResponse.data);

      const inadResponse = await api.get("/inadimplencia/resumo/");
      setInadimplencia(inadResponse.data);

      const cobrancasResponse = await api.get("/cobrancas/");
      const dados = cobrancasResponse.data.results || cobrancasResponse.data;
      setCobrancas(dados.slice(0, 6));
    } catch (error) {
      console.log("Erro ao carregar dashboard:", error);
    }
  }

  function sair() {
    logout();
    navigate("/");
  }

  function dinheiro(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (!dashboard) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  const total = dashboard.total_cobrancas || 1;

  const pagasPorcentagem = Math.round((dashboard.total_pagas / total) * 100);
  const pendentesPorcentagem = Math.round((dashboard.total_pendentes / total) * 100);
  const vencidasPorcentagem = Math.round((dashboard.total_vencidas / total) * 100);

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Building2 size={22} />
          </div>
          <div>
            <strong>CondoPay</strong>
            <span>Cobrança condominial</span>
          </div>
        </div>

        <nav>
          <button className="active">
            <LayoutDashboard size={17} />
            Dashboard
          </button>

          <button onClick={() => navigate("/condominios")}>
            <Building2 size={17} />
            Condomínios
          </button>

          <button onClick={() => navigate("/unidades")}>
            <Home size={17} />
            Unidades
          </button>

          <button onClick={() => navigate("/cobrancas")}>
            <Receipt size={17} />
            Cobranças
          </button>

          <button onClick={() => navigate("/inadimplencia")}>
            <AlertTriangle size={17} />
            Inadimplência
          </button>
          
          <button onClick={() => navigate("/acordos")}>
            <FileText size={17} />
            Acordos
          </button>
        </nav>

        <div className="user-box">
          <strong>{user?.username}</strong>
          <span>{user?.tipo === "ADMIN" ? "Administrador" : "Usuário"}</span>

          <button onClick={sair} className="logout">
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="header">
          <h1>Dashboard</h1>
          <p>Visão geral da arrecadação e inadimplência</p>
        </header>

        <section className="cards-grid">
          <div className="card">
            <div className="card-icon green">
              <Wallet size={24} />
            </div>
            <span className="small positive">↗ + 8,2%</span>
            <h2>{dinheiro(dashboard.valor_total_recebido)}</h2>
            <p>Recebido</p>
          </div>

          <div className="card">
            <div className="card-icon green">
              <TrendingDown size={24} />
            </div>
            <span className="small">-2,1%</span>
            <h2>{dinheiro(dashboard.valor_total_em_aberto)}</h2>
            <p>Em aberto</p>
          </div>

          <div className="card">
            <div className="card-icon green">
              <AlertTriangle size={24} />
            </div>
            <span className="small">{dashboard.total_pendentes} pendentes</span>
            <h2>{dashboard.total_vencidas}</h2>
            <p>Cobranças vencidas</p>
          </div>

          <div className="card">
            <div className="card-icon green">
              <FileText size={24} />
            </div>
            <span className="small">parcelados</span>
            <h2>{dashboard.total_acordos}</h2>
            <p>Acordos ativos</p>
          </div>
        </section>

        <section className="mini-grid">
          <div className="mini-card">
            <Building2 size={22} />
            <div>
              <span>Condomínios</span>
              <strong>{dashboard.total_condominios}</strong>
            </div>
          </div>

          <div className="mini-card">
            <Home size={22} />
            <div>
              <span>Unidades</span>
              <strong>{dashboard.total_unidades}</strong>
            </div>
          </div>

          <div className="mini-card">
            <Receipt size={22} />
            <div>
              <span>Cobranças totais</span>
              <strong>{dashboard.total_cobrancas}</strong>
            </div>
          </div>
        </section>

        <section className="middle-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Inadimplência por condomínio</h3>
              <span>Top 4</span>
            </div>

            {inadimplencia.slice(0, 4).map((item, index) => (
              <div className="inad-row" key={index}>
                <div>
                  <strong>{item.condominio}</strong>
                  <span>{item.qtd_cobrancas_vencidas} cobranças vencidas</span>
                </div>
                <p>{dinheiro(item.valor_total_vencido)}</p>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Distribuição de cobranças</h3>
              <span>{dashboard.total_cobrancas} no total</span>
            </div>

            <Barra
              nome="Pagas"
              qtd={dashboard.total_pagas}
              porcentagem={pagasPorcentagem}
              classe="pago"
            />

            <Barra
              nome="Pendentes"
              qtd={dashboard.total_pendentes}
              porcentagem={pendentesPorcentagem}
              classe="pendente"
            />

            <Barra
              nome="Vencidas"
              qtd={dashboard.total_vencidas}
              porcentagem={vencidasPorcentagem}
              classe="vencido"
            />
          </div>
        </section>

        <section className="panel table-panel">
          <h3>Cobranças recentes</h3>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Unidade</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {cobrancas.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>Un. {item.unidade?.numero}</td>
                  <td>{item.data_vencimento}</td>
                  <td>{dinheiro(item.valor)}</td>
                  <td className={`status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

function Barra({ nome, qtd, porcentagem, classe }) {
  return (
    <div className="bar-box">
      <div className="bar-info">
        <span>{nome}</span>
        <strong>{qtd} • {porcentagem}%</strong>
      </div>

      <div className="bar-bg">
        <div
          className={`bar-fill ${classe}`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  );
}