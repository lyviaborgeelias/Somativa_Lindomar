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
} from "lucide-react";
import api from "../../api/axios";
import { getUser, logout } from "../../utils/auth";
import "./styles.css";

export default function Unidades() {
  const navigate = useNavigate();
  const user = getUser();

  const [unidades, setUnidades] = useState([]);
  const [condominios, setCondominios] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    numero: "",
    bloco: "",
    responsavel: "",
    status: "OCUPADO",
    condominio_id: "",
  });

  const isAdmin = user?.tipo === "ADMIN" || user?.is_superuser === true;

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const uniResponse = await api.get("/unidades/");
      const condResponse = await api.get("/condominios/");

      setUnidades(uniResponse.data.results || uniResponse.data);
      setCondominios(condResponse.data.results || condResponse.data);
    } catch (error) {
      console.log("Erro ao carregar unidades:", error);
    }
  }

  function abrirNovo() {
    setEditando(null);
    setErro("");
    setForm({
      numero: "",
      bloco: "",
      responsavel: "",
      status: "OCUPADO",
      condominio_id: condominios[0]?.id || "",
    });
    setModalAberto(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    setErro("");
    setForm({
      numero: item.numero || "",
      bloco: item.bloco || "",
      responsavel: item.responsavel || "",
      status: item.status || "OCUPADO",
      condominio_id: item.condominio?.id || "",
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

  async function salvarUnidade(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const dados = {
      numero: form.numero,
      bloco: form.bloco === "" ? null : form.bloco,
      responsavel: form.responsavel,
      status: form.status,
      condominio_id: Number(form.condominio_id),
    };

    try {
      if (editando && editando.id) {
        await api.put(`/unidades/${editando.id}/`, dados);
      } else {
        await api.post("/unidades/", dados);
      }

      await carregarDados();
      fecharModal();
    } catch (error) {
      console.log("Erro ao salvar unidade:", error.response?.data || error);
      setErro("Não foi possível salvar. Verifique os campos.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirUnidade(item) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a unidade "${item.numero}"?`
    );

    if (!confirmar) return;

    try {
      await api.delete(`/unidades/${item.id}/`);
      await carregarDados();
    } catch (error) {
      console.log("Erro ao excluir unidade:", error);
      alert("Não foi possível excluir a unidade.");
    }
  }

  function sair() {
    logout();
    navigate("/");
  }

  return (
    <div className="uni-layout">
      <aside className="uni-sidebar">
        <div className="uni-brand">
          <div className="uni-brand-icon">
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

          <button className="active">
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

        <div className="uni-user-box">
          <strong>{user?.username}</strong>
          <span>{isAdmin ? "Administrador" : "Usuário"}</span>

          <button onClick={sair} className="uni-logout">
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      <main className="uni-main">
        <header className="uni-header">
          <div>
            <h1>Unidades</h1>
            <p>
              {unidades.length} unidades em {condominios.length} condomínios
            </p>
          </div>

          {isAdmin && (
            <button className="btn-novo-uni" onClick={abrirNovo}>
              <Plus size={18} />
              Nova Unidade
            </button>
          )}
        </header>

        <section className="uni-content">
          <div className="uni-table-card">
            <table>
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Bloco</th>
                  <th>Responsável</th>
                  <th>Condomínio</th>
                  <th>Status</th>
                  {isAdmin && <th>Ações</th>}
                </tr>
              </thead>

              <tbody>
                {unidades.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.numero}</strong>
                    </td>
                    <td>{item.bloco || "—"}</td>
                    <td>{item.responsavel || "—"}</td>
                    <td>{item.condominio?.nome}</td>
                    <td>
                      <span className={`uni-status ${item.status?.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>

                    {isAdmin && (
                      <td>
                        <div className="uni-actions">
                          <button onClick={() => abrirEditar(item)}>
                            <Pencil size={15} />
                          </button>

                          <button
                            className="delete"
                            onClick={() => excluirUnidade(item)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {modalAberto && (
        <div className="uni-modal-overlay">
          <div className="uni-modal-card">
            <div className="uni-modal-header">
              <h2>{editando ? "Editar Unidade" : "Nova Unidade"}</h2>

              <button onClick={fecharModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={salvarUnidade}>
              <label>Número da unidade</label>
              <input
                type="text"
                name="numero"
                value={form.numero}
                onChange={handleChange}
                required
              />

              <label>Bloco</label>
              <input
                type="text"
                name="bloco"
                value={form.bloco}
                onChange={handleChange}
                placeholder="Ex: A"
              />

              <label>Responsável</label>
              <input
                type="text"
                name="responsavel"
                value={form.responsavel}
                onChange={handleChange}
                placeholder="Ex: Carlos Silva"
                required
              />

              <label>Condomínio</label>
              <select
                name="condominio_id"
                value={form.condominio_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecione</option>
                {condominios.map((cond) => (
                  <option key={cond.id} value={cond.id}>
                    {cond.nome}
                  </option>
                ))}
              </select>

              <label>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                required
              >
                <option value="OCUPADO">OCUPADO</option>
                <option value="VAGO">VAGO</option>
              </select>

              {erro && <div className="uni-form-error">{erro}</div>}

              <div className="uni-modal-actions">
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