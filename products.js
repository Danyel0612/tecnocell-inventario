// products.js — TecnoCell S.A.C.

// --- Protect page ---
const sessionUser = sessionStorage.getItem('tc_user');
if (!sessionUser) window.location.href = 'login.html';

// --- Sample data ---
let products = [
  { id: 1, codigo: 'TC-001', nombre: 'Samsung Galaxy A55', categoria: 'Smartphone', marca: 'Samsung', stock: 15, stockMin: 5, precio: 1299.90, proveedor: 'Importaciones Lima', descripcion: '6.6" FHD+, 8GB RAM, 256GB' },
  { id: 2, codigo: 'TC-002', nombre: 'iPhone 15',          categoria: 'Smartphone', marca: 'Apple',   stock: 8,  stockMin: 4, precio: 3899.00, proveedor: 'TechDistrib SAC',    descripcion: '6.1" Super Retina, 128GB' },
  { id: 3, codigo: 'TC-003', nombre: 'Xiaomi Redmi 13',    categoria: 'Smartphone', marca: 'Xiaomi',  stock: 3,  stockMin: 5, precio: 649.90,  proveedor: 'Movil Center',       descripcion: '6.79" HD+, 6GB RAM' },
  { id: 4, codigo: 'TC-004', nombre: 'iPad 10ma Gen',      categoria: 'Tablet',     marca: 'Apple',   stock: 5,  stockMin: 3, precio: 2199.00, proveedor: 'TechDistrib SAC',    descripcion: '10.9" Liquid Retina, 64GB' },
  { id: 5, codigo: 'TC-005', nombre: 'Auricular Bluetooth', categoria: 'Accesorio', marca: 'JBL',     stock: 22, stockMin: 8, precio: 189.90,  proveedor: 'Accesorios Pro',     descripcion: 'JBL Tune 510BT Inalámbrico' },
  { id: 6, codigo: 'TC-006', nombre: 'Cargador USB-C 65W', categoria: 'Accesorio',  marca: 'Anker',   stock: 0,  stockMin: 10, precio: 79.90,  proveedor: 'Accesorios Pro',     descripcion: 'Carga rápida PD 65W' },
  { id: 7, codigo: 'TC-007', nombre: 'Pantalla Redmi Note 12', categoria: 'Repuesto', marca: 'Xiaomi', stock: 4, stockMin: 3, precio: 120.00, proveedor: 'Repuestos Tech',     descripcion: 'LCD con marco' },
  { id: 8, codigo: 'TC-008', nombre: 'Funda iPhone 15 Pro', categoria: 'Accesorio', marca: 'Apple',   stock: 30, stockMin: 10, precio: 49.90,  proveedor: 'Accesorios Pro',    descripcion: 'Silicona original' },
];

let nextId  = products.length + 1;
let editId  = null;
let deleteId = null;
let filtered = [...products];

