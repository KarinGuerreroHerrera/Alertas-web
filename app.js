
const app = document.querySelector("#app");

const state = {
  authed: false,
  screen: "login",           // login | register | forgot | forgotSent | alerts | newAlert | today | map | profile | stats
  user: { nombre: "Laura", apellido: "Gómez", email: "laura@unal.edu.co" },
  accessibility: { contraste: false, fuente: "Mediano" },
  alerts: [],                 // items created from "Tus alertas" empty state
  geocercas: [
    { id: 1, place: "U. Nacional", task: "Entregar trabajo", radius: 50, notif: "Vibración", day: "Mié 26" },
    { id: 2, place: "Gimnasio", task: "Ir al gym", radius: 50, notif: "Vibración", day: "Vie 28" },
    { id: 3, place: "Casa", task: "Comprar ingredientes", radius: 50, notif: "Vibración", day: "Mar 25" },
  ],
  modal: null,                
  toast: null,
  draft: freshDraft(),
  editingGeocerca: null,
};

function freshDraft() {
  return { trigger: "ubicacion", place: "Universidad Nacional de Colombia", radius: 50, radiusLabel: "50m", task: "Entregar trabajo", notif: "Vibración" };
}

const NAV = [
  ["alerts", "Alerta"],
  ["today", "Hoy"],
  ["map", "Mapa de geocercas"],
  ["profile", "Perfil"],
];

function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function go(screen) { state.screen = screen; state.modal = null; render(); window.scrollTo(0, 0); }
function openModal(type, payload) { state.modal = { type, payload }; render(); }
function closeModal() { state.modal = null; render(); }
function showToast(msg) {
  state.toast = msg;
  render();
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { state.toast = null; render(); }, 2400);
}


function initials(name, last) { return (name[0] || "") + (last ? last[0] : ""); }

function shell(innerHtml, activeRoute) {
  const navBtns = NAV.map(([r, l]) =>
    `<button class="${activeRoute === r ? "active" : ""}" onclick="go('${r}')"><span class="dot"></span>${l}</button>`
  ).join("");
  const navBtnsMobile = NAV.map(([r, l]) =>
    `<button class="${activeRoute === r ? "active" : ""}" onclick="go('${r}')">${l}</button>`
  ).join("");
  return `
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">Alerta</div>
      <div class="nav">${navBtns}</div>
      <div class="userbox">
        <div class="avatar">${esc(initials(state.user.nombre, state.user.apellido))}</div>
        <div><b>${esc(state.user.nombre)}</b><div class="muted">Todo sincronizado</div></div>
      </div>
    </aside>
    <main class="main">
      <div class="mobile-topbar">
        <div class="brand">Alerta</div>
        <div class="avatar">${esc(initials(state.user.nombre, state.user.apellido))}</div>
      </div>
      <div class="mobile-nav">${navBtnsMobile}</div>
      <div class="content">${innerHtml}</div>
    </main>
  </div>`;
}


