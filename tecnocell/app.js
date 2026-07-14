  /* ═══════════════════════════════════════
   TECNOCELL S.A.C. — app.js
   Lógica completa del sistema de inventario
═══════════════════════════════════════ */
const SUPABASE_URL = 'https://cilnbzovlcarnjkiuylh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pizASaSdNvJwCiZxwCc9KA_PoYoB69a';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── ESTADO GLOBAL ──────────────────────────────────────
let state = {
  currentUser: null,
  productos: [],
  proveedores: [],
  clientes: [],
  usuarios: [],
  entradas: [],
  salidas: [],
  movimientos: [],
};

// ── USUARIOS POR DEFECTO ───────────────────────────────
const DEFAULT_USERS = [
  { id: 1, username: 'admin',      password: '1234', nombre: 'Administrador',    rol: 'Administrador', email: 'admin@tecnocell.pe',      dni: '00000001', activo: true },
  { id: 2, username: 'Almacén',    password: '1234', nombre: 'Carlos Quispe',     rol: 'Almacénero',    email: 'Almacén@tecnocell.pe',    dni: '72345678', activo: true },
  { id: 3, username: 'vendedor',   password: '1234', nombre: 'Ana Torres',        rol: 'Vendedor',      email: 'ventas@tecnocell.pe',     dni: '87654321', activo: true },
];
state.usuarios = DEFAULT_USERS;

// ── DATOS DE DEMOSTRACIÓN ─────────────────────────────
const DEMO_PRODUCTOS = [
  { id:1,  codigo:'CEL-001', nombre:'Samsung Galaxy S24 Ultra',  Categoría:'Celulares',  marca:'Samsung', stock:8,  stockMin:3, pCosto:2800, pVenta:3599, Descripción:'256GB, 12GB RAM', activo:true },
  { id:2,  codigo:'CEL-002', nombre:'iPhone 15 Pro Max',          Categoría:'Celulares',  marca:'Apple',   stock:4,  stockMin:3, pCosto:4200, pVenta:5299, Descripción:'256GB, Titanio', activo:true },
  { id:3,  codigo:'CEL-003', nombre:'Xiaomi Redmi Note 13 Pro',   Categoría:'Celulares',  marca:'Xiaomi',  stock:15, stockMin:5, pCosto:780,  pVenta:999,  Descripción:'128GB, NFC', activo:true },
  { id:4,  codigo:'CEL-004', nombre:'Motorola Edge 40 Pro',       Categoría:'Celulares',  marca:'Motorola',stock:2,  stockMin:3, pCosto:1100, pVenta:1499, Descripción:'256GB, Carga 125W', activo:true },
  { id:5,  codigo:'CEL-005', nombre:'OPPO Reno 11 Pro',           Categoría:'Celulares',  marca:'OPPO',    stock:7,  stockMin:4, pCosto:950,  pVenta:1249, Descripción:'256GB, Triple cámara', activo:true },
  { id:6,  codigo:'ACC-001', nombre:'Funda Silicone iPhone 15',   Categoría:'Accesorios', marca:'Apple',   stock:25, stockMin:10,pCosto:85,   pVenta:129,  Descripción:'Original', activo:true },
  { id:7,  codigo:'ACC-002', nombre:'Cargador USB-C 65W',         Categoría:'Accesorios', marca:'Anker',   stock:18, stockMin:8, pCosto:65,   pVenta:99,   Descripción:'GaN Technology', activo:true },
  { id:8,  codigo:'ACC-003', nombre:'Auriculares TWS Pro',        Categoría:'Audio',      marca:'JBL',     stock:1,  stockMin:5, pCosto:180,  pVenta:249,  Descripción:'ANC, 30h batería', activo:true },
  { id:9,  codigo:'REP-001', nombre:'Pantalla Samsung S22',       Categoría:'Repuestos',  marca:'Samsung', stock:3,  stockMin:2, pCosto:320,  pVenta:450,  Descripción:'AMOLED Original', activo:true },
  { id:10, codigo:'REP-002', nombre:'Batería iPhone 13',           Categoría:'Repuestos',  marca:'Apple',   stock:0,  stockMin:3, pCosto:150,  pVenta:220,  Descripción:'3227mAh Original', activo:true },
  { id:11, codigo:'TAB-001', nombre:'iPad Air M2 11"',            Categoría:'Tablets',    marca:'Apple',   stock:5,  stockMin:2, pCosto:2400, pVenta:3099, Descripción:'256GB WiFi', activo:true },
  { id:12, codigo:'ACC-004', nombre:'Cable USB-C Trenzado 1.5m',  Categoría:'Accesorios', marca:'Ugreen',  stock:40, stockMin:15,pCosto:18,   pVenta:35,   Descripción:'Carga rápida 60W', activo:true },
];

const DEMO_PROVEEDORES = [
  { id:1, ruc:'20601234567', empresa:'Importaciones TechPro S.A.C.',  contacto:'Marco Flores',  tel:'01-4521890', email:'ventas@techpro.pe',    dir:'Av. Arenales 1234, Lima', activo:true },
  { id:2, ruc:'20987654321', empresa:'Distribuidora CelulMax E.I.R.L.',contacto:'Sandra Rojas',  tel:'01-7896541', email:'pedidos@celulmax.pe',   dir:'Jr. Moquegua 567, Lima',  activo:true },
  { id:3, ruc:'20451234890', empresa:'AccesoriosPlus S.A.C.',         contacto:'Héctor Mamani', tel:'01-3214567', email:'info@accesoriosplus.pe', dir:'Calle Las Flores 890, Miraflores', activo:true },
];

// ── PERSISTENCIA EN localStorage ──────────────────────
function saveData() {
  localStorage.setItem('tc_state', JSON.stringify(state));
}

const DEMO_CLIENTES = [
  { id:1, doc:'72341122',    nombre:'María Gonzáles',           tel:'987654321', email:'maria.g@mail.com',      dir:'Surco, Lima',  activo:true },
  { id:2, doc:'20543219876', nombre:'Soluciones Digitales EIRL',tel:'01-456789', email:'compras@soldigital.pe', dir:'San Isidro',   activo:true },
];

function loadData() {
  const raw = localStorage.getItem('tc_state');
  if (raw) {
    state = JSON.parse(raw);
    if (!state.clientes) state.clientes = DEMO_CLIENTES;
    if (!state.usuarios || state.usuarios.length === 0) state.usuarios = DEFAULT_USERS;
  } else {
    state.productos   = DEMO_PRODUCTOS;
    state.proveedores = DEMO_PROVEEDORES;
    state.clientes    = DEMO_CLIENTES;
    state.usuarios    = DEFAULT_USERS;
    state.entradas    = [];
    state.salidas     = [];
    state.movimientos = [];
    generateDemoMovimientos();
    saveData();
  }
  // Migrar campo 'tel' en usuarios existentes
  state.usuarios = state.usuarios.map(u => ({ tel: '', ...u }));
}
async function cargarProductosSupabase() {

  const { data, error } = await db
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    return toast('Error al cargar productos', 'error');
  }

  state.productos = data.map(p => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    Categoría: p.Categoría,
    marca: p.marca,
    stock: p.stock,
    stockMin: p.stock_min,
    pCosto: p.precio_costo,
    pVenta: p.precio_venta,
    Descripción: p.Descripción,
    activo: p.activo
  }));

  renderProductos();
}

