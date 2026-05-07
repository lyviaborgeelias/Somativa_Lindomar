import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Home,
  Receipt,
  AlertTriangle,
  FileText,
  LogOut,
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Circle,
} from "lucide-react";
import api from "../../api/axios";
import { getUser, logout } from "../../utils/auth";
import "./styles.css";

export default function Acordos() {
  const navigate = useNavigate();
  const user = getUser();

  const [acordos, setAcordos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    unidade_id: "",
    cobrancas_ids: [],
    quantidade_parcelas: 1,
  });

  const isAdmin = user?.tipo === "ADMIN" || user?.is_superuser === true;

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const acordosResponse = await api.get("/acordos/");
      const unidadesResponse = await api.get("/unidades/");
      const cobrancasResponse = await api.get("/cobrancas/");

      setAcordos(acordosResponse.data.results || acordosResponse.data);
      setUnidades(unidadesResponse.data.results || unidadesResponse.data);
      setCobrancas(cobrancasResponse.data.results || cobrancasResponse.data);
    } catch (error) {
      console.log("Erro ao carregar acordos:", error);
    }
  }

  function abrirNovo() {
    setEditando(null);
    setErro("");
    setForm({
      unidade_id: "",
      cobrancas_ids: [],
      quantidade_parcelas: 1,
    });
    setModalAberto(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    setErro("");
    setForm({
      unidade_id: item.unidade?.id || "",
      cobrancas_ids: item.cobrancas?.map((c) => c.id) || [],
      quantidade_parcelas: item.quantidade_parcelas || 1,
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setErro("");
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function marcarCobranca(id) {
    const jaSelecionada = form.cobrancas_ids.includes(id);

    setForm({
      ...form,
      cobrancas_ids: jaSelecionada
        ? form.cobrancas_ids.filter((item) => item !== id)
        : [...form.cobrancas_ids, id],
    });
  }

  async function salvarAcordo(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    if (form.cobrancas_ids.length === 0) {
      setErro("Selecione pelo menos uma cobrança vencida.");
      setLoading(false);
      return;
    }

    const dados = {
      unidade_id: Number(form.unidade_id),
      cobrancas_ids: form.cobrancas_ids,
      quantidade_parcelas: Number(form.quantidade_parcelas),
    };

    try {
      if (editando && editando.id) {
        await api.put(`/acordos/${editando.id}/`, dados);
      } else {
        await api.post("/acordos/", dados);
      }

      await carregarDados();
      fecharModal();
    } catch (error) {
      console.log("Erro ao salvar acordo:", error.response?.data || error);
      setErro("Não foi possível salvar. Use apenas cobranças vencidas da mesma unidade.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirAcordo(item) {
    const confirmar = window.confirm(`Deseja realmente excluir o acordo #${item.id}?`);

    if (!confirmar) return;

    try {
      await api.delete(`/acordos/${item.id}/`);
      await carregarDados();
    } catch (error) {
      console.log("Erro ao excluir acordo:", error);
      alert("Não foi possível excluir o acordo.");
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

  function dataBR(data) {
    if (!data) return "—";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const cobrancasVencidasDaUnidade = cobrancas.filter(
    (c) => c.status === "VENCIDO" && c.unidade?.id === Number(form.unidade_id)
  );

  return (
    <div className="aco-layout">
      <aside className="aco-sidebar">
        <div className="aco-brand">
          <div className="aco-brand-icon">
            <Building2 size={22} />
          </div>
          <div>
            <strong>CondoPay</strong>
            <span>Cobrança condominial</span>
          </div>
        </div>

        <nav>
          <button onClick={() => navigate("/dashboard")}>
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

          <button className="active">
            <FileText size={17} />
            Acordos
          </button>
        </nav>

        <div className="aco-user-box">
          <strong>{user?.username}</strong>
          <span>{isAdmin ? "Administrador" : "Usuário"}</span>

          <button onClick={sair} className="aco-logout">
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      <main className="aco-main">
        <header className="aco-header">
          <div>
            <h1>Acordos</h1>
            <p>{acordos.length} acordos ativos</p>
          </div>

          {isAdmin && (
            <button className="btn-novo-aco" onClick={abrirNovo}>
              <Plus size={18} />
              Novo Acordo
            </button>
          )}
        </header>

        <section className="aco-content">
          {acordos.map((item) => (
            <div className="aco-card" key={item.id}>
              {isAdmin && (
                <div className="aco-actions">
                  <button onClick={() => abrirEditar(item)}>
                    <Pencil size={15} />
                  </button>

                  <button className="delete" onClick={() => excluirAcordo(item)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              )}

              <div className="aco-card-header">
                <div>
                  <h2>
                    Acordo #{item.id} — Unidade {item.unidade?.numero} (
                    {item.unidade?.responsavel})
                  </h2>
                  <p>Criado em {dataBR(item.data_criacao)}</p>
                </div>

                <strong>{dinheiro(item.valor_total)}</strong>
              </div>

              <div className="aco-line" />

              <div className="parcelas-lista">
                {item.parcelas?.map((parcela) => (
                  <div className="parcela-row" key={parcela.id}>
                    <div>
                      {parcela.status === "PAGO" ? (
                        <CheckCircle size={18} className="pago-icon" />
                      ) : (
                        <Circle size={18} className="pendente-icon" />
                      )}

                      <strong>Parcela {parcela.numero_parcela}</strong>
                      <span>vence {dataBR(parcela.data_vencimento)}</span>
                    </div>

                    <strong>{dinheiro(parcela.valor)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      {modalAberto && (
        <div className="aco-modal-overlay">
          <div className="aco-modal-card">
            <div className="aco-modal-header">
              <h2>{editando ? "Editar Acordo" : "Novo Acordo"}</h2>

              <button onClick={fecharModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={salvarAcordo}>
              <label>Unidade</label>
              <select
                name="unidade_id"
                value={form.unidade_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unidade_id: e.target.value,
                    cobrancas_ids: [],
                  })
                }
                required
              >
                <option value="">Selecione</option>
                {unidades.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.numero} - {uni.responsavel} ({uni.condominio?.nome})
                  </option>
                ))}
              </select>

              <label>Quantidade de parcelas</label>
              <input
                type="number"
                name="quantidade_parcelas"
                min="1"
                value={form.quantidade_parcelas}
                onChange={handleChange}
                required
              />

              <label>Cobranças vencidas</label>

              <div className="cobrancas-checklist">
                {cobrancasVencidasDaUnidade.length === 0 && (
                  <p>Nenhuma cobrança vencida para esta unidade.</p>
                )}

                {cobrancasVencidasDaUnidade.map((cob) => (
                  <label className="check-item" key={cob.id}>
                    <input
                      type="checkbox"
                      checked={form.cobrancas_ids.includes(cob.id)}
                      onChange={() => marcarCobranca(cob.id)}
                    />

                    <span>
                      #{cob.id} — venc. {dataBR(cob.data_vencimento)} —{" "}
                      {dinheiro(cob.valor)}
                    </span>
                  </label>
                ))}
              </div>

              {erro && <div className="aco-form-error">{erro}</div>}

              <div className="aco-modal-actions">
                <button type="button" className="btn-cancelar" onClick={fecharModal}>
                  Cancelar
                </button>

                <button type="submit" className="btn-salvar" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}