function mapSvg({ radius = 50, label = "" } = {}) {
  const r = Math.max(28, Math.min(110, 28 + radius * 0.16));
  return `
  <div class="mapwrap">
    <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="landG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#eef2ee"/>
          <stop offset="1" stop-color="#e6ecea"/>
        </linearGradient>
      </defs>
      <rect width="600" height="300" fill="url(#landG)"/>
      <!-- park -->
      <rect x="20" y="20" width="150" height="95" rx="6" fill="#dcecd9"/>
      <rect x="430" y="180" width="150" height="105" rx="6" fill="#dcecd9"/>
      <!-- blocks -->
      <g fill="#ffffff" stroke="#d7dde0" stroke-width="1.5">
        <rect x="200" y="20" width="90" height="70" rx="4"/>
        <rect x="310" y="20" width="120" height="70" rx="4"/>
        <rect x="200" y="150" width="90" height="60" rx="4"/>
        <rect x="310" y="150" width="60" height="60" rx="4"/>
        <rect x="20" y="150" width="150" height="60" rx="4"/>
        <rect x="440" y="20" width="140" height="130" rx="4"/>
        <rect x="200" y="230" width="200" height="50" rx="4"/>
      </g>
      <!-- roads -->
      <g stroke="#f5f6f7" stroke-width="10">
        <line x1="0" y1="130" x2="600" y2="130"/>
        <line x1="0" y1="225" x2="600" y2="225"/>
        <line x1="195" y1="0" x2="195" y2="300"/>
        <line x1="400" y1="0" x2="400" y2="300"/>
      </g>
      <g stroke="#e3e6e8" stroke-width="1">
        <line x1="0" y1="130" x2="600" y2="130"/>
        <line x1="0" y1="225" x2="600" y2="225"/>
        <line x1="195" y1="0" x2="195" y2="300"/>
        <line x1="400" y1="0" x2="400" y2="300"/>
      </g>
      <!-- geofence -->
      <circle cx="300" cy="150" r="${r}" fill="rgba(52,201,138,.12)" stroke="#34c98a" stroke-width="2" stroke-dasharray="6 5"/>
      <!-- pin -->
      <circle cx="300" cy="150" r="9" fill="#34c98a" stroke="#fff" stroke-width="3"/>
      <circle cx="300" cy="150" r="9" fill="none" stroke="#1e2939" stroke-width="1.4"/>
    </svg>
    ${label ? `<div class="map-badge"><span class="sw"></span>${esc(label)}</div>` : ""}
    <div class="map-zoom"><button type="button">+</button><button type="button">–</button></div>
  </div>`;
}


function screenLogin() {
  app.innerHTML = `
  <div class="auth"><div class="authcard">
    <div class="logo">A</div>
    <h1>Inicio Sesión</h1>
    <p class="sub">Ingresa con tu cuenta</p>
    <div class="stack">
      <div class="field"><label>Email</label><input id="li-email" value="laura@unal.edu.co"></div>
      <div class="field"><label>Contraseña</label><input id="li-pass" type="password" value="12345678"></div>
      <button class="btn primary block" onclick="doLogin()">Iniciar sesión</button>
      <div class="auth-links">
        <button class="link-muted" onclick="go('register')">Crear Cuenta</button>
        <button class="link-muted" onclick="go('forgot')">Olvidé mi contraseña</button>
      </div>
    </div>
  </div></div>`;
}

function doLogin() {
  const email = document.querySelector("#li-email").value.trim();
  if (!email) { showToast("Ingresa tu correo"); return; }
  state.authed = true;
  go("alerts");
}

function screenRegister() {
  app.innerHTML = `
  <div class="auth"><div class="authcard">
    <div class="logo">A</div>
    <h1>Crear Cuenta</h1>
    <p class="sub">Crea tu cuenta para sincronizar alertas</p>
    <div class="stack">
      <div class="grid2">
        <div class="field"><label>Nombre</label><input id="rg-nombre" value="Laura"></div>
        <div class="field"><label>Apellido</label><input id="rg-apellido" value="Gómez"></div>
      </div>
      <div class="field"><label>Email</label><input id="rg-email" placeholder="correo@ejemplo.com"></div>
      <div class="field"><label>Contraseña</label><input id="rg-pass" type="password" placeholder="Mínimo 8 caracteres"></div>
      <button class="btn primary block" onclick="doRegister()">Crear cuenta</button>
      <div class="auth-links">
        <button class="link-muted" onclick="go('login')">Volver a Log In</button>
      </div>
    </div>
  </div></div>`;
}

function doRegister() {
  const nombre = document.querySelector("#rg-nombre").value.trim() || "Laura";
  const apellido = document.querySelector("#rg-apellido").value.trim() || "Gómez";
  const email = document.querySelector("#rg-email").value.trim();
  if (!email) { showToast("Ingresa tu correo"); return; }
  state.user = { nombre, apellido, email };
  state.authed = true;
  go("alerts");
}

