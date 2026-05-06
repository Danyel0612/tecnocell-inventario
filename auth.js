// auth.js — TecnoCell S.A.C.

const USERS = [
  { usuario: 'admin',      contrasena: '1234',   rol: 'Administrador' },
  { usuario: 'almacenero', contrasena: '1234',   rol: 'Almacenero' },
  { usuario: 'vendedor',   contrasena: '1234',   rol: 'Vendedor' },
];

function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const usuario    = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value;
  let valid = true;

  if (!usuario) {
    showFieldError('err-user', 'El usuario es obligatorio.');
    document.getElementById('fg-user').classList.add('has-error');
    valid = false;
  }
  if (!contrasena) {
    showFieldError('err-pass', 'La contraseña es obligatoria.');
    document.getElementById('fg-pass').classList.add('has-error');
    valid = false;
  }
  if (!valid) return;

  // Simulate loading
  const btn  = document.getElementById('btn-submit');
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  text.classList.add('hidden');
  loader.classList.remove('hidden');
  btn.disabled = true;

  setTimeout(() => {
    const user = USERS.find(u => u.usuario === usuario && u.contrasena === contrasena);

    if (user) {
      sessionStorage.setItem('tc_user', JSON.stringify({ usuario: user.usuario, rol: user.rol }));
      window.location.href = 'productos.html';
    } else {
      text.classList.remove('hidden');
      loader.classList.add('hidden');
      btn.disabled = false;
      document.getElementById('login-error').classList.remove('hidden');
    }
  }, 900);
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  document.getElementById('err-user').textContent   = '';
  document.getElementById('err-pass').textContent   = '';
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('fg-user').classList.remove('has-error');
  document.getElementById('fg-pass').classList.remove('has-error');
}

function togglePass() {
  const input = document.getElementById('contrasena');
  const icon  = document.getElementById('eye-icon');
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  icon.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}