function generateDemoMovimientos() {
  const hoy = new Date();
  const dias = (d) => { const dd = new Date(hoy); dd.setDate(dd.getDate()-d); return dd.toISOString().split('T')[0]; };
  const movs = [
    { id:1, fecha:dias(0), tipo:'Entrada', productoId:3, productoCod:'CEL-003', productoNom:'Xiaomi Redmi Note 13 Pro', cantidad:10, motivo:'Samsung Electronics', obs:'Pedido mensual', usuario:'admin' },
    { id:2, fecha:dias(0), tipo:'Salida',  productoId:1, productoCod:'CEL-001', productoNom:'Samsung Galaxy S24 Ultra', cantidad:1,  motivo:'Venta',             obs:'',              usuario:'vendedor' },
    { id:3, fecha:dias(1), tipo:'Entrada', productoId:6, productoCod:'ACC-001', productoNom:'Funda Silicone iPhone 15', cantidad:15, motivo:'Importaciones TechPro S.A.C.', obs:'', usuario:'Almacén' },
    { id:4, fecha:dias(1), tipo:'Salida',  productoId:2, productoCod:'CEL-002', productoNom:'iPhone 15 Pro Max',        cantidad:1,  motivo:'Venta',             obs:'Cliente VIP',   usuario:'vendedor' },
    { id:5, fecha:dias(2), tipo:'Salida',  productoId:7, productoCod:'ACC-002', productoNom:'Cargador USB-C 65W',      cantidad:3,  motivo:'Venta',             obs:'',              usuario:'vendedor' },
    { id:6, fecha:dias(3), tipo:'Entrada', productoId:9, productoCod:'REP-001', productoNom:'Pantalla Samsung S22',    cantidad:5,  motivo:'AccesoriosPlus S.A.C.', obs:'Urgente',  usuario:'Almacén' },
    { id:7, fecha:dias(4), tipo:'Salida',  productoId:5, productoCod:'CEL-005', productoNom:'OPPO Reno 11 Pro',        cantidad:2,  motivo:'Venta',             obs:'',              usuario:'vendedor' },
  ];
  state.movimientos = movs;
  // Construir entradas/salidas sincronizadas
  state.entradas = movs.filter(m=>m.tipo==='Entrada').map(m => ({
    id: m.id, fecha: m.fecha, productoId: m.productoId, productoNom: m.productoNom,
    proveedor: m.motivo, cantidad: m.cantidad, pCosto: state.productos.find(p=>p.id===m.productoId)?.pCosto||0,
    comprobante: '', obs: m.obs, usuario: m.usuario
  }));
  state.salidas = movs.filter(m=>m.tipo==='Salida').map(m => ({
    id: m.id, fecha: m.fecha, productoId: m.productoId, productoNom: m.productoNom,
    motivo: m.motivo, cantidad: m.cantidad, pVenta: state.productos.find(p=>p.id===m.productoId)?.pVenta||0,
    obs: m.obs, usuario: m.usuario
  }));
}
function emptyRow(cols, text) {
  return `
    <tr>
      <td colspan="${cols}" class="text-muted" style="text-align:center; padding:20px;">
        ${text}
      </td>
    </tr>
  `;
}

// ══════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════
async function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();

  const user = state.usuarios.find(x => x.username === u && x.password === p && x.activo);

  if (!user) {
    document.getElementById('login-error').style.display = 'block';
    return;
  }

  state.currentUser = user;

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').style.display = 'block';
  document.getElementById('sf-name').textContent = user.nombre;
  document.getElementById('sf-role').textContent = user.rol;
  document.getElementById('ua').textContent = user.nombre.charAt(0).toUpperCase();

  applyRoleRestrictions(user.rol);
  setDate();

  try {
    await cargarProductosSupabase();
  } catch (e) {
    console.error(e);
    toast('No se pudo cargar Supabase, usando datos locales', 'warn');
  }

  showPage('dashboard');
}

function doLogout() {
  if (!confirm('¿Cerrar Sesión?')) return;
  state.currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').style.display = 'none';
}

// Control de acceso por rol
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

// ══════════════════════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════════════════════
const PAGE_META = {
  dashboard:    { title: '📊 Dashboard',    sub: 'Resumen general del sistema' },
  productos:    { title: '📦 Productos',    sub: 'Gestión de productos en inventario' },
  entradas:     { title: '📥 Entradas',     sub: 'Registro de ingresos al Almacén' },
  salidas:      { title: '📤 Salidas',      sub: 'Registro de salidas y ventas' },
  movimientos:  { title: '🔄 Movimientos',  sub: 'Historial completo de movimientos' },
  clientes:     { title: '👥 Clientes',     sub: 'Gestión de clientes' },
  proveedores:  { title: '🏢 Proveedores',  sub: 'Gestión de proveedores' },
  usuarios:     { title: '👤 Usuarios',     sub: 'Gestión de usuarios y roles' },
  alertas:      { title: '🔔 Alertas',      sub: 'Productos con stock bajo o agotado' },
  reportes:     { title: '📈 Reportes',     sub: 'Análisis e informes del inventario' },
};

function showPage(page) {
  document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.getElementById('nav-'+page).classList.add('active');
  const m = PAGE_META[page];
  document.getElementById('page-title').textContent = m.title;
  document.getElementById('page-sub').textContent   = m.sub;
  const renders = {
    dashboard, productos: renderProductos, entradas: renderEntradas, salidas: renderSalidas,
    movimientos: renderMovimientos, clientes: renderClientes, proveedores: renderProveedores,
    usuarios: renderUsuarios, alertas: renderAlertas, reportes: renderReportes
  };
  if (renders[page]) renders[page]();
}

