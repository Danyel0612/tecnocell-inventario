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
  usuarios: [],
  entradas: [],
  salidas: [],
  movimientos: [],
};

// ── USUARIOS POR DEFECTO ───────────────────────────────
const DEFAULT_USERS = [
  { id: 1, username: 'admin',      password: '1234', nombre: 'Administrador',    rol: 'Administrador', email: 'admin@tecnocell.pe',      dni: '00000001', activo: true },
  { id: 2, username: 'almacen',    password: '1234', nombre: 'Carlos Quispe',     rol: 'Almacenero',    email: 'almacen@tecnocell.pe',    dni: '72345678', activo: true },
  { id: 3, username: 'vendedor',   password: '1234', nombre: 'Ana Torres',        rol: 'Vendedor',      email: 'ventas@tecnocell.pe',     dni: '87654321', activo: true },
];
state.usuarios = DEFAULT_USERS;

// ── DATOS DE DEMOSTRACIÓN ─────────────────────────────
const DEMO_PRODUCTOS = [
  { id:1,  codigo:'CEL-001', nombre:'Samsung Galaxy S24 Ultra',  categoria:'Celulares',  marca:'Samsung', stock:8,  stockMin:3, pCosto:2800, pVenta:3599, descripcion:'256GB, 12GB RAM', activo:true },
  { id:2,  codigo:'CEL-002', nombre:'iPhone 15 Pro Max',          categoria:'Celulares',  marca:'Apple',   stock:4,  stockMin:3, pCosto:4200, pVenta:5299, descripcion:'256GB, Titanio', activo:true },
  { id:3,  codigo:'CEL-003', nombre:'Xiaomi Redmi Note 13 Pro',   categoria:'Celulares',  marca:'Xiaomi',  stock:15, stockMin:5, pCosto:780,  pVenta:999,  descripcion:'128GB, NFC', activo:true },
  { id:4,  codigo:'CEL-004', nombre:'Motorola Edge 40 Pro',       categoria:'Celulares',  marca:'Motorola',stock:2,  stockMin:3, pCosto:1100, pVenta:1499, descripcion:'256GB, Carga 125W', activo:true },
  { id:5,  codigo:'CEL-005', nombre:'OPPO Reno 11 Pro',           categoria:'Celulares',  marca:'OPPO',    stock:7,  stockMin:4, pCosto:950,  pVenta:1249, descripcion:'256GB, Triple cámara', activo:true },
  { id:6,  codigo:'ACC-001', nombre:'Funda Silicone iPhone 15',   categoria:'Accesorios', marca:'Apple',   stock:25, stockMin:10,pCosto:85,   pVenta:129,  descripcion:'Original', activo:true },
  { id:7,  codigo:'ACC-002', nombre:'Cargador USB-C 65W',         categoria:'Accesorios', marca:'Anker',   stock:18, stockMin:8, pCosto:65,   pVenta:99,   descripcion:'GaN Technology', activo:true },
  { id:8,  codigo:'ACC-003', nombre:'Auriculares TWS Pro',        categoria:'Audio',      marca:'JBL',     stock:1,  stockMin:5, pCosto:180,  pVenta:249,  descripcion:'ANC, 30h batería', activo:true },
  { id:9,  codigo:'REP-001', nombre:'Pantalla Samsung S22',       categoria:'Repuestos',  marca:'Samsung', stock:3,  stockMin:2, pCosto:320,  pVenta:450,  descripcion:'AMOLED Original', activo:true },
  { id:10, codigo:'REP-002', nombre:'Batería iPhone 13',           categoria:'Repuestos',  marca:'Apple',   stock:0,  stockMin:3, pCosto:150,  pVenta:220,  descripcion:'3227mAh Original', activo:true },
  { id:11, codigo:'TAB-001', nombre:'iPad Air M2 11"',            categoria:'Tablets',    marca:'Apple',   stock:5,  stockMin:2, pCosto:2400, pVenta:3099, descripcion:'256GB WiFi', activo:true },
  { id:12, codigo:'ACC-004', nombre:'Cable USB-C Trenzado 1.5m',  categoria:'Accesorios', marca:'Ugreen',  stock:40, stockMin:15,pCosto:18,   pVenta:35,   descripcion:'Carga rápida 60W', activo:true },
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

function loadData() {
  const raw = localStorage.getItem('tc_state');
  if (raw) {
    state = JSON.parse(raw);
  } else {
    state.productos   = DEMO_PRODUCTOS;
    state.proveedores = DEMO_PROVEEDORES;
    state.usuarios    = DEFAULT_USERS;
    state.entradas    = [];
    state.salidas     = [];
    state.movimientos = [];
    generateDemoMovimientos();
    saveData();
  }
  // Asegurar usuarios por defecto
  if (!state.usuarios || state.usuarios.length === 0) {
  state.usuarios = DEFAULT_USERS;
  }
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
    categoria: p.categoria,
    marca: p.marca,
    stock: p.stock,
    stockMin: p.stock_min,
    pCosto: p.precio_costo,
    pVenta: p.precio_venta,
    descripcion: p.descripcion,
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
    { id:3, fecha:dias(1), tipo:'Entrada', productoId:6, productoCod:'ACC-001', productoNom:'Funda Silicone iPhone 15', cantidad:15, motivo:'Importaciones TechPro S.A.C.', obs:'', usuario:'almacen' },
    { id:4, fecha:dias(1), tipo:'Salida',  productoId:2, productoCod:'CEL-002', productoNom:'iPhone 15 Pro Max',        cantidad:1,  motivo:'Venta',             obs:'Cliente VIP',   usuario:'vendedor' },
    { id:5, fecha:dias(2), tipo:'Salida',  productoId:7, productoCod:'ACC-002', productoNom:'Cargador USB-C 65W',      cantidad:3,  motivo:'Venta',             obs:'',              usuario:'vendedor' },
    { id:6, fecha:dias(3), tipo:'Entrada', productoId:9, productoCod:'REP-001', productoNom:'Pantalla Samsung S22',    cantidad:5,  motivo:'AccesoriosPlus S.A.C.', obs:'Urgente',  usuario:'almacen' },
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

  setDate();

  try {
    await cargarProductosSupabase();
  } catch (e) {
    console.error(e);
    toast('No se pudo cargar Supabase, usando datos locales', 'error');
  }

  showPage('productos');
}

// ══════════════════════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════════════════════
const PAGE_META = {
  dashboard:    { title: '📊 Dashboard',    sub: 'Resumen general del sistema' },
  productos:    { title: '📦 Productos',    sub: 'Gestión de productos en inventario' },
  entradas:     { title: '📥 Entradas',     sub: 'Registro de ingresos al almacén' },
  salidas:      { title: '📤 Salidas',      sub: 'Registro de salidas y ventas' },
  movimientos:  { title: '🔄 Movimientos',  sub: 'Historial completo de movimientos' },
  proveedores:  { title: '🏢 Proveedores',  sub: 'Gestión de proveedores' },
  usuarios:     { title: '👤 Usuarios',     sub: 'Gestión de usuarios y roles' },
  alertas:      { title: '🔔 Alertas',      sub: 'Productos con stock bajo o agotado' },
  reportes:     { title: '📈 Reportes',     sub: 'Análisis e informes del inventario' },
};

function showPage(page) {
    const MODULOS_BLOQUEADOS = [
    'dashboard',
    'entradas',
    'salidas',
    'movimientos',
    'proveedores',
    'usuarios',
    'alertas',
    'reportes'
  ];

  if (MODULOS_BLOQUEADOS.includes(page)) {
    toast('Módulo no disponible para esta presentación', 'error');
    return;
  }
  document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.getElementById('nav-'+page).classList.add('active');
  const m = PAGE_META[page];
  document.getElementById('page-title').textContent = m.title;
  document.getElementById('page-sub').textContent   = m.sub;
  const renders = { dashboard, productos: renderProductos, entradas: renderEntradas, salidas: renderSalidas,
    movimientos: renderMovimientos, proveedores: renderProveedores, usuarios: renderUsuarios,
    alertas: renderAlertas, reportes: renderReportes };
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
  if (cat) prods = prods.filter(p=>p.categoria===cat);
  const tbody = document.getElementById('tbl-productos');
  tbody.innerHTML = prods.length ? prods.map(p=>`
    <tr>
      <td class="font-mono text-accent" style="font-size:12px">${p.codigo}</td>
      <td><strong>${p.nombre}</strong><br><span class="text-muted" style="font-size:11px">${p.descripcion||''}</span></td>
      <td>${p.categoria}</td>
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
  if (id==='modal-entrada') { fillSelect('me-producto'); fillProvSelect('me-proveedor'); setTodayDate('me-fecha'); }
  if (id==='modal-salida')  { fillSelect('ms-producto'); setTodayDate('ms-fecha'); updateStockInfo(); }
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function clearForm(fields) { fields.forEach(f => { const el=document.getElementById(f); if(el) el.value=''; }); }

function openModal_Producto_new() {
  document.getElementById('mp-title').textContent = 'Nuevo Producto';
  clearForm(['mp-id','mp-codigo','mp-nombre','mp-marca','mp-stock','mp-stock-min','mp-pcosto','mp-pventa','mp-descripcion']);
  document.getElementById('mp-categoria').value = 'Celulares';
  openModal('modal-producto');
}

function editProducto(id) {
  const p = state.productos.find(x=>x.id===id);
  if (!p) return;
  document.getElementById('mp-title').textContent = 'Editar Producto';
  document.getElementById('mp-id').value          = p.id;
  document.getElementById('mp-codigo').value      = p.codigo;
  document.getElementById('mp-nombre').value      = p.nombre;
  document.getElementById('mp-categoria').value   = p.categoria;
  document.getElementById('mp-marca').value       = p.marca;
  document.getElementById('mp-stock').value       = p.stock;
  document.getElementById('mp-stock-min').value   = p.stockMin;
  document.getElementById('mp-pcosto').value      = p.pCosto;
  document.getElementById('mp-pventa').value      = p.pVenta;
  document.getElementById('mp-descripcion').value = p.descripcion||'';
  openModal('modal-producto');
}

async function saveProducto() {
  const id     = document.getElementById('mp-id').value;
  const codigo = document.getElementById('mp-codigo').value.trim();
  const nombre = document.getElementById('mp-nombre').value.trim();
  const pcosto = parseFloat(document.getElementById('mp-pcosto').value)||0;
  const pventa = parseFloat(document.getElementById('mp-pventa').value)||0;

  if (!codigo || !nombre)
    return toast('Complete los campos obligatorios', 'error');

  if (id) {

    const idx = state.productos.findIndex(p=>p.id==id);

    state.productos[idx] = {
      ...state.productos[idx],
      codigo,
      nombre,
      categoria: document.getElementById('mp-categoria').value,
      marca: document.getElementById('mp-marca').value.trim(),
      stockMin: parseInt(document.getElementById('mp-stock-min').value)||0,
      stock: parseInt(document.getElementById('mp-stock').value)||state.productos[idx].stock,
      pCosto: pcosto,
      pVenta: pventa,
      descripcion: document.getElementById('mp-descripcion').value.trim(),
    };

    toast('Producto actualizado ✅');

  } else {

    const { error } = await db.from('productos').insert({
      codigo: codigo,
      nombre: nombre,
      categoria: document.getElementById('mp-categoria').value,
      marca: document.getElementById('mp-marca').value.trim(),
      stock: parseInt(document.getElementById('mp-stock').value) || 0,
      stock_min: parseInt(document.getElementById('mp-stock-min').value) || 0,
      precio_costo: pcosto,
      precio_venta: pventa,
      descripcion: document.getElementById('mp-descripcion').value.trim(),
      activo: true
    });

    if (error) {
      console.error(error);
      return toast('Error al guardar en Supabase', 'error');
    }

    toast('Producto guardado en Supabase ✅');
  }

  await cargarProductosSupabase();
  closeModal('modal-producto');
  renderProductos();

}

function deleteProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  const idx = state.productos.findIndex(p=>p.id===id);
  state.productos[idx].activo = false;
  saveData(); renderProductos(); toast('Producto eliminado');
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
  const list  = [...state.salidas].sort((a,b)=>b.id-a.id);
  tbody.innerHTML = list.length ? list.map(s=>`
    <tr>
      <td class="text-muted">${s.fecha}</td>
      <td><strong>${s.productoNom}</strong></td>
      <td><span class="pill pill-info">${s.motivo}</span></td>
      <td class="font-mono text-danger">${s.cantidad}</td>
      <td class="font-mono">S/ ${fmt(s.pVenta)}</td>
      <td class="font-mono text-success">S/ ${fmt(s.cantidad*s.pVenta)}</td>
      <td>${s.usuario}</td>
    </tr>`).join('') : emptyRow(7,'Sin salidas registradas');
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
  const prodId   = parseInt(document.getElementById('ms-producto').value);
  const cantidad = parseInt(document.getElementById('ms-cantidad').value)||0;
  const pVenta   = parseFloat(document.getElementById('ms-pventa').value)||0;
  const motivo   = document.getElementById('ms-motivo').value;
  const fecha    = document.getElementById('ms-fecha').value;
  const obs      = document.getElementById('ms-obs').value.trim();

  if (!prodId || cantidad<=0) return toast('Complete cantidad válida', 'error');
  const prod = state.productos.find(p=>p.id===prodId);
  if (!prod) return toast('Producto no encontrado', 'error');
  if (prod.stock < cantidad) return toast(`Stock insuficiente. Disponible: ${prod.stock}`, 'error');

  prod.stock -= cantidad;

  const newId = Math.max(0,...state.salidas.map(s=>s.id),0)+1;
  const salida = {
    id: newId, fecha, productoId: prod.id, productoNom: prod.nombre,
    motivo, cantidad, pVenta, obs,
    usuario: state.currentUser?.username||'admin'
  };
  state.salidas.push(salida);
  state.movimientos.push({
    id: newId+20000, fecha, tipo:'Salida',
    productoId: prod.id, productoCod: prod.codigo, productoNom: prod.nombre,
    cantidad, motivo, obs, usuario: state.currentUser?.username||'admin'
  });
  saveData(); closeModal('modal-salida'); renderSalidas(); toast('Salida registrada ✅');
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
function renderUsuarios() {
  const tbody = document.getElementById('tbl-usuarios');
  tbody.innerHTML = state.usuarios.map(u=>`
    <tr>
      <td class="font-mono text-accent">${u.username}</td>
      <td>${u.nombre}</td>
      <td>${rolPill(u.rol)}</td>
      <td>${u.email}</td>
      <td><span class="pill ${u.activo?'pill-success':'pill-danger'}">${u.activo?'Activo':'Inactivo'}</span></td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="editUsuario(${u.id})">✏</button>
        ${u.username!=='admin'?`<button class="btn btn-sm btn-danger" onclick="toggleUsuario(${u.id})" style="margin-left:4px">${u.activo?'Deshabilitar':'Habilitar'}</button>`:''}
      </td>
    </tr>`).join('');
}

function rolPill(rol) {
  const map = { 'Administrador':'pill-info', 'Almacenero':'pill-success', 'Vendedor':'pill-warn' };
  return `<span class="pill ${map[rol]||'pill-gray'}">${rol}</span>`;
}

function editUsuario(id) {
  const u = state.usuarios.find(x=>x.id===id);
  if (!u) return;
  document.getElementById('mu-title').textContent    = 'Editar Usuario';
  document.getElementById('mu-id').value             = u.id;
  document.getElementById('mu-username').value       = u.username;
  document.getElementById('mu-nombre').value         = u.nombre;
  document.getElementById('mu-rol').value            = u.rol;
  document.getElementById('mu-email').value          = u.email;
  document.getElementById('mu-pass').value           = u.password;
  document.getElementById('mu-dni').value            = u.dni||'';
  openModal('modal-usuario');
}

function saveUsuario() {
  const id       = document.getElementById('mu-id').value;
  const username = document.getElementById('mu-username').value.trim();
  const nombre   = document.getElementById('mu-nombre').value.trim();
  const rol      = document.getElementById('mu-rol').value;
  const email    = document.getElementById('mu-email').value.trim();
  const password = document.getElementById('mu-pass').value.trim();
  if (!username || !nombre || !email || !password) return toast('Complete todos los campos', 'error');

  if (id) {
    const idx = state.usuarios.findIndex(u=>u.id==id);
    state.usuarios[idx] = { ...state.usuarios[idx], username, nombre, rol, email, password, dni: document.getElementById('mu-dni').value };
    toast('Usuario actualizado ✅');
  } else {
    if (state.usuarios.find(u=>u.username===username)) return toast('Ese nombre de usuario ya existe', 'error');
    state.usuarios.push({
      id: Math.max(0,...state.usuarios.map(u=>u.id))+1,
      username, nombre, rol, email, password, dni: document.getElementById('mu-dni').value, activo: true
    });
    toast('Usuario creado ✅');
  }
  saveData(); closeModal('modal-usuario'); renderUsuarios();
}

function toggleUsuario(id) {
  const u = state.usuarios.find(x=>x.id===id);
  if (!u) return;
  u.activo = !u.activo;
  saveData(); renderUsuarios();
  toast(u.activo ? 'Usuario habilitado' : 'Usuario deshabilitado');
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
      <td>${p.categoria}</td>
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

  // Por categoría
  const cats = {};
  prods.forEach(p=>{ if(!cats[p.categoria]) cats[p.categoria]={count:0,stock:0,valor:0}; cats[p.categoria].count++; cats[p.categoria].stock+=p.stock; cats[p.categoria].valor+=p.stock*p.pCosto; });
  document.getElementById('r-categorias').innerHTML = Object.entries(cats).map(([k,v])=>`
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
  prods.forEach(p=>rows.push([p.codigo,p.nombre,p.categoria,p.marca,p.stock,p.pCosto,p.pVenta,(p.stock*p.pCosto).toFixed(2)]));
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
      clearForm(['mp-codigo','mp-nombre','mp-marca','mp-stock','mp-stock-min','mp-pcosto','mp-pventa','mp-descripcion']);
      document.getElementById('mp-categoria').value='Celulares';
      document.getElementById('mp-title').textContent='Nuevo Producto';
    }
  }
  if (id==='modal-proveedor') {
    if (!document.getElementById('mprov-id').value) {
      clearForm(['mprov-id','mprov-ruc','mprov-empresa','mprov-contacto','mprov-tel','mprov-email','mprov-dir']);
      document.getElementById('mprov-title').textContent='Nuevo Proveedor';
    }
  }
  if (id==='modal-usuario') {
    if (!document.getElementById('mu-id').value) {
      clearForm(['mu-id','mu-username','mu-nombre','mu-email','mu-pass','mu-dni']);
      document.getElementById('mu-title').textContent='Nuevo Usuario';
    }
  }
  origOpenModal(id);
};

// Botón nuevo producto
document.querySelector('[onclick="openModal(\'modal-producto\')"]')?.addEventListener('click', ()=>{
  document.getElementById('mp-id').value='';
});

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
loadData();
setDate();
