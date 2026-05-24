// profile.js
let rating = 0;

window.addEventListener('DOMContentLoaded', () => {
  const user = auth.current();
  if (!user) { showAuthGuard('profile-auth-guard','Login to view your profile.'); return; }
  document.getElementById('profile-content').style.display = 'block';
  load(user);

  // Tabs
  initTabs('prof-tabs', 'pt-', 'pt');

  // Hide review tab for staff
  if (user.role === 'staff' || user.userType === 'staff') {
    document.querySelector('[data-pt="reviews"]')?.style && (document.querySelector('[data-pt="reviews"]').style.display = 'none');
    document.querySelector('[data-pt="reviews"]')?.remove();
    const revPanel = document.getElementById('pt-reviews');
    if (revPanel) revPanel.style.display = 'none';
  }

  // Info save
  document.getElementById('p-save').addEventListener('click', () => {
    const first = document.getElementById('p-first').value.trim();
    const last  = document.getElementById('p-last').value.trim();
    const email = document.getElementById('p-email').value.trim();
    const phone = document.getElementById('p-phone').value.trim();
    const el    = document.getElementById('info-alert');
    if (!first||!email) { el.innerHTML='<div class="alert alert-danger">Name and email required.</div>'; return; }
    const users = getAll(KEYS.USERS); const u = users.find(x=>x.id===user.id);
    if (u) { u.firstName=first; u.lastName=last; u.email=email; u.phone=phone; saveAll(KEYS.USERS,users); store.set(KEYS.SESSION,{...u}); }
    el.innerHTML='<div class="alert alert-success">Profile updated!</div>';
    document.getElementById('p-name').textContent=first+' '+last;
    document.getElementById('p-avatar').textContent=first.charAt(0).toUpperCase();
    showToast('Profile saved!','success'); setTimeout(()=>el.innerHTML='',3000);
  });

  // Password save
  document.getElementById('sec-save').addEventListener('click', () => {
    const cur  = document.getElementById('sec-cur').value;
    const newP = document.getElementById('sec-new').value;
    const conf = document.getElementById('sec-conf').value;
    const el   = document.getElementById('sec-alert');
    const users = getAll(KEYS.USERS); const u = users.find(x=>x.id===user.id);
    if (!u||u.password!==cur) { el.innerHTML='<div class="alert alert-danger">Current password incorrect.</div>'; return; }
    if (newP.length<8) { el.innerHTML='<div class="alert alert-danger">Password must be 8+ characters.</div>'; return; }
    if (newP!==conf) { el.innerHTML='<div class="alert alert-danger">Passwords don\'t match.</div>'; return; }
    u.password=newP; saveAll(KEYS.USERS,users);
    el.innerHTML='<div class="alert alert-success">Password changed!</div>';
    document.getElementById('sec-cur').value=document.getElementById('sec-new').value=document.getElementById('sec-conf').value='';
    showToast('Password changed!','success'); setTimeout(()=>el.innerHTML='',3000);
  });

  // Stars
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      rating = parseInt(star.dataset.v);
      document.getElementById('rev-rating').value = rating;
      document.querySelectorAll('.star').forEach(s => s.classList.toggle('active', parseInt(s.dataset.v)<=rating));
    });
  });

  // Review submit
  document.getElementById('rev-submit').addEventListener('click', () => {
    const text = document.getElementById('rev-text').value.trim();
    const el   = document.getElementById('rev-alert');
    if (!rating) { el.innerHTML='<div class="alert alert-danger">Please select a rating.</div>'; return; }
    if (!text)   { el.innerHTML='<div class="alert alert-danger">Please write your review.</div>'; return; }
    const revs = getAll(KEYS.REVIEWS)||[];
    revs.push({ id:genId('r'), userId:user.id, rating, text, createdAt:new Date().toISOString(), status:'pending' });
    saveAll(KEYS.REVIEWS, revs);
    el.innerHTML='<div class="alert alert-success">🎉 Review submitted! It will appear after admin approval.</div>';
    document.getElementById('rev-text').value=''; rating=0;
    document.querySelectorAll('.star').forEach(s=>s.classList.remove('active'));
    document.getElementById('rev-rating').value=0;
    showToast('Review submitted!','success'); setTimeout(()=>el.innerHTML='',4000);
  });
});

function load(user) {
  document.getElementById('p-first').value  = user.firstName||'';
  document.getElementById('p-last').value   = user.lastName||'';
  document.getElementById('p-email').value  = user.email||'';
  document.getElementById('p-phone').value  = user.phone||'';
  document.getElementById('p-name').textContent = user.firstName+' '+user.lastName;
  document.getElementById('p-avatar').textContent = user.firstName.charAt(0).toUpperCase();
  document.getElementById('p-role-badge').innerHTML = `<span class="badge ${user.role==='admin'?'badge-red':user.role==='staff'?'badge-blue':'badge-green'}">${user.role}</span>`;

  const allB = bookingsAPI.forUser(user.id);
  const myCars = carsAPI.forUser(user.id);
  document.getElementById('p-bookings').textContent = allB.length;
  document.getElementById('p-points').textContent   = user.points||0;
  document.getElementById('p-cars').textContent     = myCars.length;
  document.getElementById('p-pts2').textContent     = user.points||0;

  // Tier
  const pts = user.points||0;
  let tier='Bronze', next=100, pct=Math.min(pts/100*100,100);
  if(pts>=500){tier='Platinum';next=0;pct=100;}else if(pts>=200){tier='Gold';next=500;pct=(pts-200)/300*100;}else if(pts>=100){tier='Silver';next=200;pct=(pts-100)/100*100;}
  document.getElementById('p-tier').textContent   = tier;
  document.getElementById('p-pts-bar').style.width = pct+'%';
  document.getElementById('p-pts-label').textContent = next>0 ? `${next-pts} points to ${tier==='Bronze'?'Silver':tier==='Silver'?'Gold':'Platinum'}` : '🚗 Max Tier!';

  // Cars list
  document.getElementById('prof-cars-list').innerHTML = myCars.length
    ? myCars.map(c => {
        const pic = (CARS_DB[c.brand] && CARS_DB[c.brand].models[c.model] && CARS_DB[c.brand].models[c.model].pic) || (CARS_DB[c.brand] && CARS_DB[c.brand].logo) || '';
        const imgHtml = pic ? `<img src="${pic}" alt="${c.brand}" style="width: 50px; height: 50px; object-fit: contain; border-radius: var(--radius-sm);">` : `<span style="font-size:2rem">🚗</span>`;
        return `
        <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--gray-50);border-radius:var(--radius-sm);margin-bottom:10px">
          ${imgHtml}
          <div style="flex:1"><div style="font-weight:700">${c.brand} ${c.model} (${c.year})</div><div style="font-size:.78rem;color:var(--gray-500)">${c.plate}  ${c.color}</div></div>
          <a href="booking.html?car=${c.id}" class="btn btn-ghost btn-sm">Book</a>
        </div>`;
      }).join('')
    : '<div class="empty-state" style="padding:24px"><div class="empty-icon">🔧</div><p>No cars yet.</p><a href="cars.html" class="btn btn-primary mt-16">Add a Car</a></div>';
}
