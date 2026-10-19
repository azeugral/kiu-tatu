"""Favicon e apple-touch-icon com fundo transparente, a partir do avatar chibi da cliente.
Só o fundo preto de fora do contorno vira transparente; o rosto fica inteiro (branco com traços pretos).
Uso: python tools/favicon.py"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
SRC = os.path.join(SITE, '..', '_ref', 'avatar-cliente.jpg')

im = Image.open(SRC).convert('L')
G = 4
big = im.resize((im.width * G, im.height * G), Image.LANCZOS)
bw = big.point(lambda v: 255 if v > 110 else 0)
# preenche a partir dos cantos o preto de fora com um valor marcador
for x, y in [(0, 0), (bw.width - 1, 0), (0, bw.height - 1), (bw.width - 1, bw.height - 1)]:
    if bw.getpixel((x, y)) == 0:
        ImageDraw.floodfill(bw, (x, y), 128)
fora = np.array(bw) == 128
alfa = Image.fromarray(np.where(fora, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(G * .6))
rgba = Image.merge('RGBA', (big, big, big, alfa))
caixa = alfa.point(lambda v: 255 if v > 8 else 0).getbbox()
x0, y0, x1, y1 = caixa
lado = max(x1 - x0, y1 - y0); pad = int(lado * .03)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
meio = lado // 2 + pad
rgba = rgba.crop((cx - meio, cy - meio, cx + meio, cy + meio))
for nome, tam in [('favicon-64.png', 64), ('apple-touch-icon.png', 180), ('favicon-32.png', 32)]:
    rgba.resize((tam, tam), Image.LANCZOS).save(os.path.join(SITE, nome), optimize=True)
print('ok', rgba.size)
