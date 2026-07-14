/* ================================================================
   TECNOCELL S.A.C. - Sistema de Gestion de Inventario v2.0
   app.js - Logica principal con integracion REST API
================================================================ */

// ── ESTADO GLOBAL ──────────────────────────────────────────────
let state = {
  currentUser: null,
  productos:   [],
  proveedores: [],
  clientes:    [],
  usuarios:    [],
  entradas:    [],
  salidas:     [],
  movimientos: [],
};

// ── HELPERS API REST (con JWT) ─────────────────────────────────
// Obtiene el token JWT Almacénado en localStorage
function getToken() {
  return localStorage.getItem('tc_jwt') || '';
}

// Headers comunes con autorización JWT
function authHeaders(extra) {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken(), ...extra };
}

async function apiGet(url) {
  try {
    const r = await fetch(url, { headers: authHeaders() });
    if (r.status === 401 || r.status === 403) { doLogout(); return []; }
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch(e) { console.error('GET', url, e); return []; }
}

async function apiPost(url, data) {
  const r = await fetch(url, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(data)
  });
  if (r.status === 401 || r.status === 403) { doLogout(); throw new Error('sesión expirada'); }
  if (!r.ok) { const t = await r.text(); throw new Error(t); }
  return await r.json();
}

async function apiPut(url, data) {
  const r = await fetch(url, {
    method:  'PUT',
    headers: authHeaders(),
    body:    JSON.stringify(data)
  });
  if (r.status === 401 || r.status === 403) { doLogout(); throw new Error('sesión expirada'); }
  if (!r.ok) { const t = await r.text(); throw new Error(t); }
  return await r.json();
}

async function apiDelete(url) {
  const r = await fetch(url, { method:'DELETE', headers: authHeaders() });
  if (r.status === 401 || r.status === 403) { doLogout(); throw new Error('sesión expirada'); }
  if (!r.ok) { const t = await r.text(); throw new Error(t); }
}

// Normaliza fecha: puede venir como array [2026,7,10] o string "2026-07-10"
function normFecha(f) {
  if (!f) return '';
  if (Array.isArray(f)) {
    return `${f[0]}-${String(f[1]).padStart(2,'0')}-${String(f[2]).padStart(2,'0')}`;
  }
  return String(f).substring(0, 10);
}

// Formato de moneda peruana
function fmt(n) {
  return Number(n||0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ── CARGA DE DATOS DESDE API ────────────────────────────────────
function saveData() { /* La API maneja la persistencia */ }
async function cargarProductosSupabase() { await loadData(); }

async function loadData() {
  try {
    const [prod, cli, prov, usu, mov] = await Promise.all([
      apiGet('/api/productos'),
      apiGet('/api/clientes'),
      apiGet('/api/proveedores'),
      apiGet('/api/usuarios'),
      apiGet('/api/movimientos')
    ]);

    // Productos: mapear nombres de campos de Java a los usados en el frontend
    state.productos = prod.map(p => ({
      ...p,
      stockMin: p.stockMínimo || 5,
      pCosto:   p.pCosto  || 0,
      pVenta:   p.pVenta  || 0
    }));

    state.clientes    = cli;
    state.proveedores = prov;

    // Usuarios: si la API trae datos usarlos, sino mantener los del estado
    if (usu.length > 0) state.usuarios = usu;

    // Movimientos: normalizar tipo y fecha
    state.movimientos = mov.map(m => ({
      id:          m.id,
      fecha:       normFecha(m.fecha),
      tipo:        m.tipo === 'ENTRADA' ? 'Entrada' : 'Salida',
      productoId:  m.producto?.id,
      productoCod: m.producto?.codigo || '',
      productoNom: m.producto?.nombre || '',
      cantidad:    m.cantidad,
      motivo:      m.motivo || (m.proveedor ? m.proveedor.empresa : '') || (m.cliente ? m.cliente.nombre : '') || '',
      obs:         m.obs || '',
      usuario:     m.usuario || '',
      pCosto:      m.pCosto || 0,
      pVenta:      m.pVenta || 0
    }));

    // Entradas: solo movimientos tipo ENTRADA
    state.entradas = mov.filter(m => m.tipo === 'ENTRADA').map(m => ({
      id:          m.id,
      fecha:       normFecha(m.fecha),
      productoId:  m.producto?.id,
      productoNom: m.producto?.nombre || '',
      proveedor:   m.proveedor ? m.proveedor.empresa : (m.motivo || '--'),
      cantidad:    m.cantidad,
      pCosto:      m.pCosto || m.producto?.pCosto || 0,
      obs:         m.obs || '',
      usuario:     m.usuario || ''
    }));

    // Salidas: solo movimientos tipo SALIDA
    state.salidas = mov.filter(m => m.tipo === 'SALIDA').map(m => ({
      id:          m.id,
      fecha:       normFecha(m.fecha),
      productoId:  m.producto?.id,
      productoNom: m.producto?.nombre || '',
      clienteNom:  m.cliente ? m.cliente.nombre : '',
      motivo:      m.motivo || 'Venta',
      cantidad:    m.cantidad,
      pVenta:      m.pVenta || m.producto?.pVenta || 0,
      obs:         m.obs || '',
      usuario:     m.usuario || ''
    }));

    console.log(`[TecnoCell] Cargado: ${state.productos.length} productos, ${state.movimientos.length} movimientos`);

  } catch(e) {
    console.error('[TecnoCell] Error al cargar datos:', e);
  }
}

// ── UTILIDADES UI ───────────────────────────────────────────────
function emptyRow(cols, text) {
  return `<tr><td colspan="${cols}" style="text-align:center;padding:32px;color:var(--text3)">${text}</td></tr>`;
}

let toastTimer;
function toast(msg, type='success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'toast' + (type==='error'?' error':type==='warn'?' warn':'');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  if (id === 'modal-entrada') {
    fillSelect('me-producto');
    fillProvSelect('me-proveedor');
    setTodayDate('me-fecha');
  }
  if (id === 'modal-salida') {
    fillSelect('ms-producto');
    fillClienteSelect('ms-cliente');
    setTodayDate('ms-fecha');
    updateStockInfo();
  }
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function clearForm(fields) {
  fields.forEach(f => { const el = document.getElementById(f); if(el) el.value = ''; });
}

function setTodayDate(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) el.value = new Date().toISOString().split('T')[0];
}

function setDate() {
  const d  = new Date();
  const el = document.getElementById('topbar-date');
  if (el) el.textContent = d.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function fillSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = state.productos
    .filter(p => p.activo)
    .map(p => `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`)
    .join('');
}

function fillProvSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = state.proveedores
    .filter(p => p.activo)
    .map(p => `<option value="${p.id}">${p.empresa}</option>`)
    .join('');
}

function fillClienteSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Publico General --</option>' +
    (state.clientes || [])
      .filter(c => c.activo)
      .map(c => `<option value="${c.id}">${c.nombre} (${c.doc})</option>`)
      .join('');
}

function stockClass(p) {
  return p.stock === 0 ? 'text-danger' : p.stock <= p.stockMin ? 'text-warn' : 'text-success';
}

function stockPill(p) {
  if (p.stock === 0) return '<span class="pill pill-danger">Agotado</span>';
  if (p.stock <= p.stockMin) return '<span class="pill pill-warn">Stock Bajo</span>';
  return '<span class="pill pill-success">Disponible</span>';
}

function rolPill(rol) {
  const map = {
    'Administrador': 'pill-info',
    'Almacénero':    'pill-success',
    'Vendedor':      'pill-warn'
  };
  return `<span class="pill ${map[rol]||'pill-gray'}">${rol}</span>`;
}

async function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  if (!u || !p) return toast('Ingresa usuario y contrasena', 'error');

  try {
    // El login NO lleva JWT (es la ruta publica para obtenerlo)
    const response = await fetch('/api/usuarios/login', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify({ username: u, password: p })
    });

    if (!response.ok) {
      document.getElementById('login-error').style.display = 'block';
      return;
    }

    const data = await response.json();

    // Guardar el token JWT en localStorage para futuras peticiones
    if (data.token) localStorage.setItem('tc_jwt', data.token);

    state.currentUser = data;
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').style.display = 'block';
    document.getElementById('sf-name').textContent = data.nombre;
    document.getElementById('sf-role').textContent = data.rol;
    document.getElementById('ua').textContent      = data.nombre.charAt(0).toUpperCase();

    applyRoleRestrictions(data.rol);
    setDate();
    await loadData();
    showPage('dashboard');

  } catch(error) {
    console.error('Error en login:', error);
    toast('Error de conexion con el servidor', 'error');
  }
}