function setDate() {
  const d = new Date();
  document.getElementById('topbar-date').textContent =
    d.toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function dashboard() {
  const prods = state.productos.filter(p=>p.activo);
  const bajos = prods.filter(p=>p.stock <= p.stockMin);
  const valor = prods.reduce((a,p)=>a+(p.stock*p.pCosto),0);
  const hoy   = new Date().toISOString().split('T')[0];
  const movHoy= state.movimientos.filter(m=>m.fecha===hoy).length;

  document.getElementById('s-productos').textContent  = prods.length;
  document.getElementById('s-bajo').textContent       = bajos.length;
  document.getElementById('s-valor').textContent      = 'S/ '+fmt(valor);
  document.getElementById('s-movimientos').textContent = movHoy;
  document.getElementById('badge-alertas').textContent = bajos.length;

  // Últimos movimientos
  const tbody = document.getElementById('dash-movimientos');
  const recientes = [...state.movimientos].sort((a,b)=>b.id-a.id).slice(0,8);
  tbody.innerHTML = recientes.length ? recientes.map(m=>`
    <tr>
      <td class="font-mono" style="font-size:12px">${m.productoCod||''}</td>
      <td><span class="pill ${m.tipo==='Entrada'?'pill-success':'pill-danger'}">${m.tipo}</span></td>
      <td class="font-mono">${m.cantidad}</td>
      <td>${m.usuario}</td>
      <td class="text-muted">${m.fecha}</td>
    </tr>`).join('') : emptyRow(5,'Sin movimientos');

  // Stock bajo
  const tb2 = document.getElementById('dash-bajos');
  tb2.innerHTML = bajos.length ? bajos.slice(0,8).map(p=>`
    <tr>
      <td>${p.nombre}</td>
      <td class="font-mono ${p.stock===0?'text-danger':'text-warn'}">${p.stock}</td>
      <td class="font-mono">${p.stockMin}</td>
      <td><button class="btn btn-sm btn-warn" onclick="openReponer(${p.id})">Reponer</button></td>
    </tr>`).join('') : emptyRow(4,'Sin alertas de stock');
}

// ══════════════════════════════════════════════════════
// PRODUCTOS
// ══════════════════════════════════════════════════════
function renderProductos(q='') {
  const cat = document.getElementById('filtro-cat')?.value || '';
  let prods = state.productos.filter(p=>p.activo);
  if (q)   prods = prods.filter(p=>(p.nombre+p.codigo+p.marca).toLowerCase().includes(q.toLowerCase()));
  if (cat) prods = prods.filter(p=>p.Categoría===cat);
  const tbody = document.getElementById('tbl-productos');
  tbody.innerHTML = prods.length ? prods.map(p=>`
    <tr>
      <td class="font-mono text-accent" style="font-size:12px">${p.codigo}</td>
      <td><strong>${p.nombre}</strong><br><span class="text-muted" style="font-size:11px">${p.Descripción||''}</span></td>
      <td>${p.Categoría}</td>
      <td>${p.marca}</td>
      <td class="font-mono ${stockClass(p)}">${p.stock}</td>
      <td class="font-mono">S/ ${fmt(p.pCosto)}</td>
      <td class="font-mono">S/ ${fmt(p.pVenta)}</td>
      <td>${stockPill(p)}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="editProducto(${p.id})">✏</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProducto(${p.id})" style="margin-left:4px">🗑</button>
      </td>
    </tr>`).join('') : emptyRow(9,'No se encontraron productos');
}

function stockClass(p) { return p.stock===0?'text-danger':p.stock<=p.stockMin?'text-warn':'text-success'; }

function stockPill(p) {
  if (p.stock===0) return '<span class="pill pill-danger">Agotado</span>';
  if (p.stock<=p.stockMin) return '<span class="pill pill-warn">Stock Bajo</span>';
  return '<span class="pill pill-success">Disponible</span>';
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  // Poblar selects al abrir
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

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function clearForm(fields) { fields.forEach(f => { const el=document.getElementById(f); if(el) el.value=''; }); }

function openModal_Producto_new() {
  document.getElementById('mp-title').textContent = 'Nuevo Producto';
  clearForm(['mp-id','mp-codigo','mp-nombre','mp-marca','mp-stock','mp-stock-min','mp-pcosto','mp-pventa','mp-Descripción']);
  document.getElementById('mp-Categoría').value = 'Celulares';
  openModal('modal-producto');
}

function editProducto(id) {
  const p = state.productos.find(x=>x.id===id);
  if (!p) return;
  document.getElementById('mp-title').textContent = 'Editar Producto';
  document.getElementById('mp-id').value          = p.id;
  document.getElementById('mp-codigo').value      = p.codigo;
  document.getElementById('mp-nombre').value      = p.nombre;
  document.getElementById('mp-Categoría').value   = p.Categoría;
  document.getElementById('mp-marca').value       = p.marca;
  document.getElementById('mp-stock').value       = p.stock;
  document.getElementById('mp-stock-min').value   = p.stockMin;
  document.getElementById('mp-pcosto').value      = p.pCosto;
  document.getElementById('mp-pventa').value      = p.pVenta;
  document.getElementById('mp-Descripción').value = p.Descripción||'';
  openModal('modal-producto');
}

async function saveProducto() {
  const id = document.getElementById('mp-id').value;
  const codigo = document.getElementById('mp-codigo').value.trim();
  const nombre = document.getElementById('mp-nombre').value.trim();
  const pcosto = parseFloat(document.getElementById('mp-pcosto').value) || 0;
  const pventa = parseFloat(document.getElementById('mp-pventa').value) || 0;

  if (!codigo || !nombre) {
    return toast('Complete los campos obligatorios', 'error');
  }

  const productoData = {
    codigo,
    nombre,
    Categoría: document.getElementById('mp-Categoría').value,
    marca: document.getElementById('mp-marca').value.trim(),
    stock: parseInt(document.getElementById('mp-stock').value) || 0,
    stock_min: parseInt(document.getElementById('mp-stock-min').value) || 0,
    precio_costo: pcosto,
    precio_venta: pventa,
    Descripción: document.getElementById('mp-Descripción').value.trim(),
    activo: true
  };

  let error;

  if (id) {
    const result = await db
      .from('productos')
      .update(productoData)
      .eq('id', id);

    error = result.error;
  } else {
    const result = await db
      .from('productos')
      .insert(productoData);

    error = result.error;
  }

  if (error) {
    console.error(error);
    return toast(error.message || 'Error al guardar en Supabase', 'error');
  }

  toast(id ? 'Producto actualizado ✅' : 'Producto guardado ✅');
  closeModal('modal-producto');
  await cargarProductosSupabase();
}

async function deleteProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;

  const { error } = await db
    .from('productos')
    .update({ activo: false })
    .eq('id', id);

  if (error) {
    console.error(error);
    return toast('Error al eliminar producto', 'error');
  }

  toast('Producto eliminado ✅');
  await cargarProductosSupabase();
}

// ══════════════════════════════════════════════════════
// ENTRADAS
// ══════════════════════════════════════════════════════
function renderEntradas() {
  const tbody = document.getElementById('tbl-entradas');
  const list  = [...state.entradas].sort((a,b)=>b.id-a.id);
  tbody.innerHTML = list.length ? list.map(e=>`
    <tr>
      <td class="text-muted">${e.fecha}</td>
      <td><strong>${e.productoNom}</strong></td>
      <td>${e.proveedor}</td>
      <td class="font-mono text-accent">${e.cantidad}</td>
      <td class="font-mono">S/ ${fmt(e.pCosto)}</td>
      <td class="font-mono text-success">S/ ${fmt(e.cantidad*e.pCosto)}</td>
      <td>${e.usuario}</td>
    </tr>`).join('') : emptyRow(7,'Sin entradas registradas');
}

function fillSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = state.productos.filter(p=>p.activo).map(p=>`<option value="${p.id}">${p.codigo} — ${p.nombre}</option>`).join('');
}

function fillProvSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = state.proveedores.filter(p=>p.activo).map(p=>`<option value="${p.id}">${p.empresa}</option>`).join('');
}

function setTodayDate(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) el.value = new Date().toISOString().split('T')[0];
}

function fillClienteSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">— Sin cliente —</option>' +
    (state.clientes || []).filter(c => c.activo).map(c =>
      `<option value="${c.id}">${c.nombre} (${c.doc})</option>`).join('');
}

