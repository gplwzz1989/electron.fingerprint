from html import escape
from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parent
SCREEN_DIR = ROOT / 'screens'
W, H = 1600, 1080
C = {
    'ink': '#18212D', 'soft': '#344252', 'muted': '#667484', 'quiet': '#8793A0',
    'line': '#E3E8ED', 'line2': '#D5DCE4', 'canvas': '#F4F6F8', 'surface': '#FFFFFF',
    'sidebar': '#151D27', 'sidebar2': '#1B2631', 'sideink': '#EBF0F5', 'sidequiet': '#96A3B1',
    'primary': '#245EE8', 'primarysoft': '#EDF3FF', 'green': '#B7EF70', 'greenink': '#355F47',
    'success': '#167859', 'successsoft': '#E9F7F1', 'warn': '#AB681D', 'warnsoft': '#FFF5E8',
    'red': '#C5394C', 'redsoft': '#FFF0F1', 'dark': '#1C2932', 'dark2': '#26343D',
}


class Drawing:
    def __init__(self):
        self.items = []

    def raw(self, value):
        self.items.append(value)

    def rect(self, x, y, w, h, fill, stroke='none', radius=0, sw=1, extra=''):
        self.raw(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>')

    def line(self, x1, y1, x2, y2, color=None, width=1, extra=''):
        self.raw(f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{color or C["line"]}" stroke-width="{width}" stroke-linecap="round" {extra}/>')

    def circle(self, x, y, r, fill='none', stroke='none', sw=1):
        self.raw(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def path(self, d, stroke=None, width=1.5, fill='none', extra=''):
        self.raw(f'<path d="{d}" fill="{fill}" stroke="{stroke or C["muted"]}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" {extra}/>')

    def text(self, x, y, value, size=11, color=None, weight=400, anchor='start', extra=''):
        visible_size = max(12, size)
        color = {'#3B5068':'#374151','#3B5069':'#374151','#42536A':'#374151','#3E5067':'#374151','#53667E':'#4B5563','#667484':'#6B7280','#697A8D':'#6B7280'}.get(color,color)
        self.raw(f'<text x="{x}" y="{y}" fill="{color or C["ink"]}" font-size="{visible_size}" font-weight="{weight}" text-anchor="{anchor}" {extra}>{escape(str(value))}</text>')

    def icon(self, x, y, name, color=None, s=16):
        color = color or C['muted']
        tx = f'translate({x} {y}) scale({s / 24:.4f})'
        self.raw(f'<g transform="{tx}" fill="none" stroke="{color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{ICON_PATHS.get(name, ICON_PATHS["file"])}</g>')

    def button(self, x, y, w, label, primary=False, h=34, disabled=False):
        bg = '#F2F4F6' if disabled else C['primary'] if primary else C['surface']
        fg = '#99A4AE' if disabled else '#FFFFFF' if primary else '#405062'
        stroke = bg if primary or disabled else C['line2']
        self.rect(x, y, w, h, bg, stroke, 7)
        self.text(x + w / 2, y + h / 2 + 4, label, 9, fg, 600, 'middle')

    def field(self, x, y, w, label, placeholder='', value='', h=56):
        self.text(x, y + 10, label, 9, C['soft'], 600)
        self.rect(x, y + 18, w, 32, '#FFFFFF', C['line2'], 6)
        self.text(x + 10, y + 38, value or placeholder, 9, C['soft'] if value else '#A0AAB5', 400)
        if h > 56:
            self.text(x, y + 62, '保存后由当前环境读取真实配置。', 8, C['quiet'], 400)

    def card(self, x, y, w, h, fill=None, stroke=None, radius=12):
        self.rect(x, y, w, h, fill or C['surface'], stroke or C['line'], radius)

    def empty(self, cx, y, title, description, button_label=None):
        self.rect(cx - 39, y, 78, 54, '#FFFFFF', '#B9C8D5', 8, 1.4)
        self.rect(cx - 38, y + 1, 76, 11, '#F6F8FA', 'none', 7)
        self.line(cx - 38, y + 12, cx + 38, y + 12, '#DCE4EA', 1)
        self.rect(cx - 14, y + 25, 28, 18, '#FFFFFF', '#B6C7D6', 1.2, 4, 'stroke-dasharray="3 3"')
        self.circle(cx + 36, y + 49, 14, '#EEF4FF', '#D9E5FF')
        self.line(cx + 36, y + 42, cx + 36, y + 56, C['primary'], 1.5)
        self.line(cx + 29, y + 49, cx + 43, y + 49, C['primary'], 1.5)
        self.text(cx, y + 83, title, 13, C['ink'], 650, 'middle')
        self.text(cx, y + 103, description, 9, C['muted'], 400, 'middle')
        if button_label:
            self.button(cx - 65, y + 119, 130, button_label, True, 32)

    def finish(self, path, width=W, height=H):
        styles = '<style>text{font-family:"Microsoft YaHei",sans-serif;dominant-baseline:auto} .thin{font-weight:400}</style>'
        doc = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">{styles}<rect width="{width}" height="{height}" fill="{C["canvas"]}"/>{"".join(self.items)}</svg>'
        path.write_text(doc, encoding='utf-8')


ICON_PATHS = {
    'grid': '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/>',
    'browser': '<rect x="2.5" y="3.5" width="19" height="14" rx="2"/><path d="M8 21h8M12 17.5V21M7 7h.01M10 7h.01M13 7h7"/>',
    'globe': '<circle cx="12" cy="12" r="9.2"/><path d="M3 12h18M12 2.8c2.2 2.5 3.3 5.6 3.3 9.2s-1.1 6.7-3.3 9.2c-2.2-2.5-3.3-5.6-3.3-9.2S9.8 5.3 12 2.8Z"/>',
    'sparkle': '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
    'users': '<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.2a4 4 0 0 1 0 7.6M22 20v-1.5a4 4 0 0 0-3-3.9"/>',
    'clock': '<circle cx="12" cy="12" r="9.2"/><path d="M12 6.5V12l3.5 2"/>',
    'card': '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 9h19M7 15h4"/>',
    'settings': '<circle cx="12" cy="12" r="3.2"/><path d="m19.2 13.3 1.3.8-1.1 2-1.5-.4a7.7 7.7 0 0 1-1.3.8l-.3 1.6H14l-.5-1.4a7.7 7.7 0 0 1-1.5 0l-.9 1.2-2-1.1.4-1.5a7.7 7.7 0 0 1-.8-1.3l-1.6-.3v-2.3l1.4-.5a7.7 7.7 0 0 1 0-1.5l-1.2-.9 1.1-2 1.5.4a7.7 7.7 0 0 1 1.3-.8l.3-1.6h2.3l.5 1.4a7.7 7.7 0 0 1 1.5 0l.9-1.2 2 1.1-.4 1.5a7.7 7.7 0 0 1 .8 1.3l1.6.3v2.3l-1.4.5a7.7 7.7 0 0 1 0 1.5Z"/>',
    'search': '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    'file': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    'lock': '<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    'shield': '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    'upload': '<path d="M12 16V4m-4 4 4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    'video': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3V9Z"/>',
    'image': '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    'article': '<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    'back': '<path d="m15 18-6-6 6-6"/>',
    'warning': '<path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3l-7.9-14.1a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
}


import json
import unicodedata
import re
import base64
import sys

ICON_PATHS.update({
 'fingerprint':'<path d="M6 19c2-3 1-7 2-10a4.3 4.3 0 0 1 8 .1c1 3 0 7-1 10M3 16c1-2 0-5 1-8a8.5 8.5 0 0 1 16 0c1 3 .5 6 0 9M11 21c2-4 1-8 1-11M8 22c2-3 2-6 2-9M17 22c1-2 2-4 2-6"/>',
 'team':ICON_PATHS['users'], 'folder':'<path d="M3 7h7l2 2h9v10H3V7Z M3 9h18"/>',
 'arrow':'<path d="M4 12h16m-6-6 6 6-6 6"/>'})

def definitions():
 s=(ROOT/'page-definitions.js').read_text(encoding='utf-8')
 data=json.loads(s.split('const definitions = ',1)[1].split('\n  root.QijieProductDesign',1)[0])
 engine=(ROOT/'fingerprint-engine.js').read_text(encoding='utf-8')
 profile=json.loads(engine.split('const DEFAULT_PROFILE = ',1)[1].split('\n  class ProfileValidationError',1)[0])
 for page in data['pages']:
  for group in page.get('groups',[]):
   for field in group['fields']:
    path=field.get('profilePath')
    if path and path!='name':
     value=profile
     for key in path.split('.'):value=value[key]
     if path=='noise.seed':value='创建草稿时生成独立种子'
     elif isinstance(value,list):value=','.join(value)
     elif isinstance(value,bool):value='开启' if value else '关闭'
     elif value is None:value=field.get('placeholder','')
     elif path=='hardware.platform':value={'Win32':'Windows','MacIntel':'macOS','Linux x86_64':'Linux'}[value]
     field['value']=str(value)
 return data
def measure(s,size):return sum((1 if unicodedata.east_asian_width(c) in 'WF' else .56)*size for c in str(s))
def wrap(s,width,size):
 result=[];line=''
 for c in str(s):
  if c=='\n' or (line and measure(line+c,size)>width):result.append(line);line='' if c=='\n' else c
  else:line+=c
 if line:result.append(line)
 return result or ['']
def para(d,x,y,s,width,size=12,color=None,lh=20):
 lines=wrap(s,width,size)
 for i,line in enumerate(lines):d.text(x,y+i*lh,line,size,color or C['muted'])
 return len(lines)*lh
def btn(d,x,y,item):
 width=max(88,measure(item['label'],12)+30);disabled=item.get('disabled');primary=item.get('primary')
 fill='#F0F3F7' if disabled else C['primary'] if primary else '#FFFFFF';fg='#929FB0' if disabled else '#FFFFFF' if primary else '#42536A'
 d.rect(x,y,width,36,fill,fill if disabled or primary else '#D6DFE9',7);d.text(x+width/2,y+23,item['label'],12,fg,600,'middle')
 return width

def shell(d,data,page,height):
 d.rect(0,0,232,height,'#151E2A');d.rect(24,24,34,34,'#253B54','#38516F',10);d.icon(29,29,'fingerprint','#D4EDFF',24);d.text(69,44,'栖界',20,'#EDF2F7',700);d.text(69,62,'环境与账号管理',12,'#92A2B4')
 d.rect(14,82,204,56,'#1D2A39','#344459',8);d.icon(26,99,'team','#8FA5BE',19);d.text(56,105,'选择团队',13,'#DCE5EF',550);d.text(56,123,'登录后加载团队',12,'#91A1B5')
 y=154 if height<=780 else 160
 for item in data['nav']:
  if item.get('group'):
   if item['id']!='overview':y+=8
   d.text(25,y,item['group'],12,'#899BB0',550);y+=15
  active=page['nav']==item['id']
  if active:d.rect(14,y,204,41,'#243E66','#31517D',8)
  d.icon(26,y+11,item['icon'],'#A5C8FF' if active else '#90A2B8',18);d.text(55,y+27,item['title'],13,'#FFFFFF' if active else '#B9C5D4',600 if active else 450);y+=36 if height<=780 else 47
  if item.get('group'):y+=2
 d.line(24,height-94,208,height-94,'#2B3A4D');d.text(24,height-67,'指纹按团队保存与授权访问',12,'#96A8BC');d.text(24,height-47,'浏览会话按环境独立隔离',12,'#96A8BC')
 d.rect(232,0,W-232,56,'#FFFFFF');d.line(232,56,W,56,C['line']);d.text(260,34,'工作空间',12,'#6B7280');d.text(322,34,'/',12,'#B2BCCA');d.text(338,34,next((v['title'] for v in data['nav'] if v['id']==page['nav']),'工作台'),13,'#374151',600)
 d.rect(W-390,11,270,33,'#F7F8FA','#E5E7EB',6);d.icon(W-379,20,'search','#9CA3AF',15);d.text(W-355,33,'搜索指纹、环境和账号',12,'#9CA3AF');d.text(W-55,33,'登录',13,C['primary'],600,'end')
 d.text(260,104,page['title'],22,C['ink'],650);para(d,260,131,page['description'],940,13)
 actions=page.get('actions',[]);xx=W-28-sum(max(88,measure(v['label'],12)+30)+9 for v in actions)
 for item in actions:xx+=btn(d,xx,83,item)+9
 y=156
 if page.get('tabs'):
  xx=260
  for label,id in page['tabs']:
   active=id==page['id'];d.text(xx,y+16,label,13,C['primary'] if active else '#6B7280',600 if active else 400);ww=measure(label,13)+8
   if active:d.rect(xx,y+28,ww,2,C['primary'],'none',1)
   xx+=ww+27
  d.line(260,y+29,W-28,y+29,C['line']);y+=48
 return y

def note(d,x,y,w,item):
 if not item:return y
 tone=item.get('tone','info');fg,bg,border=(('#B32C40','#FFF1F3','#F2CDD5') if tone=='error' else ('#98621E','#FFF7EB','#F1DFC1') if tone=='warning' else ('#49627C','#EEF4FB','#DCE7F4'))
 h=54+len(wrap(item['text'],w-66,12))*20;d.rect(x,y,w,h,bg,border,10);d.icon(x+16,y+18,'warning' if tone in ('error','warning') else 'shield',fg,18);d.text(x+46,y+28,item['title'],12,fg,650);para(d,x+46,y+51,item['text'],w-65,12,fg)
 return y+h+18

def rows(d,x,y,w,items):
 if not items:return y
 h=24+len(items)*45;d.card(x,y,w,h)
 for i,(label,value) in enumerate(items):
  yy=y+34+i*45;d.text(x+20,yy,label,12,'#667484');d.text(x+w-20,yy,value,12,'#3B5068',500,'end')
  if i<len(items)-1:d.line(x+20,yy+17,x+w-20,yy+17,'#EDF1F5')
 return y+h+17

def steps(d,x,y,w,items):
 if not items:return y
 h=63+sum(44+20*len(wrap(t,w-93,11)) for _,t in items);d.card(x,y,w,h);d.text(x+21,y+31,'处理步骤',14,C['ink'],650);yy=y+62
 for i,(title,text) in enumerate(items):
  d.circle(x+32,yy+1,11.5,'#EDF3FA');d.text(x+32,yy+5,str(i+1),11,'#5F7D9F',500,'middle');d.text(x+56,yy+4,title,12,C['soft'],600);hh=para(d,x+56,yy+25,text,w-80,11,'#667484');yy+=44+hh
 return y+h+17

def table(d,x,y,w,item,filters=None,h=535):
 d.card(x,y,w,h);yy=y
 if filters:
  searchw=min(360,max(220,w-len(filters)*125-52));d.rect(x+14,yy+14,searchw,35,'#FFFFFF',C['line'],7);d.icon(x+24,yy+24,'search','#8698AC',15);d.text(x+48,yy+37,'搜索名称或编号',11,'#667484');xx=x+14+searchw+10
  for label in filters:d.rect(xx,yy+14,116,35,'#FFFFFF',C['line'],7);d.text(xx+11,yy+37,label,11,'#697A8D');d.path(f'M{xx+98} {yy+29}l4 4 4-4','#94A2B2',1.2);xx+=125
  yy+=63;d.line(x,yy,x+w,yy,C['line'])
 d.rect(x+1,yy+1,w-2,43,'#F8FAFC');cw=(w-34)/len(item['columns'])
 for i,label in enumerate(item['columns']):d.text(x+17+i*cw,yy+28,label,11,'#667484',600)
 d.line(x,yy+44,x+w,yy+44,C['line']);cy=yy+44+(y+h-yy-44)/2-30;d.rect(x+w/2-22,cy-59,44,44,'#F5F6F8','none',10);d.icon(x+w/2-12,cy-49,'folder','#9CA3AF',24);d.text(x+w/2,cy+16,item['emptyTitle'],15,C['ink'],650,'middle')
 lines=wrap(item['emptyText'],min(650,w-80),12)
 for i,line in enumerate(lines):d.text(x+w/2,cy+43+i*20,line,12,C['muted'],400,'middle')
 if item.get('action'):
  ww=max(88,measure(item['action']['label'],12)+30);btn(d,x+w/2-ww/2,cy+62+(len(lines)-1)*20,item['action'])
 return y+h+20

def summary(d,x,y,w,item):
 if not item:return
 h=68+len(item['rows'])*42+len(wrap(item['text'],w-40,12))*20;d.line(x,y+8,x,y+h,'#E5E7EB');d.text(x+22,y+24,item['title'],14,C['ink'],650);yy=y+60
 for label,value in item['rows']:d.text(x+22,yy,label,12,'#6B7280');d.text(x+w,yy,value,12,'#374151',500,'end');d.line(x+22,yy+17,x+w,yy+17,'#EDEFF2');yy+=42
 para(d,x+22,yy+5,item['text'],w-22,12,'#6B7280')

def groups(d,x,y,w,items,display=False,scope=''):
 categorized=len(items or [])>1 and scope not in ('environment-create','proxy-create','signin','')
 if categorized:
  d.rect(x,y,w,46,'#FCFCFD');xx=x+16
  for i,group in enumerate(items):
   ww=measure(group['title'],13)+24
   if not i:d.rect(xx,y+8,ww,30,'#EDF3FF','none',5)
   d.text(xx+12,y+28,group['title'],13,C['primary'] if not i else '#6B7280',600 if not i else 400);xx+=ww+4
  y+=46;items=items[:1]
 for group in items or []:
  if group.get('collapsible') and not categorized:
   d.rect(x,y,w,88,'#FFFFFF');d.text(x+24,y+29,group['title'],14,C['ink'],650);para(d,x+24,y+54,group.get('description',''),w-165,12);d.text(x+w-24,y+29,'展开配置',12,C['primary'],500,'end');d.line(x,y+88,x+w,y+88,C['line']);y+=88;continue
  pairs=[];pair=[]
  for field in group['fields']:
   if field.get('full'):
    if pair:pairs.append(pair);pair=[]
    pairs.append([field])
   else:
    pair.append(field)
    if len(pair)==2:pairs.append(pair);pair=[]
  if pair:pairs.append(pair)
  fw=(w-66)/2
  rh=[(56 if H<=780 else 68)+max([len(wrap(v.get('help',''),w-48 if v.get('full') else fw,12))*18+8 if v.get('help') else 0 for v in pair] or [0]) for pair in pairs]
  dh=len(wrap(group.get('description',''),w-48,12))*20 if group.get('description') else 0
  h=(46 if H<=780 else 62)+dh+sum(rh);d.rect(x,y,w,h,'#FFFFFF');d.line(x,y+h,x+w,y+h,C['line']);d.text(x+24,y+29,group['title'],14,C['ink'],650);yy=y+(42 if H<=780 else 55)
  if group.get('action'):
   item=group['action'];bw=max(88,measure(item['label'],12)+30);btn(d,x+w-bw-24,y+12,item)
  if group.get('description'):para(d,x+24,yy,group['description'],w-48,12);yy+=dh+6
  for pair,hh in zip(pairs,rh):
   for i,item in enumerate(pair):
    xx=x+24+i*(fw+18);width=w-48 if item.get('full') else fw;d.text(xx,yy,item['label'],13,'#374151',600)
    if display or item['type']=='display':d.text(xx,yy+31,'—',13,'#6B7280');d.line(xx,yy+44,xx+width,yy+44,'#EDF1F5')
    else:
     d.rect(xx,yy+10,width,37,'#FFFFFF','#D8DEE6',7);value=item.get('value',(item.get('options') or [''])[0] if item['type']=='select' else item.get('placeholder',''));value=value.get('label','') if isinstance(value,dict) else value;value=str(value)
     while measure(value,13)>width-35:value=value[:-2]+'…'
     d.text(xx+10,yy+33,value,13,'#374151' if 'value' in item else '#6B7280')
     if item['type']=='select':d.path(f'M{xx+width-21} {yy+25}l4 4 4-4','#94A2B2',1.2)
    if item.get('help'):para(d,xx,yy+65,item['help'],width,12,'#6B7280',lh=18)
   yy+=hh
  y+=h
 return y

def footer(d,x,y,w,items,hint='请登录后完成保存。'):
 d.rect(x,y,w,70,'#FCFCFD');d.line(x,y,x+w,y,C['line']);d.text(x+16,y+36,hint,12,'#6B7280');xx=x+w-sum(max(88,measure(v['label'],12)+30)+8 for v in items)
 for item in items:xx+=btn(d,xx,y+17,item)+8
 return y+70

def platform_image(d,item,x,y,size):
 encoded=base64.b64encode((ROOT/item['icon']).read_bytes()).decode('ascii')
 d.raw(f'<image xmlns:xlink="http://www.w3.org/1999/xlink" x="{x}" y="{y}" width="{size}" height="{size}" xlink:href="data:image/png;base64,{encoded}"/>')

def authorization_flow(d,x,y,stage):
 for i,label in enumerate(['选择环境','平台登录','确认身份','保存授权']):
  xx=x+i*182;active=i==stage;fg=C['primary'] if active else '#6B7280'
  d.circle(xx+12,y+12,12,C['primary'] if active else '#FFFFFF',C['primary'] if active else '#E5E7EB');d.text(xx+12,y+16,str(i+1),12,'#FFFFFF' if active else fg,500,'middle');d.text(xx+33,y+17,label,13,fg,600 if active else 400)
  if i<3:d.line(xx+102,y+12,xx+165,y+12,'#E5E7EB')
 return y+48

def proxy_picker(d,p,height):
 d.rect(232,0,W-232,height,'#102034','none',0,1,'opacity=".36"')
 w,h=640,min(620,height-32);x=232+(W-232-w)/2;y=(height-h)/2
 d.rect(x,y,w,h,'#FFFFFF','#DCE4EE',14);d.text(x+24,y+37,p['title'],20,C['ink'],650);d.text(x+24,y+62,p['description'],13,'#6B7280');d.path(f'M{x+w-43} {y+26}l12 12m0-12-12 12','#718096',1.6)
 yy=groups(d,x+4,y+80,w-8,p['groups']);d.text(x+24,yy+12,'连接检测',13,C['ink'],600)
 for i,label in enumerate(['可用性：未检测','连通性：未检测','出口时区：尚未获取']):d.text(x+24+i*185,yy+40,label,12,'#6B7280')
 d.line(x,y+h-72,x+w,y+h-72,C['line']);d.text(x+24,y+h-32,p['footerHint'],12,'#6B7280');xx=x+w-24-sum(max(88,measure(v['label'],12)+30)+8 for v in p['footer'])
 for item in p['footer']:xx+=btn(d,xx,y+h-54,item)+8

def signin_picker(d,p,height):
 d.rect(232,0,W-232,height,'#102034','none',0,1,'opacity=".36"')
 w,h=440,378;x=232+(W-232-w)/2;y=(height-h)/2
 d.rect(x,y,w,h,'#FFFFFF','#DCE4EE',14);d.text(x+24,y+37,p['title'],20,C['ink'],650);para(d,x+24,y+62,p['description'],w-48,13)
 d.path(f'M{x+w-43} {y+26}l12 12m0-12-12 12','#718096',1.6)
 for i,item in enumerate(p['groups'][0]['fields']):
  yy=y+102+i*78;d.text(x+24,yy,item['label'],13,C['ink'],600);d.rect(x+24,yy+12,w-48,37,'#FFFFFF','#D8DEE6',7);d.text(x+34,yy+36,item['placeholder'],13,'#6B7280')
 d.line(x,y+h-96,x+w,y+h-96,C['line']);d.text(x+24,y+h-70,p['footerHint'],12,'#6B7280');btn(d,x+24,y+h-52,{'label':'取消'});btn(d,x+128,y+h-52,p['footer'][0])

def platform_picker(d,p,height):
 d.rect(232,0,W-232,height,'#102034','none',0,1,'opacity=".36"')
 w=560;cw,ch,gap=96,108,8;columns=max(1,(w-48+gap)//(cw+gap));rows=max(1,(len(p['platforms'])+columns-1)//columns)
 footer_y=90+rows*ch+(rows-1)*gap+24;h=footer_y+66;x=232+(W-232-w)/2;y=(height-h)/2
 d.rect(x,y,w,h,'#FFFFFF','#DCE4EE',14)
 d.text(x+24,y+37,p['title'],20,C['ink'],650)
 d.text(x+24,y+62,p['description'],12,'#667484')
 d.path(f'M{x+w-43} {y+26}l12 12m0-12-12 12','#718096',1.6)
 for i,item in enumerate(p['platforms']):
  xx=x+24+(i%columns)*(cw+gap);yy=y+90+(i//columns)*(ch+gap)
  asset=ROOT/item['icon'];encoded=base64.b64encode(asset.read_bytes()).decode('ascii')
  d.raw(f'<image xmlns:xlink="http://www.w3.org/1999/xlink" x="{xx+cw/2-16}" y="{yy+12}" width="32" height="32" xlink:href="data:image/png;base64,{encoded}"/>')
  d.text(xx+cw/2,yy+72,item['name'],13,'#354A63',600,'middle')
  if item.get('disabled'):
   d.text(xx+cw/2,yy+91,item['status'],10,'#718096',400,'middle')
 d.rect(x+1,y+footer_y,w-2,65,'#FAFBFD')
 d.line(x,y+footer_y,x+w,y+footer_y,'#E7ECF3')
 d.text(x+24,y+footer_y+39,p['footnote'],11,'#667484')
 btn(d,x+w-112,y+footer_y+16,{'label':'取消'})

def render(d,data,p,height):
 if p['id']=='signin':
  render(d,data,next(item for item in data['pages'] if item['id']=='overview'),height)
  signin_picker(d,p,height)
  return
 if p.get('presentation')=='modal' and p['id']=='proxy-create':
  render(d,data,next(item for item in data['pages'] if item['id']=='proxies'),height)
  proxy_picker(d,p,height)
  return
 if p['kind']=='platforms':
  render(d,data,next(item for item in data['pages'] if item['id']=='accounts'),height)
  platform_picker(d,p,height)
  return
 y=shell(d,data,p,height);x,w=260,W-288;kind=p['kind']
 if kind=='dashboard':
  d.rect(x,y,w,88,'#FFFFFF',C['line'],8);d.text(x+25,y+37,'从指纹资源到独立会话',18,'#203B5D',650);d.text(x+25,y+61,'指纹可复用，环境独立保存登录数据，平台账号由系统完成授权与更新。',12,'#5B708A');xx=x+w-205
  for name in ['fingerprint','browser','users']:
   d.icon(xx,y+38,name,'#587CA9',29)
   if name!='users':d.line(xx+42,y+52,xx+67,y+52,'#ACC0D8')
   xx+=80
  y+=106;tw=(w-32)/3
  for i,item in enumerate(p['tiles']):
   xx=x+i*(tw+16);d.card(xx,y,tw,136);d.rect(xx+20,y+20,35,35,'#EDF3FA','#E0E9F4',10);d.icon(xx+28,y+28,item['icon'],'#496D9B',19);d.icon(xx+tw-37,y+24,'arrow','#8CA0B9',15);d.text(xx+20,y+74,item['title'],14,C['ink'],650);para(d,xx+20,y+99,item['text'],tw-50,11,lh=19)
  y+=167;d.text(x,y,'最近使用的环境',14,C['ink'],650);d.text(x+w,y,'全部环境 →',11,C['primary'],500,'end');table(d,x,y+18,w,p['table'],h=330)
 elif kind in ('list','plans'):
  y=note(d,x,y,w,p.get('notice'))
  table(d,x,y,w,p['table'],p.get('filters'),h=min(610,height-y-70))
 elif kind in ('form','details','settings','authorize','signin'):
  if 'authorizationStage' in p:y=authorization_flow(d,x,y,p['authorizationStage'])
  mw=w-305 if p.get('summary') else min(w,920);summary_item=p.get('summary');form_groups=p.get('groups')
  if p['id']=='environment-create':
   form_groups=json.loads(json.dumps(form_groups));form_groups[2]['fields']=form_groups[2]['fields'][:1]
   summary_item=json.loads(json.dumps(summary_item));summary_item['rows'][-1]=['时区一致性','等待指纹信息']
  summary(d,x+mw+20,y,285,summary_item);y=note(d,x,y,mw,p.get('notice'))
  if p.get('notice'):y-=18
  y=rows(d,x,y,mw,p.get('rows'))
  if p.get('rows'):y-=17
  y=groups(d,x,y,mw,form_groups,kind=='details',p['id'])
  if p.get('inlineActions'):
   xx=x
   for item in p['inlineActions']:xx+=btn(d,xx,y,item)+10
   y+=55
  y=steps(d,x,y,mw,p.get('steps'))
  if p['id'] in ('fingerprint-create','fingerprint-protection'):
   d.rect(x,y,mw,38,'#F8FCFA');d.text(x+16,y+24,'配置组合检查通过；启动时仍需核验设备与内核兼容性。',12,'#167859');y+=38
  if p.get('footer'):footer(d,x,y,mw,p['footer'],p.get('footerHint',''))
 elif kind=='state':
  w=min(w,1020);y=note(d,x,y,w,p.get('notice'));y=rows(d,x,y,w,p.get('rows'));y=steps(d,x,y,w,p.get('steps'))
  if p.get('acknowledge'):d.rect(x,y+3,14,14,'#FFFFFF','#B9C6D7',3);d.text(x+24,y+15,p['acknowledge'],12,'#76602F')
 elif kind=='permissions':
  y=note(d,x,y,w,p.get('notice'));d.card(x,y,w,51+len(p['permissionRows'])*61);cw=w/len(p['permissionColumns']);d.rect(x+1,y+1,w-2,46,'#F8FAFC')
  for i,label in enumerate(p['permissionColumns']):d.text(x+19+i*cw,y+30,label,12,'#667484',600)
  for ri,row in enumerate(p['permissionRows']):
   yy=y+47+ri*61;d.line(x,yy,x+w,yy,C['line'])
   for i,label in enumerate(row):d.text(x+19+i*cw,yy+36,label,12,'#53667E' if not i else '#657C96',500 if not i else 400)
 elif kind=='billing':
  y=note(d,x,y,w,p.get('notice'));cw=(w-26)/3
  for i,(label,value) in enumerate(p['rows']):
   xx=x+(i%3)*(cw+13);yy=y+(i//3)*96;d.card(xx,yy,cw,83);d.text(xx+17,yy+27,label,11,'#667484');d.text(xx+17,yy+58,value,19,'#415A77',600)
  y+=215;d.text(x,y,'订阅订单',14,C['ink'],650);table(d,x,y+18,w,p['table'],h=335)
 elif kind=='payment':
  mw=w-305;summary(d,x+mw+20,y,285,p.get('summary'));d.card(x,y,mw,660);d.text(x+22,y+33,'确认订单',14,C['ink'],650);yy=y+55
  for label,value in p['rows']:d.text(x+22,yy+17,label,12,'#667484');d.text(x+mw-22,yy+17,value,12,'#3B5068',500,'end');d.line(x+22,yy+31,x+mw-22,yy+31,'#EDF1F5');yy+=46
  d.text(x+22,yy+26,'选择付款方式',14,C['ink'],650);yy+=45;pw=(mw-58)/2
  for i,label in enumerate(p['methods']):
   xx=x+22+i*(pw+14);d.rect(xx,yy,pw,55,'#FFFFFF','#DCE4EF',9);d.circle(xx+19,yy+27,6,'#FFFFFF','#A6B5C7',1.2);d.icon(xx+38,yy+18,'card','#46617E',18);d.text(xx+67,yy+33,label,12,'#46617E',600)
  yy+=75;d.rect(x+22,yy,mw-44,209,'#F8FAFC','#D9E3EE',10,1,'stroke-dasharray="5 5"');d.icon(x+mw/2-17,yy+44,'card','#93A7BC',34);d.text(x+mw/2,yy+108,'选择套餐后生成支付码',13,'#6A7F96',600,'middle');d.text(x+mw/2,yy+137,'订单与支付码生成后，使用对应应用扫码付款。',11,'#667484',400,'middle');footer(d,x+22,y+572,mw-44,p['footer'],p.get('footerHint',''))

def gallery(data,files):
 p=ROOT/'设计画册.html';html=p.read_text(encoding='utf-8');head=html.split('<body>',1)[0]
 head=re.sub(r'<title>.*?</title>','<title>栖界 · 产品界面方案</title>',head).replace('aspect-ratio:1.52;object-fit:cover;','height:auto;')
 entries=''.join('<article class="screen"><a href="screens/'+png+'"><img src="screens/'+png+'" alt="'+escape(page['title'])+'界面设计"></a><div class="caption"><strong>'+escape(page['title'])+'</strong><a href="index.html#'+page['id']+'">查看交互 →</a></div></article>' for page,png in files)
 content='<body><main><header><div><p class="eyebrow">栖界 · 产品界面 · 2026.10.28</p><h1>指纹可复用，环境独立，账号统一授权。</h1><p>工作台与七个业务模块，覆盖创建、授权、权限与付款的关键页面和失败恢复。</p></div><div class="actions"><a class="button" href="产品重构提案.md">产品定义与交互规范</a><a class="button primary" href="index.html">打开交互稿</a></div></header><div class="note">本轮为产品定义与界面方案，不代表云端授权或支付已经实现。页面采用正常业务空状态；不预置用户、团队、账号、代理结果、套餐价格、配额、付款订单或二维码。指纹初值复用现有系统默认配置，不是已入库的指纹记录。条件性状态页单独供交互评审。</div><section class="grid">'+entries+'</section><footer>平台目录由系统管理；指纹、环境、代理与账号各自独立。微信支付和支付宝须完成真实商户配置、订单核验及权益更新后开放。</footer></main></body></html>'
 p.write_text(head+content,encoding='utf-8',newline='\n')
def main():
 data=definitions();SCREEN_DIR.mkdir(parents=True,exist_ok=True);magick=shutil.which('magick');files=[]
 if not magick:raise RuntimeError('未找到图片导出工具。')
 selected=set(sys.argv[1:])
 unknown=selected-{page['id'] for page in data['pages']}
 if unknown:raise ValueError('未找到指定页面。')
 exported=0
 for i,page in enumerate(data['pages'],1):
  name=f'{i:02d}-{page["id"]}';svg=SCREEN_DIR/(name+'.svg');png=SCREEN_DIR/(name+'.png')
  if not selected or page['id'] in selected:
   height=page.get('height',H);d=Drawing();render(d,data,page,height);d.finish(svg,W,height);subprocess.run([magick,str(svg),'-resize',f'{W}x{height}!',str(png)],check=True,capture_output=True);exported+=1
  files.append((page,png.name))
 gallery(data,files);print(f'exported {exported} pages')
if __name__=='__main__':main()
