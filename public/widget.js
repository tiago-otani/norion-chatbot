/* ============================================================
   Norion Chat Widget
   Embed no site: <script src="https://SEU-APP.up.railway.app/widget.js" defer></script>
   O widget descobre a URL do backend a partir do próprio src.
   ============================================================ */
(function () {
  "use strict";
  if (window.__norionChatLoaded) return;
  window.__norionChatLoaded = true;

  // Base da API = origem do próprio script
  var script =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]');
  var API_BASE = "";
  try {
    API_BASE = new URL(script.src).origin;
  } catch (e) {
    API_BASE = "";
  }

  var BRAND = "#0a4fa3"; // azul Norion
  var BRAND_DARK = "#083b7a";

  // ---------- Estilos ----------
  var css =
    "#nrn-btn{position:fixed;right:20px;bottom:20px;z-index:99998;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;background:" +
    BRAND +
    ";box-shadow:0 4px 16px rgba(8,59,122,.35);display:flex;align-items:center;justify-content:center;transition:transform .15s}" +
    "#nrn-btn:hover{transform:scale(1.06)}" +
    "#nrn-btn svg{width:28px;height:28px;fill:#fff}" +
    "#nrn-panel{position:fixed;right:20px;bottom:90px;z-index:99999;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.22);display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}" +
    "#nrn-panel.open{display:flex}" +
    "#nrn-head{background:linear-gradient(135deg," + BRAND + "," + BRAND_DARK + ");color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}" +
    "#nrn-head .t{font-size:15px;font-weight:600;line-height:1.2}" +
    "#nrn-head .s{font-size:11px;opacity:.85}" +
    "#nrn-close{margin-left:auto;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;padding:4px}" +
    "#nrn-msgs{flex:1;overflow-y:auto;padding:14px;background:#f4f7fb;display:flex;flex-direction:column;gap:10px}" +
    ".nrn-m{max-width:85%;padding:9px 12px;border-radius:12px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-break:break-word}" +
    ".nrn-m a{color:" + BRAND + ";font-weight:600;text-decoration:underline}" +
    ".nrn-bot{background:#fff;border:1px solid #e3e9f2;color:#1c2b3a;align-self:flex-start;border-bottom-left-radius:4px}" +
    ".nrn-user{background:" + BRAND + ";color:#fff;align-self:flex-end;border-bottom-right-radius:4px}" +
    "#nrn-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px;background:#f4f7fb}" +
    ".nrn-chip{border:1px solid " + BRAND + ";color:" + BRAND + ";background:#fff;border-radius:999px;padding:5px 11px;font-size:12px;cursor:pointer}" +
    ".nrn-chip:hover{background:" + BRAND + ";color:#fff}" +
    "#nrn-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e3e9f2;background:#fff}" +
    "#nrn-in{flex:1;border:1px solid #cfd9e6;border-radius:10px;padding:9px 12px;font-size:13.5px;outline:none;resize:none;max-height:90px;font-family:inherit}" +
    "#nrn-in:focus{border-color:" + BRAND + "}" +
    "#nrn-send{border:none;background:" + BRAND + ";color:#fff;border-radius:10px;padding:0 14px;cursor:pointer;font-size:14px}" +
    "#nrn-send:disabled{opacity:.5;cursor:default}" +
    ".nrn-typing{display:inline-flex;gap:4px;padding:10px 12px}" +
    ".nrn-typing i{width:6px;height:6px;border-radius:50%;background:#9db3cc;animation:nrnB 1.2s infinite}" +
    ".nrn-typing i:nth-child(2){animation-delay:.15s}.nrn-typing i:nth-child(3){animation-delay:.3s}" +
    "@keyframes nrnB{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}" +
    "@media(max-width:480px){#nrn-panel{right:8px;bottom:78px;height:70vh}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- Estrutura ----------
  var btn = document.createElement("button");
  btn.id = "nrn-btn";
  btn.setAttribute("aria-label", "Abrir chat da Norion");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M12 3C6.9 3 3 6.5 3 10.8c0 2.4 1.2 4.5 3.2 5.9-.1.9-.5 2.1-1.5 3.3 0 0 2.4-.3 4.3-1.6.9.2 1.9.4 3 .4 5.1 0 9-3.5 9-7.9S17.1 3 12 3z"/></svg>';

  var panel = document.createElement("div");
  panel.id = "nrn-panel";
  panel.innerHTML =
    '<div id="nrn-head"><div><div class="t">Assistente Norion</div><div class="s">Suporte, comercial e d\u00favidas</div></div><button id="nrn-close" aria-label="Fechar">\u00d7</button></div>' +
    '<div id="nrn-msgs"></div>' +
    '<div id="nrn-chips"></div>' +
    '<form id="nrn-form"><textarea id="nrn-in" rows="1" placeholder="Escreva sua mensagem..."></textarea><button id="nrn-send" type="submit">Enviar</button></form>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgsEl = panel.querySelector("#nrn-msgs");
  var chipsEl = panel.querySelector("#nrn-chips");
  var formEl = panel.querySelector("#nrn-form");
  var inputEl = panel.querySelector("#nrn-in");
  var sendEl = panel.querySelector("#nrn-send");

  // ---------- Estado ----------
  var history = [];
  try {
    history = JSON.parse(sessionStorage.getItem("nrn_history") || "[]");
  } catch (e) {}

  var WELCOME =
    "Ol\u00e1! Sou o assistente virtual da Norion. Posso ajudar com suporte t\u00e9cnico, contato comercial, garantias, prazos e muito mais. O que voc\u00ea procura?";
  var CHIPS = [
    "Suporte T\u00e9cnico",
    "Contato Comercial",
    "Drivers e Downloads",
    "Garantia",
    "Quero ser parceiro",
  ];

  // ---------- Helpers ----------
  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function linkify(s) {
    return esc(s).replace(
      /(https?:\/\/[^\s<]+[^\s<.,)!?])/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
  }
  function addMsg(role, text) {
    var d = document.createElement("div");
    d.className = "nrn-m " + (role === "user" ? "nrn-user" : "nrn-bot");
    d.innerHTML = role === "user" ? esc(text) : linkify(text);
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function save() {
    try {
      sessionStorage.setItem("nrn_history", JSON.stringify(history.slice(-16)));
    } catch (e) {}
  }
  function renderChips() {
    chipsEl.innerHTML = "";
    if (history.length > 0) return; // chips só no início
    CHIPS.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "nrn-chip";
      b.textContent = c;
      b.onclick = function () {
        send(c);
      };
      chipsEl.appendChild(b);
    });
  }
  function showTyping() {
    var d = document.createElement("div");
    d.className = "nrn-m nrn-bot nrn-typing";
    d.id = "nrn-tp";
    d.innerHTML = "<i></i><i></i><i></i>";
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById("nrn-tp");
    if (t) t.remove();
  }

  // ---------- Envio ----------
  var busy = false;
  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    sendEl.disabled = true;
    inputEl.value = "";
    addMsg("user", text);
    history.push({ role: "user", content: text });
    save();
    renderChips();
    showTyping();

    fetch(API_BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history.slice(-16),
        page: location.href,
      }),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (res) {
        hideTyping();
        var reply =
          (res.j && (res.j.reply || res.j.error)) ||
          "N\u00e3o consegui responder agora. Fale conosco em https://www.norion.ind.br/contato";
        addMsg("bot", reply);
        if (res.ok && res.j.reply) {
          history.push({ role: "assistant", content: res.j.reply });
          save();
        }
      })
      .catch(function () {
        hideTyping();
        addMsg(
          "bot",
          "Falha de conex\u00e3o. Tente novamente ou fale conosco em https://www.norion.ind.br/contato"
        );
      })
      .finally(function () {
        busy = false;
        sendEl.disabled = false;
        inputEl.focus();
      });
  }

  // ---------- Eventos ----------
  btn.onclick = function () {
    var open = panel.classList.toggle("open");
    if (open && msgsEl.children.length === 0) {
      // restaura histórico ou dá boas-vindas
      if (history.length) {
        history.forEach(function (m) {
          addMsg(m.role === "user" ? "user" : "bot", m.content);
        });
      } else {
        addMsg("bot", WELCOME);
      }
      renderChips();
    }
    if (open) inputEl.focus();
  };
  panel.querySelector("#nrn-close").onclick = function () {
    panel.classList.remove("open");
  };
  formEl.onsubmit = function (e) {
    e.preventDefault();
    send(inputEl.value);
  };
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(inputEl.value);
    }
  });
})();