function screenForgot() {
  app.innerHTML = `
  <div class="auth"><div class="authcard">
    <h1>Reestablecer contraseña</h1>
    <p class="sub">Te enviaremos un enlace seguro</p>
    <div class="stack">
      <div class="field"><label>Correo electrónico</label><input id="fp-email" value="laura@unal.edu.co"></div>
      <button class="btn primary block" onclick="doForgot()">Enviar enlace</button>
      <button class="btn block" onclick="go('login')">Volver a Log In</button>
    </div>
  </div></div>`;
}

function doForgot() {
  go("forgotSent");
}

function screenForgotSent() {
  app.innerHTML = `
  <div class="auth"><div class="authcard" style="text-align:center">
    <div class="modal-icon" style="margin:0 auto 16px">✓</div>
    <h1>Enlace enviado</h1>
    <p class="sub">Revisa ${esc(state.user.email)} para continuar con el restablecimiento.</p>
    <button class="btn primary block" onclick="go('login')">Volver a Log In</button>
  </div></div>`;
}


function screenAlerts() {
  const header = `
    <div class="row">
      <div><h1 class="title">Tus alertas</h1><p class="muted">Todo sincronizado</p></div>
      ${state.alerts.length ? `<button class="btn primary" onclick="startNewAlert()">+ Crear alerta</button>` : ""}
    </div>`;

  const body = state.alerts.length
    ? `<div class="stack" style="margin-top:24px">${state.alerts.map(a => `
        <div class="card row center">
          <div>
            <b>${esc(a.task)}</b>
            <div class="muted">${esc(a.place)} · radio ${a.radius}m · ${esc(a.notif)}</div>
          </div>
          <button class="btn small danger-ghost" onclick="removeAlert(${a.id})">Eliminar</button>
        </div>`).join("")}</div>`
    : `<div class="card empty-state">
        <div class="empty-ring"></div>
        <h2>Aún no tienes alertas</h2>
        <p>Crea tu primera alerta por ubicación o por tarea.</p>
        <button class="btn primary" onclick="startNewAlert()">+ Crear primera alerta</button>
      </div>`;

  app.innerHTML = shell(header + body, "alerts");
}

function startNewAlert() {
  state.draft = freshDraft();
  go("newAlert");
}

function removeAlert(id) {
  state.alerts = state.alerts.filter(a => a.id !== id);
  render();
}

function screenNewAlert() {
  const d = state.draft;
  const html = `
    <div class="card">
      <p class="muted" style="margin-bottom:6px">Nueva alerta · configuración completa</p>
      <h1 class="title">¿Cómo quieres que te avise?</h1>

      <div class="section-title">1. Selecciona el disparador</div>
      <div class="grid2">
        <div class="trigger ${d.trigger === "ubicacion" ? "selected" : ""}" onclick="setDraft('trigger','ubicacion')">
          <b>Por ubicación (geocerca)</b><p class="muted">Se activa al llegar o salir de un lugar</p>
        </div>
        <div class="trigger ${d.trigger === "tarea" ? "selected" : ""}" onclick="setDraft('trigger','tarea')">
          <b>Por tarea o acción</b><p class="muted">Se activa a una hora fija</p>
        </div>
      </div>

      ${d.trigger === "ubicacion" ? `
      <div class="section-title">2. Elige la ubicación</div>
      <div class="field"><label>Buscar lugar</label>
        <input id="na-place" value="${esc(d.place)}" oninput="setDraft('place',this.value)" placeholder="Busca una dirección o lugar">
      </div>
      ${mapSvg({ radius: d.radius, label: d.place })}

      <div class="section-title">3. ¿Qué tan cerca debe estar?</div>
      <div class="radius-row">
        ${["Punto exacto", "20m", "50m", "100m", "Personalizado"].map(x => `
          <button type="button" class="chip-btn ${d.radiusLabel === x ? "selected" : ""}" onclick="setRadiusChip('${x}')">${x}</button>
        `).join("")}
      </div>
      <input type="range" min="0" max="500" value="${d.radius}" oninput="setDraftRadius(this.value)">
      <div class="row"><span class="muted">Exacto</span><span class="muted">500m</span></div>
      ` : `
      <div class="section-title">2. ¿Cuándo se activa?</div>
      <div class="field"><label>Hora</label><input id="na-time" type="time" value="18:00"></div>
      `}

      <div class="card soft" style="margin-top:24px">
        <h2 class="section-title" style="margin-top:0">Detalles de la tarea</h2>
        <div class="field"><label>Nombre de la tarea</label>
          <input id="na-task" value="${esc(d.task)}" oninput="setDraft('task',this.value)">
        </div>
        <div style="margin-top:16px">
          <b style="font-size:13.5px">Perfil de notificación</b>
          <div class="options">
            ${["Silencio", "Vibración", "Sonido"].map(n => `
              <label><input type="radio" name="notif" value="${n}" ${d.notif === n ? "checked" : ""} onchange="setDraft('notif','${n}')"> ${n}</label>
            `).join("")}
          </div>
        </div>
        <button class="btn primary block" style="margin-top:18px" onclick="createAlert()">Crear alerta</button>
      </div>
    </div>`;
  app.innerHTML = shell(html, "alerts");
}

