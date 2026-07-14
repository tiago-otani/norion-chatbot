// ============================================================
// Norion Chatbot — servidor
// Faz proxy seguro entre o widget do site e a API do Claude.
// A chave ANTHROPIC_API_KEY fica APENAS aqui (variável de
// ambiente no Railway), nunca no navegador do visitante.
// ============================================================

import express from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ---------- Configuração ----------
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || "claude-sonnet-4-6";
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 700);

// Domínios autorizados a chamar a API (CORS).
// Em produção defina: ALLOWED_ORIGINS=https://www.norion.ind.br,https://norion.ind.br
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Base de conhecimento + persona (prompt do sistema)
const SYSTEM_PROMPT = readFileSync(
  path.join(__dirname, "prompt", "system-prompt.md"),
  "utf-8"
);

// ---------- Middlewares ----------
app.use(express.json({ limit: "50kb" }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Arquivos estáticos: página demo (/) e widget (/widget.js)
app.use(express.static(path.join(__dirname, "public")));

// ---------- Rate limit simples por IP (memória) ----------
const buckets = new Map();
const RATE_LIMIT = Number(process.env.RATE_LIMIT || 20); // msgs por janela
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

function rateLimited(ip) {
  const now = Date.now();
  const b = buckets.get(ip) || { count: 0, start: now };
  if (now - b.start > RATE_WINDOW_MS) {
    b.count = 0;
    b.start = now;
  }
  b.count++;
  buckets.set(ip, b);
  return b.count > RATE_LIMIT;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of buckets) {
    if (now - b.start > RATE_WINDOW_MS) buckets.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

// ---------- Rotas ----------
app.get("/health", (_req, res) => res.json({ ok: true, model: MODEL }));

app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) {
      return res
        .status(500)
        .json({ error: "ANTHROPIC_API_KEY não configurada no servidor." });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    if (rateLimited(ip)) {
      return res.status(429).json({
        error:
          "Muitas mensagens em pouco tempo. Aguarde alguns minutos e tente novamente.",
      });
    }

    // Valida e sanitiza o histórico vindo do widget
    const incoming = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];
    const messages = incoming
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .slice(-16) // mantém só as últimas 16 mensagens (controle de custo)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Mensagem inválida." });
    }

    // Contexto opcional: página onde o visitante está
    const pageUrl =
      typeof req.body?.page === "string" ? req.body.page.slice(0, 300) : "";
    const system = pageUrl
      ? `${SYSTEM_PROMPT}\n\n[Contexto: o visitante está na página ${pageUrl}]`
      : SYSTEM_PROMPT;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Anthropic API error:", r.status, detail.slice(0, 500));
      return res.status(502).json({
        error:
          "Não consegui responder agora. Tente novamente em instantes ou fale conosco em https://www.norion.ind.br/contato",
      });
    }

    const data = await r.json();
    const reply = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.json({ reply });
  } catch (err) {
    console.error("Erro /api/chat:", err);
    res.status(500).json({
      error:
        "Erro interno. Tente novamente ou fale conosco em https://www.norion.ind.br/contato",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Norion Chatbot rodando na porta ${PORT} — modelo: ${MODEL}`);
});
