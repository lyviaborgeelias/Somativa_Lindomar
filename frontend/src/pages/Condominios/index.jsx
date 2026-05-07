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

export default function Condominios() {
    const navigate = useNavigate();
    const user = getUser();

    const [condominios, setCondominios] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        nome: "",
        cnpj: "",
        endereco: "",
    });

    const isAdmin = user?.tipo === "ADMIN" || user?.is_superuser === true;

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            const condResponse = await api.get("/condominios/");
            const uniResponse = await api.get("/unidades/");

            setCondominios(condResponse.data.results || condResponse.data);
            setUnidades(uniResponse.data.results || uniResponse.data);
        } catch (error) {
            console.log("Erro ao carregar condomínios:", error);
        }
    }

    function contarUnidades(condominioId) {
        return unidades.filter((u) => u.condominio?.id === condominioId).length;
    }

    function abrirNovo() {
        setEditando(null);
        setErro("");
        setForm({
            nome: "",
            cnpj: "",
            endereco: "",
        });
        setModalAberto(true);
    }

    function abrirEditar(item) {
        setEditando(item);
        setErro("");
        setForm({
            nome: item.nome || "",
            cnpj: item.cnpj || "",
            endereco: item.endereco || "",
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

    async function salvarCondominio(e) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        const dados = {
            nome: form.nome,
            cnpj: form.cnpj === "" ? null : form.cnpj,
            endereco: form.endereco,
        };

        try {
            if (editando && editando.id) {
                await api.put(`/condominios/${editando.id}/`, dados);
            } else {
                await api.post("/condominios/", dados);
            }

            carregarDados();
            fecharModal();
        } catch (error) {
            console.log("Erro ao salvar:", error);

            if (error.response) {
                console.log("Status:", error.response.status);
                console.log("Dados:", error.response.data);
            }

            setErro("Não foi possível salvar. Verifique os campos e tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    async function excluirCondominio(item) {
        if (!item?.id) return;

        const confirmar = window.confirm(
            `Deseja realmente excluir o condomínio "${item.nome}"?`
        );

        if (!confirmar) return;

        try {
            await api.delete(`/condominios/${item.id}/`);
            carregarDados();
        } catch (error) {
            console.log("Erro ao excluir:", error);

            alert("Não foi possível excluir o condomínio.");
        }
    }

    function sair() {
        logout();
        navigate("/");
    }

    return (
        <div className="cond-layout">
            <aside className="cond-sidebar">
                <div className="cond-brand">
                    <div className="cond-brand-icon">
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

                    <button className="active">
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

                <div className="cond-user-box">
                    <strong>{user?.username}</strong>
                    <span>{isAdmin ? "Administrador" : "Usuário"}</span>

                    <button onClick={sair} className="cond-logout">
                        <LogOut size={15} />
                        Sair
                    </button>
                </div>
            </aside>

            <main className="cond-main">
                <header className="cond-header">
                    <div>
                        <h1>Condomínios</h1>
                        <p>{condominios.length} cadastrados</p>
                    </div>

                    {isAdmin && (
                        <button className="btn-novo" onClick={abrirNovo}>
                            <Plus size={18} />
                            Novo Condomínio
                        </button>
                    )}
                </header>

                <section className="cond-content">
                    <div className="cond-grid">
                        {condominios.map((item) => (
                            <div className="cond-card" key={item.id}>
                                {isAdmin && (
                                    <div className="card-actions">
                                        <button onClick={() => abrirEditar(item)} title="Editar">
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            onClick={() => excluirCondominio(item)}
                                            title="Excluir"
                                            className="delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}

                                <div className="cond-card-top">
                                    <div className="cond-icon">
                                        <Building2 size={24} />
                                    </div>

                                    <div>
                                        <h2>{item.nome}</h2>
                                        <p>{item.cnpj || "Sem CNPJ"}</p>
                                    </div>
                                </div>

                                <p className="cond-endereco">{item.endereco}</p>

                                <div className="cond-line" />

                                <div className="cond-info">
                                    <span>Unidades</span>
                                    <strong>{contarUnidades(item.id)}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {modalAberto && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>{editando ? "Editar Condomínio" : "Novo Condomínio"}</h2>

                            <button onClick={fecharModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={salvarCondominio}>
                            <label>Nome</label>
                            <input
                                type="text"
                                name="nome"
                                value={form.nome}
                                onChange={handleChange}
                                placeholder="Ex: Residencial Primavera"
                                required
                            />

                            <label>CNPJ</label>
                            <input
                                type="text"
                                name="cnpj"
                                value={form.cnpj}
                                onChange={handleChange}
                                placeholder="Ex: 12.345.678/0001-90"
                            />

                            <label>Endereço</label>
                            <input
                                type="text"
                                name="endereco"
                                value={form.endereco}
                                onChange={handleChange}
                                placeholder="Ex: Rua das Flores, 100 — Campinas/SP"
                                required
                            />

                            {erro && <div className="form-error">{erro}</div>}

                            <div className="modal-actions">
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