function setDraft(key, value) { state.draft[key] = value; render(); }
function setDraftRadius(v) {
  state.draft.radius = Number(v);
  state.draft.radiusLabel = "Personalizado";
  render();
}
function setRadiusChip(label) {
  const map = { "Punto exacto": 0, "20m": 20, "50m": 50, "100m": 100 };
  state.draft.radiusLabel = label;
  if (label in map) state.draft.radius = map[label];
  render();
}

function createAlert() {
  const d = state.draft;
  if (!d.task.trim()) { showToast("Ponle un nombre a la tarea"); return; }
  const id = Date.now();
  const newAlert = { id, task: d.task, place: d.trigger === "ubicacion" ? d.place : "Hora fija", radius: d.radius, notif: d.notif };
  state.alerts.push(newAlert);
  if (d.trigger === "ubicacion") {
    state.geocercas.push({ id, place: d.place, task: d.task, radius: d.radius, notif: d.notif, day: "" });
  }
  openModal("created", newAlert);
}

function modalCreated(a) {
  return `
  <div class="overlay">
    <div class="modal-card">
      <div class="modal-icon">✓</div>
      <h1 style="font-size:22px">¡Alerta creada!</h1>
      <p class="muted">Sincronizando con tu celular…</p>
      <div class="summary-box">
        <div class="r"><span>Lugar</span><b>${esc(a.place)}</b></div>
        <div class="r"><span>Radio</span><b>${a.radius} m</b></div>
        <div class="r"><span>Tarea</span><b>${esc(a.task)}</b></div>
        <div class="r"><span>Notif.</span><b>${esc(a.notif)}</b></div>
      </div>
      <button class="btn primary block" onclick="closeModal();go('alerts')">Listo</button>
    </div>
  </div>`;
}


function screenToday() {
  const days = ["Lun 24", "Mar 25", "Mié 26", "Jue 27", "Vie 28", "Sáb 29", "Dom 30"];
  const byDay = Object.fromEntries(days.map(d => [d, []]));
  state.geocercas.forEach(g => { if (g.day && byDay[g.day]) byDay[g.day].push(g.task); });
  const upcoming = state.geocercas.filter(g => g.day);

  const html = `
    <div class="row">
      <div><h1 class="title">Hola, ${esc(state.user.nombre)}</h1><p class="muted">Semana del 24 al 30 de agosto</p></div>
      <button class="btn primary" onclick="startNewAlert()">Nueva alerta</button>
    </div>
    <div class="week">
      ${days.map(d => `
        <div class="day ${d === "Mié 26" ? "today" : ""}">
          <b>${d}</b>
          ${byDay[d].map(t => `<div class="chip">${esc(t)}</div>`).join("")}
        </div>`).join("")}
    </div>
    <div class="grid2" style="margin-top:22px">
      <div class="card">
        <h3 style="margin-bottom:10px">Próximas alertas</h3>
        ${upcoming.length ? upcoming.map(g => `<p class="muted" style="margin:6px 0">${esc(g.task)} — ${esc(g.place)}</p>`).join("")
          : `<p class="muted">No tienes alertas próximas.</p>`}
      </div>
      <div class="card">
        <h3 style="margin-bottom:10px">Geocercas activas</h3>
        <div style="font-size:28px;font-weight:800">${state.geocercas.length} lugares</div>
        <button class="btn" style="margin-top:12px" onclick="go('map')">Ver en el mapa →</button>
      </div>
    </div>`;
  app.innerHTML = shell(html, "today");
}