// --- Render ---
function renderTable(data) {
  const tbody  = document.getElementById('products-tbody');
  const empty  = document.getElementById('empty-state');
  tbody.innerHTML = '';

  if (!data.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  data.forEach(p => {
    const stockClass = p.stock === 0 ? 'stock-out' : p.stock <= p.stockMin ? 'stock-low' : 'stock-ok';
    const badgeClass = p.stock === 0 ? 'badge-out' : p.stock <= p.stockMin ? 'badge-low' : 'badge-ok';
    const badgeText  = p.stock === 0 ? 'Sin stock' : p.stock <= p.stockMin ? 'Stock bajo' : 'Disponible';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="code-badge">${esc(p.codigo)}</span></td>
      <td>
        <div class="product-name">${esc(p.nombre)}</div>
        ${p.descripcion ? `<div class="product-desc">${esc(p.descripcion)}</div>` : ''}
      </td>
      <td><span class="cat-badge cat-${esc(p.categoria)}">${esc(p.categoria)}</span></td>
      <td>${esc(p.marca)}</td>
      <td class="stock-cell"><span class="stock-num ${stockClass}">${p.stock}</span></td>
      <td style="color:var(--text3)">${p.stockMin}</td>
      <td style="font-weight:600">S/ ${p.precio.toFixed(2)}</td>
      <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon" onclick="openEdit(${p.id})" title="Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon danger" onclick="openDelete(${p.id})" title="Eliminar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStats(data) {
  document.getElementById('stat-total').textContent = data.length;
  document.getElementById('stat-stock').textContent = data.filter(p => p.stock > p.stockMin).length;
  document.getElementById('stat-low').textContent   = data.filter(p => p.stock > 0 && p.stock <= p.stockMin).length;
  const valor = data.reduce((sum, p) => sum + p.precio * p.stock, 0);
  document.getElementById('stat-valor').textContent = 'S/ ' + valor.toLocaleString('es-PE', { minimumFractionDigits: 2 });
}

function init() {
  filtered = [...products];
  renderTable(filtered);
  updateStats(products);
}

// --- Filter ---
function filterProducts() {
  const q    = document.getElementById('search-input').value.toLowerCase();
  const cat  = document.getElementById('filter-categoria').value;
  const stk  = document.getElementById('filter-stock').value;

  filtered = products.filter(p => {
    const matchQ   = !q || p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
    const matchCat = !cat || p.categoria === cat;
    const matchStk = !stk ||
      (stk === 'ok'  && p.stock > p.stockMin) ||
      (stk === 'low' && p.stock > 0 && p.stock <= p.stockMin) ||
      (stk === 'out' && p.stock === 0);
    return matchQ && matchCat && matchStk;
  });

  renderTable(filtered);
  updateStats(filtered);
}

// --- Modal Add/Edit ---
function openModal() {
  editId = null;
  document.getElementById('modal-title').textContent = 'Nuevo Producto';
  clearForm();
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function openEdit(id) {
  editId = id;
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-title').textContent = 'Editar Producto';
  document.getElementById('m-codigo').value      = p.codigo;
  document.getElementById('m-nombre').value      = p.nombre;
  document.getElementById('m-categoria').value   = p.categoria;
  document.getElementById('m-marca').value       = p.marca;
  document.getElementById('m-stock').value       = p.stock;
  document.getElementById('m-stockmin').value    = p.stockMin;
  document.getElementById('m-precio').value      = p.precio;
  document.getElementById('m-proveedor').value   = p.proveedor || '';
  document.getElementById('m-descripcion').value = p.descripcion || '';
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  clearForm();
  editId = null;
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function clearForm() {
  ['m-codigo','m-nombre','m-marca','m-stock','m-stockmin','m-precio','m-proveedor','m-descripcion'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('m-categoria').value = '';
  document.getElementById('modal-error').classList.add('hidden');
}

function saveProduct() {
  const codigo      = document.getElementById('m-codigo').value.trim();
  const nombre      = document.getElementById('m-nombre').value.trim();
  const categoria   = document.getElementById('m-categoria').value;
  const marca       = document.getElementById('m-marca').value.trim();
  const stock       = parseInt(document.getElementById('m-stock').value);
  const stockMin    = parseInt(document.getElementById('m-stockmin').value);
  const precio      = parseFloat(document.getElementById('m-precio').value);
  const proveedor   = document.getElementById('m-proveedor').value.trim();
  const descripcion = document.getElementById('m-descripcion').value.trim();

  if (!codigo || !nombre || !categoria || !marca || isNaN(stock) || isNaN(stockMin) || isNaN(precio)) {
    document.getElementById('modal-error').classList.remove('hidden');
    return;
  }

  if (editId !== null) {
    const idx = products.findIndex(p => p.id === editId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], codigo, nombre, categoria, marca, stock, stockMin, precio, proveedor, descripcion };
    }
  } else {
    products.push({ id: nextId++, codigo, nombre, categoria, marca, stock, stockMin, precio, proveedor, descripcion });
  }

  closeModal();
  filterProducts();
}

// --- Delete ---
function openDelete(id) {
  deleteId = id;
  const p = products.find(x => x.id === id);
  document.getElementById('delete-name').textContent = p ? p.nombre : '';
  document.getElementById('delete-overlay').classList.remove('hidden');
}

function closeDelete() {
  document.getElementById('delete-overlay').classList.add('hidden');
  deleteId = null;
}

function closeDeleteOutside(e) {
  if (e.target === document.getElementById('delete-overlay')) closeDelete();
}

function confirmDelete() {
  products = products.filter(p => p.id !== deleteId);
  closeDelete();
  filterProducts();
}

// --- Utils ---
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// --- Init ---
init();
