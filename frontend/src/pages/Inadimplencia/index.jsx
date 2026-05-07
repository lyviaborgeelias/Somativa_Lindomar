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
} from "lucide-react";
import api from "../../api/axios";
import { getUser, logout } from "../../utils/auth";
import "./styles.css";

export default function Inadimplencia() {
    const navigate = useNavigate();
    const user = getUser();

    const [inadimplencia, setInadimplencia] = useState([]);

    const isAdmin = user?.tipo === "ADMIN" || user?.is_superuser === true;

    useEffect(() => {
        carregarInadimplencia();
    }, []);

    async function carregarInadimplencia() {
        try {
            const response = await api.get("/inadimplencia/resumo/");
            setInadimplencia(response.data.results || response.data);
        } catch (error) {
            console.log("Erro ao carregar inadimplência:", error);
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

    const totalEmAtraso = inadimplencia.reduce(
        (total, item) => total + Number(item.valor_total_vencido || 0),
        0
    );

    return (
        <div className="inad-layout">
            <aside className="inad-sidebar">
                <div className="inad-brand">
                    <div className="inad-brand-icon">
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

                    <button className="active">
                        <AlertTriangle size={17} />
                        Inadimplência
                    </button>

                    <button onClick={() => navigate("/acordos")}>
                        <FileText size={17} />
                        Acordos
                    </button>
                </nav>

                <div className="inad-user-box">
                    <strong>{user?.username}</strong>
                    <span>{isAdmin ? "Administrador" : "Usuário"}</span>

                    <button onClick={sair} className="inad-logout">
                        <LogOut size={15} />
                        Sair
                    </button>
                </div>
            </aside>

            <main className="inad-main">
                <header className="inad-header">
                    <h1>Inadimplência</h1>
                    <p>Total em atraso: {dinheiro(totalEmAtraso)}</p>
                </header>

                <section className="inad-content">
                    <div className="inad-grid">
                        {inadimplencia.map((item, index) => (
                            <div className="inad-card" key={index}>
                                <div className="inad-card-top">
                                    <div className="inad-icon">
                                        <AlertTriangle size={22} />
                                    </div>

                                    <h2>{item.condominio}</h2>
                                </div>

                                <h3>{dinheiro(item.valor_total_vencido)}</h3>

                                <p>
                                    {item.qtd_cobrancas_vencidas}{" "}
                                    {item.qtd_cobrancas_vencidas === 1
                                        ? "cobrança vencida"
                                        : "cobranças vencidas"}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}