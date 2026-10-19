# Kiu Tatu

Site da tatuadora Kiu (@kiu.tatu), em Itapetininga-SP e São Paulo-SP. É uma página estática, publicada no GitHub Pages com `noindex`.

- `index.html`, `assets/css/site.css` e `assets/js/site.js` formam o site.
- `assets/obras.json` lista o portfólio e é gerado por `tools/processar.py` a partir de `_ref/ig` (a extração do Instagram fica fora do repo).
- `assets/img/logo.svg` e `kiu.svg` foram vetorizados dos arquivos da cliente por `tools/vetorizar.py`.
- O fundo do hero é `assets/js/sigilo.js`: fumaça roxa espelhada com veios de tinta preta, num shader WebGL que roda ao vivo no desktop na resolução real da tela (até 2x, e baixa sozinho se pesar). No toque entram `assets/video/sigilo-*.mp4`, gerados pelo mesmo shader com `tools/gerar_video.py`, que também gera os pôsteres `sigilo.webp` e `sigilo-m.webp`.
- A paleta é preto, osso e ultravioleta (`--acento` #6a45f5, `--lilas` #b9a6ff), puxada do cabelo azul e violeta dela.
- `agendar.html` + `assets/js/agendar.js`: pedido de orçamento em 5 etapas (Você, A ideia, Tamanho e local, Data, Revisão), no lugar do Google Forms. O rascunho fica no navegador. Com `ENVIO.email` preenchido, envia pelo FormSubmit com até 4 imagens comprimidas; vazio (como está agora), monta o texto, copia e abre a DM da Kiu (`ig.me/m/kiu.tatu`). Depois do envio por e-mail, volta em `agendar.html?enviado=1`. A faixa de SP abre com `?onde=sp`.
- `og.jpg`, `favicon-64.png` e `apple-touch-icon.png` saem de `tools/og.py`.

## CONFIRMAR com a cliente

1. A seção "Na wishlist" (ideias que ela quer tatuar + promo de R$ 250 a R$ 300 em Itapetininga) foi retirada em 19/10. Se ela quiser de volta, o HTML está no fim deste arquivo; o CSS (`.sec-wish`, `.wish`, `.lista-brilho`, `.promo`) e a imagem `assets/img/wish.webp` continuam no projeto.
2. A agenda em São Paulo é em 19 e 20 de novembro de 2026? Qual é o bairro ou estúdio? E depois dessas datas, sai a faixa vermelha?
3. Ela cobra sinal? Qual é o valor e qual a regra de remarcação?
4. Está tudo certo em citar o @guelemk (story repostado) como depoimento?
5. O texto de "Quem tatua" (começou em out/2024 em SJC, depois Sorocaba e Itapetininga) está correto? Ela quer aparecer como "Kiu" ou quer mostrar o nome?
6. Tem WhatsApp, ou o contato continua só pela DM?
9. **Pedido de orçamento:** qual e-mail recebe os pedidos? Preencher em `assets/js/agendar.js` (`ENVIO.email`). No primeiro envio o FormSubmit manda um link de ativação para esse e-mail. **Não fazer envio de teste real** antes de combinar com ela.
10. Conferir os campos do pedido com o Google Forms que ela usa hoje: falta algum? Ela cobra sinal? (Se cobrar, explicar no aceite final.)
11. Atende só maiores de 18? O pedido exige a confirmação. Ela atende aos domingos? Hoje os dias vão de segunda a sábado.
7. Domínio próprio (ex.: kiutatu.com.br)?
8. Se a wishlist voltar: o cybersigil das costas (destaque "orgulhosa dessa q eu fiz") pode ir para o site?

## Seção wishlist (retirada)

```html
<section class="sec sec-wish" id="wishlist">
  <div class="sec-in wish">
    <figure class="wish-foto"><img src="assets/img/wish.webp" alt="Desenho autoral de cybersigil para costas, em linhas finas" loading="lazy" width="640" height="640"></figure>
    <div class="wish-txt">
      <h2>Na wishlist</h2>
      <p>Ideias que a Kiu quer muito tatuar. Se alguma combina com você, manda mensagem.</p>
      <ul class="lista-brilho">
        <li><svg><use href="#brilho"/></svg><div><strong>Coluna em cybersigil</strong>Desenho autoral descendo pelas costas, com asas de espinho.</div></li>
        <li><svg><use href="#brilho"/></svg><div><strong>Estêncil em preto e branco</strong>Personagem, gato ou cena de filme em alto contraste, estilo xerox.</div></li>
        <li><svg><use href="#brilho"/></svg><div><strong>Lettering grande no antebraço</strong>Palavra em caligrafia longa acompanhando o braço.</div></li>
      </ul>
      <p class="promo"><svg><use href="#brilho"/></svg>Pra quem é de Itapetininga: peças da wishlist de R$ 250 a R$ 300.</p>
      <a class="btn btn-acento" href="https://ig.me/m/kiu.tatu" target="_blank" rel="noopener"><svg><use href="#ig"/></svg><span>Quero uma dessas</span></a>
    </div>
  </div>
</section>
```
