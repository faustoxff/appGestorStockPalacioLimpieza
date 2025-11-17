import React, { useState } from "react";
import "../styles/main.css";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (usuario.toLowerCase() === "admin" && clave === "1234") {
      localStorage.setItem("usuario_logueado", usuario);
      onLogin(usuario);
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div
      className="login-body"
      style={{ backgroundImage: "url('/assets/logo_sin_texto.png')" }}
    >
      <div className="login-card">
        <h1>Ingreso al sistema</h1>

        <div className="login-inputs">
          <input
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />

          <div className="tooltip-container">
            <button className="btn login-btn" onClick={handleLogin}>
              Ingresar
            </button>
            <div className="tooltip">
              Usuario: <b>admin</b> <br />
              Contraseña: <b>1234</b>
            </div>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        <p className="info">© El Palacio de la Limpieza</p>
      </div>
    </div>
  );
}
