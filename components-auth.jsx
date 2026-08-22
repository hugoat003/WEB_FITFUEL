import React from "react";
const { useState, useEffect } = React;

/* ── Modal login / registro ─────────────────────────────── */
function AuthModal({ onClose }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const reset = (t) => { setTab(t); setError(""); setDone(""); };

  const handleLogin = async (e) => {
    e.preventDefault();
    const rl = rateLimit("ff_rl_login", 6, 5 * 60 * 1000); // 6 intentos / 5 min
    if (!rl.ok) { setError(`Demasiados intentos. Espera ${Math.ceil(rl.retryMs / 60000)} min.`); return; }
    const f = new FormData(e.target);
    setLoading(true); setError("");
    const { error } = await sb.auth.signInWithPassword({
      email: f.get("email"), password: f.get("password"),
    });
    setLoading(false);
    if (error) { setError("Correo o contraseña incorrectos"); return; }
    onClose();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (f.get("password") !== f.get("confirm")) { setError("Las contraseñas no coinciden"); return; }
    const rl = rateLimit("ff_rl_register", 4, 15 * 60 * 1000); // 4 registros / 15 min
    if (!rl.ok) { setError(`Demasiados intentos. Espera ${Math.ceil(rl.retryMs / 60000)} min.`); return; }
    setLoading(true); setError("");
    const { error } = await sb.auth.signUp({
      email: f.get("email"),
      password: f.get("password"),
      options: { data: { full_name: f.get("nombre") } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone("¡Cuenta creada! Revisa tu correo para confirmarla.");
  };

  const handleGoogle = () => {
    // Volver a la MISMA dirección desde la que se abrió el sitio (p. ej. la IP de
    // la red local en el móvil), no a la "Site URL" por defecto de Supabase, que
    // suele ser localhost y en el iPhone apunta al propio teléfono → no conecta.
    sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const rl = rateLimit("ff_rl_forgot", 4, 15 * 60 * 1000); // 4 intentos / 15 min
    if (!rl.ok) { setError(`Demasiados intentos. Espera ${Math.ceil(rl.retryMs / 60000)} min.`); return; }
    setLoading(true); setError("");
    // Supabase manda un enlace de recuperación; al volver, detectSessionInUrl dispara
    // el evento PASSWORD_RECOVERY (lo escucha app.jsx → abre el modal de nueva contraseña).
    const { error } = await sb.auth.resetPasswordForEmail(f.get("email"), {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone("Si el correo existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).");
  };

  const trapRef = useFocusTrap(true, onClose);

  return (
    <>
      <div className="auth-scrim" onClick={onClose} />
      <div className="auth-modal" role="dialog" aria-modal="true" ref={trapRef}>
        <button className="icon-btn auth-close" onClick={onClose} aria-label="Cerrar">
          <Icon name="x" size={18} />
        </button>

        <img src="/logo-mark.png" alt="FITFUEL" className="auth-logo-img" />

        <div className="auth-tabs">
          <button className={tab === "login" ? "on" : ""} onClick={() => reset("login")}>Iniciar sesión</button>
          <button className={tab === "register" ? "on" : ""} onClick={() => reset("register")}>Crear cuenta</button>
        </div>

        {done ? (
          <div className="auth-success">
            <Icon name="check" size={22} stroke={3} />
            <p>{done}</p>
          </div>
        ) : tab === "forgot" ? (
          <form className="auth-form" onSubmit={handleForgot}>
            <p className="auth-promo-note" style={{ marginTop: 0 }}>
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>
            <label>Correo electrónico<input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" /></label>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
            <button type="button" className="link-x" style={{ display: "block", margin: "12px auto 0" }} onClick={() => reset("login")}>
              ← Volver a iniciar sesión
            </button>
          </form>
        ) : tab === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>Correo electrónico<input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" /></label>
            <label>Contraseña<input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" /></label>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? "Entrando…" : "Iniciar sesión"}
            </button>
            <button type="button" className="link-x" style={{ display: "block", margin: "12px auto 0" }} onClick={() => reset("forgot")}>
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label>Nombre completo<input name="nombre" type="text" required autoComplete="name" placeholder="Tu nombre" /></label>
            <label>Correo electrónico<input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" /></label>
            <label>Contraseña<input name="password" type="password" required autoComplete="new-password" placeholder="Mínimo 6 caracteres" minLength={6} /></label>
            <label>Confirmar contraseña<input name="confirm" type="password" required autoComplete="new-password" placeholder="Repite la contraseña" /></label>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
            <p className="auth-promo-note">
              Al registrarte recibirás el código <b>BIENVENIDO10</b> — 10% en tu primera compra.
            </p>
          </form>
        )}

        {!done && tab !== "forgot" && (
          <>
            <div className="auth-divider"><span>o</span></div>
            <button className="btn btn-ghost btn-block auth-google" onClick={handleGoogle}>
              <svg width="17" height="17" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ── Menú de usuario (logged in) ────────────────────────── */
function UserMenu({ user, onClose }) {
  const nombre = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario";

  const handleLogout = async () => {
    await sb.auth.signOut();
    onClose();
  };

  return (
    <>
      <div className="umenu-scrim" onClick={onClose} />
      <div className="umenu">
        <div className="umenu-head">
          <div className="umenu-avatar"><span>{nombre[0].toUpperCase()}</span></div>
          <div>
            <b>{nombre}</b>
            <span>{user.email}</span>
          </div>
        </div>
        <nav className="umenu-nav">
          <a href="/cuenta" onClick={onClose}><Icon name="user" size={15} /> Mi cuenta</a>
          <a href="/cuenta/pedidos" onClick={onClose}><Icon name="package" size={15} /> Mis pedidos</a>
          <a href="/cuenta/favoritos" onClick={onClose}><Icon name="heart" size={15} /> Favoritos</a>
        </nav>
        <button className="btn btn-ghost btn-block btn-sm" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

/* ── Modal: nueva contraseña (tras clic en el enlace de recuperación) ────── */
function ResetPasswordModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const trapRef = useFocusTrap(true, onClose);

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const pw = (f.get("password") || "").toString();
    if (pw.length < 6) { setError("Mínimo 6 caracteres"); return; }
    if (pw !== f.get("confirm")) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); setError("");
    const { error } = await sb.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  };

  return (
    <>
      <div className="auth-scrim" onClick={onClose} />
      <div className="auth-modal" role="dialog" aria-modal="true" ref={trapRef}>
        <button className="icon-btn auth-close" onClick={onClose} aria-label="Cerrar">
          <Icon name="x" size={18} />
        </button>
        <img src="/logo-mark.png" alt="FITFUEL" className="auth-logo-img" />
        <h3 style={{ textAlign: "center", fontFamily: "var(--font-display)", fontSize: 20, margin: "4px 0 16px" }}>
          Nueva contraseña
        </h3>
        {done ? (
          <div className="auth-success">
            <Icon name="check" size={22} stroke={3} />
            <p>¡Listo! Tu contraseña se actualizó. Ya puedes iniciar sesión con ella.</p>
            <button className="btn btn-primary btn-block" onClick={onClose} style={{ marginTop: 12 }}>Continuar</button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>Nueva contraseña<input name="password" type="password" required autoComplete="new-password" placeholder="Mínimo 6 caracteres" minLength={6} /></label>
            <label>Confirmar contraseña<input name="confirm" type="password" required autoComplete="new-password" placeholder="Repite la contraseña" /></label>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

Object.assign(window, { AuthModal, UserMenu, ResetPasswordModal });