function screenMap() {
  const html = `
    <div class="row">
      <div><h1 class="title">Mapa y geocercas</h1><p class="muted">Visualiza y administra tus lugares activos.</p></div>
      <button class="btn primary" onclick="startNewGeocerca()">Nueva geocerca</button>
    </div>
    ${mapSvg({ radius: 60, label: state.geocercas[0] ? state.geocercas[0].place : "" })}
    <div class="section-title">Geocercas activas</div>
    ${state.geocercas.length ? state.geocercas.map(g => `
      <div class="list-row">
        <div class="meta"><b>${esc(g.place)}</b><div class="muted">${esc(g.task)} · radio ${g.radius}m</div></div>
        <div class="actions">
          <button class="btn small mint" onclick="startEditGeocerca(${g.id})">Editar</button>
          <button class="btn small danger-ghost" onclick="confirmDeleteGeocerca(${g.id})">Eliminar</button>
        </div>
      </div>`).join("") : `<p class="muted">No tienes geocercas activas todavía.</p>`}
  `;
  app.innerHTML = shell(html, "map");
}

function startNewGeocerca() {
  openModal("newGeocerca", { place: "", task: "", radius: 50, notif: "Vibración" });
}

function modalNewGeocerca(p) {
  return `
  <div class="overlay">
    <div class="modal-card left">
      <h1 style="font-size:21px;margin-bottom:4px">Nueva geocerca</h1>
      <p class="muted" style="margin-bottom:16px">Define un lugar y la tarea asociada.</p>
      <div class="field"><label>Lugar</label><input id="ng-place" class="plain" placeholder="Ej. Biblioteca Central" value="${esc(p.place)}"></div>
      <div class="field"><label>Tarea asociada</label><input id="ng-task" class="plain" placeholder="Ej. Devolver libro" value="${esc(p.task)}"></div>
      <div class="field"><label>Radio (m)</label><input id="ng-radius" class="plain" type="number" min="10" max="500" value="${p.radius}"></div>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn block" onclick="closeModal()">Cancelar</button>
        <button class="btn primary block" onclick="saveNewGeocerca()">Crear geocerca</button>
      </div>
    </div>
  </div>`;
}

function saveNewGeocerca() {
  const place = document.querySelector("#ng-place").value.trim();
  const task = document.querySelector("#ng-task").value.trim();
  const radius = Number(document.querySelector("#ng-radius").value) || 50;
  if (!place || !task) { showToast("Completa lugar y tarea"); return; }
  state.geocercas.push({ id: Date.now(), place, task, radius, notif: "Vibración", day: "" });
  closeModal();
  showToast("Geocerca creada");
}

function startEditGeocerca(id) {
  const g = state.geocercas.find(x => x.id === id);
  openModal("editGeocerca", { ...g });
}

function modalEditGeocerca(p) {
  return `
  <div class="overlay">
    <div class="modal-card left">
      <h1 style="font-size:21px;margin-bottom:16px">Editar geocerca</h1>
      <div class="field"><label>Lugar</label><input id="eg-place" class="plain" value="${esc(p.place)}"></div>
      <div class="field"><label>Tarea asociada</label><input id="eg-task" class="plain" value="${esc(p.task)}"></div>
      <div class="field"><label>Radio (m)</label><input id="eg-radius" class="plain" type="number" min="10" max="500" value="${p.radius}"></div>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn block" onclick="closeModal()">Cancelar</button>
        <button class="btn primary block" onclick="saveEditGeocerca(${p.id})">Guardar cambios</button>
      </div>
    </div>
  </div>`;
}

