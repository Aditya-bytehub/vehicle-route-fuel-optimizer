(() => {
  const KEYS={users:'routex_users',current:'routex_current_user',routes:'routex_routes',vehicles:'routex_vehicles',prefs:'routex_preferences',draft:'routex_route_draft'};
  const uid=(p='id')=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const read=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const users=()=>read(KEYS.users,[]); const routes=()=>read(KEYS.routes,[]); const vehicles=()=>read(KEYS.vehicles,[]);
  function seed(){
    let us=users();
    if(!us.length){ us=[
      {id:'user_demo',name:'Aditya Sharma',email:'demo@routex.app',phone:'9876543210',password:'demo1234',role:'user',status:'active',createdAt:'2026-08-12'},
      {id:'user_anmol',name:'Anmol Sehgal',email:'anmol@routex.app',phone:'9876500001',password:'demo1234',role:'user',status:'active',createdAt:'2026-08-13'},
      {id:'user_riya',name:'Riya Mehta',email:'riya@routex.app',phone:'9876500002',password:'demo1234',role:'user',status:'active',createdAt:'2026-08-14'},
      {id:'user_kunal',name:'Kunal Verma',email:'kunal@routex.app',phone:'9876500003',password:'demo1234',role:'user',status:'active',createdAt:'2026-08-15'},
      {id:'admin_demo',name:'RouteX Admin',email:'admin@routex.app',phone:'9999999999',password:'admin1234',role:'admin',status:'active',createdAt:'2026-08-10'}
    ]; write(KEYS.users,us); }
    if(!vehicles().length) write(KEYS.vehicles,[
      {id:uid('veh'),userId:'user_demo',name:'Urban Runner',reg:'PB10RX1001',fuelType:'Petrol',mileage:15,fuelPrice:95,capacity:800,speed:40},
      {id:uid('veh'),userId:'user_demo',name:'City Diesel',reg:'PB10RX1002',fuelType:'Diesel',mileage:18,fuelPrice:88,capacity:1200,speed:42},
      {id:uid('veh'),userId:'user_anmol',name:'Express Van',reg:'CH01RX2202',fuelType:'Diesel',mileage:16,fuelPrice:88,capacity:1000,speed:45},
      {id:uid('veh'),userId:'user_riya',name:'Green CNG',reg:'CH01RX3303',fuelType:'CNG',mileage:22,fuelPrice:78,capacity:700,speed:38},
      {id:uid('veh'),userId:'user_kunal',name:'Cargo Mini',reg:'HR05RX4404',fuelType:'Petrol',mileage:14,fuelPrice:95,capacity:900,speed:40}
    ]);
    if(!routes().length) demoRoutes();
  }
  function demoRoutes(){
    const base=[
      {id:'s1',name:'Sector 17',address:'Chandigarh',lat:30.7333,lng:76.7794,type:'Delivery',priority:'urgent',load:120,windowStart:'10:00',windowEnd:'11:00',service:10},
      {id:'s2',name:'Industrial Area',address:'Chandigarh',lat:30.7050,lng:76.8010,type:'Delivery',priority:'high',load:180,windowStart:'11:15',windowEnd:'12:30',service:12},
      {id:'s3',name:'Zirakpur Hub',address:'Zirakpur',lat:30.6425,lng:76.8173,type:'Pickup',priority:'normal',load:90,windowStart:'12:30',windowEnd:'14:00',service:8},
      {id:'s4',name:'Mohali Phase 7',address:'Mohali',lat:30.7046,lng:76.7179,type:'Delivery',priority:'urgent',load:140,windowStart:'10:30',windowEnd:'12:00',service:10},
      {id:'s5',name:'Airport Road',address:'Mohali',lat:30.6900,lng:76.7880,type:'Delivery',priority:'normal',load:100,windowStart:'14:00',windowEnd:'16:00',service:7}
    ];
    const mk=(id,userId,name,offset)=>{const stops=base.map(s=>({...s,id:uid('stop'),lat:s.lat+(offset||0),lng:s.lng+(offset||0)}));return {id,userId,routeName:name,vehicleId:'',depot:{name:'Chandigarh Depot',lat:30.7046,lng:76.7179},startTime:'09:00',startDate:'2026-08-18',stops,originalOrder:stops.map(s=>s.id),optimizedOrder:stops.map(s=>s.id),originalDistance:0,optimizedDistance:0,fuelUsed:0,fuelCost:0,urgentCount:stops.filter(s=>s.priority==='urgent').length,lateCount:0,onTimeRate:100,createdAt:'2026-08-18T09:00:00Z',algorithm:'Haversine + Priority-Aware NN + 2-Opt'} };
    write(KEYS.routes,[mk('route_demo1','user_demo','Chandigarh Priority Run',0),mk('route_demo2','user_anmol','Morning Express',.004),mk('route_demo3','user_riya','City Collection',-.003)]);
  }
  function current(){const id=localStorage.getItem(KEYS.current);return users().find(u=>u.id===id)||null}
  function setCurrent(u){localStorage.setItem(KEYS.current,u.id)}
  function logout(){localStorage.removeItem(KEYS.current);location.href='index.html'}
  function requireUser(role){const u=current();if(!u){location.href='login.html?next='+encodeURIComponent(location.pathname);return null}if(role&&u.role!==role){location.href=u.role==='admin'?'admin-dashboard.html':'dashboard.html';return null}return u}
  function saveUser(u){write(KEYS.users,users().map(x=>x.id===u.id?u:x))}
  function toast(msg,type='info'){let c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.id='toast-container';document.body.appendChild(c)}const e=document.createElement('div');e.className=`toast toast-${type}`;e.textContent=msg;c.appendChild(e);setTimeout(()=>e.remove(),3200)}
  function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function fmt(n,d=1){return Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:d,minimumFractionDigits:d})}
  function injectNav(active){const u=current();const side=document.getElementById('sidebar');if(!side)return;side.innerHTML=`<div class="brand"><span class="brand-mark">R</span><span>Route<span class="ember">X</span></span></div><div class="nav-label">CONTROL</div><a class="side-link ${active==='dashboard'?'active':''}" href="dashboard.html">⌂ <span>Dashboard</span></a><a class="side-link ${active==='plan'?'active':''}" href="plan-route.html">⌁ <span>Plan Route</span></a><a class="side-link ${active==='routes'?'active':''}" href="routes.html">▣ <span>My Routes</span></a><a class="side-link ${active==='history'?'active':''}" href="history.html">◷ <span>History</span></a><a class="side-link ${active==='vehicles'?'active':''}" href="vehicles.html">▱ <span>Vehicles</span></a><a class="side-link ${active==='analytics'?'active':''}" href="analytics.html">◒ <span>Analytics</span></a><div class="nav-label">ACCOUNT</div><a class="side-link ${active==='profile'?'active':''}" href="profile.html">◉ <span>Profile</span></a><a class="side-link ${active==='settings'?'active':''}" href="settings.html">⚙ <span>Settings</span></a><div class="side-spacer"></div><div class="side-user"><div class="avatar">${esc((u?.name||'U')[0])}</div><div><b>${esc(u?.name||'User')}</b><small>${esc(u?.role||'user')}</small></div></div><button class="side-link logout-btn" id="logout-btn">↪ <span>Logout</span></button>`;document.getElementById('logout-btn').onclick=logout}
  function pageChrome(title,subtitle,active){document.body.classList.add('app-page');injectNav(active);const h=document.getElementById('page-title');if(h)h.textContent=title;const s=document.getElementById('page-subtitle');if(s)s.textContent=subtitle||'';const u=current();const n=document.getElementById('top-user');if(n)n.textContent=u?.name||'User';}
  window.RouteX={KEYS,uid,read,write,users,routes,vehicles,seed,current,setCurrent,logout,requireUser,saveUser,toast,esc,fmt,pageChrome};
  seed();
})();
