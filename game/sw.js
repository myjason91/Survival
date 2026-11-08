/* 생존of탕정(72시간 생존게임) 서비스워커 — 범위는 /game/ 하위만. 생존 수첩 캐시(saengjon-v*)는 건드리지 않는다 */
const CACHE='saengjon-game-v10.5.2';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const SCOPE=new URL('./',self.location).pathname;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf('saengjon-game-')===0&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin||url.pathname.indexOf(SCOPE)!==0)return;
  const isPage=e.request.mode==='navigate'||url.pathname===SCOPE||url.pathname===SCOPE+'index.html';
  if(isPage){
    e.respondWith(fetch(e.request).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return res}
      /* 서버가 404 등으로 답하면(사이트 비공개 전환 뒤) 저장해 둔 사본을 보여 준다 */
      return caches.open(CACHE).then(c=>c.match('./index.html')).then(h=>h||res);
    })
      .catch(()=>caches.open(CACHE).then(c=>c.match('./index.html'))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c=>c.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(res=>{
    if(res&&res.ok){const cp=res.clone();c.put(e.request,cp)}return res}))));
});
