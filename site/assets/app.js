(() => {
  'use strict';
  document.documentElement.classList.add('js-ready');
  const base = document.documentElement.dataset.base || '/projects/';
  const url = (value = '') => base + String(value).replace(/^\/+/, '');
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const external = (value) => /^https:\/\//.test(String(value || '')) ? value : '#';
  const palettes = {mint:['#94e8d6','rgba(78,200,167,.24)'],violet:['#c3b2f9','rgba(142,113,216,.23)'],orange:['#f1bb91','rgba(228,142,87,.23)'],blue:['#9abff5','rgba(88,144,232,.23)']};
  const accentStyle = (accent) => { const p = palettes[accent] || palettes.mint; return `--accent:${p[0]};--tint:${p[1]}`; };
  const statusLabel = (status) => ({published:'Published', planned:'Research queue', prototype:'Prototype', validating:'Validating', launched:'Launched'}[status] || status);
  const iconFor = (id) => ({knowledge:'◈',productivity:'↗',professional:'⌘',infrastructure:'⌁'}[id] || '◇');
  const figFor = (id) => ({knowledge:'◎',productivity:'↗',professional:'§',infrastructure:'⌘'}[id] || '◈');
  const projectLink = (p) => url(`projects/${encodeURIComponent(p.category)}/${encodeURIComponent(p.id)}/`);
  const textList = (list) => (list || []).map((x) => `<li>${esc(x)}</li>`).join('');
  const tagMarkup = (tags) => (tags || []).slice(0, 5).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const when = (date) => date ? String(date).slice(0,7).replace('-','.') : 'UPCOMING';
  const initNav = () => {
    const button = document.getElementById('menu-button'); const nav = document.getElementById('mobile-nav');
    if (button && nav) { button.addEventListener('click', () => { const next = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(next)); nav.hidden = !next; }); nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {button.setAttribute('aria-expanded', 'false'); nav.hidden = true;})); }
    const yr = document.getElementById('year'); if(yr) yr.textContent = String(new Date().getFullYear());
    if ('IntersectionObserver' in window) { const ob = new IntersectionObserver(entries => {entries.forEach(e => {if(e.isIntersecting){ e.target.classList.add('is-visible'); ob.unobserve(e.target); }})},{threshold:.12}); document.querySelectorAll('.reveal').forEach(el=>ob.observe(el)); } else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
  };
  async function fetchCatalog() { const response = await fetch(url('data/catalog.json'), {cache: 'no-cache'}); if (!response.ok) throw new Error(`Catalog unavailable (${response.status})`); return response.json(); }
  function initHome(catalog) {
    const items = catalog.projects || []; const categories = catalog.categories || [];
    const published = items.filter(p => p.status === 'published');
    const counts = {published:published.length, tracked:items.length, sources:published.reduce((a,p)=>a+Number(p.sourceCount || 0),0)};
    for(const [metric,value] of Object.entries(counts)){const el = document.querySelector(`[data-metric="${metric}"]`); if(el) el.textContent = String(value).padStart(2,'0');}
    const cg = document.getElementById('category-grid');
    cg.innerHTML = categories.map(c => {
      const count = items.filter(p => p.category === c.id).length;
      return `<button type="button" class="category-card" style="${accentStyle(c.accent)}" data-category="${esc(c.id)}" aria-label="View ${esc(c.name)} projects"><span class="category-top"><span>${esc(c.number)} / FIELD</span><span class="category-symbol">${iconFor(c.id)}</span></span><h3>${esc(c.name)}</h3><div class="zh">${esc(c.zh)}</div><p>${esc(c.description)}</p><span class="category-foot"><span>${count} ${count===1?'project':'projects'}</span><strong>EXPLORE ↗</strong></span></button>`;
    }).join('');
    const grid = document.getElementById('project-grid'), empty = document.getElementById('empty-state'), search = document.getElementById('project-search'), chipButtons = [...document.querySelectorAll('.filter-chip')], activeCat = document.getElementById('active-category');
    let filter = 'all', category = new URLSearchParams(location.search).get('category') || '', query = '';
    if (!categories.some(c => c.id === category)) category = '';
    function render() {
      const visible = items.filter(p => (filter==='all'||p.status===filter) && (!category||p.category===category) && `${p.title} ${p.titleZh||''} ${p.summary||''} ${(p.tags||[]).join(' ')} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
      grid.innerHTML = visible.map((p,idx) => {
        const c = categories.find(x => x.id === p.category) || {name:p.category,accent:'mint'};
        return `<a href="${projectLink(p)}" class="project-card" aria-label="View project: ${esc(p.title)}"><div class="card-art" style="${accentStyle(c.accent)}"><span class="art-corner">${p.status==='published'?'FEATURED RESEARCH':'OPPORTUNITY WATCHLIST'}</span><span class="art-center" aria-hidden="true">${figFor(p.category)}</span><span class="art-index">1998X / ${String(idx+1).padStart(2,'0')}</span></div><div class="card-content"><div class="card-meta"><span>${esc(c.name.toUpperCase())}</span><span class="status-pill ${p.status==='planned'?'planned':''}">${esc(statusLabel(p.status))}</span></div><h3>${esc(p.title)}</h3><p class="card-zh">${esc(p.titleZh||'')}</p><p class="card-description">${esc(p.summary)}</p><div class="tag-list">${tagMarkup(p.tags)}</div><div class="card-footer"><span>${p.status==='published' ? `${Number(p.sourceCount||0)} sources · ${when(p.publishedAt)}` : 'Research not yet published'}</span><span>VIEW DOSSIER ↗</span></div></div></a>`;
      }).join('');
      empty.hidden = visible.length > 0;
      const catName = categories.find(c=>c.id===category)?.name;
      activeCat.hidden = !category;
      if(category) activeCat.innerHTML = `Category: <strong>${esc(catName)}</strong> <button type="button" id="remove-category">Clear ×</button>`;
      document.getElementById('remove-category')?.addEventListener('click',()=>{category='';history.replaceState(null,'',location.pathname+(filter==='all'?'':'#portfolio'));render()});
      chipButtons.forEach(btn=>{const on=btn.dataset.filter===filter;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));});
    }
    cg.querySelectorAll('[data-category]').forEach(el=>el.addEventListener('click',()=>{category=el.dataset.category; history.replaceState(null,'',`${location.pathname}?category=${encodeURIComponent(category)}#portfolio`); render(); document.getElementById('portfolio').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));
    chipButtons.forEach(el=>el.addEventListener('click',()=>{filter=el.dataset.filter;render()}));
    search?.addEventListener('input',()=>{query=search.value.trim();render()});
    document.getElementById('clear-filters')?.addEventListener('click',()=>{filter='all';category='';query='';search.value='';history.replaceState(null,'',location.pathname+'#portfolio');render()});
    render();
  }
  function initDetail(catalog) {
    const id = document.documentElement.dataset.projectId;
    const p = (catalog.projects||[]).find(x=>x.id===id);
    const root = document.getElementById('detail-root');
    if(!p) {root.innerHTML='<div class="dossier-pending">This project could not be found. <a href="'+url('')+'">Return to portfolio ↗</a></div>';return;}
    const cat = (catalog.categories||[]).find(c=>c.id===p.category) || {name:p.category,zh:'',accent:'mint'};
    document.title = `${p.title} · 1998X Projects`;
    const meta = document.querySelector('meta[name="description"]'); if(meta) meta.content = p.summary;
    document.getElementById('crumb-name').textContent=p.title;
    const published = p.status==='published';
    const links = (p.files||[]).map(f=>`<a class="resource-link" href="${url(f.path)}" ${f.format==='DOCX'?'download':''}><strong>${esc(f.label)}</strong><span>${esc(f.format)} ↗</span></a>`).join('');
    const sources = (p.sourceLinks||[]).map(s=>`<a class="resource-link" href="${esc(external(s.url))}" target="_blank" rel="noopener noreferrer"><strong>${esc(s.label)}</strong><span>↗</span></a>`).join('');
    root.innerHTML=`<article><div class="dossier-head"><div><div class="section-kicker">${esc(cat.name.toUpperCase())} / PROJECT DOSSIER</div><h1>${esc(p.title)}</h1><p class="dossier-subtitle">${esc(p.subtitle||'')}</p><p class="dossier-summary">${esc(p.summary)}</p><p class="dossier-zh">${esc(p.summaryZh||'')}</p><div class="tag-list dossier-tags">${tagMarkup(p.tags)}</div></div><div class="dossier-side"><div class="side-line"><span>RESEARCH STAGE</span><strong>${esc(statusLabel(p.status))}</strong></div><div class="side-line"><span>DOMAIN</span><strong>${esc(cat.name)}</strong></div><div class="side-line"><span>DATE</span><strong>${esc(p.publishedAt||'Not yet published')}</strong></div><div class="side-line"><span>REFERENCES</span><strong>${published?Number(p.sourceCount||0)+' cited entries':'Not researched'}</strong></div></div></div><div class="dossier-main"><div class="dossier-body">${!published?'<div class="dossier-pending"><strong>Research queue / 待研究</strong><p>This is an intentionally empty project shell. Research conclusions, validation results and traction have not been published.</p></div>':''}<section><div class="section-kicker">01 / THE PROBLEM</div><h2>What needs to change?</h2><p>${esc(p.problem||'Not yet defined.')}</p></section><section><div class="section-kicker">02 / THE THESIS</div><h2>Where the opportunity might be</h2><p class="statement">${esc(p.thesis||'To be determined.')}</p></section>${published?`<section><div class="section-kicker">03 / RESEARCH FINDINGS</div><h2>Signals from the market</h2><ol>${textList(p.findings)}</ol></section><section><div class="section-kicker">04 / COUNTERPOINTS</div><h2>What remains unproven</h2><ul>${textList(p.risks)}</ul></section><section><div class="section-kicker">05 / METHODOLOGY</div><h2>Evidence, not endorsement</h2><p>${esc(p.method)}</p><p>Claims in this dossier represent desk research and product hypotheses. They are not evidence of customer adoption, revenue or product-market fit.</p></section>`:''}</div><aside class="dossier-aside" aria-label="Research resources"><div class="aside-card"><h3>RESEARCH FILES</h3>${links||'<p class="aside-note">Deliverables will appear here once published.</p>'}</div><div class="aside-card"><h3>ORIGINAL SOURCES</h3>${sources||'<p class="aside-note">No sources published yet.</p>'}</div><div class="aside-card"><h3>TRANSPARENCY NOTE</h3><p class="aside-note">Stage labels distinguish published analysis from future work. The research report contains detailed references and limits.</p></div></aside></div></article>`;
  }
  async function main(){ initNav(); try{const catalog = await fetchCatalog(); if(document.body.dataset.page==='home') initHome(catalog); else initDetail(catalog);}catch(e){const root = document.getElementById(document.body.dataset.page==='home'?'project-grid':'detail-root');if(root)root.innerHTML='<p class="dossier-pending">Project data is currently unavailable. Please visit the <a href="https://github.com/1998x-stack/projects">source repository</a>.</p>';console.error(e)} }
  main();
})();
