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

export default function Cobrancas() {
    const navigate = useNavigate();
    const user = getUser();

    const [cobrancas, setCobrancas] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [condominios, setCondominios] = useState([]);

    const [filtroStatus, setFiltroStatus] = useState("");
    const [filtroCondominio, setFiltroCondominio] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        unidade_id: "",
        competencia: "",
        data_vencimento: "",
        valor: "",
        status: "PENDENTE",
        data_pagamento: "",
        forma_pagamento: "",
    });

    const isAdmin = user?.tipo === "ADMIN" || user?.is_superuser === true;

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            const cobResponse = await api.get("/cobrancas/");
            const uniResponse = await api.get("/unidades/");
            const condResponse = await api.get("/condominios/");

            setCobrancas(cobResponse.data.results || cobResponse.data);
            setUnidades(uniResponse.data.results || uniResponse.data);
            setCondominios(condResponse.data.results || condResponse.data);
        } catch (error) {
            console.log("Erro ao carregar cobranças:", error);
        }
    }

    const cobrancasFiltradas = cobrancas.filter((item) => {
        const statusOk = filtroStatus ? item.status === filtroStatus : true;

        const condominioOk = filtroCondominio
            ? item.unidade?.condominio?.id === Number(filtroCondominio)
            : true;

        return statusOk && condominioOk;
    });

    function abrirNovo() {
        setEditando(null);
        setErro("");

        setForm({
            unidade_id: unidades[0]?.id || "",
            competencia: "",
            data_vencimento: "",
            valor: "",
            status: "PENDENTE",
            data_pagamento: "",
            forma_pagamento: "",
        });

        setModalAberto(true);
    }

    function abrirEditar(item) {
        setEditando(item);
        setErro("");

        setForm({
            unidade_id: item.unidade?.id || "",
            competencia: item.competencia || "",
            data_vencimento: item.data_vencimento || "",
            valor: item.valor || "",
            status: item.status || "PENDENTE",
            data_pagamento: item.data_pagamento || "",
            forma_pagamento: item.forma_pagamento || "",
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

    async function salvarCobranca(e) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        const dados = {
            unidade_id: Number(form.unidade_id),
            competencia: form.competencia,
            data_vencimento: form.data_vencimento,
            valor: form.valor,
            status: form.status,
            data_pagamento: form.data_pagamento || null,
            forma_pagamento: form.forma_pagamento || null,
        };

        if (dados.status !== "PAGO") {
            dados.data_pagamento = null;
            dados.forma_pagamento = null;
        }

        try {
            if (editando && editando.id) {
                await api.put(`/cobrancas/${editando.id}/`, dados);
            } else {
                await api.post("/cobrancas/", dados);
            }

            await carregarDados();
            fecharModal();
        } catch (error) {
            console.log("Erro ao salvar cobrança:", error.response?.data || error);
            setErro("Não foi possível salvar. Verifique os campos.");
        } finally {
            setLoading(false);
        }
    }

    async function excluirCobranca(item) {
        const confirmar = window.confirm(
            `Deseja realmente excluir a cobrança #${item.id}?`
        );

        if (!confirmar) return;

        try {
            await api.delete(`/cobrancas/${item.id}/`);
            await carregarDados();
        } catch (error) {
            console.log("Erro ao excluir cobrança:", error);
            alert("Não foi possível excluir a cobrança.");
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

    function competenciaBR(data) {
        if (!data) return "—";
        const [ano, mes] = data.split("-");
        return `${mes}/${ano}`;
    }

    return (
        <div className="cob-layout">
            <aside className="cob-sidebar">
                <div className="cob-brand">
                    <div className="cob-brand-icon">
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

                    <button className="active">
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

                <div className="cob-user-box">
                    <strong>{user?.username}</strong>
                    <span>{isAdmin ? "Administrador" : "Usuário"}</span>

                    <button onClick={sair} className="cob-logout">
                        <LogOut size={15} />
                        Sair
                    </button>
                </div>
            </aside>

            <main className="cob-main">
                <header className="cob-header">
                    <div>
                        <h1>Cobranças</h1>
                        <p>Emissão, vencimentos e pagamentos</p>
                    </div>

                    {isAdmin && (
                        <button className="btn-novo-cob" onClick={abrirNovo}>
                            <Plus size={18} />
                            Nova Cobrança
                        </button>
                    )}
                </header>

                <section className="cob-content">
                    <div className="cob-filtros">
                        <div>
                            <select
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value)}
                            >
                                <option value="">TODOS</option>
                                <option value="PENDENTE">PENDENTE</option>
                                <option value="PAGO">PAGO</option>
                                <option value="VENCIDO">VENCIDO</option>
                                <option value="CANCELADO">CANCELADO</option>
                            </select>

                            <select
                                value={filtroCondominio}
                                onChange={(e) => setFiltroCondominio(e.target.value)}
                            >
                                <option value="">Todos os condomínios</option>
                                {condominios.map((cond) => (
                                    <option key={cond.id} value={cond.id}>
                                        {cond.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span>{cobrancasFiltradas.length} cobranças</span>
                    </div>

                    <div className="cob-table-card">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Unidade</th>
                                    <th>Competência</th>
                                    <th>Vencimento</th>
                                    <th>Valor</th>
                                    <th>Multa/Juros</th>
                                    <th>Status</th>
                                    <th>Pagamento</th>
                                    {isAdmin && <th>Ações</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {cobrancasFiltradas.map((item) => (
                                    <tr key={item.id}>
                                        <td>#{item.id}</td>

                                        <td>
                                            <strong>
                                                {item.unidade?.bloco ? `${item.unidade.bloco}-` : ""}
                                                {item.unidade?.numero} · {item.unidade?.responsavel}
                                            </strong>
                                        </td>

                                        <td>{competenciaBR(item.competencia)}</td>
                                        <td>{dataBR(item.data_vencimento)}</td>

                                        <td>
                                            <strong>{dinheiro(item.valor)}</strong>
                                        </td>

                                        <td className="muted">
                                            {dinheiro(item.multa)} / {dinheiro(item.juros)}
                                        </td>

                                        <td>
                                            <span className={`cob-status ${item.status?.toLowerCase()}`}>
                                                {item.status}
                                            </span>
                                        </td>

                                        <td>{item.forma_pagamento || "—"}</td>

                                        {isAdmin && (
                                            <td>
                                                <div className="cob-actions">
                                                    <button onClick={() => abrirEditar(item)}>
                                                        <Pencil size={15} />
                                                    </button>

                                                    <button
                                                        className="delete"
                                                        onClick={() => excluirCobranca(item)}
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
                <div className="cob-modal-overlay">
                    <div className="cob-modal-card">
                        <div className="cob-modal-header">
                            <h2>{editando ? "Editar Cobrança" : "Nova Cobrança"}</h2>

                            <button onClick={fecharModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={salvarCobranca}>
                            <label>Unidade</label>
                            <select
                                name="unidade_id"
                                value={form.unidade_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione</option>
                                {unidades.map((uni) => (
                                    <option key={uni.id} value={uni.id}>
                                        {uni.numero} - {uni.responsavel} ({uni.condominio?.nome})
                                    </option>
                                ))}
                            </select>

                            <label>Competência</label>
                            <input
                                type="date"
                                name="competencia"
                                value={form.competencia}
                                onChange={handleChange}
                                required
                            />

                            <label>Data de vencimento</label>
                            <input
                                type="date"
                                name="data_vencimento"
                                value={form.data_vencimento}
                                onChange={handleChange}
                                required
                            />

                            <label>Valor</label>
                            <input
                                type="number"
                                step="0.01"
                                name="valor"
                                value={form.valor}
                                onChange={handleChange}
                                required
                            />

                            <label>Status</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="PENDENTE">PENDENTE</option>
                                <option value="PAGO">PAGO</option>
                                <option value="VENCIDO">VENCIDO</option>
                                <option value="CANCELADO">CANCELADO</option>
                            </select>

                            {form.status === "PAGO" && (
                                <>
                                    <label>Data de pagamento</label>
                                    <input
                                        type="date"
                                        name="data_pagamento"
                                        value={form.data_pagamento}
                                        onChange={handleChange}
                                        required
                                    />

                                    <label>Forma de pagamento</label>
                                    <select
                                        name="forma_pagamento"
                                        value={form.forma_pagamento}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        <option value="PIX">PIX</option>
                                        <option value="BOLETO">BOLETO</option>
                                        <option value="CARTAO">CARTAO</option>
                                    </select>
                                </>
                            )}

                            {erro && <div className="cob-form-error">{erro}</div>}

                            <div className="cob-modal-actions">
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