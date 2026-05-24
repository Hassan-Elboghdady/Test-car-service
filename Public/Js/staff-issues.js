// staff-issues.js
window.addEventListener('DOMContentLoaded', () => {
  seedData(); if (!requireRole('staff')) return; initSidebar();
  const user = auth.current();
  const myJobs = bookingsAPI.allWithDetails().filter(b=>b.assignedStaff===user.id);
  const bSel = document.getElementById('iss-booking');
  myJobs.forEach(j=>{
    const o=document.createElement('option'); o.value=j.id;
    o.textContent=`${j.service?.name||''}  ${formatDate(j.date)}`; bSel.appendChild(o);
  });
  const params = new URLSearchParams(location.search);
  if (params.get('bid')) bSel.value = params.get('bid');

  document.getElementById('iss-submit').addEventListener('click', () => {
    const type = document.getElementById('iss-type').value;
    const sev  = document.getElementById('iss-severity').value;
    const desc = document.getElementById('iss-desc').value.trim();
    const bid  = document.getElementById('iss-booking').value;
    const el   = document.getElementById('issue-alert');
    if (!desc) { el.innerHTML='<div class="alert alert-danger">Please describe the issue.</div>'; return; }
    const staffIssues = JSON.parse(localStorage.getItem('as_staff_issues') || '[]');
    staffIssues.push({ id:genId('si'), staffId:user.id, bookingId:bid, type, severity:sev, desc, createdAt:new Date().toISOString(), adminReply:'' });
    localStorage.setItem('as_staff_issues', JSON.stringify(staffIssues));
    // Notify admin
    notify({ message:`Staff ${user.firstName} reported a problem: ${type}`, type:'warning', icon:'✅' });
    el.innerHTML='<div class="alert alert-success">✅ Issue submitted to admin. Thank you.</div>';
    document.getElementById('iss-desc').value='';
    renderPast(user.id);
    showToast('Issue reported!','success');
    setTimeout(()=>el.innerHTML='',4000);
  });
  renderPast(user.id);
});

function renderPast(uid) {
  const issues = JSON.parse(localStorage.getItem('as_staff_issues') || '[]').filter(i=>i.staffId===uid);
  const sevColors = { low:'badge-green', medium:'badge-yellow', high:'badge-red' };
  document.getElementById('past-issues').innerHTML = issues.length
    ? [...issues].reverse().slice(0,5).map(i=>`
      <div style="padding:10px 0;border-bottom:1px solid var(--gray-100)">
        <div class="flex-between mb-4">
          <strong style="font-size:.83rem">${i.type}</strong>
          <span class="badge ${sevColors[i.severity]||'badge-gray'}">${i.severity}</span>
        </div>
        <div style="font-size:.78rem;color:var(--gray-500)">${i.desc.slice(0,60)}</div>
        ${i.adminReply ? `<div style="margin-top:6px;padding:6px 10px;background:#fff0f2;border-radius:6px;border-left:3px solid var(--primary);font-size:.75rem"><strong>👨‍💼 Admin:</strong> ${i.adminReply}</div>` : '<div style="font-size:.7rem;color:var(--gray-400);margin-top:3px">⏳ Awaiting admin reply</div>'}
        <div style="font-size:.7rem;color:var(--gray-400);margin-top:3px">${formatDate(i.createdAt)}</div>
      </div>`).join('')
    : '<p style="color:var(--gray-400);font-size:.85rem">No issues reported yet.</p>';
}