async function doLogout() {
  if (state.currentUser && !confirm('Cerrar Sesión?')) return;

  // Revocar el token en el servidor (lista negra) antes de borrar del cliente
  const token = localStorage.getItem('tc_jwt');
  if (token) {
    try {
      await fetch('/api/usuarios/logout', {
        method:  'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch(e) {
      // Si hay error de red el token expirara solo a las 24 h
      console.warn('No se pudo revocar el token en el servidor:', e);
    }
  }

  // Limpiar sesión local
  localStorage.removeItem('tc_jwt');
  state.currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').style.display = 'none';
}

function applyRoleRestrictions(rol) {
  const permisos = {
    'Administrador': ['dashboard','productos','entradas','salidas','movimientos','clientes','proveedores','usuarios','alertas','reportes'],
    'Almacénero':    ['dashboard','productos','entradas','salidas','movimientos','alertas'],
    'Vendedor':      ['dashboard','productos','salidas','movimientos','clientes','alertas'],
  };
  const permitidos = permisos[rol] || ['dashboard'];
  document.querySelectorAll('.nav-item[id^="nav-"]').forEach(item => {
    const page = item.id.replace('nav-', '');
    item.style.display = permitidos.includes(page) ? '' : 'none';
  });
}

// ── NAVEGACION ──────────────────────────────────────────────────
const PAGE_META = {
  dashboard:   { title: 'Dashboard',    sub: 'Resumen general del sistema' },
  productos:   { title: 'Productos',    sub: 'Gestion de productos en inventario' },
  entradas:    { title: 'Entradas',     sub: 'Registro de ingresos al Almacén' },
  salidas:     { title: 'Salidas',      sub: 'Registro de salidas y ventas' },
  movimientos: { title: 'Movimientos',  sub: 'Historial completo de movimientos' },
  clientes:    { title: 'Clientes',     sub: 'Gestion de clientes' },
  proveedores: { title: 'Proveedores',  sub: 'Gestion de proveedores' },
  usuarios:    { title: 'Usuarios',     sub: 'Gestion de usuarios y roles' },
  alertas:     { title: 'Alertas',      sub: 'Productos con stock bajo o agotado' },
  reportes:    { title: 'Reportes',     sub: 'Analisis e informes del inventario' },
};

function showPage(page) {
  document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (!pageEl) return;
  pageEl.classList.remove('hidden');
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');
  const m = PAGE_META[page];
  if (m) {
    document.getElementById('page-title').textContent = m.title;
    document.getElementById('page-sub').textContent   = m.sub;
  }
  const renders = {
    dashboard,
    productos:   renderProductos,
    entradas:    renderEntradas,
    salidas:     renderSalidas,
    movimientos: renderMovimientos,
    clientes:    renderClientes,
    proveedores: renderProveedores,
    usuarios:    renderUsuarios,
    alertas:     renderAlertas,
    reportes:    renderReportes
  };
  if (renders[page]) renders[page]();
}

// ── DASHBOARD ───────────────────────────────────────────────────
function dashboard() {
  const prods  = state.productos.filter(p => p.activo);
  const bajos  = prods.filter(p => p.stock <= p.stockMin);
  const valor  = prods.reduce((a, p) => a + (p.stock * (p.pCosto || 0)), 0);
  const hoy    = new Date().toISOString().split('T')[0];
  const movHoy = state.movimientos.filter(m => m.fecha === hoy).length;

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('s-productos',  prods.length);
  set('s-bajo',       bajos.length);
  set('s-valor',      'S/ ' + fmt(valor));
  set('s-movimientos', movHoy);
  set('badge-alertas', bajos.length);

  // Ultimos movimientos
  const tbody = document.getElementById('dash-movimientos');
  if (tbody) {
    const recientes = [...state.movimientos].sort((a, b) => b.id - a.id).slice(0, 8);
    tbody.innerHTML = recientes.length ? recientes.map(m => `
      <tr>
        <td class="font-mono" style="font-size:12px">${m.productoCod || ''}</td>
        <td><span class="pill ${m.tipo==='Entrada'?'pill-success':'pill-danger'}">${m.tipo}</span></td>
        <td class="font-mono">${m.cantidad}</td>
        <td>${m.usuario}</td>
        <td class="text-muted">${m.fecha}</td>
      </tr>`).join('') : emptyRow(5, 'Sin movimientos');
  }

  // Stock bajo
  const tb2 = document.getElementById('dash-bajos');
  if (tb2) {
    tb2.innerHTML = bajos.length ? bajos.slice(0, 8).map(p => `
      <tr>
        <td>${p.nombre}</td>
        <td class="font-mono ${p.stock===0?'text-danger':'text-warn'}">${p.stock}</td>
        <td class="font-mono">${p.stockMin}</td>
        <td><button class="btn btn-sm btn-warn" onclick="openReponer(${p.id})">Reponer</button></td>
      </tr>`).join('') : emptyRow(4, 'Sin alertas de stock');
  }
}

// ── PRODUCTOS ───────────────────────────────────────────────────
function renderProductos(q = '') {
  const cat = document.getElementById('filtro-cat')?.value || '';
  let prods = state.productos.filter(p => p.activo);
  if (q)   prods = prods.filter(p => (p.nombre + p.codigo + p.marca).toLowerCase().includes(q.toLowerCase()));
  if (cat) prods = prods.filter(p => p.Categoría === cat);
  const tbody = document.getElementById('tbl-productos');
  if (!tbody) return;
  tbody.innerHTML = prods.length ? prods.map(p => `
    <tr>
      <td class="font-mono text-accent" style="font-size:12px">${p.codigo}</td>
      <td><strong>${p.nombre}</strong><br><span class="text-muted" style="font-size:11px">${p.Descripción || ''}</span></td>
      <td>${p.Categoría}</td>
      <td>${p.marca}</td>
      <td class="font-mono ${stockClass(p)}">${p.stock}</td>
      <td class="font-mono">S/ ${fmt(p.pCosto)}</td>
      <td class="font-mono">S/ ${fmt(p.pVenta)}</td>
      <td>${stockPill(p)}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="editProducto(${p.id})">&#9998; Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProducto(${p.id})" style="margin-left:4px">&#128465;</button>
      </td>
    </tr>`).join('') : emptyRow(9, 'No se encontraron productos');
}

function openModal_Producto_new() {
  document.getElementById('mp-title').textContent = 'Nuevo Producto';
  document.getElementById('mp-id').value = '';
  clearForm(['mp-codigo','mp-nombre','mp-marca','mp-stock','mp-stock-min','mp-pcosto','mp-pventa','mp-Descripción']);
  document.getElementById('mp-Categoría').value = 'Celulares';
  openModal('modal-producto');
}

function editProducto(id) {
  const p = state.productos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('mp-title').textContent  = 'Editar Producto';
  document.getElementById('mp-id').value           = p.id;
  document.getElementById('mp-codigo').value       = p.codigo;
  document.getElementById('mp-nombre').value       = p.nombre;
  document.getElementById('mp-Categoría').value    = p.Categoría;
  document.getElementById('mp-marca').value        = p.marca;
  document.getElementById('mp-stock').value        = p.stock;
  document.getElementById('mp-stock-min').value    = p.stockMin || p.stockMínimo || 5;
  document.getElementById('mp-pcosto').value       = p.pCosto || 0;
  document.getElementById('mp-pventa').value       = p.pVenta || 0;
  document.getElementById('mp-Descripción').value  = p.Descripción || '';
  openModal('modal-producto');
}

async function saveProducto() {
  const id = document.getElementById('mp-id').value;
  const data = {
    codigo:      document.getElementById('mp-codigo').value.trim(),
    nombre:      document.getElementById('mp-nombre').value.trim(),
    Categoría:   document.getElementById('mp-Categoría').value,
    marca:       document.getElementById('mp-marca').value.trim(),
    stock:       parseInt(document.getElementById('mp-stock').value) || 0,
    stockMínimo: parseInt(document.getElementById('mp-stock-min').value) || 5,
    pCosto:      parseFloat(document.getElementById('mp-pcosto').value) || 0,
    pVenta:      parseFloat(document.getElementById('mp-pventa').value) || 0,
    Descripción: document.getElementById('mp-Descripción').value.trim(),
    activo:      true
  };
  if (!data.codigo || !data.nombre) return toast('Complete los campos obligatorios', 'error');
  try {
    if (id) await apiPut('/api/productos/' + id, data);
    else    await apiPost('/api/productos', data);
    toast('Producto guardado correctamente');
    closeModal('modal-producto');
    await loadData();
    renderProductos();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

async function deleteProducto(id) {
  if (!confirm('Eliminar este producto?')) return;
  try {
    await apiDelete('/api/productos/' + id);
    toast('Producto eliminado');
    await loadData();
    renderProductos();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

// ── ENTRADAS ────────────────────────────────────────────────────
function renderEntradas() {
  const tbody = document.getElementById('tbl-entradas');
  if (!tbody) return;
  const list = [...state.entradas].sort((a, b) => b.id - a.id);
  tbody.innerHTML = list.length ? list.map(e => `
    <tr>
      <td class="text-muted">${e.fecha}</td>
      <td><strong>${e.productoNom}</strong></td>
      <td>${e.proveedor}</td>
      <td class="font-mono text-accent">${e.cantidad}</td>
      <td class="font-mono">S/ ${fmt(e.pCosto)}</td>
      <td class="font-mono text-success">S/ ${fmt(e.cantidad * e.pCosto)}</td>
      <td>${e.usuario}</td>
    </tr>`).join('') : emptyRow(7, 'Sin entradas registradas');
}

async function saveEntrada() {
  const pId    = document.getElementById('me-producto').value;
  const provId = document.getElementById('me-proveedor').value;
  const cant   = parseInt(document.getElementById('me-cantidad').value) || 0;
  const pCosto = parseFloat(document.getElementById('me-pcosto').value) || 0;
  const obs    = document.getElementById('me-obs').value.trim();

  if (!pId)       return toast('Selecciona un producto', 'error');
  if (cant <= 0)  return toast('Ingresa una cantidad valida', 'error');
  if (!provId)    return toast('Selecciona un proveedor', 'error');

  const data = {
    tipo:      'ENTRADA',
    producto:  { id: parseInt(pId)   },
    proveedor: { id: parseInt(provId) },
    cantidad:  cant,
    pCosto:    pCosto,
    obs:       obs,
    usuario:   state.currentUser?.username || 'admin'
  };

  try {
    await apiPost('/api/movimientos/entrada', data);
    toast('Entrada registrada correctamente');
    closeModal('modal-entrada');
    await loadData();
    renderEntradas();
    dashboard();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

// ── SALIDAS ─────────────────────────────────────────────────────
function renderSalidas() {
  const tbody = document.getElementById('tbl-salidas');
  if (!tbody) return;
  const list = [...state.salidas].sort((a, b) => b.id - a.id);
  tbody.innerHTML = list.length ? list.map(s => `
    <tr>
      <td class="text-muted">${s.fecha}</td>
      <td><strong>${s.productoNom}</strong></td>
      <td>${s.clienteNom
        ? `<span class="pill pill-info" style="font-size:10px">${s.clienteNom}</span>`
        : '<span class="text-muted" style="font-size:11px">Publico General</span>'}</td>
      <td><span class="pill pill-gray">${s.motivo}</span></td>
      <td class="font-mono text-danger">${s.cantidad}</td>
      <td class="font-mono">S/ ${fmt(s.pVenta)}</td>
      <td class="font-mono text-success">S/ ${fmt(s.cantidad * s.pVenta)}</td>
      <td>${s.usuario}</td>
    </tr>`).join('') : emptyRow(8, 'Sin salidas registradas');
}

function updateStockInfo() {
  const sel  = document.getElementById('ms-producto');
  const disp = document.getElementById('ms-stock-disp');
  if (!sel || !disp) return;
  const prod = state.productos.find(p => p.id === parseInt(sel.value));
  if (prod) {
    disp.value = prod.stock + ' unidades';
    const pvEl = document.getElementById('ms-pventa');
    if (pvEl && (!pvEl.value || pvEl.value === '0')) {
      pvEl.value = prod.pVenta || 0;
    }
  }
}

async function saveSalida() {
  const pId    = document.getElementById('ms-producto').value;
  const cliEl  = document.getElementById('ms-cliente');
  const cliId  = cliEl && cliEl.value ? parseInt(cliEl.value) : null;
  const cant   = parseInt(document.getElementById('ms-cantidad').value) || 0;
  const pVenta = parseFloat(document.getElementById('ms-pventa').value) || 0;
  const motivo = document.getElementById('ms-motivo')?.value || 'Venta';
  const obs    = document.getElementById('ms-obs').value.trim();

  if (!pId)      return toast('Selecciona un producto', 'error');
  if (cant <= 0) return toast('Ingresa una cantidad valida', 'error');

  const prod = state.productos.find(p => p.id === parseInt(pId));
  if (!prod) return toast('Producto no encontrado', 'error');
  if (prod.stock < cant) return toast(`Stock insuficiente. Disponible: ${prod.stock}`, 'error');

  const data = {
    tipo:     'SALIDA',
    producto: { id: parseInt(pId) },
    cliente:  cliId ? { id: cliId } : null,
    cantidad: cant,
    pVenta:   pVenta,
    motivo:   motivo,
    obs:      obs,
    usuario:  state.currentUser?.username || 'admin'
  };

  try {
    await apiPost('/api/movimientos/salida', data);
    toast('Salida registrada correctamente');
    closeModal('modal-salida');
    await loadData();
    renderSalidas();
    dashboard();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

// ── MOVIMIENTOS ─────────────────────────────────────────────────
function renderMovimientos(q = '') {
  const tipo = document.getElementById('filtro-tipo-mov')?.value || '';
  let list   = [...state.movimientos].sort((a, b) => {
    if (b.fecha !== a.fecha) return b.fecha.localeCompare(a.fecha);
    return b.id - a.id;
  });
  if (q)    list = list.filter(m => (m.productoNom + m.productoCod + m.usuario).toLowerCase().includes(q.toLowerCase()));
  if (tipo) list = list.filter(m => m.tipo === tipo);
  const tbody = document.getElementById('tbl-movimientos');
  if (!tbody) return;
  tbody.innerHTML = list.length ? list.map(m => `
    <tr>
      <td class="text-muted">${m.fecha}</td>
      <td><span class="pill ${m.tipo==='Entrada'?'pill-success':'pill-danger'}">${m.tipo}</span></td>
      <td>
        <span class="font-mono text-accent" style="font-size:11px">${m.productoCod || ''}</span><br>
        <span style="font-size:13px">${m.productoNom}</span>
      </td>
      <td class="font-mono">${m.cantidad}</td>
      <td>${m.motivo || '--'}</td>
      <td>${m.usuario}</td>
      <td class="text-muted">${m.obs || '--'}</td>
    </tr>`).join('') : emptyRow(7, 'Sin movimientos registrados');
}

// ── CLIENTES ────────────────────────────────────────────────────
function renderClientes(q = '') {
  let lista = (state.clientes || []).slice();
  if (q) lista = lista.filter(c =>
    (c.nombre + c.doc + (c.email||'') + (c.tel||'')).toLowerCase().includes(q.toLowerCase()));
  const tbody = document.getElementById('tbl-clientes');
  if (!tbody) return;
  tbody.innerHTML = lista.length ? lista.map(c => `
    <tr style="${!c.activo ? 'opacity:0.55' : ''}">
      <td class="font-mono text-accent" style="font-size:12px">${c.doc}</td>
      <td><strong>${c.nombre}</strong></td>
      <td>${c.tel || '--'}</td>
      <td>${c.email || '--'}</td>
      <td>${c.dir || '--'}</td>
      <td><span class="pill ${c.activo?'pill-success':'pill-danger'}">${c.activo?'Activo':'Inactivo'}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm btn-ghost" onclick="editCliente(${c.id})">&#9998; Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCliente(${c.id})" style="margin-left:4px">&#128465;</button>
      </td>
    </tr>`).join('') : emptyRow(7, 'No se encontraron clientes');
}

function openModal_Cliente_new() {
  document.getElementById('mcli-title').textContent = 'Nuevo Cliente';
  document.getElementById('mcli-id').value = '';
  clearForm(['mcli-doc','mcli-nombre','mcli-tel','mcli-email','mcli-dir']);
  openModal('modal-cliente');
}

function editCliente(id) {
  const c = (state.clientes || []).find(x => x.id === id);
  if (!c) return;
  document.getElementById('mcli-title').textContent = 'Editar Cliente';
  document.getElementById('mcli-id').value          = c.id;
  document.getElementById('mcli-doc').value         = c.doc;
  document.getElementById('mcli-nombre').value      = c.nombre;
  document.getElementById('mcli-tel').value         = c.tel || '';
  document.getElementById('mcli-email').value       = c.email || '';
  document.getElementById('mcli-dir').value         = c.dir || '';
  openModal('modal-cliente');
}

async function buscarDocCliente() {
  const doc = document.getElementById('mcli-doc')?.value.trim();
  if (!doc) return toast('Ingresa un numero de documento primero', 'warn');
  if (doc.length !== 8 && doc.length !== 11)
    return toast('El documento debe tener 8 digitos (DNI) o 11 digitos (RUC)', 'warn');

  const esDNI  = doc.length === 8;
  const url    = esDNI ? `/api/consulta/dni/${doc}` : `/api/consulta/ruc/${doc}`;

  const btn = document.querySelector('[onclick="buscarDocCliente()"]');
  if (btn) { btn.textContent = 'Buscando...'; btn.disabled = true; }

  try {
    const data = await apiGet(url);
    if (esDNI) {
      if (!data.nombres) throw new Error('Sin datos');
      const nombreCompleto = `${data.apellidoPaterno} ${data.apellidoMaterno}, ${data.nombres}`.trim();
      document.getElementById('mcli-nombre').value = nombreCompleto;
      document.getElementById('mcli-dir').value    = '';
      toast('DNI encontrado en RENIEC');
    } else {
      if (!data.RazónSocial) throw new Error('Sin datos');
      document.getElementById('mcli-nombre').value = data.RazónSocial;
      document.getElementById('mcli-dir').value    = data.Dirección || '';
      toast('RUC encontrado en SUNAT');
    }
  } catch(err) {
    const local = (state.clientes || []).find(c => c.doc === doc);
    if (local) {
      document.getElementById('mcli-nombre').value = local.nombre;
      document.getElementById('mcli-tel').value    = local.tel || '';
      document.getElementById('mcli-email').value  = local.email || '';
      document.getElementById('mcli-dir').value    = local.dir || '';
      toast('Cliente encontrado en base local');
    } else {
      toast('No se pudo consultar la API. Completa los datos manualmente.', 'error');
    }
  } finally {
    if (btn) { btn.textContent = 'Buscar'; btn.disabled = false; }
  }
}

async function saveCliente() {
  const id   = document.getElementById('mcli-id').value;
  const data = {
    doc:    document.getElementById('mcli-doc').value.trim(),
    nombre: document.getElementById('mcli-nombre').value.trim(),
    tel:    document.getElementById('mcli-tel').value.trim(),
    email:  document.getElementById('mcli-email').value.trim(),
    dir:    document.getElementById('mcli-dir').value.trim(),
    activo: true
  };
  if (!data.doc || !data.nombre) return toast('Documento y nombre son obligatorios', 'error');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return toast('Correo invalido', 'error');
  try {
    if (id) await apiPut('/api/clientes/' + id, data);
    else    await apiPost('/api/clientes', data);
    toast('Cliente guardado correctamente');
    closeModal('modal-cliente');
    await loadData();
    renderClientes();
    fillClienteSelect('ms-cliente');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

async function deleteCliente(id) {
  if (!confirm('Eliminar este cliente?')) return;
  try {
    await apiDelete('/api/clientes/' + id);
    toast('Cliente eliminado');
    await loadData();
    renderClientes();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

// ── PROVEEDORES ─────────────────────────────────────────────────
function renderProveedores(q = '') {
  let list = state.proveedores.filter(p => p.activo);
  if (q) list = list.filter(p =>
    (p.empresa + p.ruc + (p.contacto||'')).toLowerCase().includes(q.toLowerCase()));
  const tbody = document.getElementById('tbl-proveedores');
  if (!tbody) return;
  tbody.innerHTML = list.length ? list.map(p => `
    <tr>
      <td class="font-mono text-accent" style="font-size:12px">${p.ruc}</td>
      <td><strong>${p.empresa}</strong></td>
      <td>${p.contacto || '--'}</td>
      <td>${p.tel || '--'}</td>
      <td>${p.email || '--'}</td>
      <td>${p.dir || '--'}</td>
      <td><span class="pill pill-success">Activo</span></td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="editProveedor(${p.id})">&#9998; Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProveedor(${p.id})" style="margin-left:4px">&#128465;</button>
      </td>
    </tr>`).join('') : emptyRow(8, 'No se encontraron proveedores');
}

function openModal_Proveedor_new() {
  document.getElementById('mprov-title').textContent = 'Nuevo Proveedor';
  document.getElementById('mprov-id').value = '';
  clearForm(['mprov-ruc','mprov-empresa','mprov-contacto','mprov-tel','mprov-email','mprov-dir']);
  openModal('modal-proveedor');
}

function editProveedor(id) {
  const p = state.proveedores.find(x => x.id === id);
  if (!p) return;
  document.getElementById('mprov-title').textContent = 'Editar Proveedor';
  document.getElementById('mprov-id').value          = p.id;
  document.getElementById('mprov-ruc').value         = p.ruc;
  document.getElementById('mprov-empresa').value     = p.empresa;
  document.getElementById('mprov-contacto').value    = p.contacto || '';
  document.getElementById('mprov-tel').value         = p.tel || '';
  document.getElementById('mprov-email').value       = p.email || '';
  document.getElementById('mprov-dir').value         = p.dir || '';
  openModal('modal-proveedor');
}

async function saveProveedor() {
  const id   = document.getElementById('mprov-id').value;
  const data = {
    ruc:      document.getElementById('mprov-ruc').value.trim(),
    empresa:  document.getElementById('mprov-empresa').value.trim(),
    contacto: document.getElementById('mprov-contacto').value.trim(),
    tel:      document.getElementById('mprov-tel').value.trim(),
    email:    document.getElementById('mprov-email').value.trim(),
    dir:      document.getElementById('mprov-dir').value.trim(),
    activo:   true
  };
  if (!data.ruc || !data.empresa) return toast('RUC y empresa son obligatorios', 'error');
  if (data.ruc.length !== 11) return toast('El RUC debe tener 11 digitos', 'error');
  try {
    if (id) await apiPut('/api/proveedores/' + id, data);
    else    await apiPost('/api/proveedores', data);
    toast('Proveedor guardado correctamente');
    closeModal('modal-proveedor');
    await loadData();
    renderProveedores();
    fillProvSelect('me-proveedor');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

async function deleteProveedor(id) {
  if (!confirm('Eliminar este proveedor?')) return;
  try {
    await apiDelete('/api/proveedores/' + id);
    toast('Proveedor eliminado');
    await loadData();
    renderProveedores();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

// ── USUARIOS ────────────────────────────────────────────────────
function renderUsuarios(q = '') {
  const rolFiltro = document.getElementById('filtro-rol-usuario')?.value || '';
  let lista = state.usuarios.slice();
  if (q) lista = lista.filter(u =>
    (u.username + u.nombre + (u.email||'') + (u.dni||'')).toLowerCase().includes(q.toLowerCase()));
  if (rolFiltro) lista = lista.filter(u => u.rol === rolFiltro);

  const esAdmin     = state.currentUser?.rol === 'Administrador';
  const tbody       = document.getElementById('tbl-usuarios');
  if (!tbody) return;

  tbody.innerHTML = lista.length ? lista.map(u => {
    const inicial     = u.nombre.charAt(0).toUpperCase();
    const esMismoUser = u.id === state.currentUser?.id;
    return `
    <tr style="${!u.activo ? 'opacity:0.55' : ''}">
      <td>
        <div style="width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff">${inicial}</div>
      </td>
      <td>
        <span class="font-mono text-accent" style="font-size:12px">${u.username}</span>
        ${esMismoUser ? '<span class="pill pill-info" style="font-size:9px;margin-left:6px">Tu</span>' : ''}
      </td>
      <td><strong>${u.nombre}</strong></td>
      <td>${rolPill(u.rol)}</td>
      <td>${u.email || '--'}</td>
      <td class="font-mono text-muted" style="font-size:12px">${u.dni || '--'}</td>
      <td><span class="pill ${u.activo?'pill-success':'pill-danger'}">${u.activo?'Activo':'Inactivo'}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm btn-ghost" onclick="editUsuario(${u.id})">&#9998; Editar</button>
        ${esAdmin && u.username !== 'admin' ? `
          <button class="btn btn-sm ${u.activo?'btn-warn':'btn-success'}" onclick="toggleUsuario(${u.id})" style="margin-left:4px">
            ${u.activo ? 'Deshab.' : 'Habilitar'}
          </button>` : ''}
        ${esAdmin && u.username !== 'admin' && !esMismoUser ? `
          <button class="btn btn-sm btn-danger" onclick="deleteUsuario(${u.id})" style="margin-left:4px">&#128465;</button>` : ''}
      </td>
    </tr>`;
  }).join('') : emptyRow(8, 'No se encontraron usuarios');
}

function openModal_Usuario_new() {
  document.getElementById('mu-title').textContent = 'Nuevo Usuario';
  document.getElementById('mu-id').value = '';
  clearForm(['mu-username','mu-nombre','mu-email','mu-pass','mu-pass2','mu-dni','mu-tel']);
  document.getElementById('mu-rol').value = 'Vendedor';
  document.getElementById('mu-edit-note')?.classList.add('hidden');
  const avatar = document.getElementById('mu-avatar-preview');
  if (avatar) avatar.textContent = '?';
  const nombrePrev = document.getElementById('mu-nombre-preview');
  if (nombrePrev) nombrePrev.textContent = 'Nuevo Usuario';
  const rolPrev = document.getElementById('mu-rol-preview');
  if (rolPrev) rolPrev.textContent = 'Vendedor';
  const usernameEl = document.getElementById('mu-username');
  if (usernameEl) usernameEl.readOnly = false;
  openModal('modal-usuario');
}

function editUsuario(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u) return;
  document.getElementById('mu-title').textContent = 'Editar Usuario';
  document.getElementById('mu-id').value          = u.id;
  document.getElementById('mu-username').value    = u.username;
  document.getElementById('mu-nombre').value      = u.nombre;
  document.getElementById('mu-rol').value         = u.rol;
  document.getElementById('mu-email').value       = u.email || '';
  document.getElementById('mu-pass').value        = '';
  document.getElementById('mu-pass2').value       = '';
  document.getElementById('mu-dni').value         = u.dni || '';
  document.getElementById('mu-tel').value         = u.tel || '';
  document.getElementById('mu-edit-note')?.classList.remove('hidden');
  const usernameEl = document.getElementById('mu-username');
  if (usernameEl) usernameEl.readOnly = (u.username === 'admin');
  const avatar = document.getElementById('mu-avatar-preview');
  if (avatar) avatar.textContent = u.nombre.charAt(0).toUpperCase();
  const nombrePrev = document.getElementById('mu-nombre-preview');
  if (nombrePrev) nombrePrev.textContent = u.nombre;
  const rolPrev = document.getElementById('mu-rol-preview');
  if (rolPrev) rolPrev.textContent = u.rol;
  openModal('modal-usuario');
}

async function saveUsuario() {
  const id       = document.getElementById('mu-id').value;
  const username = document.getElementById('mu-username').value.trim().replace(/\s+/g, '_');
  const nombre   = document.getElementById('mu-nombre').value.trim();
  const rol      = document.getElementById('mu-rol').value;
  const email    = document.getElementById('mu-email').value.trim();
  const pass     = document.getElementById('mu-pass').value;
  const pass2    = document.getElementById('mu-pass2').value;
  const dni      = document.getElementById('mu-dni').value.trim();
  const tel      = document.getElementById('mu-tel').value.trim();

  if (!username || !nombre || !email) return toast('Usuario, nombre y correo son obligatorios', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Correo electronico invalido', 'error');
  if (dni && !/^\d{8}$/.test(dni)) return toast('El DNI debe tener 8 digitos', 'error');

  let finalPassword;
  if (id) {
    if (pass || pass2) {
      if (pass.length < 4)  return toast('Contrasena Mínimo 4 caracteres', 'error');
      if (pass !== pass2)   return toast('Las contrasenas no coinciden', 'error');
      finalPassword = pass;
    } else {
      finalPassword = state.usuarios.find(u => u.id == id)?.password || '';
    }
  } else {
    if (!pass)            return toast('La contrasena es obligatoria', 'error');
    if (pass.length < 4)  return toast('Contrasena Mínimo 4 caracteres', 'error');
    if (pass !== pass2)   return toast('Las contrasenas no coinciden', 'error');
    finalPassword = pass;
  }

  const data = { username, nombre, password: finalPassword, rol, dni, email, tel, activo: true };
  try {
    if (id) await apiPut('/api/usuarios/' + id, data);
    else    await apiPost('/api/usuarios', data);
    toast('Usuario guardado correctamente');
    closeModal('modal-usuario');
    await loadData();
    renderUsuarios();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

async function deleteUsuario(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u) return;
  if (u.username === 'admin') return toast('No se puede eliminar al administrador', 'error');
  if (u.id === state.currentUser?.id) return toast('No puedes eliminarte a ti mismo', 'error');
  if (!confirm(`Eliminar al usuario "${u.nombre}"? Esta accion no se puede deshacer.`)) return;
  try {
    await apiDelete('/api/usuarios/' + id);
    toast('Usuario eliminado');
    await loadData();
    renderUsuarios();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
}

function toggleUsuario(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u || u.username === 'admin') return toast('Operacion no permitida', 'error');
  const data = { ...u, activo: !u.activo };
  apiPut('/api/usuarios/' + id, data)
    .then(() => {
      toast(data.activo ? 'Usuario habilitado' : 'Usuario deshabilitado');
      loadData().then(renderUsuarios);
    })
    .catch(e => toast('Error: ' + e.message, 'error'));
}

function updateUsuarioPreview() {
  const nombre  = document.getElementById('mu-nombre')?.value || '';
  const rol     = document.getElementById('mu-rol')?.value || 'Selecciona un rol';
  const inicial = nombre.trim() ? nombre.trim().charAt(0).toUpperCase() : '?';
  const avatar  = document.getElementById('mu-avatar-preview');
  if (avatar) avatar.textContent = inicial;
  const np = document.getElementById('mu-nombre-preview');
  if (np) np.textContent = nombre || 'Nuevo Usuario';
  const rp = document.getElementById('mu-rol-preview');
  if (rp) rp.textContent = rol;
}

function togglePassVis(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  if (btn) btn.textContent = input.type === 'password' ? 'Ver' : 'Ocultar';
}

// ── MI PERFIL ───────────────────────────────────────────────────
function openMiPerfil() {
  const u = state.currentUser;
  if (!u) return;
  const set    = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
  set('perfil-avatar',        u.nombre.charAt(0).toUpperCase());
  set('perfil-nombre-header', u.nombre);
  const rh = document.getElementById('perfil-rol-header');
  if (rh) rh.innerHTML = rolPill(u.rol);
  set('perfil-user-header', '@' + u.username);
  setVal('perfil-username', u.username);
  setVal('perfil-rol',      u.rol);
  setVal('perfil-nombre',   u.nombre);
  setVal('perfil-dni',      u.dni || '');
  setVal('perfil-email',    u.email || '');
  setVal('perfil-tel',      u.tel || '');
  clearForm(['perfil-pass-actual','perfil-pass-nueva','perfil-pass-confirmar']);
  switchPerfilTab('datos');
  openModal('modal-mi-perfil');
}

function switchPerfilTab(tab) {
  const tabDatos = document.getElementById('perfil-tab-datos');
  const tabPass  = document.getElementById('perfil-tab-pass');
  const btnDatos = document.getElementById('tab-datos');
  const btnPass  = document.getElementById('tab-pass');
  if (tab === 'datos') {
    tabDatos?.classList.remove('hidden');
    tabPass?.classList.add('hidden');
    if (btnDatos) { btnDatos.style.background = 'var(--card)'; btnDatos.style.color = 'var(--text)'; }
    if (btnPass)  { btnPass.style.background  = 'transparent'; btnPass.style.color  = 'var(--text2)'; }
  } else {
    tabDatos?.classList.add('hidden');
    tabPass?.classList.remove('hidden');
    if (btnDatos) { btnDatos.style.background = 'transparent'; btnDatos.style.color = 'var(--text2)'; }
    if (btnPass)  { btnPass.style.background  = 'var(--card)'; btnPass.style.color  = 'var(--text)'; }
    const passNueva = document.getElementById('perfil-pass-nueva');
    if (passNueva) passNueva.oninput = updatePasswordStrength;
  }
}

function savePerfilDatos() {
  const u = state.currentUser;
  if (!u) return;
  const nombre = document.getElementById('perfil-nombre').value.trim();
  const email  = document.getElementById('perfil-email').value.trim();
  const dni    = document.getElementById('perfil-dni').value.trim();
  const tel    = document.getElementById('perfil-tel').value.trim();
  if (!nombre || !email) return toast('Nombre y correo son obligatorios', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Correo invalido', 'error');
  const data = { ...u, nombre, email, dni, tel };
  apiPut('/api/usuarios/' + u.id, data)
    .then(() => {
      state.currentUser = { ...state.currentUser, nombre, email, dni, tel };
      const idx = state.usuarios.findIndex(x => x.id === u.id);
      if (idx >= 0) state.usuarios[idx] = state.currentUser;
      document.getElementById('sf-name').textContent = nombre;
      document.getElementById('ua').textContent = nombre.charAt(0).toUpperCase();
      document.getElementById('perfil-nombre-header').textContent = nombre;
      document.getElementById('perfil-avatar').textContent = nombre.charAt(0).toUpperCase();
      toast('Perfil actualizado correctamente');
    })
    .catch(e => toast('Error: ' + e.message, 'error'));
}

function savePerfilPassword() {
  const u = state.currentUser;
  if (!u) return;
  const actual    = document.getElementById('perfil-pass-actual').value;
  const nueva     = document.getElementById('perfil-pass-nueva').value;
  const confirmar = document.getElementById('perfil-pass-confirmar').value;
  if (!actual || !nueva || !confirmar) return toast('Completa todos los campos de contrasena', 'error');
  if (actual !== u.password) return toast('La contrasena actual es incorrecta', 'error');
  if (nueva.length < 4) return toast('La nueva contrasena debe tener Mínimo 4 caracteres', 'error');
  if (nueva !== confirmar) return toast('Las nuevas contrasenas no coinciden', 'error');
  if (nueva === actual) return toast('La nueva contrasena debe ser diferente', 'warn');
  const data = { ...u, password: nueva };
  apiPut('/api/usuarios/' + u.id, data)
    .then(() => {
      state.currentUser = { ...state.currentUser, password: nueva };
      clearForm(['perfil-pass-actual','perfil-pass-nueva','perfil-pass-confirmar']);
      updatePasswordStrength();
      toast('Contrasena cambiada exitosamente');
    })
    .catch(e => toast('Error: ' + e.message, 'error'));
}

function updatePasswordStrength() {
  const pass  = document.getElementById('perfil-pass-nueva')?.value || '';
  const bar   = document.getElementById('pass-strength-bar');
  const label = document.getElementById('pass-strength-label');
  if (!bar || !label) return;
  let score = 0;
  if (pass.length >= 4)           score++;
  if (pass.length >= 8)           score++;
  if (/[A-Z]/.test(pass))         score++;
  if (/[0-9]/.test(pass))         score++;
  if (/[^A-Za-z0-9]/.test(pass))  score++;
  const levels = [
    { pct:'0%',   color:'transparent',    text:''          },
    { pct:'20%',  color:'var(--danger)',   text:'Muy debil' },
    { pct:'45%',  color:'var(--warn)',     text:'Debil'     },
    { pct:'65%',  color:'#ffcc00',         text:'Moderada'  },
    { pct:'85%',  color:'var(--accent3)',  text:'Fuerte'    },
    { pct:'100%', color:'var(--accent3)',  text:'Muy fuerte'},
  ];
  const lvl        = levels[Math.min(score, 5)];
  bar.style.width      = pass ? lvl.pct : '0%';
  bar.style.background = lvl.color;
  label.textContent    = lvl.text;
}

// ── ALERTAS ─────────────────────────────────────────────────────
function renderAlertas() {
  const bajos = state.productos.filter(p => p.activo && p.stock <= p.stockMin);
  const badge = document.getElementById('badge-alertas');
  if (badge) badge.textContent = bajos.length;
  const tbody = document.getElementById('tbl-alertas');
  if (!tbody) return;
  tbody.innerHTML = bajos.length ? bajos.map(p => `
    <tr>
      <td class="font-mono text-accent" style="font-size:12px">${p.codigo}</td>
      <td><strong>${p.nombre}</strong></td>
      <td>${p.Categoría}</td>
      <td class="font-mono ${p.stock===0?'text-danger fw-bold':'text-warn fw-bold'}">${p.stock}</td>
      <td class="font-mono">${p.stockMin}</td>
      <td>${p.stock===0
        ? '<span class="pill pill-danger">Agotado</span>'
        : '<span class="pill pill-warn">Stock Bajo</span>'}</td>
      <td><button class="btn btn-sm btn-primary" onclick="openReponer(${p.id})">Reponer</button></td>
    </tr>`).join('')
    : `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">No hay alertas de stock</td></tr>`;
}

function openReponer(prodId) {
  showPage('entradas');
  openModal('modal-entrada');
  setTimeout(() => {
    const sel = document.getElementById('me-producto');
    if (sel) { sel.value = prodId; }
  }, 150);
}

// ── REPORTES ────────────────────────────────────────────────────
function renderReportes() {
  const prods      = state.productos.filter(p => p.activo);
  const mes        = new Date().toISOString().slice(0, 7);
  const valorTotal = prods.reduce((a, p) => a + (p.stock * (p.pCosto || 0)), 0);
  const ventasMes  = state.salidas.filter(s => s.fecha?.startsWith(mes)).reduce((a, s) => a + (s.cantidad * (s.pVenta || 0)), 0);
  const entsMes    = state.entradas.filter(e => e.fecha?.startsWith(mes)).reduce((a, e) => a + e.cantidad, 0);
  const salsMes    = state.salidas.filter(s => s.fecha?.startsWith(mes)).reduce((a, s) => a + s.cantidad, 0);

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('r-valor',        'S/ ' + fmt(valorTotal));
  set('r-ventas',       'S/ ' + fmt(ventasMes));
  set('r-entradas-mes', entsMes);
  set('r-salidas-mes',  salsMes);

  // Por Categoría
  const cats = {};
  prods.forEach(p => {
    if (!cats[p.Categoría]) cats[p.Categoría] = { count:0, stock:0, valor:0 };
    cats[p.Categoría].count++;
    cats[p.Categoría].stock += p.stock;
    cats[p.Categoría].valor += p.stock * (p.pCosto || 0);
  });
  const catEl = document.getElementById('r-Categorías');
  if (catEl) catEl.innerHTML = Object.entries(cats)
    .map(([k, v]) => `<tr><td>${k}</td><td class="font-mono">${v.count}</td><td class="font-mono">${v.stock}</td><td class="font-mono text-accent">S/ ${fmt(v.valor)}</td></tr>`)
    .join('');

  // Por marca (ventas)
  const marcas = {};
  state.salidas.forEach(s => {
    const p = state.productos.find(x => x.id === s.productoId);
    if (!p) return;
    if (!marcas[p.marca]) marcas[p.marca] = { und:0, total:0 };
    marcas[p.marca].und   += s.cantidad;
    marcas[p.marca].total += s.cantidad * (s.pVenta || 0);
  });
  const marcasEl = document.getElementById('r-marcas');
  if (marcasEl) marcasEl.innerHTML = Object.entries(marcas).length
    ? Object.entries(marcas)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([k, v]) => `<tr><td>${k}</td><td class="font-mono">${v.und}</td><td class="font-mono text-success">S/ ${fmt(v.total)}</td></tr>`)
        .join('')
    : emptyRow(3, 'Sin ventas registradas');

  // Inventario completo
  const invEl = document.getElementById('r-inventario');
  if (invEl) invEl.innerHTML = prods.map(p => `
    <tr>
      <td class="font-mono text-accent" style="font-size:11px">${p.codigo}</td>
      <td>${p.nombre}</td>
      <td>${p.marca}</td>
      <td class="font-mono">${p.stock}</td>
      <td class="font-mono">S/ ${fmt(p.pCosto)}</td>
      <td class="font-mono">S/ ${fmt(p.pVenta)}</td>
      <td class="font-mono text-success">S/ ${fmt(p.stock * (p.pCosto || 0))}</td>
    </tr>`).join('');
}

function exportCSV() {
  const prods = state.productos.filter(p => p.activo);
  const rows  = [['Codigo','Nombre','Categoría','Marca','Stock','P.Costo','P.Venta','Valor Total']];
  prods.forEach(p => rows.push([
    p.codigo, p.nombre, p.Categoría, p.marca,
    p.stock, p.pCosto||0, p.pVenta||0,
    ((p.stock * (p.pCosto||0)).toFixed(2))
  ]));
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'TecnoCell_Inventario.csv'; a.click();
  toast('Archivo CSV descargado');
}

function printReport() { window.print(); }

// ── MENU RESPONSIVO ─────────────────────────────────────────────
function toggleMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  } else {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
  }
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      document.querySelector('.sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('active');
    }
  });
});

// ── ENTER KEY EN LOGIN ──────────────────────────────────────────
document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('login-user').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-pass').focus();
});

// ── INICIALIZACION ──────────────────────────────────────────────
setDate();