// ══════════════════════════════════════════════════════
// CLIENTES
// ══════════════════════════════════════════════════════
function renderClientes(q = '') {
  let lista = (state.clientes || []).slice();
  if (q) lista = lista.filter(c =>
    (c.nombre + c.doc + c.email + (c.tel || '')).toLowerCase().includes(q.toLowerCase()));

  const tbody = document.getElementById('tbl-clientes');
  if (!tbody) return;

  tbody.innerHTML = lista.length ? lista.map(c => `
    <tr style="${!c.activo ? 'opacity:0.55' : ''}">
      <td class="font-mono text-accent" style="font-size:12px">${c.doc}</td>
      <td><strong>${c.nombre}</strong></td>
      <td>${c.tel || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${c.dir || '—'}</td>
      <td><span class="pill ${c.activo ? 'pill-success' : 'pill-danger'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm btn-ghost" onclick="editCliente(${c.id})">✏ Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCliente(${c.id})" style="margin-left:4px">🗑</button>
      </td>
    </tr>`).join('') : emptyRow(7, '🔍 No se encontraron clientes');
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

function openModal_Cliente_new() {
  document.getElementById('mcli-title').textContent = 'Nuevo Cliente';
  clearForm(['mcli-id','mcli-doc','mcli-nombre','mcli-tel','mcli-email','mcli-dir']);
  openModal('modal-cliente');
}

async function buscarDocCliente() {
  const doc = document.getElementById('mcli-doc')?.value.trim();
  if (!doc) return toast('Ingresa un número de documento primero', 'warn');
  if (doc.length !== 8 && doc.length !== 11)
    return toast('El documento debe tener 8 dígitos (DNI) o 11 dígitos (RUC)', 'warn');

  const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImRhbnllbDA2MTI5NUBnbWFpbC5jb20ifQ.DR8hg0H9dxJNxXWz--RAxlvvtOsBHseG8dSEk45WdCA';
  const esDNI = doc.length === 8;
  const url   = esDNI
    ? `https://dniruc.apisperu.com/api/v1/dni/${doc}?token=${TOKEN}`
    : `https://dniruc.apisperu.com/api/v1/ruc/${doc}?token=${TOKEN}`;

  // Feedback visual mientras carga
  const btn = document.querySelector('[onclick="buscarDocCliente()"]');
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    if (esDNI) {
      // Respuesta DNI: { dni, nombres, apellidoPaterno, apellidoMaterno }
      if (!data.nombres) throw new Error('Sin datos');
      const nombreCompleto = `${data.apellidoPaterno} ${data.apellidoMaterno}, ${data.nombres}`.trim();
      document.getElementById('mcli-nombre').value = nombreCompleto;
      document.getElementById('mcli-dir').value    = '';
      toast('✅ DNI encontrado en RENIEC');
    } else {
      // Respuesta RUC: { ruc, RazónSocial, Dirección, ubigeoSunat, ... }
      if (!data.RazónSocial) throw new Error('Sin datos');
      document.getElementById('mcli-nombre').value = data.RazónSocial;
      document.getElementById('mcli-dir').value    = data.Dirección || '';
      toast('✅ RUC encontrado en SUNAT');
    }
  } catch (err) {
    // Fallback: buscar en base local
    const local = (state.clientes || []).find(c => c.doc === doc);
    if (local) {
      document.getElementById('mcli-nombre').value = local.nombre;
      document.getElementById('mcli-tel').value    = local.tel || '';
      document.getElementById('mcli-email').value  = local.email || '';
      document.getElementById('mcli-dir').value    = local.dir || '';
      toast('✅ Cliente encontrado en base local');
    } else {
      toast('❌ No se pudo consultar la API. Completa los datos manualmente.', 'error');
    }
  } finally {
    if (btn) { btn.textContent = '🔍'; btn.disabled = false; }
  }
}

function saveCliente() {
  const id     = document.getElementById('mcli-id').value;
  const doc    = document.getElementById('mcli-doc').value.trim();
  const nombre = document.getElementById('mcli-nombre').value.trim();
  const tel    = document.getElementById('mcli-tel').value.trim();
  const email  = document.getElementById('mcli-email').value.trim();
  const dir    = document.getElementById('mcli-dir').value.trim();

  if (!doc || !nombre) return toast('Documento y nombre son obligatorios', 'error');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Correo inválido', 'error');

  if (!state.clientes) state.clientes = [];

  if (id) {
    const idx = state.clientes.findIndex(c => c.id == id);
    state.clientes[idx] = { ...state.clientes[idx], doc, nombre, tel, email, dir };
    toast('Cliente actualizado ✅');
  } else {
    if (state.clientes.find(c => c.doc === doc)) return toast('Ya existe un cliente con ese documento', 'error');
    state.clientes.push({
      id: Math.max(0, ...state.clientes.map(c => c.id)) + 1,
      doc, nombre, tel, email, dir, activo: true
    });
    toast('Cliente creado ✅');
  }
  saveData();
  closeModal('modal-cliente');
  renderClientes();
  // Refrescar select de clientes en modal-salida si está abierto
  fillClienteSelect('ms-cliente');
}

function deleteCliente(id) {
  if (!confirm('¿Eliminar este cliente?')) return;
  state.clientes = (state.clientes || []).filter(c => c.id !== id);
  saveData();
  renderClientes();
  toast('Cliente eliminado');
}

function saveEntrada() {
  const prodId    = parseInt(document.getElementById('me-producto').value);
  const provId    = parseInt(document.getElementById('me-proveedor').value);
  const cantidad  = parseInt(document.getElementById('me-cantidad').value)||0;
  const pCosto    = parseFloat(document.getElementById('me-pcosto').value)||0;
  const fecha     = document.getElementById('me-fecha').value;
  const obs       = document.getElementById('me-obs').value.trim();

  if (!prodId || cantidad<=0) return toast('Complete cantidad válida', 'error');
  const prod = state.productos.find(p=>p.id===prodId);
  const prov = state.proveedores.find(p=>p.id===provId);
  if (!prod) return toast('Producto no encontrado', 'error');

  prod.stock += cantidad;
  if (pCosto > 0) prod.pCosto = pCosto;

  const newId = Math.max(0,...state.entradas.map(e=>e.id),0)+1;
  const entrada = {
    id: newId, fecha, productoId: prod.id, productoNom: prod.nombre,
    proveedor: prov?.empresa||'—', cantidad, pCosto, obs,
    usuario: state.currentUser?.username||'admin', comprobante: document.getElementById('me-comprobante').value
  };
  state.entradas.push(entrada);
  state.movimientos.push({
    id: newId+10000, fecha, tipo:'Entrada',
    productoId: prod.id, productoCod: prod.codigo, productoNom: prod.nombre,
    cantidad, motivo: prov?.empresa||'—', obs, usuario: state.currentUser?.username||'admin'
  });
  saveData(); closeModal('modal-entrada'); renderEntradas(); toast('Entrada registrada ✅');
}

