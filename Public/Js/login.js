// login.js  Auth page logic

// --- EGYPT PHONE VALIDATOR ----------------------------------
// Egyptian mobile numbers: 11 digits, starting with 010/011/012/015
function isEgyptPhone(p) {
  const cleaned = p.replace(/[\s\-]/g, ''); // strip spaces and dashes
  return /^(010|011|012|015)\d{8}$/.test(cleaned);
}

let currentRole = 'customer';
let currentSub = 'login';

// --- TAB SWITCHING --------------------------------------------
document.querySelectorAll('.auth-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRole = btn.dataset.role;
    showPanel();
  });
});

document.querySelectorAll('.sub-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSub = btn.dataset.sub;
    showPanel();
  });
});

window.switchSub = (sub) => {
  document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`.sub-tab[data-sub="${sub}"]`)?.classList.add('active');
  currentSub = sub;
  showPanel();
};

function showPanel() {
  document.querySelectorAll('.auth-panel').forEach(p => p.style.display = 'none');
  if (currentSub === 'login') {
    document.getElementById('panel-login').style.display = 'block';
    // Swap login field for staff vs customer
    const emailLabel = document.querySelector('label[for="l-email"]');
    const emailInput = document.getElementById('l-email');
    if (currentRole === 'staff') {
      if (emailLabel) emailLabel.textContent = 'Staff Code';
      if (emailInput) { emailInput.type = 'text'; emailInput.placeholder = 'Enter your staff code (e.g. STF-001)'; }
    } else {
      if (emailLabel) emailLabel.textContent = 'Email Address';
      if (emailInput) { emailInput.type = 'email'; emailInput.placeholder = 'you@example.com'; }
    }
  } else {
    const id = currentRole === 'staff' ? 'panel-register-staff' : 'panel-register-customer';
    document.getElementById(id).style.display = 'block';
  }
}

// --- POPULATE CAR BRAND DROPDOWN -----------------------------
const brandSel = document.getElementById('rc-brand');
const modelSel = document.getElementById('rc-model');
const yearSel = document.getElementById('rc-year');

Object.keys(CARS_DB).forEach(brand => {
  const opt = document.createElement('option');
  opt.value = brand; opt.textContent = brand;
  brandSel.appendChild(opt);
});

brandSel.addEventListener('change', () => {
  modelSel.innerHTML = '<option value="">Select model</option>';
  yearSel.innerHTML = '<option value="">Select year</option>';
  modelSel.disabled = !brandSel.value;
  yearSel.disabled = true;
  if (!brandSel.value) return;
  const models = Object.keys(CARS_DB[brandSel.value].models);
  models.forEach(m => {
    const o = document.createElement('option'); o.value = m; o.textContent = m; modelSel.appendChild(o);
  });
});

modelSel.addEventListener('change', () => {
  yearSel.innerHTML = '<option value="">Select year</option>';
  yearSel.disabled = !modelSel.value;
  if (!brandSel.value || !modelSel.value) return;
  const years = CARS_DB[brandSel.value].models[modelSel.value] || [];
  years.slice().reverse().forEach(y => {
    const o = document.createElement('option'); o.value = y; o.textContent = y; yearSel.appendChild(o);
  });
});

// --- PASSWORD STRENGTH ----------------------------------------
function calcStrength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const strengthLabels = ['Enter a password', 'Weak', 'Fair', 'Good', 'Strong ?'];
const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

function bindStrength(inputId, barId, labelId) {
  document.getElementById(inputId)?.addEventListener('input', function () {
    const s = calcStrength(this.value);
    const bar = document.getElementById(barId);
    const lbl = document.getElementById(labelId);
    if (bar) { bar.style.width = (s * 25) + '%'; bar.style.background = strengthColors[s]; }
    if (lbl) { lbl.textContent = strengthLabels[s]; lbl.style.color = strengthColors[s] || 'var(--gray-500)'; }
  });
}
bindStrength('rc-password', 'rc-strength-bar', 'rc-strength-label');
bindStrength('rs-password', 'rs-strength-bar', 'rs-strength-label');

// --- TOGGLE EYE -----------------------------------------------
window.toggleEye = (inputId, btnId) => {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!inp) return;
  const isText = inp.type === 'text';
  inp.type = isText ? 'password' : 'text';
  if (btn) btn.textContent = isText ? '🚗' : '🚗';
};

