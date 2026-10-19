/* Pedido de orçamento: etapas, validação, rascunho no navegador, fotos e envio.
   Dois modos de envio, escolhidos por ENVIO.email:
   - com e-mail: POST multipart para o FormSubmit, com as imagens anexadas (comprimidas aqui);
   - sem e-mail: monta o texto do pedido, copia e abre a DM da Kiu para colar. */
(() => {
  const ENVIO = {
    email: '',                      // CONFIRMAR: e-mail da Kiu para o FormSubmit (vazio = pedido vai pela DM)
    dm: 'https://ig.me/m/kiu.tatu',
    maxFotos: 4,
    ladoMax: 1600,
    qualidade: .82
  };
  const CHAVE = 'kiu-pedido-v1';
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* menu do celular (esta página não carrega o site.js) */
  const bm = $('.nav-menu'), menu = $('#menu');
  bm.addEventListener('click', () => {
    const abre = menu.hidden;
    bm.setAttribute('aria-expanded', abre); menu.hidden = !abre;
    document.body.style.overflow = abre ? 'hidden' : '';
  });

  const form = $('[data-pedido]');
  const etapas = $$('[data-etapa]', form);
  const passos = $$('[data-passos] li');
  const nomes = passos.map(p => p.textContent.trim());
  const bVoltar = $('[data-voltar]'), bAvancar = $('[data-avancar]'), bEnviar = $('[data-enviar]');
  const alerta = $('[data-alerta]'), rascunho = $('[data-rascunho]');
  let atual = 0, maxVisto = 0;
  const fotos = []; // { file, url }

  /* ---------- ajuda que muda com o tipo ---------- */
  const ajudas = {
    'Autoral': 'O que você quer, o clima, se tem significado. A Kiu cria a partir disso.',
    'Fanart': 'Qual personagem, de onde, se é uma cena ou pose específica. Manda imagem se tiver.',
    'Sigilo ou tribal': 'Onde vai e como quer que acompanhe o corpo. Fino e espinhoso ou mais cheio?',
    'Cobertura': 'Como é a tattoo atual e o que quer por cima. Manda foto dela nas referências.',
    'Retoque': 'Qual tattoo, quando foi feita e o que precisa reforçar. Foto ajuda muito.'
  };
  const ajuda = $('[data-ajuda]');
  $$('input[name="Tipo"]').forEach(r => r.addEventListener('change', () => { ajuda.textContent = ajudas[r.value]; }));

  /* ---------- contador ---------- */
  const ideia = $('#ideia'), contador = $('[data-contador]');
  const contar = () => { const n = ideia.value.trim().length; contador.textContent = n < 20 ? `${n} de 20 caracteres no mínimo` : `${n} caracteres`; };
  ideia.addEventListener('input', contar);

  /* ---------- tamanho: atalhos e régua ---------- */
  const tam = $('#tamanho'), marca = $('[data-regua-marca]'), leitura = $('[data-regua-leitura]');
  const MAXR = 40;
  (() => {
    let h = '';
    for (let cm = 0; cm <= MAXR; cm++) {
      const g = cm % 10 === 0, m = cm % 5 === 0;
      h += `<i class="${g ? 'g' : m ? 'm' : ''}" style="left:${cm / MAXR * 100}%"></i>`;
      if (g) h += `<b style="left:${cm / MAXR * 100}%">${cm}</b>`;
    }
    $('[data-regua]').insertAdjacentHTML('beforeend', h);
  })();
  const comparar = v => v <= 4 ? 'do tamanho de uma moeda' : v <= 8 ? 'do tamanho de um cartão de crédito' : v <= 14 ? 'mais ou menos a palma da mão'
    : v <= 22 ? 'mais ou menos um palmo' : v <= 32 ? 'um antebraço quase inteiro' : 'peça grande, pode ser em mais de uma sessão';
  const regua = () => {
    const v = parseFloat(tam.value);
    $$('[data-cm] .chip').forEach(b => b.classList.toggle('on', +b.dataset.v === v));
    if (!v || v <= 0) { marca.style.transform = 'scaleX(0)'; leitura.textContent = ''; return; }
    marca.style.transform = `scaleX(${Math.min(1, v / MAXR)})`;
    leitura.textContent = `${v} cm · ${comparar(v)}`;
  };
  tam.addEventListener('input', regua);
  $$('[data-cm] .chip').forEach(b => b.addEventListener('click', () => {
    tam.value = b.dataset.v; regua(); tam.closest('.campo').classList.remove('erro'); salvarLogo();
  }));

  /* ---------- fotos ---------- */
  const inArq = $('#arquivos'), lista = $('[data-fotos-lista]'), zona = $('[data-fotos]');
  const desenharFotos = () => {
    lista.innerHTML = fotos.map((f, i) => `<figure class="foto"><img src="${f.url}" alt="Referência ${i + 1}"><button type="button" data-tirar="${i}" aria-label="Remover imagem ${i + 1}">×</button></figure>`).join('');
  };
  const addArquivos = arqs => {
    let cheio = false;
    [...arqs].forEach(f => {
      if (!/^image\//.test(f.type)) return;
      if (fotos.length >= ENVIO.maxFotos) { cheio = true; return; }
      fotos.push({ file: f, url: URL.createObjectURL(f) });
    });
    desenharFotos();
    if (cheio) mostrarAlerta(`Dá para mandar até ${ENVIO.maxFotos} imagens. O resto você manda na DM depois.`);
  };
  inArq.addEventListener('change', () => { addArquivos(inArq.files); inArq.value = ''; });
  lista.addEventListener('click', e => {
    const b = e.target.closest('[data-tirar]'); if (!b) return;
    const i = +b.dataset.tirar; URL.revokeObjectURL(fotos[i].url); fotos.splice(i, 1); desenharFotos();
  });
  ['dragenter', 'dragover'].forEach(t => zona.addEventListener(t, e => { e.preventDefault(); zona.classList.add('arrastando'); }));
  ['dragleave', 'drop'].forEach(t => zona.addEventListener(t, e => { e.preventDefault(); zona.classList.remove('arrastando'); }));
  zona.addEventListener('drop', e => e.dataTransfer && addArquivos(e.dataTransfer.files));

  const comprimir = file => new Promise(ok => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, ENVIO.ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(b => ok(!b || b.size > file.size ? file : new File([b], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })), 'image/jpeg', ENVIO.qualidade);
    };
    img.onerror = () => { URL.revokeObjectURL(url); ok(file); };
    img.src = url;
  });

  /* ---------- validação ---------- */
  const marcar = (el, ok) => { const c = el.closest('.campo, .confirma'); if (c) c.classList.toggle('erro', !ok); return ok; };
  const marcados = g => $$(`[data-grupo="${g}"] input[type="checkbox"]:checked`).map(c => c.value);

  const validar = i => {
    const et = etapas[i]; let ok = true, primeiro = null;
    const falha = el => { ok = false; primeiro = primeiro || el; };
    $$('input[required], textarea[required]', et).forEach(el => {
      if (el.type === 'radio' || el.type === 'checkbox') return;
      const v = el.value.trim(); let bom = v.length > 0;
      if (bom && el.type === 'number') bom = +v > 0 && +v <= 200;
      if (bom && el.minLength > 0) bom = v.length >= el.minLength;
      if (bom && el.id === 'insta') bom = /^@?[\w.]{2,30}$/.test(v);
      if (!marcar(el, bom)) falha(el);
    });
    const w = $('#whats', et);
    if (w && w.value.trim() && !marcar(w, w.value.replace(/\D/g, '').length >= 10)) falha(w);
    const radios = {};
    $$('input[type="radio"][required]', et).forEach(r => { radios[r.name] = r; });
    Object.values(radios).forEach(r => { if (!marcar(r, !!$(`input[name="${r.name}"]:checked`, et))) falha(r); });
    if ($('[data-grupo="local"]', et)) {
      const bom = marcados('local').length > 0 || $('#local-obs').value.trim().length > 0;
      if (!marcar($('#local-obs'), bom)) falha($('[data-grupo="local"] input'));
    }
    ['dias', 'periodo'].forEach(g => {
      const caixa = $(`[data-grupo="${g}"]`, et);
      if (caixa && !marcar(caixa.querySelector('input'), marcados(g).length > 0)) falha(caixa.querySelector('input'));
    });
    $$('.confirma input[required]', et).forEach(c => { if (!marcar(c, c.checked)) falha(c); });
    if (!ok) {
      mostrarAlerta('Faltou preencher alguns campos desta etapa.');
      const alvo = primeiro.closest('.campo, .confirma') || primeiro;
      alvo.scrollIntoView({ behavior: calmo ? 'auto' : 'smooth', block: 'center' });
      setTimeout(() => primeiro.focus({ preventScroll: true }), 350);
    } else esconderAlerta();
    return ok;
  };
  ['input', 'change'].forEach(t => form.addEventListener(t, e => { const c = e.target.closest('.erro'); if (c) c.classList.remove('erro'); }));
  const mostrarAlerta = t => { alerta.textContent = t; alerta.hidden = false; };
  const esconderAlerta = () => { alerta.hidden = true; };

  /* ---------- navegação ---------- */
  const ir = (i, foco = true) => {
    atual = Math.max(0, Math.min(etapas.length - 1, i));
    maxVisto = Math.max(maxVisto, atual);
    etapas.forEach((et, k) => { et.hidden = k !== atual; et.classList.toggle('entra', k === atual); });
    passos.forEach((p, k) => {
      if (k === atual) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current');
      p.classList.toggle('feito', k !== atual && k <= maxVisto);
    });
    bVoltar.hidden = atual === 0;
    bAvancar.hidden = atual === etapas.length - 1;
    bEnviar.hidden = atual !== etapas.length - 1;
    $('[data-progresso]').style.transform = `scaleX(${(atual + 1) / etapas.length})`;
    $('[data-etapa-n]').textContent = `Etapa ${atual + 1} de ${etapas.length} · ${nomes[atual]}`;
    if (atual === etapas.length - 1) montarRevisao();
    esconderAlerta();
    if (foco) {
      const y = form.getBoundingClientRect().top + scrollY - $('[data-topo]').offsetHeight - 16;
      if (scrollY > y) scrollTo({ top: y, behavior: 'auto' });
      const h = $('h2', etapas[atual]); h.tabIndex = -1; h.focus({ preventScroll: true });
    }
  };
  bAvancar.addEventListener('click', () => { if (validar(atual)) { salvar(); ir(atual + 1); } });
  bVoltar.addEventListener('click', () => ir(atual - 1));
  $$('[data-ir]').forEach(b => b.addEventListener('click', () => {
    const alvo = +b.dataset.ir;
    if (alvo <= atual) return ir(alvo);
    for (let k = atual; k < alvo; k++) if (!validar(k)) { ir(k); validar(k); return; }
    ir(alvo);
  }));
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !/checkbox|radio/.test(e.target.type)) {
      e.preventDefault(); if (atual < etapas.length - 1) bAvancar.click();
    }
  });

  /* ---------- composição e revisão ---------- */
  const val = s => { const el = $(s); return el ? el.value.trim() : ''; };
  const radio = n => { const r = $(`input[name="${n}"]:checked`); return r ? r.value : ''; };
  const compor = () => {
    const loc = marcados('local'), det = val('#local-obs');
    $('[data-composto="local"]').value = loc.join(', ') + (det ? (loc.length ? ' · ' : '') + det : '');
    $('[data-composto="dias"]').value = marcados('dias').join(', ');
    $('[data-composto="periodo"]').value = marcados('periodo').join(', ');
  };
  const insta = () => { const v = val('#insta').replace(/^@/, ''); return v ? '@' + v : ''; };
  const linhas = () => {
    compor();
    return [
      ['Nome', val('#nome'), 0], ['Instagram', insta(), 0], ['WhatsApp', val('#whats'), 0], ['Cidade', val('#cidade'), 0],
      ['Tattoo', radio('Primeira tattoo'), 0],
      ['Tipo', radio('Tipo'), 1], ['Cor', radio('Cor'), 1], ['Ideia', val('#ideia'), 1],
      ['Referências', [fotos.length ? `${fotos.length} imagem${fotos.length > 1 ? 's' : ''}` : '', val('#link')].filter(Boolean).join(' · '), 1],
      ['Tamanho', val('#tamanho') ? val('#tamanho') + ' cm' : '', 2], ['Local', $('[data-composto="local"]').value, 2], ['Saúde', val('#saude'), 2],
      ['Onde', radio('Onde'), 3], ['Dias', $('[data-composto="dias"]').value, 3], ['Período', $('[data-composto="periodo"]').value, 3],
      ['Prazo', radio('Prazo'), 3], ['Observações', val('#obs'), 3]
    ];
  };
  const montarRevisao = () => {
    $('[data-revisao]').innerHTML = linhas().filter(l => l[1]).map(l =>
      `<div class="rev-linha"><dt>${l[0]}</dt><dd>${esc(l[1])}</dd><button type="button" data-editar="${l[2]}">Editar</button></div>`).join('');
  };
  $('[data-revisao]').addEventListener('click', e => { const b = e.target.closest('[data-editar]'); if (b) ir(+b.dataset.editar); });

  const textoDM = () => ['Oi, Kiu! Pedido de orçamento pelo site:', '', ...linhas().filter(l => l[1]).map(l => `${l[0]}: ${l[1]}`)].join('\n');

  /* ---------- rascunho ---------- */
  const lerTudo = () => {
    const d = {};
    $$('input, textarea', form).forEach(el => {
      if (/file|hidden/.test(el.type) || el.name === '_honey') return;
      if (/checkbox|radio/.test(el.type)) d[(el.name || el.closest('[data-grupo]').dataset.grupo) + '|' + el.value] = el.checked;
      else if (el.id) d[el.id] = el.value;
    });
    return d;
  };
  const aplicar = d => {
    $$('input, textarea', form).forEach(el => {
      if (/file|hidden/.test(el.type) || el.name === '_honey') return;
      if (/checkbox|radio/.test(el.type)) { const k = (el.name || el.closest('[data-grupo]').dataset.grupo) + '|' + el.value; if (k in d) el.checked = !!d[k]; }
      else if (el.id && el.id in d) el.value = d[el.id];
    });
  };
  const salvar = () => {
    try { localStorage.setItem(CHAVE, JSON.stringify({ d: lerTudo(), e: maxVisto, t: Date.now() })); rascunho.textContent = 'Rascunho salvo neste navegador'; } catch (e) { /* sem armazenamento */ }
  };
  let tS; const salvarLogo = () => { clearTimeout(tS); tS = setTimeout(salvar, 500); };
  form.addEventListener('input', salvarLogo); form.addEventListener('change', salvarLogo);
  try {
    const r = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (r && r.d && Date.now() - r.t < 2592e6) { aplicar(r.d); maxVisto = r.e || 0; rascunho.textContent = 'Continuando de onde você parou'; }
  } catch (e) { /* ignora */ }

  /* vindo da faixa de SP (?onde=sp) */
  if (new URLSearchParams(location.search).get('onde') === 'sp') $$('input[name="Onde"]')[1].checked = true;

  const tipoSel = $('input[name="Tipo"]:checked'); if (tipoSel) ajuda.textContent = ajudas[tipoSel.value];
  contar(); regua(); ir(0, false);

  /* ---------- pronto ---------- */
  const pronto = $('[data-pronto]');
  const mostrarPronto = (enviado) => {
    form.hidden = true; $('.ag-lado').hidden = true;
    pronto.hidden = false;
    if (enviado) {
      $('[data-pronto-tit]').textContent = 'Pedido enviado';
      $('[data-pronto-txt]').textContent = 'A Kiu recebeu seu pedido e responde pela DM do Instagram. Fica de olho nas solicitações de mensagem.';
      $('[data-texto]').hidden = true; $('[data-copiar]').hidden = true;
      $('[data-abrir-dm] span').textContent = 'Falar com a Kiu na DM';
    }
    pronto.focus({ preventScroll: true });
    scrollTo({ top: 0, behavior: 'auto' });
  };
  const copiar = async t => {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0';
      document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (er) { /* */ } a.remove(); return ok;
    }
  };
  $('[data-copiar]').addEventListener('click', async e => {
    const ok = await copiar($('[data-texto]').textContent);
    e.currentTarget.querySelector('span').textContent = ok ? 'Copiado' : 'Selecione e copie';
  });
  if (new URLSearchParams(location.search).get('enviado') === '1') mostrarPronto(true);

  /* ---------- envio ---------- */
  let enviando = false;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (enviando) return;
    for (let k = 0; k < etapas.length; k++) if (!validar(k)) { ir(k); validar(k); return; }
    if (form.elements._honey.value) return;
    compor();

    if (!ENVIO.email) {
      const t = textoDM();
      $('[data-texto]').textContent = t;
      const ok = await copiar(t);
      if (!ok) $('[data-pronto-txt]').textContent = 'Agora é só mandar na DM da Kiu. Copia o texto abaixo, abre a conversa e cola.';
      $('[data-pronto-fotos]').hidden = !fotos.length;
      try { localStorage.removeItem(CHAVE); } catch (er) { /* */ }
      mostrarPronto(false);
      return;
    }

    enviando = true; bEnviar.disabled = true; bEnviar.querySelector('span').textContent = 'Enviando…';
    form.action = 'https://formsubmit.co/' + ENVIO.email;
    form.elements._subject.value = `Orçamento · ${val('#nome')} · ${radio('Onde')}`;
    form.elements._next.value = new URL('agendar.html?enviado=1', location.href).href;
    const arqs = await Promise.all(fotos.map(f => comprimir(f.file)));
    const caixa = $('[data-anexos]'); caixa.innerHTML = '';
    let semDT = false;
    arqs.forEach((a, i) => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.name = 'Referência ' + (i + 1); caixa.appendChild(inp);
      try { const dt = new DataTransfer(); dt.items.add(a); inp.files = dt.files; } catch (er) { semDT = true; inp.remove(); }
    });
    if (semDT && arqs.length) $('#obs').value += '\n\n(As imagens não anexaram por este navegador; mando na DM.)';
    /* campos auxiliares não vão no e-mail */
    $$('[data-grupo] input[type="checkbox"], #local-obs, #arquivos').forEach(el => { el.disabled = true; });
    form.elements['Instagram'].value = insta();
    try { localStorage.removeItem(CHAVE); } catch (er) { /* */ }
    HTMLFormElement.prototype.submit.call(form);
  });
})();