// ══════════════════════════════════════════════════════
// SALIDAS
// ══════════════════════════════════════════════════════
function renderSalidas() {
  const tbody = document.getElementById('tbl-salidas');
  const list  = [...state.salidas].sort((a,b) => b.id - a.id);
  tbody.innerHTML = list.length ? list.map(s => `
    <tr>
      <td class="text-muted">${s.fecha}</td>
      <td><strong>${s.productoNom}</strong></td>
      <td>${s.clienteNom ? `<span class="pill pill-info" style="font-size:10px">${s.clienteNom}</span>` : '<span class="text-muted" style="font-size:11px">Publico General</span>'}</td>
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
  const prod = state.productos.find(p=>p.id===parseInt(sel.value));
  if (prod) {
    disp.value = prod.stock + ' unidades';
    document.getElementById('ms-pventa').value = prod.pVenta;
  }
}

function saveSalida() {
  const prodId    = parseInt(document.getElementById('ms-producto').value);
  const cantidad  = parseInt(document.getElementById('ms-cantidad').value) || 0;
  const pVenta    = parseFloat(document.getElementById('ms-pventa').value) || 0;
  const motivo    = document.getElementById('ms-motivo').value;
  const fecha     = document.getElementById('ms-fecha').value;
  const obs       = document.getElementById('ms-obs').value.trim();
  const clienteSel = document.getElementById('ms-cliente');
  const clienteId  = clienteSel ? (parseInt(clienteSel.value) || null) : null;
  const clienteNom = clienteId
    ? (state.clientes || []).find(c => c.id === clienteId)?.nombre || ''
    : '';

  if (!prodId || cantidad <= 0) return toast('Complete cantidad válida', 'error');
  const prod = state.productos.find(p => p.id === prodId);
  if (!prod) return toast('Producto no encontrado', 'error');
  if (prod.stock < cantidad) return toast(`Stock insuficiente. Disponible: ${prod.stock}`, 'error');

  prod.stock -= cantidad;

  const newId = Math.max(0, ...state.salidas.map(s => s.id), 0) + 1;
  const salida = {
    id: newId, fecha, productoId: prod.id, productoNom: prod.nombre,
    motivo, cantidad, pVenta, obs, clienteId, clienteNom,
    usuario: state.currentUser?.username || 'admin'
  };
  state.salidas.push(salida);
  state.movimientos.push({
    id: newId + 20000, fecha, tipo: 'Salida',
    productoId: prod.id, productoCod: prod.codigo, productoNom: prod.nombre,
    cantidad, motivo, obs, clienteNom,
    usuario: state.currentUser?.username || 'admin'
  });
  saveData();
  closeModal('modal-salida');
  renderSalidas();
  toast('Salida registrada ✅');
}

// ══════════════════════════════════════════════════════
// MOVIMIENTOS
// ══════════════════════════════════════════════════════
function renderMovimientos(q='') {
  const tipo = document.getElementById('filtro-tipo-mov')?.value||'';
  let list   = [...state.movimientos].sort((a,b)=>{
    if (b.fecha !== a.fecha) return b.fecha.localeCompare(a.fecha);
    return b.id - a.id;
  });
  if (q)    list = list.filter(m=>(m.productoNom+m.productoCod+m.usuario).toLowerCase().includes(q.toLowerCase()));
  if (tipo) list = list.filter(m=>m.tipo===tipo);
  const tbody = document.getElementById('tbl-movimientos');
  tbody.innerHTML = list.length ? list.map(m=>`
    <tr>
      <td class="text-muted">${m.fecha}</td>
      <td><span class="pill ${m.tipo==='Entrada'?'pill-success':'pill-danger'}">${m.tipo}</span></td>
      <td><span class="font-mono text-accent" style="font-size:11px">${m.productoCod||''}</span><br><span style="font-size:13px">${m.productoNom}</span></td>
      <td class="font-mono">${m.cantidad}</td>
      <td>${m.motivo||'—'}</td>
      <td>${m.usuario}</td>
      <td class="text-muted">${m.obs||'—'}</td>
    </tr>`).join('') : emptyRow(7,'Sin movimientos registrados');
}

// ══════════════════════════════════════════════════════
// PROVEEDORES
// ══════════════════════════════════════════════════════
function renderProveedores(q='') {
  let list = state.proveedores.filter(p=>p.activo);
  if (q) list = list.filter(p=>(p.empresa+p.ruc+p.contacto).toLowerCase().includes(q.toLowerCase()));
  const tbody = document.getElementById('tbl-proveedores');
  tbody.innerHTML = list.length ? list.map(p=>`
    <tr>
      <td class="font-mono text-accent" style="font-size:12px">${p.ruc}</td>
      <td><strong>${p.empresa}</strong></td>
      <td>${p.contacto||'—'}</td>
      <td>${p.tel}</td>
      <td>${p.email}</td>
      <td>${p.dir||'—'}</td>
      <td><span class="pill pill-success">Activo</span></td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="editProveedor(${p.id})">✏</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProveedor(${p.id})" style="margin-left:4px">🗑</button>
      </td>
    </tr>`).join('') : emptyRow(8,'No se encontraron proveedores');
}

function editProveedor(id) {
  const p = state.proveedores.find(x=>x.id===id);
  if (!p) return;
  document.getElementById('mprov-title').textContent = 'Editar Proveedor';
  document.getElementById('mprov-id').value       = p.id;
  document.getElementById('mprov-ruc').value      = p.ruc;
  document.getElementById('mprov-empresa').value  = p.empresa;
  document.getElementById('mprov-contacto').value = p.contacto||'';
  document.getElementById('mprov-tel').value      = p.tel;
  document.getElementById('mprov-email').value    = p.email;
  document.getElementById('mprov-dir').value      = p.dir||'';
  openModal('modal-proveedor');
}

function saveProveedor() {
  const id      = document.getElementById('mprov-id').value;
  const ruc     = document.getElementById('mprov-ruc').value.trim();
  const empresa = document.getElementById('mprov-empresa').value.trim();
  const tel     = document.getElementById('mprov-tel').value.trim();
  const email   = document.getElementById('mprov-email').value.trim();
  if (!ruc || !empresa || !tel || !email) return toast('Complete los campos obligatorios', 'error');
  if (ruc.length !== 11) return toast('El RUC debe tener 11 dígitos', 'error');

  const data = {
    ruc, empresa,
    contacto: document.getElementById('mprov-contacto').value.trim(),
    tel, email,
    dir: document.getElementById('mprov-dir').value.trim(),
    activo: true
  };

  if (id) {
    const idx = state.proveedores.findIndex(p=>p.id==id);
    state.proveedores[idx] = { ...state.proveedores[idx], ...data };
    toast('Proveedor actualizado ✅');
  } else {
    data.id = Math.max(0,...state.proveedores.map(p=>p.id))+1;
    state.proveedores.push(data);
    toast('Proveedor creado ✅');
  }
  saveData(); closeModal('modal-proveedor'); renderProveedores();
}

function deleteProveedor(id) {
  if (!confirm('¿Eliminar este proveedor?')) return;
  const idx = state.proveedores.findIndex(p=>p.id===id);
  state.proveedores[idx].activo = false;
  saveData(); renderProveedores(); toast('Proveedor eliminado');
}

// ══════════════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════════════
function renderUsuarios(q = '') {
  const rolFiltro = document.getElementById('filtro-rol-usuario')?.value || '';
  let lista = state.usuarios.slice();
  if (q) lista = lista.filter(u =>
    (u.username + u.nombre + u.email + (u.dni || '')).toLowerCase().includes(q.toLowerCase()));
  if (rolFiltro) lista = lista.filter(u => u.rol === rolFiltro);

  const esAdmin = state.currentUser?.rol === 'Administrador';
  const tbody = document.getElementById('tbl-usuarios');

  tbody.innerHTML = lista.length ? lista.map(u => {
    const inicial = u.nombre.charAt(0).toUpperCase();
    const rolColors = { 'Administrador': 'var(--accent)', 'Almacénero': 'var(--accent3)', 'Vendedor': 'var(--warn)' };
    const avatarColor = rolColors[u.rol] || 'var(--accent2)';
    const esMismoUser = u.id === state.currentUser?.id;
    return `
    <tr style="${!u.activo ? 'opacity:0.55' : ''}">
      <td>
        <div style="width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,${avatarColor},var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff">${inicial}</div>
      </td>
      <td>
        <span class="font-mono text-accent" style="font-size:12px">${u.username}</span>
        ${esMismoUser ? '<span class="pill pill-info" style="font-size:9px;margin-left:6px;">Tú</span>' : ''}
      </td>
      <td><strong>${u.nombre}</strong></td>
      <td>${rolPill(u.rol)}</td>
      <td>${u.email}</td>
      <td class="font-mono text-muted" style="font-size:12px">${u.dni || '—'}</td>
      <td><span class="pill ${u.activo ? 'pill-success' : 'pill-danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm btn-ghost" onclick="editUsuario(${u.id})" title="Editar">✏ Editar</button>
        ${esAdmin && u.username !== 'admin' ? `
          <button class="btn btn-sm ${u.activo ? 'btn-warn' : 'btn-success'}" onclick="toggleUsuario(${u.id})" style="margin-left:4px">
            ${u.activo ? '⛔ Deshab.' : '✅ Habilitar'}
          </button>` : ''}
        ${esAdmin && u.username !== 'admin' && !esMismoUser ? `
          <button class="btn btn-sm btn-danger" onclick="deleteUsuario(${u.id})" style="margin-left:4px" title="Eliminar">🗑</button>` : ''}
      </td>
    </tr>`;
  }).join('') : emptyRow(8, '🔍 No se encontraron usuarios');
}

function rolPill(rol) {
  const map = { 'Administrador': 'pill-info', 'Almacénero': 'pill-success', 'Vendedor': 'pill-warn' };
  return `<span class="pill ${map[rol] || 'pill-gray'}">${rol}</span>`;
}

function openModal_Usuario_new() {
  document.getElementById('mu-title').textContent = 'Nuevo Usuario';
  document.getElementById('mu-id').value = '';
  clearForm(['mu-username','mu-nombre','mu-email','mu-pass','mu-pass2','mu-dni','mu-tel']);
  document.getElementById('mu-rol').value = 'Vendedor';
  document.getElementById('mu-edit-note').classList.add('hidden');
  document.getElementById('mu-avatar-preview').textContent = '?';
  document.getElementById('mu-nombre-preview').textContent = 'Nuevo Usuario';
  document.getElementById('mu-rol-preview').textContent = 'Vendedor';
  document.getElementById('mu-username').readOnly = false;
  openModal('modal-usuario');
}

function editUsuario(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u) return;
  document.getElementById('mu-title').textContent  = 'Editar Usuario';
  document.getElementById('mu-id').value           = u.id;
  document.getElementById('mu-username').value     = u.username;
  document.getElementById('mu-nombre').value       = u.nombre;
  document.getElementById('mu-rol').value          = u.rol;
  document.getElementById('mu-email').value        = u.email;
  document.getElementById('mu-pass').value         = '';
  document.getElementById('mu-pass2').value        = '';
  document.getElementById('mu-dni').value          = u.dni || '';
  document.getElementById('mu-tel').value          = u.tel || '';
  document.getElementById('mu-edit-note').classList.remove('hidden');
  document.getElementById('mu-username').readOnly  = (u.username === 'admin');
  document.getElementById('mu-avatar-preview').textContent   = u.nombre.charAt(0).toUpperCase();
  document.getElementById('mu-nombre-preview').textContent   = u.nombre;
  document.getElementById('mu-rol-preview').textContent      = u.rol;
  openModal('modal-usuario');
}

function saveUsuario() {
  const id       = document.getElementById('mu-id').value;
  const username = document.getElementById('mu-username').value.trim().replace(/\s+/g, '_');
  const nombre   = document.getElementById('mu-nombre').value.trim();
  const rol      = document.getElementById('mu-rol').value;
  const email    = document.getElementById('mu-email').value.trim();
  const pass     = document.getElementById('mu-pass').value;
  const pass2    = document.getElementById('mu-pass2').value;
  const dni      = document.getElementById('mu-dni').value.trim();
  const tel      = document.getElementById('mu-tel').value.trim();

  if (!username || !nombre || !email) return toast('Complete los campos obligatorios (usuario, nombre, correo)', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Correo electrónico inválido', 'error');
  if (dni && !/^\d{8}$/.test(dni)) return toast('El DNI debe tener exactamente 8 dígitos', 'error');

  let finalPassword;
  if (id) {
    // Edición: contraseña es opcional
    if (pass || pass2) {
      if (pass.length < 4) return toast('La contraseña debe tener Mínimo 4 caracteres', 'error');
      if (pass !== pass2) return toast('Las contraseñas no coinciden ❌', 'error');
      finalPassword = pass;
    } else {
      finalPassword = state.usuarios.find(u => u.id == id)?.password;
    }
    const dupUser = state.usuarios.find(u => u.username === username && u.id != id);
    if (dupUser) return toast('Ese nombre de usuario ya está en uso', 'error');
    const idx = state.usuarios.findIndex(u => u.id == id);
    state.usuarios[idx] = { ...state.usuarios[idx], username, nombre, rol, email, password: finalPassword, dni, tel };
    // Actualizar sidebar si es el usuario logueado
    if (state.currentUser?.id == id) {
      state.currentUser = state.usuarios[idx];
      document.getElementById('sf-name').textContent = nombre;
      document.getElementById('sf-role').textContent = rol;
      document.getElementById('ua').textContent = nombre.charAt(0).toUpperCase();
    }
    toast('Usuario actualizado ✅');
  } else {
    if (!pass) return toast('La contraseña es obligatoria', 'error');
    if (pass.length < 4) return toast('La contraseña debe tener Mínimo 4 caracteres', 'error');
    if (pass !== pass2) return toast('Las contraseñas no coinciden ❌', 'error');
    if (state.usuarios.find(u => u.username === username)) return toast('Ese nombre de usuario ya existe', 'error');
    finalPassword = pass;
    state.usuarios.push({
      id: Math.max(0, ...state.usuarios.map(u => u.id)) + 1,
      username, nombre, rol, email, password: finalPassword, dni, tel, activo: true
    });
    toast('Usuario creado ✅');
  }
  saveData();
  closeModal('modal-usuario');
  renderUsuarios();
}

function toggleUsuario(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u) return;
  if (u.username === 'admin') return toast('No se puede deshabilitar al administrador principal', 'error');
  u.activo = !u.activo;
  saveData();
  renderUsuarios();
  toast(u.activo ? '✅ Usuario habilitado' : '⛔ Usuario deshabilitado');
}

function deleteUsuario(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u) return;
  if (u.username === 'admin') return toast('No se puede eliminar al administrador principal', 'error');
  if (u.id === state.currentUser?.id) return toast('No puedes eliminarte a ti mismo', 'error');
  if (!confirm(`¿Eliminar al usuario "${u.nombre}" definitivamente? Esta acción no se puede deshacer.`)) return;
  state.usuarios = state.usuarios.filter(x => x.id !== id);
  saveData();
  renderUsuarios();
  toast('Usuario eliminado');
}

// ── UTILIDADES USUARIOS ──────────────────────────────
function togglePassVis(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    input.type = 'password';
    if (btn) btn.textContent = '👁';
  }
}

function updateUsuarioPreview() {
  const nombre = document.getElementById('mu-nombre')?.value || '';
  const rol    = document.getElementById('mu-rol')?.value || 'Selecciona un rol';
  const inicial = nombre.trim() ? nombre.trim().charAt(0).toUpperCase() : '?';
  const el = document.getElementById('mu-avatar-preview');
  if (el) el.textContent = inicial;
  const np = document.getElementById('mu-nombre-preview');
  if (np) np.textContent = nombre || 'Nuevo Usuario';
  const rp = document.getElementById('mu-rol-preview');
  if (rp) rp.textContent = rol;
}

// ── MI PERFIL ────────────────────────────────────────
function openMiPerfil() {
  const u = state.currentUser;
  if (!u) return;
  document.getElementById('perfil-avatar').textContent        = u.nombre.charAt(0).toUpperCase();
  document.getElementById('perfil-nombre-header').textContent = u.nombre;
  document.getElementById('perfil-rol-header').innerHTML      = rolPill(u.rol);
  document.getElementById('perfil-user-header').textContent   = '@' + u.username;
  document.getElementById('perfil-username').value            = u.username;
  document.getElementById('perfil-rol').value                 = u.rol;
  document.getElementById('perfil-nombre').value              = u.nombre;
  document.getElementById('perfil-dni').value                 = u.dni || '';
  document.getElementById('perfil-email').value               = u.email;
  document.getElementById('perfil-tel').value                 = u.tel || '';
  clearForm(['perfil-pass-actual','perfil-pass-nueva','perfil-pass-confirmar']);
  const bar = document.getElementById('pass-strength-bar');
  const lbl = document.getElementById('pass-strength-label');
  if (bar) { bar.style.width = '0%'; bar.style.background = 'transparent'; }
  if (lbl) lbl.textContent = '';
  switchPerfilTab('datos');
  openModal('modal-mi-perfil');
}

function switchPerfilTab(tab) {
  const tabDatos = document.getElementById('perfil-tab-datos');
  const tabPass  = document.getElementById('perfil-tab-pass');
  const btnDatos = document.getElementById('tab-datos');
  const btnPass  = document.getElementById('tab-pass');
  if (tab === 'datos') {
    tabDatos.classList.remove('hidden');
    tabPass.classList.add('hidden');
    btnDatos.style.background = 'var(--card)';
    btnDatos.style.color      = 'var(--text)';
    btnPass.style.background  = 'transparent';
    btnPass.style.color       = 'var(--text2)';
  } else {
    tabDatos.classList.add('hidden');
    tabPass.classList.remove('hidden');
    btnDatos.style.background = 'transparent';
    btnDatos.style.color      = 'var(--text2)';
    btnPass.style.background  = 'var(--card)';
    btnPass.style.color       = 'var(--text)';
    // Usar oninput en HTML en lugar de addEventListener para evitar duplicados
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Correo electrónico inválido', 'error');
  if (dni && !/^\d{8}$/.test(dni)) return toast('El DNI debe tener exactamente 8 dígitos', 'error');

  const idx = state.usuarios.findIndex(x => x.id === u.id);
  state.usuarios[idx] = { ...state.usuarios[idx], nombre, email, dni, tel };
  state.currentUser = state.usuarios[idx];

  document.getElementById('sf-name').textContent = nombre;
  document.getElementById('ua').textContent = nombre.charAt(0).toUpperCase();
  document.getElementById('perfil-nombre-header').textContent = nombre;
  document.getElementById('perfil-avatar').textContent = nombre.charAt(0).toUpperCase();

  saveData();
  toast('✅ Perfil actualizado correctamente');
}

function savePerfilPassword() {
  const u = state.currentUser;
  if (!u) return;
  const actual    = document.getElementById('perfil-pass-actual').value;
  const nueva     = document.getElementById('perfil-pass-nueva').value;
  const confirmar = document.getElementById('perfil-pass-confirmar').value;

  if (!actual || !nueva || !confirmar) return toast('Completa todos los campos de contraseña', 'error');
  if (actual !== u.password) return toast('❌ La contraseña actual es incorrecta', 'error');
  if (nueva.length < 4) return toast('La nueva contraseña debe tener Mínimo 4 caracteres', 'error');
  if (nueva !== confirmar) return toast('❌ Las nuevas contraseñas no coinciden', 'error');
  if (nueva === actual) return toast('La nueva contraseña debe ser diferente a la actual', 'warn');

  const idx = state.usuarios.findIndex(x => x.id === u.id);
  state.usuarios[idx].password = nueva;
  state.currentUser = state.usuarios[idx];
  clearForm(['perfil-pass-actual','perfil-pass-nueva','perfil-pass-confirmar']);
  updatePasswordStrength();
  saveData();
  toast('🔑 Contraseña cambiada exitosamente');
}

function updatePasswordStrength() {
  const pass  = document.getElementById('perfil-pass-nueva')?.value || '';
  const bar   = document.getElementById('pass-strength-bar');
  const label = document.getElementById('pass-strength-label');
  if (!bar || !label) return;
  let score = 0;
  if (pass.length >= 4) score++;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const levels = [
    { pct: '0%',   color: 'transparent',    text: '' },
    { pct: '20%',  color: 'var(--danger)',   text: '🟥 Muy débil' },
    { pct: '45%',  color: 'var(--warn)',     text: '🟧 Débil' },
    { pct: '65%',  color: '#ffcc00',         text: '🟨 Moderada' },
    { pct: '85%',  color: 'var(--accent3)',  text: '🟩 Fuerte' },
    { pct: '100%', color: 'var(--accent3)',  text: '🟩 Muy fuerte' },
  ];
  const lvl = levels[Math.min(score, 5)];
  bar.style.width      = pass ? lvl.pct : '0%';
  bar.style.background = lvl.color;
  label.textContent    = lvl.text;
}




// ══════════════════════════════════════════════════════
// ALERTAS
// ══════════════════════════════════════════════════════
function renderAlertas() {
  const bajos = state.productos.filter(p=>p.activo && p.stock<=p.stockMin);
  document.getElementById('badge-alertas').textContent = bajos.length;
  const tbody = document.getElementById('tbl-alertas');
  tbody.innerHTML = bajos.length ? bajos.map(p=>`
    <tr>
      <td class="font-mono text-accent" style="font-size:12px">${p.codigo}</td>
      <td><strong>${p.nombre}</strong></td>
      <td>${p.Categoría}</td>
      <td class="font-mono ${p.stock===0?'text-danger fw-bold':'text-warn fw-bold'}">${p.stock}</td>
      <td class="font-mono">${p.stockMin}</td>
      <td>${p.stock===0?'<span class="pill pill-danger">⛔ Agotado</span>':'<span class="pill pill-warn">⚠ Stock Bajo</span>'}</td>
      <td><button class="btn btn-sm btn-primary" onclick="openReponer(${p.id})">📥 Reponer</button></td>
    </tr>`).join('') : `<tr><td colspan="7" class="empty-state"><div class="icon">✅</div>No hay alertas de stock</td></tr>`;
}

function openReponer(prodId) {
  openModal('modal-entrada');
  setTimeout(()=>{
    const sel = document.getElementById('me-producto');
    if (sel) sel.value = prodId;
  }, 100);
  showPage('entradas');
}

// ══════════════════════════════════════════════════════
// REPORTES
// ══════════════════════════════════════════════════════
function renderReportes() {
  const prods = state.productos.filter(p=>p.activo);
  const mes   = new Date().toISOString().slice(0,7);

  const valorTotal = prods.reduce((a,p)=>a+(p.stock*p.pCosto),0);
  const ventasMes  = state.salidas.filter(s=>s.fecha?.startsWith(mes)).reduce((a,s)=>a+(s.cantidad*s.pVenta),0);
  const entsMes    = state.entradas.filter(e=>e.fecha?.startsWith(mes)).reduce((a,e)=>a+e.cantidad,0);
  const salsMes    = state.salidas.filter(s=>s.fecha?.startsWith(mes)).reduce((a,s)=>a+s.cantidad,0);

  document.getElementById('r-valor').textContent         = 'S/ '+fmt(valorTotal);
  document.getElementById('r-ventas').textContent        = 'S/ '+fmt(ventasMes);
  document.getElementById('r-entradas-mes').textContent  = entsMes;
  document.getElementById('r-salidas-mes').textContent   = salsMes;

  // Por Categoría
  const cats = {};
  prods.forEach(p=>{ if(!cats[p.Categoría]) cats[p.Categoría]={count:0,stock:0,valor:0}; cats[p.Categoría].count++; cats[p.Categoría].stock+=p.stock; cats[p.Categoría].valor+=p.stock*p.pCosto; });
  document.getElementById('r-Categorías').innerHTML = Object.entries(cats).map(([k,v])=>`
    <tr><td>${k}</td><td class="font-mono">${v.count}</td><td class="font-mono">${v.stock}</td><td class="font-mono text-accent">S/ ${fmt(v.valor)}</td></tr>`).join('');

  // Por marca (ventas)
  const marcas = {};
  state.salidas.forEach(s=>{
    const p = state.productos.find(x=>x.id===s.productoId);
    if (!p) return;
    if (!marcas[p.marca]) marcas[p.marca]={und:0,total:0};
    marcas[p.marca].und+=s.cantidad; marcas[p.marca].total+=s.cantidad*s.pVenta;
  });
  document.getElementById('r-marcas').innerHTML = Object.entries(marcas).length
    ? Object.entries(marcas).sort((a,b)=>b[1].total-a[1].total).map(([k,v])=>`
      <tr><td>${k}</td><td class="font-mono">${v.und}</td><td class="font-mono text-success">S/ ${fmt(v.total)}</td></tr>`).join('')
    : emptyRow(3,'Sin ventas registradas');

  // Inventario completo
  document.getElementById('r-inventario').innerHTML = prods.map(p=>`
    <tr>
      <td class="font-mono text-accent" style="font-size:11px">${p.codigo}</td>
      <td>${p.nombre}</td>
      <td>${p.marca}</td>
      <td class="font-mono">${p.stock}</td>
      <td class="font-mono">S/ ${fmt(p.pCosto)}</td>
      <td class="font-mono">S/ ${fmt(p.pVenta)}</td>
      <td class="font-mono text-success">S/ ${fmt(p.stock*p.pCosto)}</td>
    </tr>`).join('');
}

function exportCSV() {
  const prods = state.productos.filter(p=>p.activo);
  const rows  = [['Código','Nombre','Categoría','Marca','Stock','P.Costo','P.Venta','Valor Total']];
  prods.forEach(p=>rows.push([p.codigo,p.nombre,p.Categoría,p.marca,p.stock,p.pCosto,p.pVenta,(p.stock*p.pCosto).toFixed(2)]));
  const csv  = rows.map(r=>r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href=url; a.download='TecnoCell_Inventario.csv'; a.click();
  toast('Archivo CSV descargado ✅');
}

function printReport() {
  window.print();
}

// ══════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════
function fmt(n) { return Number(n||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center;padding:32px;color:var(--text3)">${msg}</td></tr>`;
}

let toastTimer;
function toast(msg, type='success') {
  const el = document.getElementById('toast');
  el.textContent  = msg;
  el.className    = 'toast' + (type==='error'?' error':type==='warn'?' warn':'');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.add('hidden'), 3200);
}

