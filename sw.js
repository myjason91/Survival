const CACHE='saengjon-v2.3';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return; /* 외부 요청엔 관여하지 않음 */
  const isPage = e.request.mode==='navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if(isPage){
    /* 페이지(HTML)는 네트워크 우선 — 온라인이면 항상 최신, 오프라인이면 캐시 */
    e.respondWith(
      fetch(e.request).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp))}return res;})
        .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(h=>h||caches.match('./index.html')))
    );
    return;
  }
  /* 그 외 자산은 캐시 우선 */
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});
