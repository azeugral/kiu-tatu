(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* nav sólida ao rolar + barra de DM no celular */
  const nav = $('.nav'), barra = $('.barra-dm'), hero = $('.hero');
  const rolou = () => {
    nav.classList.toggle('solida', scrollY > 20);
    barra.classList.toggle('on', scrollY > hero.offsetHeight * .7);
  };
  addEventListener('scroll', rolou, { passive: true }); rolou();

  /* link ativo */
  const links = $$('.nav-links a');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('ativo', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.hash); s && io.observe(s); });

  /* menu */
  const bm = $('.nav-menu'), menu = $('#menu');
  const abreMenu = on => {
    bm.setAttribute('aria-expanded', on); menu.hidden = !on;
    document.body.style.overflow = on ? 'hidden' : '';
  };
  bm.addEventListener('click', () => abreMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => abreMenu(false)));

  /* fundo: fumaça com sigilos espelhados, ao vivo no desktop (WebGL) e MP4 em loop no toque */
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fundo = $('.hero-fundo'), cv = $('.fundo-gl', fundo), hv = $('.fundo-vid', fundo);
  const toque = matchMedia('(hover: none), (pointer: coarse), (max-width: 760px)').matches;
  const tocaVideo = (v, src) => {
    if (calmo) return;
    v.src = src;
    v.addEventListener('playing', () => v.classList.add('on'), { once: true });
    new IntersectionObserver(([e]) => e.isIntersecting ? v.play().catch(() => {}) : v.pause()).observe(v.parentElement);
  };
  /* eixo do espelho: no centro da foto do hero */
  const eixo = () => { const f = $('.hero-foto').getBoundingClientRect(); return Math.min(.85, Math.max(.5, (f.left + f.width / 2) / innerWidth)); };
  const vivo = () => {
    let T;
    try { T = sigiloGL(cv); } catch (e) { T = null; }
    if (!T) return;
    const CICLO = 24000, ESC = .8;
    let ex = eixo();
    const ajusta = () => { T.tamanho(Math.round(fundo.clientWidth * ESC), Math.round(fundo.clientHeight * ESC)); ex = eixo(); };
    ajusta(); addEventListener('resize', ajusta);
    let ve = true, ult = 0, t0 = performance.now();
    new IntersectionObserver(([e]) => ve = e.isIntersecting).observe(fundo);
    const quadro = t => {
      requestAnimationFrame(quadro);
      if (!ve || document.hidden || t - ult < 32) return;
      ult = t;
      T.desenhar(((t - t0) % CICLO) / CICLO * 6.283185307179586, ex);
      cv.classList.add('on');
    };
    if (calmo) { T.desenhar(0, ex); cv.classList.add('on'); } else requestAnimationFrame(quadro);
  };
  if (toque) tocaVideo(hv, innerWidth > innerHeight ? 'assets/video/sigilo-deitado.mp4' : 'assets/video/sigilo-celular.mp4');
  else vivo();
  $$('.fim-fundo .fundo-vid').forEach(v => tocaVideo(v, v.dataset.src));

  /* hero: fotos passam sozinhas */
  const fotos = $$('.hero-quadro img'), tit = $('.hero-tit'), cont = $('.hero-cont b'), bar = $('.hero-barra i');
  const nomes = ['Olhos em sangue, autoral', 'Cybersigil na mão', 'Hollow Knight, autoral', 'Hexatombe, Ordem Paranormal', 'Cybersigil com luz vermelha'];
  let hi = 0;
  const corre = () => { bar.classList.remove('corre'); void bar.offsetWidth; bar.classList.add('corre'); };
  const troca = () => {
    fotos[hi].classList.remove('on');
    hi = (hi + 1) % fotos.length;
    fotos[hi].classList.add('on');
    tit.textContent = nomes[hi]; cont.textContent = hi + 1;
    corre();
  };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { corre(); setInterval(() => { if (!document.hidden) troca(); }, 6000); }

  /* portfólio */
  const grade = $('#grade'), mais = $('#mais');
  const nomesCat = { cyber: 'Cybersigilismo', geek: 'Anime e games', vermelho: 'Vermelho', fino: 'Traço fino' };
  let obras = [], filtro = 'todos', limite = 16;
  const visiveis = () => obras.filter(o => filtro === 'todos' || o.cat === filtro);
  const desenha = () => {
    const lista = visiveis();
    grade.innerHTML = lista.slice(0, limite).map((o, i) => `
      <li style="animation-delay:${(i % 16) * 30}ms"><button data-id="${o.id}" aria-label="Ver fotos: ${o.titulo}">
        <div class="obra-img"><img src="assets/img/obras/${o.id}.webp" alt="${o.titulo}" loading="lazy" width="720" height="900">${o.fotos.length > 1 ? `<span class="qtd">${o.fotos.length} fotos</span>` : ''}</div>
        <p class="obra-leg"><span>${o.id}</span>${o.titulo}</p>
      </button></li>`).join('');
    mais.parentElement.hidden = lista.length <= limite;
  };
  const filtra = f => {
    filtro = f; limite = 16;
    $$('.filtros button').forEach(b => b.setAttribute('aria-selected', b.dataset.f === f));
    desenha();
  };
  $$('.filtros button').forEach(b => b.addEventListener('click', () => filtra(b.dataset.f)));
  $$('.estilo').forEach(a => a.addEventListener('click', () => filtra(a.dataset.ir)));
  mais.addEventListener('click', () => { limite += 16; desenha(); });
  fetch('assets/obras.json').then(r => r.json()).then(d => { obras = d; desenha(); });

  /* galeria */
  const gal = $('#galeria'), gimg = $('.gal-fig img', gal), gtit = $('.gal-tit', gal), gcont = $('.gal-cont', gal), gig = $('.gal-ig', gal);
  let atual = null, gi = 0, volta = null;
  const mostra = () => {
    gimg.src = `assets/img/obras/${atual.fotos[gi]}.webp`;
    gimg.alt = atual.titulo;
    gtit.textContent = atual.titulo;
    gcont.textContent = atual.fotos.length > 1 ? `${gi + 1} de ${atual.fotos.length}` : '';
    $$('.gal-seta', gal).forEach(b => b.hidden = atual.fotos.length < 2);
  };
  const abre = (o, el) => {
    atual = o; gi = 0; volta = el; mostra();
    gig.href = `https://www.instagram.com/p/${o.ig}/`;
    gal.hidden = false; document.body.style.overflow = 'hidden'; $('.gal-fechar').focus();
  };
  const fecha = () => { gal.hidden = true; document.body.style.overflow = ''; volta && volta.focus(); };
  const passa = d => { gi = (gi + d + atual.fotos.length) % atual.fotos.length; mostra(); };
  grade.addEventListener('click', e => {
    const b = e.target.closest('button[data-id]'); if (!b) return;
    abre(obras.find(o => o.id === b.dataset.id), b);
  });
  $('.gal-fechar').addEventListener('click', fecha);
  $('.gal-ant').addEventListener('click', () => passa(-1));
  $('.gal-prox').addEventListener('click', () => passa(1));
  gal.addEventListener('click', e => { if (e.target === gal) fecha(); });
  addEventListener('keydown', e => {
    if (gal.hidden) return;
    if (e.key === 'Escape') fecha();
    if (e.key === 'ArrowLeft') passa(-1);
    if (e.key === 'ArrowRight') passa(1);
  });
  let tx = null;
  gal.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  gal.addEventListener('touchend', e => {
    if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 40 && atual.fotos.length > 1) passa(dx < 0 ? 1 : -1);
  });
})();
