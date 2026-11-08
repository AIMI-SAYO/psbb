// Shows the game list. The live list comes first; the copy kept with this site
// is used if the live one cannot be reached.
const SOURCES = ["https://psbb-api.aimisayo.com/games.json", "games.json"];
const box = document.getElementById("games");
const count = document.getElementById("count");
const search = document.getElementById("q");
let games = [];

function size(bytes) {
  if (!bytes) return "";
  return bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
}

function links(g) {
  const base = `http://${g.host}${g.path}`;
  if (!(g.parts > 1) || !base.endsWith("_0.pkg")) return [base];
  const front = base.slice(0, -"_0.pkg".length);
  return Array.from({ length: g.parts }, (_, i) => `${front}_${i}.pkg`);
}

function el(tag, attrs = {}, text) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

function render() {
  const q = search.value.trim().toLowerCase();
  const shown = games.filter((g) => !q || (g.name || "").toLowerCase().includes(q) || (g.titleId || "").toLowerCase().includes(q));
  count.textContent = `${shown.length} of ${games.length}`;
  box.replaceChildren();
  if (!shown.length) {
    box.append(el("div", { class: "empty" }, games.length ? "No game matches that search." : "No games yet. Games appear here as people download them."));
    return;
  }
  for (const g of shown) {
    const row = el("article", { class: "game" });
    const info = el("div");
    info.append(el("h3", {}, g.name || g.titleId));
    const meta = el("div", { class: "meta" });
    const kind = g.version ? `${g.kind} ${g.version}` : g.kind;
    for (const part of [g.platform, g.region, kind, size(g.totalSize), `${g.parts} part${g.parts === 1 ? "" : "s"}`, g.titleId, g.updated ? `seen ${g.updated.slice(0, 10)}` : ""]) {
      if (part) meta.append(el("span", {}, part));
    }
    info.append(meta);
    const buttons = el("div", { class: "buttons" });
    const show = el("button", { class: "button quiet small", type: "button" }, "Show links");
    const copy = el("button", { class: "button small", type: "button" }, "Copy links");
    const list = el("pre", { class: "links" }, links(g).join("\n"));
    show.onclick = () => {
      row.classList.toggle("open");
      show.textContent = row.classList.contains("open") ? "Hide links" : "Show links";
    };
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(links(g).join("\r\n"));
        copy.textContent = "Copied";
      } catch {
        row.classList.add("open");
        copy.textContent = "Select below";
      }
      setTimeout(() => (copy.textContent = "Copy links"), 1800);
    };
    buttons.append(show, copy);
    row.append(info, buttons, list);
    box.append(row);
  }
}

async function load() {
  for (const url of SOURCES) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const data = await r.json();
      if (!Array.isArray(data.games)) continue;
      games = data.games.filter((g) => typeof g.path === "string" && g.path.startsWith("/"));
      render();
      return;
    } catch {}
  }
  box.replaceChildren(el("div", { class: "empty" }, "The list could not be loaded. Try again in a moment."));
}

search.addEventListener("input", render);
load();
