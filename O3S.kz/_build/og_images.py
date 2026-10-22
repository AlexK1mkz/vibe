"""Картинки превью (Open Graph) 1200×630 JPG в img/og/. Запуск: python3 _build/og_images.py .
Цены на картинках — по CONFIG.showPrices из o3s-data.js."""
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
S=sys.argv[1]; OUTD=os.path.join(S,'img/og'); os.makedirs(OUTD,exist_ok=True)
F=os.environ.get('OG_FONTS','/home/claude/ogfonts/')  # статичные TTF Onest 800 / Inter 400-600 (из @fontsource-variable, fontTools instancer)
def font(n,sz): return ImageFont.truetype(F+n,sz)
LOGO=ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',46)
W,H=1200,630
BLUE=(5,140,197); NAVY=(23,43,58); GREY=(59,79,92); LIGHT=(223,242,249)

def wrap(d,text,f,maxw):
    words=text.split(' '); lines=[]; cur=''
    for w in words:
        t=(cur+' '+w).strip()
        if d.textlength(t,font=f)<=maxw: cur=t
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines

def make(name,title,sub,chips,photo,cut=False):
    im=Image.new('RGB',(W,H),(245,250,252))
    # vertical gradient
    g=Image.linear_gradient('L').resize((W,H))
    im=Image.composite(Image.new('RGB',(W,H),(232,246,250)),im,g)
    ov=Image.new('RGBA',(W,H),(0,0,0,0)); od=ImageDraw.Draw(ov)
    cx,cy=W+40,-60
    for r in range(60,760,48): od.ellipse([cx-r,cy-r,cx+r,cy+r],outline=(26,169,224,46),width=2)
    for r in range(40,420,42): od.ellipse([-120-r,H+140-r,-120+r,H+140+r],outline=(26,169,224,30),width=2)
    im.paste(ov,(0,0),ov)
    d=ImageDraw.Draw(im)
    X=64
    d.text((X,52),'OTRI',font=LOGO,fill=BLUE)
    # kicker pill
    kf=font('inter-600.ttf',19); k='Производство медицинского оборудования · Астана'
    kw=d.textlength(k,font=kf)
    d.rounded_rectangle([X,126,X+kw+44,166],radius=20,fill=LIGHT)
    d.ellipse([X+16,141,X+26,151],fill=BLUE)
    d.text((X+34,133),k,font=kf,fill=(5,105,154))
    # title
    maxw=560
    for sz in (56,50,46,42):
        tf=font('onest-800.ttf',sz); lines=wrap(d,title,tf,maxw)
        if len(lines)<=2 or (len(lines)<=3 and sz<=46): break
    y=196
    for ln in lines:
        d.text((X,y),ln,font=tf,fill=NAVY); y+=int(sz*1.08)
    y+=14
    sf=font('inter-400.ttf',25)
    sl=wrap(d,sub,sf,maxw)
    room=(H-128-16-y)//34
    sl=sl[:max(1,room)]
    for ln in sl:
        d.text((X,y),ln,font=sf,fill=GREY); y+=34
    # chips
    cf=font('inter-600.ttf',21); cxp=X; cyp=H-128
    for c in chips:
        w=d.textlength(c,font=cf)+36
        d.rounded_rectangle([cxp,cyp,cxp+w,cyp+46],radius=23,fill=(255,255,255),outline=(207,224,232),width=2)
        d.text((cxp+18,cyp+10),c,font=cf,fill=NAVY); cxp+=w+10
    d.text((X,H-60),'otri.kz  ·  +7 771 001 07 44',font=font('inter-500.ttf',22),fill=BLUE)
    # photo card
    cw,ch=440,500; px,py=W-cw-56,(H-ch)//2
    sh=Image.new('RGBA',(W,H),(0,0,0,0)); sd=ImageDraw.Draw(sh)
    sd.rounded_rectangle([px+10,py+28,px+cw-10,py+ch+18],radius=28,fill=(23,43,58,70))
    sh=sh.filter(ImageFilter.GaussianBlur(22)); im.paste(sh,(0,0),sh)
    card=Image.new('RGB',(cw,ch),(255,255,255))
    ph=Image.open(os.path.join(S,photo)).convert('RGBA')
    if cut:
        ph.thumbnail((cw-80,ch-60)); card.paste(ph,((cw-ph.width)//2,(ch-ph.height)//2),ph)
    else:
        r=max(cw/ph.width,ch/ph.height); ph=ph.resize((int(ph.width*r)+1,int(ph.height*r)+1),Image.LANCZOS)
        l=(ph.width-cw)//2; t=(ph.height-ch)//2; card.paste(ph.crop((l,t,l+cw,t+ch)).convert('RGB'))
    m=Image.new('L',(cw,ch),0); ImageDraw.Draw(m).rounded_rectangle([0,0,cw-1,ch-1],radius=28,fill=255)
    im.paste(card,(px,py),m)
    kz=Image.open(os.path.join(S,'img/made-in-kz.webp')).convert('RGB'); kz.thumbnail((150,94))
    bx,by=px+22,py+ch-kz.height-22
    d.rounded_rectangle([bx-10,by-10,bx+kz.width+10,by+kz.height+10],radius=16,fill=(255,255,255))
    im.paste(kz,(bx,by))
    im.save(os.path.join(OUTD,name+'.jpg'),quality=86,optimize=True,progressive=True)

P='img/otri/'
make('og-home','Озоновые стерилизаторы и УФ-рециркуляторы OTRI','Низкотемпературная стерилизация инструментов: цикл 30–70 минут при температуре до 45\u00a0°C. Поставка под ключ.',['30–70 мин','до 45\u00a0°C','РУ РК'],P+'otri-s-cube-34.webp')
make('og-catalog','Каталог оборудования OTRI','5 озоновых стерилизаторов от 16 до 250 л и 2 бактерицидных рециркулятора.',['OTRI S-16…S-250','OTRI Desktop'],P+'otri-s-long-34.webp')
make('og-dental','Озоновый стерилизатор для стоматологии','OTRI S-16 для кабинета: цикл 30\u00a0минут, до 45\u00a0°C, прозрачная камера, РУ РК.',['Астана','Алматы','под ключ'],P+'otri-s-long-cabinet.webp')
make('og-rent','Аренда озонового стерилизатора для клиники','Без покупки оборудования: гарантийный взнос, ежемесячный платёж, сервис включён.',['S-16','S-36','S-40'],P+'otri-s-long-clinic.webp')
make('og-contacts','Контакты OTRI','г. Астана, пр. Кабанбай батыра, 11, нп 43. Телефон и WhatsApp +7 771 001 07 44, info@otri.kz.',['WhatsApp','info@otri.kz'],P+'otri-ozonator-panel.webp')
import json, subprocess
tmp=os.path.join(S,'_build','_data.mjs'); open(tmp,'w',encoding='utf-8').write(open(os.path.join(S,'o3s-data.js'),encoding='utf-8').read())
d=json.loads(subprocess.check_output(['node','-e',"import(process.argv[1]).then(m=>{const o={};for(const k in m){if(typeof m[k]!=='function')o[k]=m[k]};process.stdout.write(JSON.stringify(o))})",tmp])); os.remove(tmp)
SHOW=bool(d['CONFIG'].get('showPrices'))
fmt=lambda n: f'{n:,}'.replace(',',' ')+' ₸'
for m in d['STERILIZERS']:
    make('og-'+m['id'],f"Озоновый стерилизатор {m['name']}, {m['vol']} л",f"Камера {m['chamber']} см, цикл {m['cycle']} минут, до 45\u00a0°C, 70 Вт. Поставка под ключ, гарантия от 37 месяцев.",['от '+fmt(m['price']) if SHOW else 'Цена по запросу',f"{m['cycle']} мин",'РУ РК'],m['gallery'][0])
for m in d['RECIRCULATORS']:
    make('og-'+m['id'],f"УФ-рециркулятор {m['name']}",f"Закрытый бактерицидный рециркулятор для помещений до {m['area']} м². Доставка включена, гарантия 12 месяцев.",[fmt(m['price']) if SHOW else 'Цена по запросу',f"до {m['area']} м²",f"{m['lamps']} лампы"],'img/otri/otri-desktop-recirculator.png',cut=True)
print(sorted(os.listdir(OUTD)))
