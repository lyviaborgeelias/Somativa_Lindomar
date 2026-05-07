import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Lock, User } from "lucide-react";
import api from "../../api/axios";
import { saveAuth } from "../../utils/auth";
import "./styles.css";

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const tokenResponse = await api.post("/token/", {
                username: form.username,
                password: form.password,
            });

            const access = tokenResponse.data.access;
            const refresh = tokenResponse.data.refresh;

            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);

            const userResponse = await api.get("/usuarios/me/", {
                headers: {
                    Authorization: `Bearer ${access}`,
                },
            });

            const user = userResponse.data;

            saveAuth(access, refresh, user);

            if (user.tipo === "ADMIN" || user.is_superuser === true) {
                navigate("/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            console.log(err);
            setError("Usuário ou senha inválidos.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-icon">
                    <Building2 size={38} />
                </div>

                <h1>Sistema de Cobrança</h1>
                <p>Controle de condomínios, unidades e cobranças</p>

                <form onSubmit={handleSubmit}>
                    <label>Usuário</label>
                    <div className="input-box">
                        <User size={18} />
                        <input
                            type="text"
                            name="username"
                            placeholder="Digite seu usuário"
                            value={form.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label>Senha</label>
                    <div className="input-box">
                        <Lock size={18} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Digite sua senha"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <span className="error">{error}</span>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <div className="login-info">
                    <strong>Admin:</strong> admin2 / 123456 <br />
                    <strong>Usuário:</strong> usuario1 / 123456
                </div>
            </div>
        </div>
    );
}