// --- SCROLL TO FIELD HELPER -----------------------------------
function scrollToFieldError(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function showFieldErr(alertEl, inputId, msg) {
  // inline error on the field
  const el = document.getElementById(inputId);
  if (el) {
    el.classList.add('is-invalid');
    let errDiv = el.parentElement.querySelector('.form-error');
    if (!errDiv) { errDiv = document.createElement('div'); errDiv.className = 'form-error'; el.parentElement.appendChild(errDiv); }
    errDiv.textContent = msg;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (alertEl) alertEl.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
}
function clearFieldErrors(prefix) {
  document.querySelectorAll(`[id^="${prefix}"].is-invalid`).forEach(el => el.classList.remove('is-invalid'));
  document.querySelectorAll(`[id^="${prefix}"] ~ .form-error, .form-error`).forEach(el => el.remove());
}

// --- LOGIN ----------------------------------------------------
document.getElementById('login-btn')?.addEventListener('click', () => {
  const emailOrCode = document.getElementById('l-email').value.trim();
  const pwd = document.getElementById('l-password').value;
  const alertEl = document.getElementById('login-alert');
  alertEl.innerHTML = '';
  // clear previous errors
  ['l-email','l-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('is-invalid'); const e = el.parentElement.querySelector('.form-error'); if(e) e.remove(); }
  });

  if (!emailOrCode) { showFieldErr(alertEl, 'l-email', 'Please enter your ' + (currentRole==='staff'?'staff code':'email address') + '.'); return; }
  if (!pwd) { showFieldErr(alertEl, 'l-password', 'Please enter your password.'); return; }

  let user;
  if (currentRole === 'staff') {
    const allUsers = store.get(KEYS.USERS) || [];
    const inputCode = emailOrCode.toUpperCase();
    user = allUsers.find(u =>
      (u.role === 'staff' || u.userType === 'staff') &&
      u.staffCode && u.staffCode.toUpperCase() === inputCode
    );
    if (!user) {
      const codes = store.get(KEYS.STAFF_CODES) || [];
      const codeEntry = codes.find(c => c.code.toUpperCase() === inputCode && c.usedBy);
      if (codeEntry) user = allUsers.find(u => u.id === codeEntry.usedBy);
    }
    if (user) {
      const verified = auth.login(user.email, pwd);
      if (!verified) user = null;
    }
    if (!user) { showFieldErr(alertEl, 'l-email', '⚠️ Invalid staff code or password.'); return; }
  } else {
    user = auth.login(emailOrCode, pwd);
    if (!user) { showFieldErr(alertEl, 'l-email', '⚠️ Invalid email or password.'); return; }
  }

  showToast(`Welcome back, ${user.firstName}! 🚗`, 'success');
  setTimeout(() => {
    if (user.role === 'admin') location.href = 'admin-dashboard.html';
    else if (user.role === 'staff' || user.userType === 'staff') location.href = 'staff-dashboard.html';
    else location.href = 'index.html';
  }, 700);
});

// Enter key on login
document.getElementById('l-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-btn').click(); });

// --- CUSTOMER REGISTER ----------------------------------------
document.getElementById('reg-cust-btn')?.addEventListener('click', () => {
  const alertEl = document.getElementById('reg-cust-alert');
  alertEl.innerHTML = '';
  // clear previous inline errors
  ['rc-first','rc-last','rc-email','rc-phone','rc-password','rc-confirm','rc-brand','rc-model','rc-year','rc-plate','rc-color'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.classList.remove('is-invalid');
    const e = el.parentElement.querySelector('.form-error'); if(e) e.remove();
  });

  const first = document.getElementById('rc-first').value.trim();
  const last = document.getElementById('rc-last').value.trim();
  const email = document.getElementById('rc-email').value.trim();
  const phone = document.getElementById('rc-phone').value.trim();
  const pwd = document.getElementById('rc-password').value;
  const conf = document.getElementById('rc-confirm').value;
  const brand = document.getElementById('rc-brand').value;
  const model = document.getElementById('rc-model').value;
  const year = document.getElementById('rc-year').value;
  const plate = document.getElementById('rc-plate').value.trim();
  const color = document.getElementById('rc-color').value.trim();
  const terms = document.getElementById('rc-terms').checked;

  if (!first) { showFieldErr(alertEl,'rc-first','Please enter your first name.'); return; }
  if (!last)  { showFieldErr(alertEl,'rc-last','Please enter your last name.');  return; }
  if (!isEmail(email)) { showFieldErr(alertEl,'rc-email','Please enter a valid email address.'); return; }
  if (!isEgyptPhone(phone)) { showFieldErr(alertEl,'rc-phone','Valid Egyptian mobile required (11 digits, starting 010/011/012/015).'); return; }
  if (pwd.length < 8) { showFieldErr(alertEl,'rc-password','Password must be at least 8 characters.'); return; }
  if (pwd !== conf)   { showFieldErr(alertEl,'rc-confirm','Passwords do not match.'); return; }
  if (!brand) { showFieldErr(alertEl,'rc-brand','Please select your car brand.'); return; }
  if (!model) { showFieldErr(alertEl,'rc-model','Please select your car model.'); return; }
  if (!year)  { showFieldErr(alertEl,'rc-year','Please select the car year.');  return; }
  if (!plate) { showFieldErr(alertEl,'rc-plate','Please enter your license plate.'); return; }
  if (!color) { showFieldErr(alertEl,'rc-color','Please enter your car color.'); return; }
  if (!terms) {
    alertEl.innerHTML = '<div class="alert alert-danger">You must agree to the Terms & Conditions.</div>';
    document.getElementById('rc-terms')?.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }

  const result = auth.register({ firstName: first, lastName: last, email, phone, password: pwd, role: 'customer' });
  if (result.error) { showFieldErr(alertEl, 'rc-email', result.error); return; }

  // Add the car
  upsert(KEYS.CARS, { id: genId('c'), owner: result.id, brand, model, year: parseInt(year), plate, color, emoji: CARS_DB[brand]?.emoji || '🚗' });

  showToast(`Welcome to AutoServe, ${result.firstName}! 🚗`, 'success');
  setTimeout(() => location.href = 'index.html', 700);
});