function saveEditGeocerca(id) {
  const place = document.querySelector("#eg-place").value.trim();
  const task = document.querySelector("#eg-task").value.trim();
  const radius = Number(document.querySelector("#eg-radius").value) || 50;
  const g = state.geocercas.find(x => x.id === id);
  if (!place || !task) { showToast("Completa lugar y tarea"); return; }
  Object.assign(g, { place, task, radius });
  closeModal();
  showToast("Cambios guardados");
}

function confirmDeleteGeocerca(id) {
  const g = state.geocercas.find(x => x.id === id);
  openModal("deleteGeocerca", g);
}

function modalDeleteGeocerca(g) {
  return `
  <div class="overlay">
    <div class="modal-card">
      <span class="eyebrow-tag">ELIMINADO</span>
      <h1 style="font-size:24px">${esc(g.place)}</h1>
      <p class="muted">${esc(g.task)} · radio ${g.radius}m</p>
      <button class="btn mint block" style="margin-top:22px" onclick="finishDeleteGeocerca(${g.id})">Listo</button>
    </div>
  </div>`;
}

function finishDeleteGeocerca(id) {
  state.geocercas = state.geocercas.filter(x => x.id !== id);
  closeModal();
}


function screenProfile() {
  const html = `
    <div class="row">
      <h1 class="title">Tu perfil</h1>
      <button class="btn primary" onclick="go('stats')">Historial y estadísticas</button>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="row center">
        <div style="display:flex;gap:14px;align-items:center">
          <div class="avatar" style="width:52px;height:52px;font-size:17px">${esc(initials(state.user.nombre, state.user.apellido))}</div>
          <div><h2 style="margin:0;font-size:19px">${esc(state.user.nombre)} ${esc(state.user.apellido)}</h2><p class="muted">${esc(state.user.email)}</p></div>
        </div>
        <button class="btn" onclick="startEditProfile()">Editar datos</button>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h2 style="font-size:18px;margin-bottom:14px">Accesibilidad</h2>
      <div class="row center">
        <span class="muted">Contraste alto</span>
        <label class="switch">
          <input type="checkbox" id="acc-contraste" ${state.accessibility.contraste ? "checked" : ""}>
          <span class="track"></span><span class="thumb"></span>
        </label>
      </div>
      <div class="row center" style="margin-top:12px">
        <span class="muted">Tamaño de fuente</span>
        <select id="acc-fuente" class="btn" style="padding:8px 12px">
          ${["Pequeño", "Mediano", "Grande"].map(f => `<option ${state.accessibility.fuente === f ? "selected" : ""}>${f}</option>`).join("")}
        </select>
      </div>
      <button class="btn primary" style="margin-top:16px" onclick="saveAccessibility()">Guardar cambios</button>
    </div>

    <div class="card" style="margin-top:16px">
      <h2 style="font-size:18px;margin-bottom:6px">Sincronización</h2>
      <b style="color:var(--mint-dark)">Todo sincronizado</b>
      <p class="muted">Última actualización hoy, 10:42. Tus cambios están guardados en la nube.</p>
      <button class="btn" onclick="retrySync()">Reintentar sincronización</button>
    </div>`;
  app.innerHTML = shell(html, "profile");
}

function saveAccessibility() {
  state.accessibility.contraste = document.querySelector("#acc-contraste").checked;
  state.accessibility.fuente = document.querySelector("#acc-fuente").value;
  showToast("Cambios guardados");
}

function retrySync() { showToast("Sincronización completada"); }

function startEditProfile() { openModal("editProfile", { ...state.user }); }

