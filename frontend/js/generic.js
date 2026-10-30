document.addEventListener('DOMContentLoaded', async () => {
  const u = RouteForge.requireUser(); if (!u) return;
  const page = document.body.dataset.page || 'dashboard';
  RouteForge.pageChrome(document.body.dataset.title || 'RouteForge', document.body.dataset.subtitle || '', page);
  const saveRoutes = xs => RouteForge.write(RouteForge.KEYS.routes, xs || []);
  const saveVehicles = xs => RouteForge.write(RouteForge.KEYS.vehicles, xs || []);
  async function refreshRoutes(all = false) { const d = await RouteForgeAPI.getRoutes(all); saveRoutes(d.routes); return d.routes; }
  async function refreshVehicles(all = false) { const d = await RouteForgeAPI.getVehicles(all); saveVehicles(d.vehicles); return d.vehicles; }
  try {
    if (page === 'routes' || page === 'history' || page === 'analytics') await refreshRoutes();
    if (page === 'vehicles') await refreshVehicles();
  } catch (e) { RouteForge.toast(`Could not load saved data from server: ${e.message}`, 'error'); }

  if (page === 'routes' || page === 'history') {
    const body = document.getElementById('route-table');
    async function render() {
      const q = (document.getElementById('search')?.value || '').trim().toLowerCase();
      const arr = RouteForge.userRoutes(u.id).filter(r => !q || String(r.routeName || '').toLowerCase().includes(q)).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
      body.innerHTML = arr.map(r => `<tr><td><b>${RouteForge.esc(r.routeName||'Untitled Route')}</b><small>${new Date(r.createdAt||Date.now()).toLocaleDateString('en-IN')}</small></td><td>${(r.stops||[]).length}</td><td>${Number(r.optimizedDistance||0).toFixed(1)} km</td><td>${Number(r.fuelUsed||0).toFixed(2)} L</td><td>₹${Math.round(r.fuelCost||0).toLocaleString('en-IN')}</td><td><span class="status ${r.onTimeRate>=90?'good':r.onTimeRate>=70?'warn':'bad'}">${Number(r.onTimeRate||0).toFixed(0)}%</span></td><td><button class="btn btn-ghost btn-xs" data-view="${r.id}">View</button><button class="btn btn-ghost btn-xs" data-copy="${r.id}">Duplicate</button><button class="btn btn-danger btn-xs" data-del="${r.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">No routes found. Create your first RouteForge route.</td></tr>';
      body.querySelectorAll('[data-view]').forEach(b => b.onclick = async () => { try { const d = await RouteForgeAPI.request(`/routes/${encodeURIComponent(b.dataset.view)}`); const r = { ...d.route, id: String(d.route._id || d.route.id), userId: String(d.route.userId?._id || d.route.userId) }; RouteForge.write(RouteForge.KEYS.draft, r); location.href = 'route-result.html'; } catch(e) { RouteForge.toast(e.message, 'error'); } });
      body.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => { const r=RouteForge.routes().find(x=>x.id===b.dataset.copy); if(!r)return; try { const copy={...r, routeName:`${r.routeName} (Copy)`, createdAt:new Date().toISOString()}; delete copy.id; delete copy._id; const d=await RouteForgeAPI.createRoute(copy); const x={...d.route,id:String(d.route._id),userId:u.id}; saveRoutes([x,...RouteForge.routes()]); RouteForge.toast('Route duplicated and saved to MongoDB','success'); await render(); } catch(e){RouteForge.toast(e.message,'error');} });
      body.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if(!confirm('Delete this route from MongoDB?'))return; try { await RouteForgeAPI.deleteRoute(b.dataset.del); saveRoutes(RouteForge.routes().filter(x=>x.id!==b.dataset.del)); await render(); RouteForge.toast('Route deleted from database','success'); } catch(e){RouteForge.toast(e.message,'error');} });
    }
    document.getElementById('search')?.addEventListener('input', render); await render();
  }

  if (page === 'vehicles') {
    const box = document.getElementById('vehicle-grid');
    async function renderV() {
      const vs = RouteForge.vehicles().filter(v => v.userId === u.id);
      box.innerHTML = vs.map(v => `<div class="glass vehicle-card"><div class="vehicle-icon">▱</div><h3>${RouteForge.esc(v.name)}</h3><p>${RouteForge.esc(v.reg||'')}</p><div class="vehicle-specs"><span>${v.fuelType}<small>Fuel</small></span><span>${v.mileage} km/L<small>Mileage</small></span><span>₹${v.fuelPrice}/L<small>Fuel price</small></span><span>${v.speed} km/h<small>Avg speed</small></span></div><button class="btn btn-danger btn-xs" data-vdel="${v.id}">Delete</button></div>`).join('') || '<div class="empty">No vehicles yet.</div>';
      box.querySelectorAll('[data-vdel]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this vehicle from the database?'))return;try{await RouteForgeAPI.deleteVehicle(b.dataset.vdel);saveVehicles(RouteForge.vehicles().filter(x=>x.id!==b.dataset.vdel));await renderV();RouteForge.toast('Vehicle deleted from MongoDB','success')}catch(e){RouteForge.toast(e.message,'error')}});
    }
    document.getElementById('vehicle-form').onsubmit = async e => { e.preventDefault(); const reg=document.getElementById('v-reg').value.trim(); if(RouteForge.vehicles().some(x=>x.userId===u.id&&String(x.reg||'').toLowerCase()===reg.toLowerCase()))return RouteForge.toast('A vehicle with this registration already exists','warning'); const v={name:document.getElementById('v-name').value.trim(),reg,fuelType:document.getElementById('v-fuel').value,mileage:+document.getElementById('v-mileage').value,fuelPrice:+document.getElementById('v-price').value,capacity:+document.getElementById('v-capacity').value,speed:+document.getElementById('v-speed').value}; const btn=e.submitter; if(btn)btn.disabled=true; try { const d=await RouteForgeAPI.createVehicle(v); const item={...d.vehicle,id:String(d.vehicle._id||d.vehicle.id),userId:String(d.vehicle.userId?._id||d.vehicle.userId)}; saveVehicles([item,...RouteForge.vehicles()]); e.target.reset(); await renderV(); RouteForge.toast('Vehicle saved to MongoDB','success'); } catch(err){RouteForge.toast(err.message,'error')} finally{if(btn)btn.disabled=false;} };
    await renderV();
  }

  if (page === 'profile') {
    document.getElementById('p-name').value=u.name||''; document.getElementById('p-email').value=u.email||''; document.getElementById('p-phone').value=u.phone||'';
    document.getElementById('profile-form').onsubmit=async e=>{e.preventDefault();try{const d=await RouteForgeAPI.updateProfile({name:document.getElementById('p-name').value.trim(),phone:document.getElementById('p-phone').value.trim()});RouteForge.setCurrent(d.user);localStorage.setItem('routeforge_api_user',JSON.stringify(d.user));RouteForge.toast('Profile updated on server','success')}catch(err){RouteForge.toast(err.message,'error')}};
  }
  if (page === 'settings') {
    const prefs=RouteForge.read(RouteForge.KEYS.prefs,{theme:'dark',motion:'full',unit:'km',currency:'INR'}); for(const k of Object.keys(prefs)){const el=document.getElementById('set-'+k);if(el)el.value=prefs[k]} document.documentElement.dataset.theme=prefs.theme;document.body.dataset.motion=prefs.motion;
    document.getElementById('settings-form').onsubmit=e=>{e.preventDefault();const p={theme:document.getElementById('set-theme').value,motion:document.getElementById('set-motion').value,unit:document.getElementById('set-unit').value,currency:document.getElementById('set-currency').value};RouteForge.write(RouteForge.KEYS.prefs,p);document.documentElement.dataset.theme=p.theme;document.body.dataset.motion=p.motion;RouteForge.toast('Settings saved in this browser','success')};
  }
  if (page === 'analytics') {
    const rs=RouteForge.routes().filter(r=>r.userId===u.id); const saved=rs.reduce((s,r)=>s+Math.max(0,(r.originalDistance||0)-(r.optimizedDistance||0)),0); const fuelSaved=rs.reduce((s,r)=>s+Math.max(0,(r.originalDistance||0)-(r.optimizedDistance||0))/(r.vehicle?.mileage||15),0); const costSaved=rs.reduce((s,r)=>s+Math.max(0,(r.originalDistance||0)-(r.optimizedDistance||0))/(r.vehicle?.mileage||15)*(r.vehicle?.fuelPrice||95),0); const stops=rs.reduce((s,r)=>s+(r.stops||[]).length,0),on=rs.length?rs.reduce((s,r)=>s+(r.onTimeRate||0),0)/rs.length:100; [['a-routes',rs.length],['a-stops',stops],['a-saved',saved.toFixed(1)+' km'],['a-fuel',fuelSaved.toFixed(1)+' L'],['a-cost','₹'+Math.round(costSaved).toLocaleString('en-IN')],['a-time',on.toFixed(0)+'%']].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v});
  }
});
