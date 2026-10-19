"""Gera og.jpg (1200x630) com Playwright/Edge. Os ícones saem de tools/favicon.py."""
import os, pathlib
from playwright.sync_api import sync_playwright
B = pathlib.Path(__file__).resolve().parent.parent
logo = (B/'assets/img/logo.svg').read_text(); kiu = (B/'assets/img/kiu.svg').read_text()
u = lambda p: (B/p).as_uri()
og = f"""<body style="margin:0;width:1200px;height:630px;background:#060606 url({u('assets/img/sigilo.webp')}) center/cover;color:#f1eeea;font-family:'JetBrains Mono',monospace;position:relative;overflow:hidden">
<img src="{u('assets/img/hero-1.webp')}" style="position:absolute;left:0;top:0;height:630px;width:285px;object-fit:cover;-webkit-mask:linear-gradient(90deg,#000 55%,transparent)">
<img src="{u('assets/img/hero-5.webp')}" style="position:absolute;right:0;top:0;height:630px;width:285px;object-fit:cover;-webkit-mask:linear-gradient(270deg,#000 55%,transparent)">
<div style="position:absolute;left:285px;top:0;width:630px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px">
<div style="width:440px;color:#f1eeea">{logo}</div>
<div style="font-size:22px;letter-spacing:.12em;text-transform:uppercase">Itapetininga · São Paulo</div>
<div style="font-size:17px;letter-spacing:.12em;text-transform:uppercase;color:#b9a6ff">Orçamento pela DM</div></div></body>"""
with sync_playwright() as p:
    br = p.chromium.launch(channel='msedge'); pg = br.new_page(viewport={'width':1200,'height':630})
    tmp = B/'tools/_og.html'; tmp.write_text(og, encoding='utf8'); pg.goto(tmp.as_uri()); pg.wait_for_timeout(800); tmp.unlink(); pg.screenshot(path=str(B/'og.jpg'), type='jpeg', quality=82)
    br.close()
print('ok', os.path.getsize(B/'og.jpg')//1024, 'KB')
