"""Gera as imagens do site a partir de _ref/ig (posts e destaques) e _ref/gerado (fundos)."""
import glob, json, os
from PIL import Image, ImageOps
R = os.path.join(os.path.dirname(__file__), '..', '..', '_ref')
A = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
os.makedirs(f'{A}/obras', exist_ok=True); os.makedirs(f'{A}/cic', exist_ok=True)

# (post, categoria, título, foto de capa, desvio vertical do recorte 0..1)
OBRAS = [
 (2,'vermelho','Olhos em sangue, autoral',1,.4),
 (37,'cyber','Cybersigil na mão',1,.5),
 (10,'geek','Hollow Knight, autoral',1,.5),
 (21,'vermelho','Hexatombe, Ordem Paranormal',1,.5),
 (5,'cyber','Ordem em mão e braço',1,.45),
 (6,'geek','Luffy, autoral',1,.4),
 (19,'vermelho','Estrela da Jojo',1,.5),
 (11,'geek','Crona, Soul Eater',3,.5),
 (39,'cyber','Cybersigil com luz vermelha',1,.5),
 (14,'geek','Espreitador, autoral',1,.5),
 (57,'vermelho','Lírio vermelho, Tokyo Ghoul',1,.4),
 (4,'fino','Sakura com sigilo',1,.5),
 (22,'cyber','Sigilo de Ordem',1,.5),
 (13,'geek','Sonic',1,.5),
 (16,'vermelho','Espada do Finn',1,.5),
 (27,'fino','Lírio-aranha na mão',1,.5),
 (44,'cyber','Tribal fechado',1,.5),
 (43,'geek','Gengar',1,.4),
 (15,'vermelho','Amigo Imaginário, Ordem',1,.4),
 (8,'fino','Morceguinhos',1,.5),
 (38,'cyber','Ornamento sob o busto',1,.5),
 (12,'geek','Gatinho de fone',1,.5),
 (59,'vermelho','Sigilo vermelho',1,.5),
 (54,'fino','Lírios',1,.5),
 (34,'geek','Fullmetal Alchemist',1,.5),
 (61,'cyber','Cybertribal',1,.5),
 (48,'vermelho','All this love',1,.5),
 (20,'geek','Dragão de D20',1,.5),
 (52,'cyber','Coração de espinhos',1,.5),
 (28,'fino','Suminagashi',1,.5),
 (62,'geek','02, Vocaloid',1,.4),
 (69,'cyber','Olho chorando',2,.5),
 (56,'vermelho','Sol de sangue',1,.5),
 (50,'fino','Coração de corrente',1,.4),
 (29,'geek','Haunter e Law',1,.5),
 (64,'cyber','Cybertribal na mão',2,.5),
 (36,'fino','Flores com luz vermelha',2,.5),
 (63,'geek','13 lentes de um final feliz',1,.5),
 (46,'cyber','Tribal na mão',3,.5),
 (26,'fino','Brilhinhos',1,.5),
 (72,'geek','Oni, a primeira cobaia',1,.5),
 (31,'geek','Gorillaz',1,.5),
 (35,'cyber','Sigilo em vermelho e preto',2,.5),
 (65,'geek','Trafalgar Law',1,.4),
 (17,'geek','Shadow morango',1,.5),
 (53,'cyber','Trash, alfinetes',1,.5),
]
HERO = [(2,2,.35),(37,1,.5),(10,1,.45),(21,1,.5),(39,3,.5)]
CIC = ['4_2','4_4','4_6','4_7','4_9','4_1']

def corta(im, ar, dy=.5):
    w, h = im.size
    if w/h > ar: nw = int(h*ar); x = (w-nw)//2; return im.crop((x,0,x+nw,h))
    nh = int(w/ar); y = int((h-nh)*dy); return im.crop((0,y,w,y+nh))
def salva(im, p, w, q=80):
    im = im.convert('RGB')
    if im.width > w: im = im.resize((w, round(im.height*w/im.width)), Image.LANCZOS)
    im.save(p, 'WEBP', quality=q, method=6)

dados = json.load(open(f'{R}/ig/dados.json', encoding='utf8'))
posts = {p['n']: p for p in dados['posts']}
arq = lambda n: sorted(glob.glob(f'{R}/ig/posts/{n:02d}_*.jpg'), key=lambda f: int(f.rsplit('_',1)[1][:-4]))
saida = []
for i,(n,cat,tit,capa,dy) in enumerate(OBRAS, 1):
    fs = arq(n); fotos = []
    for k,f in enumerate(fs, 1):
        im = ImageOps.exif_transpose(Image.open(f))
        if k == capa:
            salva(corta(im, 4/5, dy), f'{A}/obras/{i:02d}.webp', 720, 78)
        salva(im, f'{A}/obras/{i:02d}-{k}.webp', 1280, 80); fotos.append(f'{i:02d}-{k}')
    saida.append({'id': f'{i:02d}', 'cat': cat, 'titulo': tit, 'fotos': fotos, 'data': posts[n]['date'], 'ig': posts[n]['code']})
for i,(n,k,dy) in enumerate(HERO, 1):
    salva(corta(Image.open(arq(n)[k-1]), 4/5, dy), f'{A}/hero-{i}.webp', 900, 82)
for i,h in enumerate(CIC, 1):
    salva(corta(Image.open(f'{R}/ig/hl/{h}.jpg'), 4/5, .5), f'{A}/cic/{i}.webp', 600, 80)
# desenho autoral de costas do destaque wishlist, sem o texto do story
salva(Image.open(f'{R}/ig/hl/2_5.jpg').crop((0,70,640,710)), f'{A}/wish.webp', 640, 82)
salva(Image.open(f'{R}/gerado/cetim-desk.png'), f'{A}/cetim.webp', 1920, 72)
salva(Image.open(f'{R}/gerado/cetim-mob.png'), f'{A}/cetim-m.webp', 900, 72)
json.dump(saida, open(os.path.join(os.path.dirname(__file__), '..', 'assets', 'obras.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(len(saida), 'obras')
