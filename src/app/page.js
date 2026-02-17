"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

function normalizeBaseUrl(url) {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export default function Home() {
  const apiBase = useMemo(
    () => normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL),
    []
  );

  const [statusRoot, setStatusRoot] = useState("Pendiente");
  const [statusInfo, setStatusInfo] = useState("Pendiente");
  const [latencyRoot, setLatencyRoot] = useState("-");
  const [latencyInfo, setLatencyInfo] = useState("-");
  const [payload, setPayload] = useState(null);
  const [raw, setRaw] = useState("Sin datos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const rootOk = statusRoot === "Conectado";
  const infoOk = statusInfo === "Conectado";

  async function requestWithTime(path) {
    const start = performance.now();
    const response = await fetch(`${apiBase}${path}`);
    const elapsed = Math.round(performance.now() - start);
    const data = await response.json();
    return { response, data, elapsed };
  }

  function clearResult() {
    setStatusRoot("Pendiente");
    setStatusInfo("Pendiente");
    setLatencyRoot("-");
    setLatencyInfo("-");
    setPayload(null);
    setRaw("Sin datos");
    setError("");
  }

  async function checkApi() {
    if (!apiBase) return;

    setLoading(true);
    clearResult();

    try {
      const root = await requestWithTime("/");
      setStatusRoot(root.response.ok ? "Conectado" : `Error ${root.response.status}`);
      setLatencyRoot(`${root.elapsed} ms`);
    } catch (err) {
      setStatusRoot("Sin conexión");
      setLatencyRoot(err.message);
    }

    try {
      const info = await requestWithTime("/api/info");
      setStatusInfo(info.response.ok ? "Conectado" : `Error ${info.response.status}`);
      setLatencyInfo(`${info.elapsed} ms`);
      setRaw(JSON.stringify(info.data, null, 2));

      if (!info.response.ok) {
        throw new Error("No se pudo obtener /api/info");
      }

      setPayload(info.data);
    } catch (err) {
      setStatusInfo("Sin conexión");
      setError(err.message);
      setRaw(`Error conectando /api/info: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.card}>
          <h1>Demo de conexión API</h1>
          <p>
            Base URL desde <code>NEXT_PUBLIC_API_URL</code>:
          </p>
          <p className={styles.code}>{apiBase || "No configurada"}</p>
          {!apiBase ? (
            <p className={styles.errorText}>
              Define <code>NEXT_PUBLIC_API_URL</code> para habilitar la conexión.
            </p>
          ) : null}
          <div className={styles.actions}>
            <button onClick={checkApi} disabled={!apiBase || loading}>
              {loading ? "Probando..." : "Probar conexión"}
            </button>
            <button onClick={clearResult} className={styles.secondary}>
              Limpiar
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Estado de endpoints</h2>
          <div className={styles.grid}>
            <article className={styles.statusBox}>
              <div className={styles.endpoint}>GET /</div>
              <span className={`${styles.badge} ${rootOk ? styles.ok : styles.neutral}`}>
                {statusRoot}
              </span>
              <small>{latencyRoot}</small>
            </article>
            <article className={styles.statusBox}>
              <div className={styles.endpoint}>GET /api/info</div>
              <span className={`${styles.badge} ${infoOk ? styles.ok : styles.neutral}`}>
                {statusInfo}
              </span>
              <small>{latencyInfo}</small>
            </article>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Respuesta renderizada</h2>
          <p>
            <strong>Nombre:</strong> {payload?.nombre || "-"}
          </p>
          <p>
            <strong>Mensaje:</strong> {payload?.mensaje || "-"}
          </p>
          <p>
            <strong>Versión:</strong> {payload?.version || "-"}
          </p>
          <ul>
            {Array.isArray(payload?.items) && payload.items.length > 0 ? (
              payload.items.map((item) => <li key={item.id}>{`#${item.id} - ${item.titulo}`}</li>)
            ) : (
              <li>Sin datos</li>
            )}
          </ul>
          {error ? <p className={styles.errorText}>{error}</p> : null}
        </section>

        <section className={styles.card}>
          <h2>JSON crudo</h2>
          <pre>{raw}</pre>
        </section>
      </main>
    </div>
  );
}