function modalEditProfile(p) {
  return `
  <div class="overlay">
    <div class="modal-card left">
      <h1 style="font-size:21px;margin-bottom:16px">Editar datos</h1>
      <div class="grid2">
        <div class="field"><label>Nombre</label><input id="ep-nombre" class="plain" value="${esc(p.nombre)}"></div>
        <div class="field"><label>Apellido</label><input id="ep-apellido" class="plain" value="${esc(p.apellido)}"></div>
      </div>
      <div class="field"><label>Email</label><input id="ep-email" class="plain" value="${esc(p.email)}"></div>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn block" onclick="closeModal()">Cancelar</button>
        <button class="btn primary block" onclick="saveEditProfile()">Guardar</button>
      </div>
    </div>
  </div>`;
}

function saveEditProfile() {
  const nombre = document.querySelector("#ep-nombre").value.trim();
  const apellido = document.querySelector("#ep-apellido").value.trim();
  const email = document.querySelector("#ep-email").value.trim();
  if (!nombre || !email) { showToast("Completa nombre y correo"); return; }
  state.user = { nombre, apellido, email };
  closeModal();
  showToast("Datos actualizados");
}

/* --------------------------------- Stats -------------------------------------- */

function screenStats() {
  const bars = [
    ["Lun", 40], ["Mar", 78], ["Mié", 55], ["Jue", 95], ["Vie", 70], ["Sáb", 30], ["Dom", 18],
  ];
  const peak = Math.max(...bars.map(b => b[1]));
  const html = `
    <div class="row">
      <h1 class="title">Historial y estadísticas</h1>
      <div style="display:flex;gap:8px">
        <button class="btn primary small">Esta semana</button>
        <button class="btn small" onclick="go('profile')">Volver</button>
      </div>
    </div>
    <div class="grid3" style="margin-top:20px">
      <div class="card stat-box"><span class="muted">Completadas</span><div class="num">18</div></div>
      <div class="card stat-box"><span class="muted">Pospuestas</span><div class="num">5</div></div>
      <div class="card stat-box"><span class="muted">Tasa de cumplimiento</span><div class="num">78%</div></div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="barchart">
        ${bars.map(([d, v]) => `
          <div class="barcol ${d === "Jue" ? "today" : ""}">
            <div class="bar ${v === peak ? "peak" : ""}" style="height:${v}%"></div>
            <span>${d}</span>
          </div>`).join("")}
      </div>
    </div>
    <div class="section-title">Actividad reciente</div>
    <div class="card">
      <div class="activity-row"><b>Entregar trabajo</b><span class="muted">Completada hoy, 8:00</span></div>
      <div class="activity-row"><b>Ir al gym</b><span class="muted">Pospuesta 10 min</span></div>
      <div class="activity-row"><b>Comprar ingredientes</b><span class="muted">Completada ayer, 18:30</span></div>
    </div>`;
  app.innerHTML = shell(html, "profile");
}


function render() {
  if (!state.authed) {
    if (state.screen === "register") screenRegister();
    else if (state.screen === "forgot") screenForgot();
    else if (state.screen === "forgotSent") screenForgotSent();
    else screenLogin();
  } else {
    if (state.screen === "newAlert") screenNewAlert();
    else if (state.screen === "today") screenToday();
    else if (state.screen === "map") screenMap();
    else if (state.screen === "profile") screenProfile();
    else if (state.screen === "stats") screenStats();
    else screenAlerts();
  }

  if (state.modal) {
    const m = state.modal;
    const html =
      m.type === "created" ? modalCreated(m.payload) :
      m.type === "newGeocerca" ? modalNewGeocerca(m.payload) :
      m.type === "editGeocerca" ? modalEditGeocerca(m.payload) :
      m.type === "deleteGeocerca" ? modalDeleteGeocerca(m.payload) :
      m.type === "editProfile" ? modalEditProfile(m.payload) : "";
    app.insertAdjacentHTML("beforeend", html);
  }

  if (state.toast) {
    app.insertAdjacentHTML("beforeend", `<div class="toast">${esc(state.toast)}</div>`);
  }
}

render();