// --- STAFF REGISTER -------------------------------------------
document.getElementById('reg-staff-btn')?.addEventListener('click', () => {
  const alertEl = document.getElementById('reg-staff-alert');
  alertEl.innerHTML = '';
  ['rs-first','rs-last','rs-email','rs-phone','rs-password','rs-confirm','rs-code'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.classList.remove('is-invalid');
    const e = el.parentElement.querySelector('.form-error'); if(e) e.remove();
  });

  const first = document.getElementById('rs-first').value.trim();
  const last = document.getElementById('rs-last').value.trim();
  const email = document.getElementById('rs-email').value.trim();
  const phone = document.getElementById('rs-phone').value.trim();
  const pwd = document.getElementById('rs-password').value;
  const conf = document.getElementById('rs-confirm').value;
  const code = document.getElementById('rs-code').value.trim();
  const terms = document.getElementById('rs-terms').checked;

  if (!first) { showFieldErr(alertEl,'rs-first','Please enter your first name.'); return; }
  if (!last)  { showFieldErr(alertEl,'rs-last','Please enter your last name.');  return; }
  if (!isEmail(email)) { showFieldErr(alertEl,'rs-email','Please enter a valid email address.'); return; }
  if (!isEgyptPhone(phone)) { showFieldErr(alertEl,'rs-phone','Valid Egyptian mobile required (11 digits, starting 010/011/012/015).'); return; }
  if (pwd.length < 8) { showFieldErr(alertEl,'rs-password','Password must be at least 8 characters.'); return; }
  if (pwd !== conf)   { showFieldErr(alertEl,'rs-confirm','Passwords do not match.'); return; }
  if (!code) { showFieldErr(alertEl,'rs-code','Please enter your staff access code.'); return; }
  if (!terms) {
    alertEl.innerHTML = '<div class="alert alert-danger">You must agree to the Terms & Conditions.</div>';
    document.getElementById('rs-terms')?.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }

  const validCode = staffCodesAPI.isValid(code);
  if (!validCode) { showFieldErr(alertEl,'rs-code','⚠️ Invalid or expired staff code. Please contact your admin.'); return; }

  const result = auth.register({ firstName: first, lastName: last, email, phone, password: pwd, role: 'staff', staffRole: '', userType: 'staff' });
  if (result.error) { showFieldErr(alertEl, 'rs-email', result.error); return; }

  // Save the staff code on the user record so login can find it
  staffCodesAPI.markUsed(code, result.id);
  const users = store.get(KEYS.USERS) || [];
  const newUser = users.find(u => u.id === result.id);
  if (newUser) { newUser.staffCode = code.toUpperCase(); newUser.userType = 'staff'; store.set(KEYS.USERS, users); }

  showToast(`Staff account created! Welcome, ${result.firstName}! Your admin will assign your role.`, 'success');
  setTimeout(() => location.href = 'staff-dashboard.html', 700);
});

// --- INIT -----------------------------------------------------
// If already logged in, redirect
window.addEventListener('DOMContentLoaded', () => {
  seedData();
  if (auth.isLoggedIn()) {
    const u = auth.current();
    if (u.role === 'admin') location.href = 'admin-dashboard.html';
    else if (u.role === 'staff') location.href = 'staff-dashboard.html';
    else location.href = 'index.html';
  }
  // Check hash for register
  if (location.hash === '#register') switchSub('register');
});
