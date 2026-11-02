const CACHE='saengjon-v2.6';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const SCOPE=new URL('./',self.location).pathname;            /* 예: /Survival/ */
const OWN_PAGES=[SCOPE,SCOPE+'index.html'];
const SUB_APPS=[SCOPE+'game/'];                               /* 하위 앱(72시간 생존게임)은 자체 서비스워커가 담당 */
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
/* 이전 버전 생존 수첩 캐시(saengjon-v*)만 정리 — 하위 앱 캐시(saengjon-game-*)는 보존 */
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf('saengjon-v')===0&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return; /* 외부 요청엔 관여하지 않음 */
  if(SUB_APPS.some(p=>url.pathname.indexOf(p)===0))return;
  const isPage = e.request.mode==='navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if(isPage){
    /* 페이지(HTML)는 네트워크 우선 — 온라인이면 항상 최신, 오프라인이면 캐시. 캐시 저장은 생존 수첩 자기 페이지만 */
    const own=OWN_PAGES.includes(url.pathname);
    e.respondWith(
      fetch(e.request).then(res=>{
        if(res&&res.ok){if(own){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp))}return res;}
        /* 서버가 404 등으로 답하면(사이트 비공개 전환 뒤) 저장해 둔 사본을 보여 준다 */
        return caches.match(e.request,{ignoreSearch:true}).then(h=>h||caches.match('./index.html')).then(h=>h||res);
      })
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
