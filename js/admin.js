document.addEventListener('DOMContentLoaded',()=>{
  const a=RouteForge.requireUser('admin');
  if(!a)return;
  document.getElementById('logout-btn')?.addEventListener('click',RouteForge.logout);
  document.getElementById('page-title').textContent=document.body.dataset.title||'Admin';
  document.getElementById('page-subtitle').textContent=document.body.dataset.subtitle||'';
  document.getElementById('top-user').textContent=a.name;

  const users=()=>RouteForge.users();
  const routes=()=>RouteForge.routes();
  const stats=()=>{
    const allU=users(),allR=routes();
    const stops=allR.reduce((s,r)=>s+(r.stops||[]).length,0);
    const dist=allR.reduce((s,r)=>s+Number(r.optimizedDistance||0),0);
    const fuel=allR.reduce((s,r)=>s+Number(r.fuelUsed||0),0);
    const cost=allR.reduce((s,r)=>s+Number(r.fuelCost||0),0);
    const urgent=allR.reduce((s,r)=>s+Number(r.urgentCount||0),0);
    const late=allR.reduce((s,r)=>s+Number(r.lateCount||0),0);
    [['users',allU.filter(u=>u.role==='user').length],['active',allU.filter(u=>u.status==='active'&&u.role==='user').length],['blocked',allU.filter(u=>u.status==='blocked'&&u.role==='user').length],['routes',allR.length],['stops',stops],['distance',dist.toFixed(1)+' km'],['fuel',fuel.toFixed(1)+' L'],['cost','₹'+Math.round(cost).toLocaleString('en-IN')],['urgent',urgent],['late',late]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v});
  };
  stats();

  const routeBox=document.getElementById('admin-route-list');
  if(routeBox){
    const allR=routes(),allU=users();
    routeBox.innerHTML=allR.map(r=>{const owner=allU.find(x=>x.id===r.userId);return `<tr><td>${RouteForge.esc(owner?.name||'Unknown')}</td><td><b>${RouteForge.esc(r.routeName||'Untitled Route')}</b></td><td>${(r.stops||[]).length}</td><td>${Number(r.optimizedDistance||0).toFixed(1)} km</td><td>${Number(r.fuelUsed||0).toFixed(2)} L</td><td>₹${Math.round(r.fuelCost||0).toLocaleString('en-IN')}</td><td><span class="status ${r.onTimeRate>=90?'good':r.onTimeRate>=70?'warn':'bad'}">${Number(r.onTimeRate||0).toFixed(0)}%</span></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">No routes.</td></tr>';
  }

  const tb=document.getElementById('users-table');
  if(tb){
    const render=()=>{
      const q=(document.getElementById('search')?.value||'').trim().toLowerCase();
      const arr=users().filter(u=>!q||String(u.name||'').toLowerCase().includes(q)||String(u.email||'').toLowerCase().includes(q));
      tb.innerHTML=arr.map(u=>`<tr><td><b>${RouteForge.esc(u.name)}</b></td><td>${RouteForge.esc(u.email)}</td><td>${u.role}</td><td><span class="status ${u.status==='active'?'good':'bad'}">${u.status}</span></td><td>${u.createdAt||'—'}</td><td><button class="btn btn-ghost btn-xs" data-block="${u.id}">${u.status==='active'?'Block':'Unblock'}</button>${u.role!=='admin'?`<button class="btn btn-danger btn-xs" data-udel="${u.id}">Delete</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No users found.</td></tr>';
      tb.querySelectorAll('[data-block]').forEach(b=>b.onclick=()=>{
        const arr=users();const x=arr.find(x=>x.id===b.dataset.block);if(!x)return;
        x.status=x.status==='active'?'blocked':'active';RouteForge.write(RouteForge.KEYS.users,arr);RouteForge.toast(`User ${x.status==='blocked'?'blocked':'unblocked'}`,'success');stats();render();
      });
      tb.querySelectorAll('[data-udel]').forEach(b=>b.onclick=()=>{
        if(!confirm('Delete this user and all routes/vehicles belonging to them?'))return;
        const id=b.dataset.udel;
        RouteForge.write(RouteForge.KEYS.users,users().filter(x=>x.id!==id));
        RouteForge.write(RouteForge.KEYS.routes,routes().filter(x=>x.userId!==id));
        RouteForge.write(RouteForge.KEYS.vehicles,RouteForge.vehicles().filter(x=>x.userId!==id));
        RouteForge.toast('User and related data deleted','success');stats();render();
      });
    };
    document.getElementById('search')?.addEventListener('input',render);render();
  }

  const urgentBox=document.getElementById('urgent-list');
  if(urgentBox){
    const allR=routes();
    urgentBox.innerHTML=allR.flatMap(r=>(r.stops||[]).filter(s=>s.priority==='urgent').map(s=>`<div class="risk-row"><b>${RouteForge.esc(s.name)}</b><span>${RouteForge.esc(r.routeName)}</span><span class="priority urgent">URGENT</span><small>${s.windowStart||'—'}–${s.windowEnd||'—'}</small></div>`)).join('')||'<div class="empty">No urgent deliveries.</div>';
  }
  const lateBox=document.getElementById('late-list');
  if(lateBox){
    const allR=routes();
    lateBox.innerHTML=allR.flatMap(r=>(r.simulation?.legs||[]).filter(x=>x.status==='LATE').map(x=>`<div class="risk-row"><b>${RouteForge.esc(x.stop.name)}</b><span>${RouteForge.esc(r.routeName)}</span><span class="status bad">${Math.round(x.lateMinutes)} min late</span></div>`)).join('')||'<div class="empty">No late deliveries.</div>';
  }
});