// Botón nueva entrada en sidebar del modal producto
document.getElementById('modal-producto').querySelector('.btn-primary').addEventListener('click', ()=>{});
document.querySelectorAll('.nav-item[onclick*="productos"]')[0]?.addEventListener('click', ()=>{
  clearForm(['mp-id']); document.getElementById('mp-title').textContent='Nuevo Producto';
});
// Limpiar modal producto al abrir nuevo
const origOpenModal = openModal;
window.openModal = function(id) {
  if (id==='modal-producto') {
    if (!document.getElementById('mp-id').value) {
      clearForm(['mp-codigo','mp-nombre','mp-marca','mp-stock','mp-stock-min','mp-pcosto','mp-pventa','mp-Descripción']);
      document.getElementById('mp-Categoría').value='Celulares';
      document.getElementById('mp-title').textContent='Nuevo Producto';
    }
  }
  if (id==='modal-proveedor') {
    if (!document.getElementById('mprov-id').value) {
      clearForm(['mprov-id','mprov-ruc','mprov-empresa','mprov-contacto','mprov-tel','mprov-email','mprov-dir']);
      document.getElementById('mprov-title').textContent='Nuevo Proveedor';
    }
  }

  origOpenModal(id);
};

// Botón nuevo producto
document.querySelector('[onclick="openModal(\'modal-producto\')"]')?.addEventListener('click', ()=>{
  document.getElementById('mp-id').value='';
});

// ── Enter key en login ────────────────────────────────
document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('login-user').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-pass').focus();
});

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
loadData();
setDate();



