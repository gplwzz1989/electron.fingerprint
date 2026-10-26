from html import escape
from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parent
SCREEN_DIR = ROOT / 'screens'
W, H = 1520, 1000
C = {
    'ink': '#18212D', 'soft': '#344252', 'muted': '#6D7988', 'quiet': '#8793A0',
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
        visible_size = round(size * 1.15, 1) if size <= 10 else size
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


NAV = [
    ('工作台', 'grid'), ('环境列表', 'browser'), ('代理资源', 'globe'),
    ('团队成员', 'users'), ('操作记录', 'clock'), ('订阅计费', 'card'), ('系统设置', 'settings'), ('AI 创作', 'sparkle'),
]


def shell(d, active='overview', title='工作台'):
    d.rect(0, 0, W, 36, '#E9EDF1')
    d.rect(12, 5, 208, 31, '#F8FAFB', '#DCE2E8', 8)
    d.rect(20, 11, 17, 17, '#2C543F', 'none', 5)
    d.text(28.5, 23, 'Q', 9, '#D9F8AA', 700, 'middle')
    d.text(45, 24, '栖界 · 工作空间', 10, '#283647', 550)
    d.text(201, 25, '×', 14, '#8190A0', 400, 'middle')
    d.text(238, 24, '+', 18, '#687687', 400, 'middle')
    d.circle(1472, 18, 5, 'none', '#98A4B0')
    d.circle(1491, 18, 5, 'none', '#98A4B0')
    d.circle(1510, 18, 5, 'none', '#98A4B0')
    d.rect(0, 36, W, 42, '#F8FAFB')
    d.line(0, 36, W, 36, '#DCE2E8')
    d.text(20, 64, '‹', 21, '#687687', 400)
    d.text(54, 64, '›', 21, '#AAB3BD', 400)
    d.text(87, 64, '↻', 17, '#687687', 500)
    d.rect(310, 43, 785, 27, '#EDF1F4', '#E1E6EB', 8)
    d.text(324, 61, '⌑', 13, '#51856C', 500)
    d.text(343, 61, '本机工作空间', 9, '#697687', 400)
    d.text(1080, 61, '本地', 8, '#587968', 600, 'end')
    d.text(1121, 62, '◈', 14, '#687687', 400)
    d.text(1153, 62, '▧', 14, '#687687', 400)
    d.rect(0, 78, 236, H - 78, C['sidebar'])
    d.rect(236, 78, W - 236, 63, C['surface'])
    d.line(236, 141, W, 141, C['line'])
    d.rect(12, 99, 35, 35, '#2C543F', 'none', 10)
    d.path('M20 109L29.5 104L39 109V120L29.5 125L20 120V109Z M20 109L29.5 114.5L39 109 M29.5 114.5V125', '#D9F8AA', 1.1)
    d.text(57, 115, '栖界', 17, '#F4F7FA', 700)
    d.text(57, 131, '独立浏览环境工作台', 8, C['sidequiet'], 400)
    d.rect(14, 150, 208, 53, C['sidebar2'], '#34404C', 9)
    d.rect(23, 160, 32, 32, '#2C543F', 'none', 8)
    d.text(39, 180, '本', 11, '#D9F8AA', 650, 'middle')
    d.text(65, 170, '本机工作空间', 9, '#EAF0F6', 600)
    d.text(65, 185, '数据保存在此设备', 8, '#9CA9B7', 400)
    d.text(211, 180, '⌄', 13, '#8895A3', 400, 'middle')
    d.text(24, 230, '核心工作', 8, '#8190A0', 650, extra='letter-spacing="1.2"')
    nav_y = [244, 284, 324, 384, 424, 464, 504, 584]
    for i, (label, name) in enumerate(NAV):
        if i == 3:
            d.text(24, 365, '协作与管理', 8, '#8190A0', 650, extra='letter-spacing="1.2"')
        if i == 7:
            d.text(24, 565, '可选工具', 8, '#8190A0', 650, extra='letter-spacing="1.2"')
        y = nav_y[i]
        is_active = (active == 'creator' and i == 7) or (active == 'create' and i == 1) or (active == 'detail' and i == 1) or (active == 'browser' and i == 1) or (active == 'error' and i == 2) or (active == name)
        if is_active:
            d.rect(10, y, 216, 35, '#263C34', '#354D43', 8)
            d.rect(10, y + 7, 2, 21, C['green'], 'none', 1)
        color = C['green'] if is_active else '#8F9EAD'
        d.icon(22, y + 9, name, color, 16)
        d.text(48, y + 22, label, 10, '#FFFFFF' if is_active else '#B1BDC9', 550 if is_active else 450)
    d.rect(14, 828, 208, 55, '#1B2B25', '#2C4137', 9)
    d.circle(27, 846, 4, '#7BD49A')
    d.text(39, 850, '本地数据模式', 9, '#DDE7E0', 600)
    d.text(39, 866, '登录数据不会自动上传', 8, '#9BB0A3', 400)
    d.text(25, 908, '?', 10, '#B9C5D0', 600)
    d.text(42, 908, '了解栖界的工作方式', 8, '#AEB9C5', 450)
    d.line(14, 927, 222, 927, '#2A3541')
    d.circle(30, 954, 14, '#CBD9E5')
    d.text(30, 957, '用', 9, '#26384B', 700, 'middle')
    d.text(53, 952, '当前用户', 9, '#EEF2F6', 550)
    d.text(53, 966, '本机使用者', 8, '#8E9BA9', 400)
    d.text(216, 956, '···', 12, '#9EABB8', 500, 'middle')
    d.text(269, 116, '栖界', 9, '#83909D', 400)
    d.text(293, 116, '/', 9, '#C0C8D0', 400)
    d.text(308, 116, title, 10, '#344252', 600)
    d.rect(1047, 93, 255, 31, '#F6F8FA', '#E5E9ED', 8)
    d.icon(1058, 101, 'search', '#7A8794', 14)
    d.text(1079, 113, '搜索环境、分组和操作', 8, '#7A8794', 400)
    d.rect(1240, 100, 42, 16, '#FFFFFF', '#E1E6EA', 4)
    d.text(1261, 111, 'Ctrl K', 7, '#7F8A96', 500, 'middle')
    d.line(1321, 99, 1321, 119, C['line'])
    d.circle(1340, 108, 3, '#7BD49A')
    d.text(1351, 111, '本机运行', 8, '#577765', 500)
    d.text(1410, 114, '♧', 13, '#667484', 400)
    d.circle(1460, 108, 13, '#CBD9E5')
    d.text(1460, 111, '用', 8, '#26384B', 700, 'middle')
    d.text(1484, 112, '⌄', 10, '#748191', 400, 'middle')
    d.rect(0, 0, W, H, 'none', 'none', 0, 0, 'pointer-events="none"')
    d.rect(1410, 978, 100, 15, '#FFFFFF', '#DFE5E9', 5, 1, 'opacity="0.9"')
    d.text(1460, 989, '界面评审稿', 7, '#6C7B89', 400, 'middle')
    d.text(269, 180, '', 9)


def title(d, eyebrow, heading, desc, right=''):
    d.text(270, 177, eyebrow, 8, '#718092', 650, extra='letter-spacing="1.1"')
    d.text(270, 208, heading, 24, '#17212C', 660)
    d.text(270, 229, desc, 9, C['muted'], 400)
    if right:
        d.button(1390 - 112, 184, 112, right, True, 34)


def make_overview(d):
    title(d, '本机工作空间', '工作台', '集中管理独立浏览环境、代理连接与会话状态。每项业务从一个清晰、可控的环境开始。', '＋ 新建环境')
    d.rect(270, 253, 1218, 259, C['dark'], '#26343E', 15)
    d.text(301, 287, '栖界 · 独立浏览环境', 8, '#A5D88D', 650, extra='letter-spacing="1.1"')
    d.text(301, 334, '让每个账号，', 26, '#F5F7F7', 700)
    d.text(301, 368, '都有自己的工作空间。', 26, '#F5F7F7', 700)
    d.text(301, 398, '为不同业务隔离登录状态和浏览数据。按需配置代理，', 9, '#B1BDC2', 400)
    d.text(301, 416, '在同一处查看环境、连接与会话状态。', 9, '#B1BDC2', 400)
    d.button(301, 442, 137, '＋ 创建浏览环境', True, 34)
    d.button(447, 442, 147, '浏览产品工作方式', False, 34)
    d.rect(929, 287, 364, 184, '#24343D', '#485963', 11, 1, 'transform="rotate(-2 1111 379)"')
    d.rect(929, 287, 364, 30, '#202F38', '#42525B', 10, 1, 'transform="rotate(-2 1111 302)"')
    for x, col in [(944, '#708080'), (957, '#617772'), (970, '#567264')]:
        d.circle(x, 302, 3.5, col)
    d.rect(930, 318, 83, 152, '#213039', 'none', 0, 0, 'transform="rotate(-2 971 394)"')
    d.rect(1026, 340, 241, 95, '#293A42', '#51636A', 7)
    d.rect(1038, 357, 38, 40, '#304A40', '#83AA82', 10)
    d.rect(1088, 356, 100, 6, '#839197', 'none', 4)
    d.rect(1088, 371, 145, 5, '#51656B', 'none', 4)
    d.rect(1088, 386, 126, 5, '#40545B', 'none', 4)
    d.rect(1226, 268, 120, 27, '#314149', '#54656B', 8)
    d.circle(1239, 281, 3.5, C['green'])
    d.text(1248, 284, '独立会话', 8, '#DCE6E3', 500)
    d.rect(900, 457, 100, 27, '#314149', '#54656B', 8)
    d.circle(913, 470, 3.5, C['green'])
    d.text(922, 473, '本地数据', 8, '#DCE6E3', 500)
    d.card(270, 532, 796, 195)
    d.text(290, 558, '从这里开始', 12, C['ink'], 650)
    d.text(290, 574, '创建并启动一个隔离的浏览环境', 8, C['muted'], 400)
    d.text(1045, 558, '环境管理  →', 8, C['primary'], 600, 'end')
    for i, (label, desc) in enumerate([
        ('建立环境', '设置业务名称、启动网址和本机数据位置。'),
        ('确认连接', '选择网络方式。代理无法连接时会阻止启动。'),
        ('开始工作', '在独立会话中访问网站，状态与其他环境隔离。'),
    ]):
        x = 291 + i * 250
        if i:
            d.line(x - 13, 597, x - 13, 700, C['line'])
        d.circle(x + 11, 604, 11, C['green'] if i == 0 else '#EDF5EF')
        d.text(x + 11, 608, str(i + 1), 8, '#243C2D' if i == 0 else '#426A56', 700, 'middle')
        d.text(x, 632, label, 10, C['ink'], 650)
        d.text(x, 653, desc[:19], 8, C['muted'], 400)
        d.text(x, 667, desc[19:], 8, C['muted'], 400)
    d.card(1082, 532, 406, 195)
    d.text(1102, 558, '默认保护', 12, C['ink'], 650)
    d.text(1466, 558, '安全边界', 8, C['muted'], 500, 'end')
    for y, label, desc, kind in [(591, '数据优先保存在本机', '登录信息和环境数据不会默认上传。', 'folder'), (635, '代理失败不自动直连', '连接异常时明确提示，保留当前配置。', 'globe'), (679, '环境之间相互隔离', '同一环境共享会话，不同环境独立。', 'lock')]:
        d.rect(1102, y - 13, 26, 26, '#EDF5EF', 'none', 8)
        d.icon(1107, y - 8, kind, '#476F59', 16)
        d.text(1138, y - 1, label, 9, '#364555', 650)
        d.text(1138, y + 14, desc, 8, C['muted'], 400)
    d.card(270, 746, 796, 195)
    d.text(290, 772, '最近使用的环境', 12, C['ink'], 650)
    d.text(290, 788, '创建后会显示在这里', 8, C['muted'], 400)
    d.empty(668, 801, '尚未创建浏览环境', '先为一项业务建立独立会话。', '新建环境')
    d.card(1082, 746, 406, 195)
    d.text(1102, 772, '需要帮助？', 12, C['ink'], 650)
    d.text(1102, 795, '快速了解产品与数据边界', 8, C['muted'], 400)
    d.icon(1102, 812, 'browser', '#476F59', 17)
    d.text(1128, 824, '环境与浏览器标签', 9, '#364555', 650)
    d.text(1128, 840, '了解环境、会话与多标签页的关系。', 8, C['muted'], 400)
    d.icon(1102, 856, 'warning', '#476F59', 17)
    d.text(1128, 868, '代理连接异常', 9, '#364555', 650)
    d.text(1128, 884, '查看检查失败后的处理方式。', 8, C['muted'], 400)
    d.button(1102, 899, 140, '打开首次使用指南', False, 28)


def make_environments(d):
    title(d, '核心工作 / 隔离会话', '环境列表', '每个环境拥有独立的浏览会话、配置快照与启动网址。', '＋ 新建环境')
    d.card(270, 253, 1218, 672)
    for i, label in enumerate(['全部环境', '正在运行', '需要处理']):
        x = 292 + i * 112
        d.text(x, 284, label, 9, '#2454C9' if i == 0 else '#778391', 650 if i == 0 else 450)
        if i == 0:
            d.rect(x, 297, 62, 2, C['primary'], 'none', 1)
    d.line(271, 298, 1487, 298)
    d.rect(287, 314, 821, 34, '#FFFFFF', C['line'], 7)
    d.icon(299, 323, 'search', '#8793A0', 15)
    d.text(321, 335, '搜索环境名称或编号', 8, '#A0AAB5', 400)
    d.rect(1118, 314, 132, 34, '#FFFFFF', C['line'], 7)
    d.text(1130, 335, '全部分组     ⌄', 8, '#5C6978', 450)
    d.rect(1260, 314, 126, 34, '#FFFFFF', C['line'], 7)
    d.text(1272, 335, '最近使用   ⌄', 8, '#5C6978', 450)
    d.button(1396, 314, 70, '管理分组', False, 34)
    d.line(271, 360, 1487, 360)
    d.empty(879, 473, '这里还没有环境', '为一项业务创建独立环境。数据和登录状态会与其他环境隔离。', '创建第一个环境')
    d.line(271, 886, 1487, 886)
    d.text(290, 907, '环境名称、代理和运行状态会在创建后显示。', 8, C['quiet'], 400)
    d.text(1468, 907, '本机数据', 8, C['quiet'], 400, 'end')


def make_create(d, step):
    title(d, '环境列表 / 新建', '新建环境', '用三步建立一个可独立管理的浏览环境。')
    labels = ['基本信息', '网络连接', '指纹配置']
    for i, label in enumerate(labels, 1):
        x = 275 + (i - 1) * 125
        active = i == step
        done = i < step
        fill = C['primary'] if active else '#E7F5EE' if done else '#EDF0F3'
        fg = '#FFFFFF' if active else '#347153' if done else '#7D8996'
        d.circle(x + 12, 270, 11, fill, C['primary'] if active else '#D7EADF' if done else '#E1E6EA')
        d.text(x + 12, 273, '✓' if done else str(i), 8, fg, 700, 'middle')
        d.text(x + 31, 273, label, 8, '#213C75' if active else '#94A0AC' if not done else '#3B7358', 650 if active else 450)
        if i < 3:
            d.line(x + 80, 270, x + 111, 270, '#DFE4E8')
    d.card(270, 297, 885, 612)
    d.text(292, 327, ['先建立业务环境', '选择网络连接方式', '确认浏览器配置'][step - 1], 13, C['ink'], 650)
    descs = [
        '为环境命名并选择本机保存方式。后续可单独修改启动网址。',
        '可以直接连接，也可以按需配置代理。连接检查会在创建前执行。',
        '选择内核默认配置或按需填写参数。可用能力以实际运行时检查结果为准。',
    ]
    d.text(292, 346, descs[step - 1], 8, C['muted'], 400)
    d.rect(1050, 313, 81, 23, '#F0F3F5', 'none', 11)
    d.text(1090, 328, f'第 {step} 步 / 共 3 步', 7, '#667484', 600, 'middle')
    if step == 1:
        d.field(292, 379, 824, '环境名称 *', '输入便于识别的名称')
        d.text(292, 443, '建议按业务用途命名，方便以后查找。', 8, C['quiet'], 400)
        d.field(292, 464, 397, '业务分组', '暂不分组')
        d.field(719, 464, 397, '启动网址', 'https://')
        d.line(292, 549, 1131, 549)
        d.text(292, 578, '数据保存方式', 9, C['soft'], 600)
        d.rect(292, 591, 402, 79, '#F5F8FF', '#8CABE A'.replace(' ', ''), 9, 1.2)
        d.circle(309, 610, 5, '#FFFFFF', C['primary'], 1.5)
        d.circle(309, 610, 2.5, C['primary'])
        d.text(324, 613, '保存在本机', 9, C['soft'], 650)
        d.text(324, 632, '登录状态和环境数据仅保存在这台设备。', 8, C['muted'], 400)
        d.rect(712, 591, 404, 79, '#FFFFFF', C['line'], 9)
        d.circle(729, 610, 5, '#FFFFFF', '#AAB4BE', 1.2)
        d.text(744, 613, '跨设备同步', 9, '#8994A0', 600)
        d.text(744, 632, '需要工作空间同步服务接入后使用。', 8, '#9AA4AE', 400)
        d.rect(712, 646, 45, 14, C['warnsoft'], 'none', 7)
        d.text(734, 656, '暂不可用', 6, C['warn'], 600, 'middle')
    elif step == 2:
        d.text(292, 380, '网络方式', 9, C['soft'], 600)
        d.rect(292, 393, 402, 78, '#F5F8FF', '#8CABE A'.replace(' ', ''), 9, 1.2)
        d.circle(309, 412, 5, '#FFFFFF', C['primary'], 1.5)
        d.circle(309, 412, 2.5, C['primary'])
        d.text(324, 415, '直接连接', 9, C['soft'], 650)
        d.text(324, 434, '使用当前设备网络。', 8, C['muted'], 400)
        d.rect(712, 393, 404, 78, '#FFFFFF', C['line'], 9)
        d.circle(729, 412, 5, '#FFFFFF', '#AAB4BE', 1.2)
        d.text(744, 415, '使用代理', 9, C['soft'], 650)
        d.text(744, 434, '连接指定代理，需先完成连接检查。', 8, C['muted'], 400)
        d.rect(292, 489, 824, 50, '#F3F7FA', '#E1E9EF', 8)
        d.icon(306, 505, 'shield', '#547189', 16)
        d.text(331, 509, '代理检查失败时会阻止启动，不会自动切换到本机网络。', 8, '#586A7C', 500)
        d.text(331, 526, '认证信息默认掩码显示，保存时只读取实际填写内容。', 8, '#6F8191', 400)
        d.field(292, 560, 397, '代理协议', '选择协议')
        d.field(719, 560, 397, '代理地址', '主机名或 IP 地址')
        d.field(292, 630, 397, '端口', '端口号')
        d.field(719, 630, 397, '用户名（可选）', '代理用户名')
        d.field(292, 700, 397, '密码（可选）', '代理密码')
        d.button(719, 721, 146, '检查代理连接', False, 32)
    else:
        d.text(292, 380, '指纹配置方式', 9, C['soft'], 600)
        d.rect(292, 393, 402, 74, '#F5F8FF', '#8CABE A'.replace(' ', ''), 9, 1.2)
        d.circle(309, 412, 5, '#FFFFFF', C['primary'], 1.5)
        d.circle(309, 412, 2.5, C['primary'])
        d.text(324, 415, '使用内核默认配置', 9, C['soft'], 650)
        d.text(324, 434, '使用当前运行时提供的默认值。', 8, C['muted'], 400)
        d.rect(712, 393, 404, 74, '#FFFFFF', C['line'], 9)
        d.circle(729, 412, 5, '#FFFFFF', '#AAB4BE', 1.2)
        d.text(744, 415, '自定义配置', 9, C['soft'], 650)
        d.text(744, 434, '按需调整语言、时区和硬件参数。', 8, C['muted'], 400)
        d.card(292, 488, 824, 171, '#FFFFFF', C['line'], 9)
        d.text(311, 514, '配置摘要', 10, C['ink'], 650)
        d.text(311, 531, '首次启动前保存为稳定快照', 8, C['muted'], 400)
        d.rect(1020, 499, 77, 21, C['primarysoft'], 'none', 10)
        d.text(1058, 513, '待运行时校验', 7, '#3158A0', 600, 'middle')
        for i, (label, value) in enumerate([('浏览器内核', '由当前运行时提供'), ('语言与时区', '使用设备默认值'), ('屏幕与图形参数', '按运行时能力检查')]):
            y = 556 + i * 29
            if i:
                d.line(311, y - 16, 1096, y - 16, '#EDF0F2')
            d.text(311, y, label, 8, C['muted'], 400)
            d.text(1095, y, value, 8, '#39495A', 550, 'end')
        d.rect(292, 675, 824, 50, '#F3F7FA', '#E1E9EF', 8)
        d.icon(306, 692, 'lock', '#547189', 16)
        d.text(331, 695, '创建后，指纹配置随环境保存。修改前需要关闭正在运行的环境。', 8, '#586A7C', 500)
        d.text(331, 712, '运行时未提供或未校验的能力不会显示为已启用。', 8, '#6F8191', 400)
    d.line(292, 853, 1131, 853)
    d.text(292, 879, '环境数据默认保存在本机。', 8, C['quiet'], 400)
    d.button(881, 865, 94, '上一步', False, 31)
    d.button(985, 865, 130, '继续   →' if step < 3 else '创建环境', True, 31)
    d.card(1173, 297, 315, 382)
    headings = ['创建前了解', '网络连接规则', '指纹配置原则']
    descriptions = [
        '环境是独立会话的边界。每个环境拥有自己的 Cookie、缓存和浏览数据。',
        '使用代理的环境在检查成功后才会启动。失败时保留配置并提示修复。',
        '模板仅提供配置起点。实际支持能力由当前运行时决定。',
    ]
    d.text(1191, 327, headings[step - 1], 10, C['ink'], 650)
    words = descriptions[step - 1]
    for i in range(0, len(words), 25):
        d.text(1191, 351 + i // 25 * 15, words[i:i + 25], 8, C['muted'], 400)
    d.line(1191, 414, 1470, 414)
    facts = [
        ['不同环境的登录状态相互隔离', '环境可以稍后编辑和分组'],
        ['代理凭据默认以掩码显示', '失败时不会自动切换为本机网络'],
        ['关闭环境后才能编辑', '未配置时保持内核原生行为'],
    ][step - 1]
    for i, fact in enumerate(facts):
        y = 443 + i * 35
        d.circle(1198, y - 3, 7, '#E9F5EE')
        d.text(1198, y, '✓', 8, '#3A795A', 650, 'middle')
        d.text(1211, y, fact, 8, '#556374', 450)
    d.line(1191, 521, 1470, 521)
    d.text(1191, 547, '设计说明', 8, '#6D7988', 600)
    d.text(1191, 566, '配置值会在真实环境中', 8, '#7D8996', 400)
    d.text(1191, 581, '读取和校验；此稿不写入', 8, '#7D8996', 400)
    d.text(1191, 596, '环境配置或启动浏览器。', 8, '#7D8996', 400)
    d.text(1191, 638, '查看连接失败示例 →', 8, C['primary'], 600)


def make_detail(d):
    title(d, '环境列表 / 环境详情', '环境详情', '环境名称、连接方式、指纹快照与使用状态集中查看。', '返回环境列表')
    sections = [
        (253, '基础信息', [('环境名称', '选择环境后显示真实名称'), ('环境编号', '由系统读取，不在评审稿中生成'), ('数据位置', '读取本机配置'), ('最近使用', '由真实运行记录提供')]),
        (452, '网络与代理', [('连接方式', '选择环境后显示真实配置'), ('代理地址', '认证信息默认掩码'), ('连接检查', '尚未执行')]),
        (617, '指纹配置快照', [('配置来源', '读取当前环境快照'), ('兼容性', '由实际运行时检查')]),
    ]
    for y, heading, rows in sections:
        h = 40 + len(rows) * 31
        d.card(270, y, 851, h)
        d.text(289, y + 25, heading, 10, C['ink'], 650)
        for i, (key, value) in enumerate(rows):
            yy = y + 47 + i * 31
            d.line(289, yy - 8, 1102, yy - 8, '#EDF0F2')
            d.text(289, yy + 6, key, 8, '#82909C', 400)
            d.text(467, yy + 6, value, 8, '#5D6A78', 500)
    d.card(1139, 253, 349, 230)
    d.rect(1158, 273, 38, 38, '#EDF5EF', 'none', 11)
    d.icon(1167, 282, 'browser', '#426D56', 20)
    d.text(1158, 337, '先选择一个环境', 11, C['ink'], 650)
    d.text(1158, 358, '环境详情只呈现已保存的真实配置。', 8, C['muted'], 400)
    d.text(1158, 374, '这里不预填演示名称、代理地址、', 8, C['muted'], 400)
    d.text(1158, 390, '运行记录或指纹值。', 8, C['muted'], 400)
    d.button(1158, 416, 130, '打开环境列表', True, 30)
    d.line(1158, 459, 1470, 459)
    d.text(1158, 479, '浏览会话', 8, C['muted'], 400)
    d.text(1469, 479, '按环境隔离', 8, C['soft'], 550, 'end')
    d.text(1158, 502, '配置修改', 8, C['muted'], 400)
    d.text(1469, 502, '运行中时锁定', 8, C['soft'], 550, 'end')


def make_browser(d):
    title(d, '环境列表 / 浏览器窗口', '环境浏览器', '在独立会话中访问网站。同一环境的网页标签共享登录状态。', '返回环境列表')
    d.card(270, 253, 1218, 644)
    d.rect(271, 254, 1216, 48, '#F8FAFB', 'none', 12)
    d.icon(291, 270, 'browser', '#596A79', 17)
    d.text(318, 282, '尚未选择环境', 9, '#596A79', 650)
    d.rect(421, 269, 76, 20, '#F0F3F5', 'none', 10)
    d.text(459, 283, '会话未启动', 7, '#667484', 600, 'middle')
    d.rect(1416, 269, 54, 20, C['primarysoft'], 'none', 10)
    d.text(1443, 283, '本机浏览器', 7, '#3158A0', 600, 'middle')
    d.line(271, 302, 1487, 302)
    for i, label in enumerate(['‹', '↻']):
        d.rect(286 + i * 34, 313, 28, 28, '#FFFFFF', C['line'], 7)
        d.text(300 + i * 34, 332, label, 14, '#6C7987', 500, 'middle')
    d.rect(358, 313, 1045, 28, '#F8FAFB', '#E5EAEE', 8)
    d.icon(369, 320, 'lock', '#8B96A2', 14)
    d.text(390, 332, '选择环境后输入网址', 8, '#8B96A2', 400)
    d.rect(1411, 313, 28, 28, '#FFFFFF', C['line'], 7)
    d.icon(1418, 320, 'download', '#6C7987', 14)
    d.rect(1446, 313, 28, 28, '#FFFFFF', C['line'], 7)
    d.icon(1453, 320, 'shield', '#6C7987', 14)
    d.line(271, 352, 1487, 352)
    d.empty(879, 479, '选择一个环境开始浏览', '每个环境拥有独立的 Cookie、缓存和网络配置。当前页面不会打开外部网站。', '前往环境列表')
    d.rect(271, 868, 1216, 28, '#F8FAFB', 'none', 0)
    d.line(271, 868, 1487, 868)
    d.text(289, 887, '不同环境使用不同会话；同一环境中的网页标签共享登录状态。', 8, '#718090', 400)


def make_proxies(d):
    title(d, '网络资源', '代理资源', '集中检查代理连接，并查看环境绑定关系。代理异常时不会静默改用本机网络。', '＋ 添加代理')
    tiles = [('代理条目', '连接后显示'), ('连接状态', '按需执行检查'), ('认证凭据', '默认掩码显示')]
    for i, (label, value) in enumerate(tiles):
        x = 270 + i * 412
        d.card(x, 253, 394, 76)
        d.text(x + 17, 280, label, 8, '#798594', 450)
        d.text(x + 17, 307, value, 10, '#344354', 650)
    d.card(270, 346, 1218, 579)
    d.rect(271, 347, 1216, 39, '#F8FAFB', 'none', 12)
    cols = [('代理名称', 289), ('类型与地址', 538), ('出口地区', 801), ('绑定环境', 1048), ('连接状态', 1295)]
    for label, x in cols:
        d.text(x, 372, label, 8, '#788593', 600)
    d.line(271, 386, 1487, 386)
    d.empty(879, 487, '尚未添加代理资源', '添加前准备好代理协议、服务器地址和端口。保存后可以执行连接检查。', '＋ 添加代理')
    d.line(271, 886, 1487, 886)
    d.text(289, 907, '代理凭据不会显示在列表中。', 8, C['quiet'], 400)
    d.text(1468, 907, '本机管理', 8, C['quiet'], 400, 'end')


def creator_base(d, active_label, title_main, subtitle):
    title(d, '内容工作流', 'AI 创作中心', '从素材到成稿与发布，在同一条清晰的工作流中完成。')
    tabs = ['视频创作', '长文排版', '图文笔记', '作品库', '发布配置']
    d.rect(270, 253, 756, 39, '#E9EDF1', '#E0E5E9', 9)
    for i, label in enumerate(tabs):
        x = 276 + i * 148
        if label == active_label:
            d.rect(x, 257, 142, 31, '#FFFFFF', 'none', 7)
        d.text(x + 71, 277, label, 8, '#1F4FBF' if label == active_label else '#667483', 650 if label == active_label else 450, 'middle')
    d.rect(1289, 258, 73, 21, '#E9F7F1', 'none', 10)
    d.text(1325, 272, '本机创作', 7, '#397258', 600, 'middle')


def make_creator(d, kind):
    specs = {
        'video': ('视频创作', '视频项目设置', '预览与分镜'),
        'article': ('长文排版', '文章设置', '文章预览'),
        'post': ('图文笔记', '图文内容', '移动端预览'),
        'assets': ('作品库', '作品资产', '本机生成内容'),
        'publish': ('发布配置', '选择发布账号', '发布内容'),
    }
    active_label, left_title, right_title = specs[kind]
    creator_base(d, active_label, left_title, '')
    if kind == 'assets':
        d.card(270, 308, 1218, 617)
        d.rect(287, 322, 750, 33, '#FFFFFF', C['line'], 7)
        d.icon(299, 331, 'search', '#8793A0', 15)
        d.text(321, 344, '搜索作品名称', 8, '#A0AAB5', 400)
        d.rect(1048, 322, 140, 33, '#FFFFFF', C['line'], 7)
        d.text(1061, 343, '全部类型       ⌄', 8, '#5C6978', 450)
        d.button(1379, 322, 91, '刷新作品库', False, 33)
        d.line(271, 367, 1487, 367)
        d.empty(879, 474, '作品库暂时为空', '本机生成或保存的作品会在这里整理。当前没有预置示例内容。', '开始创作')
        d.line(271, 886, 1487, 886)
        d.text(289, 907, '作品和素材保存在本机。', 8, C['quiet'], 400)
        d.text(1468, 907, '本地资产', 8, C['quiet'], 400, 'end')
        return
    left_w = 571 if kind != 'publish' else 594
    right_x = 857 if kind != 'publish' else 880
    right_w = 631 if kind != 'publish' else 608
    d.card(270, 308, left_w, 604)
    d.text(290, 337, left_title, 10, C['ink'], 650)
    d.rect(290, 350, 65, 20, C['primarysoft'], 'none', 10)
    d.text(322, 364, {'video': '本地渲染', 'article': '公众号排版', 'post': '多图笔记', 'publish': '环境账号'}[kind], 7, '#3158A0', 600, 'middle')
    if kind == 'video':
        d.rect(290, 382, 531, 108, '#FAFBFD', '#CBD5DE', 8, 1, 'stroke-dasharray="5 4"')
        d.icon(535, 395, 'video', '#6280A0', 19)
        d.text(555, 421, '选择本地视频素材', 9, '#657486', 600, 'middle')
        d.text(555, 439, '添加后显示真实文件名与大小，不预置演示素材。', 7, '#8A96A2', 400, 'middle')
        d.button(497, 450, 116, '浏览本机文件', False, 25)
        d.field(290, 508, 531, '创作主题', '输入视频主题或要点')
        d.field(290, 575, 255, '视频时长', '选择时长')
        d.field(566, 575, 255, '画面比例', '选择比例')
        d.field(290, 642, 531, '字幕', '按需添加字幕')
        d.text(290, 728, '渲染使用本机 FFmpeg。', 8, C['quiet'], 400)
        d.button(700, 709, 121, '生成分镜', True, 31, True)
        d.text(290, 880, '等待素材', 8, C['quiet'], 400)
    elif kind == 'article':
        d.field(290, 382, 531, '文章主题', '输入文章主题')
        d.field(290, 449, 255, '内容风格', '选择内容风格')
        d.field(566, 449, 255, '目标平台', '选择发布平台')
        d.field(290, 516, 531, '关键词（选填）', '添加有助于表达重点的关键词')
        d.rect(290, 591, 531, 48, '#F3F7FA', '#E1E9EF', 8)
        d.icon(304, 607, 'file', '#547189', 16)
        d.text(329, 611, '生成内容需要人工检查。排版预览不代表已经发布。', 7, '#586A7C', 500)
        d.text(329, 628, '支持 Markdown 编辑与排版预览。', 7, '#6F8191', 400)
        d.text(290, 880, '填写主题后开始创作。', 8, C['quiet'], 400)
        d.button(700, 709, 121, '开始撰写', True, 31, True)
    elif kind == 'post':
        d.field(290, 382, 531, '笔记标题', '输入笔记标题')
        d.text(290, 453, '正文内容', 9, C['soft'], 600)
        d.rect(290, 461, 531, 86, '#FFFFFF', C['line2'], 7)
        d.text(301, 482, '写下你的内容', 8, '#A0AAB5', 400)
        d.rect(290, 559, 531, 84, '#FAFBFD', '#CBD5DE', 8, 1, 'stroke-dasharray="5 4"')
        d.icon(535, 568, 'image', '#6280A0', 18)
        d.text(555, 594, '添加图片', 8, '#657486', 600, 'middle')
        d.text(555, 611, '从本机选择图片，支持调整顺序和封面。', 7, '#8A96A2', 400, 'middle')
        d.field(290, 653, 531, '发布平台', '选择发布平台')
        d.text(290, 880, '发布前检查图片与平台格式。', 8, C['quiet'], 400)
        d.button(700, 709, 121, '预览图文', True, 31, True)
    else:
        d.text(290, 382, '账号由环境登录状态提供', 9, C['soft'], 600)
        d.rect(290, 394, 553, 248, '#FFFFFF', 'none', 0)
        d.empty(566, 438, '没有可用的发布账号', '先在目标浏览环境中登录平台账号。', '前往环境列表')
        d.line(271, 873, 864, 873)
        d.text(290, 893, '不会从其他环境读取登录状态。', 8, C['quiet'], 400)
    d.card(right_x, 308, right_w, 604)
    d.text(right_x + 18, 337, right_title, 10, C['ink'], 650)
    d.text(right_x + right_w - 18, 337, '暂无内容', 7, C['quiet'], 450, 'end')
    if kind in ('video', 'article'):
        d.rect(right_x + 17, 354, right_w - 34, 518, '#F7F9FA', '#D6DEE5', 9, 1, 'stroke-dasharray="4 4"')
        d.circle(right_x + right_w / 2, 548, 23, '#EDF2F6')
        d.icon(right_x + right_w / 2 - 11, 537, 'video' if kind == 'video' else 'article', '#607C96', 22)
        d.text(right_x + right_w / 2, 590, '预览将在这里生成' if kind == 'video' else '文章预览区', 10, '#526273', 650, 'middle')
        d.text(right_x + right_w / 2, 612, '添加素材并填写主题后检查内容。' if kind == 'video' else '生成或编辑后检查标题、正文与排版。', 8, '#7C8997', 400, 'middle')
    elif kind == 'post':
        phone_x = right_x + right_w / 2 - 99
        d.rect(phone_x, 383, 198, 394, '#FFFFFF', '#263441', 25, 5)
        d.rect(phone_x + 65, 380, 68, 9, '#263441', 'none', 6)
        d.rect(phone_x + 11, 397, 176, 368, '#F7F8FA', 'none', 12)
        d.circle(right_x + right_w / 2, 541, 21, '#EDF2F6')
        d.icon(right_x + right_w / 2 - 10, 531, 'image', '#607C96', 20)
        d.text(right_x + right_w / 2, 584, '内容预览', 9, '#526273', 650, 'middle')
        d.text(right_x + right_w / 2, 601, '添加标题与图片后显示', 7, '#8994A0', 400, 'middle')
    else:
        d.rect(right_x + 16, 354, right_w - 32, 204, '#FFFFFF', C['line'], 9)
        d.text(right_x + 34, 383, '发布内容', 9, C['soft'], 650)
        d.field(right_x + 34, 397, right_w - 68, '发布平台', '选择账号后可用')
        d.field(right_x + 34, 466, right_w - 68, '发布时间', '选择立即发布或定时发布')
        d.rect(right_x + 16, 574, right_w - 32, 54, '#F3F7FA', '#E1E9EF', 8)
        d.icon(right_x + 29, 590, 'lock', '#547189', 16)
        d.text(right_x + 54, 594, '账号授权、内容预览和发布结果', 7, '#586A7C', 500)
        d.text(right_x + 54, 611, '会按每个目标账号分别确认。', 7, '#6F8191', 400)
        d.button(right_x + 16, 646, right_w - 32, '确认发布', True, 33, True)


def make_members(d):
    title(d, '协作与管理', '团队成员', '按成员与环境范围管理访问权限。成员变更应留下可追溯记录。', '邀请成员')
    d.card(270, 253, 1218, 672)
    for i, label in enumerate(['成员', '角色与权限', '邀请记录']):
        x = 290 + i * 116
        d.text(x, 283, label, 9, '#2454C9' if i == 0 else '#778391', 650 if i == 0 else 450)
    d.line(271, 298, 1487, 298)
    d.rect(287, 314, 800, 34, '#FFFFFF', C['line'], 7)
    d.icon(299, 323, 'search', '#8793A0', 15)
    d.text(321, 335, '搜索成员姓名或邮箱', 8, '#A0AAB5', 400)
    d.rect(1098, 314, 130, 34, '#FFFFFF', C['line'], 7)
    d.text(1110, 335, '所有角色      ⌄', 8, '#5C6978', 450)
    d.button(1238, 314, 115, '权限说明', False, 34)
    d.line(271, 360, 1487, 360)
    for x, label in [(290, '成员'), (630, '角色'), (900, '可访问环境'), (1175, '状态')]:
        d.text(x, 382, label, 8, '#788593', 600)
    d.line(271, 392, 1487, 392)
    d.empty(879, 486, '还没有邀请团队成员', '邀请成员后按角色和环境范围授予权限。敏感操作应明确授权并记录。', '邀请成员')
    d.line(271, 886, 1487, 886)
    d.text(289, 907, '成员列表只显示真实工作空间成员。', 8, C['quiet'], 400)
    d.text(1468, 907, '权限变更可审计', 8, C['quiet'], 400, 'end')


def make_audit(d):
    title(d, '协作与管理', '操作记录', '按时间、成员和结果查找关键变更。记录不包含 Cookie、代理密码或网页正文。', '导出记录')
    d.card(270, 253, 1218, 672)
    d.text(289, 280, '筛选记录', 8, '#788493', 600)
    for i, label in enumerate(['选择时间范围', '所有成员', '所有操作', '所有结果']):
        x = 356 + i * 198
        d.rect(x, 264, 184, 34, '#FFFFFF', C['line'], 7)
        d.text(x + 11, 285, label + '     ⌄', 8, '#667484', 450)
    d.button(1175, 264, 100, '清除筛选', False, 34)
    d.line(271, 310, 1487, 310)
    for x, label in [(290, '发生时间'), (511, '成员'), (704, '操作'), (1027, '目标'), (1305, '结果')]:
        d.text(x, 334, label, 8, '#788593', 600)
    d.line(271, 348, 1487, 348)
    d.empty(879, 467, '暂无操作记录', '环境、网络和权限变更会在实际操作后写入记录。当前不显示虚构的成员或事件。', '')
    d.line(271, 886, 1487, 886)
    d.text(289, 907, '敏感数据默认脱敏。', 8, C['quiet'], 400)
    d.text(1468, 907, '记录由真实操作生成', 8, C['quiet'], 400, 'end')


def make_billing(d):
    title(d, '协作与管理', '订阅计费', '查看工作空间的订阅权益和用量。仅展示服务端确认的套餐、价格与账单。')
    d.card(270, 253, 1218, 173)
    d.rect(293, 278, 48, 48, '#EDF5EF', 'none', 12)
    d.icon(305, 290, 'card', '#426D56', 24)
    d.rect(358, 272, 91, 20, C['warnsoft'], 'none', 10)
    d.text(403, 286, '服务尚未连接', 7, C['warn'], 600, 'middle')
    d.text(358, 315, '订阅与在线计费暂不可用', 12, C['ink'], 650)
    d.text(358, 341, '当前评审稿不展示套餐价格、账单金额或配额数字。', 9, C['muted'], 400)
    d.text(358, 359, '服务接入后，页面会读取真实订阅状态和用量。', 9, C['muted'], 400)
    d.card(270, 446, 594, 180)
    d.text(290, 475, '工作空间权益', 10, C['ink'], 650)
    d.text(290, 500, '由订阅服务返回可用环境数、成员席位和同步空间。', 8, C['muted'], 400)
    d.text(290, 517, '套餐详情未接入前不显示虚构权益。', 8, C['muted'], 400)
    d.button(290, 555, 100, '查看套餐', False, 30, True)
    d.card(881, 446, 607, 180)
    d.text(901, 475, '发票与付款方式', 10, C['ink'], 650)
    d.text(901, 500, '付款记录、发票信息和续费状态将在安全的计费服务', 8, C['muted'], 400)
    d.text(901, 517, '接入后显示。', 8, C['muted'], 400)
    d.button(901, 555, 138, '管理付款方式', False, 30, True)


def make_settings(d):
    title(d, '协作与管理', '系统设置', '调整本地数据保护、代理检查、更新与诊断。')
    d.card(270, 253, 857, 333)
    d.text(290, 282, '环境与数据', 11, C['ink'], 650)
    rows = [
        ('关闭环境前创建恢复点', '保留可恢复状态。磁盘空间不足时显示明确提醒。', 'on'),
        ('启动前检查代理连接', '代理无法连接时阻止启动，不切换到本机网络。', 'on'),
        ('环境数据位置', '显示由应用实际配置的本机存储路径。', '查看位置'),
    ]
    for i, (label, desc, value) in enumerate(rows):
        y = 304 + i * 83
        if i:
            d.line(289, y, 1108, y, '#EDF0F2')
        d.text(290, y + 22, label, 9, '#394858', 600)
        d.text(290, y + 40, desc[:74], 7, '#7D8996', 400)
        if value == 'on':
            d.rect(1060, y + 22, 33, 18, '#5D9874', 'none', 10)
            d.circle(1085, y + 31, 6.5, '#FFFFFF')
        else:
            d.button(1010, y + 15, 96, '查看位置', False, 28)
    d.card(270, 604, 857, 304)
    d.text(290, 633, '更新与诊断', 11, C['ink'], 650)
    for i, (label, desc, btn) in enumerate([
        ('检查更新', '检查客户端与内核版本，并保留环境数据。', '检查更新'),
        ('导出诊断信息', '导出前预览字段；不包含登录数据、代理密码或网页正文。', '预览内容'),
        ('减少界面动效', '可跟随系统偏好设置。', '跟随系统'),
    ]):
        y = 655 + i * 75
        if i:
            d.line(289, y, 1108, y, '#EDF0F2')
        d.text(290, y + 22, label, 9, '#394858', 600)
        d.text(290, y + 40, desc[:76], 7, '#7D8996', 400)
        d.button(1000, y + 14, 106, btn, False, 28)
    d.card(1145, 253, 343, 321)
    d.rect(1163, 272, 42, 42, '#EDF5EF', 'none', 11)
    d.icon(1174, 283, 'shield', '#426D56', 20)
    d.text(1163, 336, '能力以实际运行时为准', 10, C['ink'], 650)
    for i, line in enumerate(['内核版本、平台架构和指纹能力', '通过本机运行时读取。页面选项', '不代表能力已经验证。']):
        d.text(1163, 359 + 15 * i, line, 8, C['muted'], 400)
    d.line(1163, 423, 1469, 423)
    d.text(1163, 447, '运行时信息', 8, C['muted'], 400)
    d.text(1468, 447, '由客户端提供', 8, C['soft'], 550, 'end')
    d.text(1163, 472, '能力检查', 8, C['muted'], 400)
    d.text(1468, 472, '启动时读取', 8, C['soft'], 550, 'end')
    d.button(1163, 500, 157, '查看产品工作方式', False, 30)


def make_onboarding(d):
    title(d, '开始使用', '了解栖界', '先从本机工作空间开始，按需配置代理、会话和创作工具。', '创建浏览环境')
    d.rect(270, 253, 1218, 292, C['dark'], '#26343E', 15)
    d.text(300, 291, '先本地，后协作', 8, '#A5D88D', 650, extra='letter-spacing="1.1"')
    d.text(300, 338, '工作空间清晰，', 24, '#FFFFFF', 700)
    d.text(300, 370, '每个环境彼此独立。', 24, '#FFFFFF', 700)
    d.text(300, 405, '先为业务建立独立会话，再选择网络和指纹配置。', 9, '#B6C1C4', 400)
    d.text(300, 424, '代理连接、环境配置和团队权限都有清晰入口。', 9, '#B6C1C4', 400)
    d.button(300, 460, 142, '创建浏览环境', True, 33)
    d.circle(1270, 398, 67, 'none', '#65796D', 1)
    d.circle(1270, 398, 86, 'none', '#31443A', 1)
    d.circle(1270, 398, 107, 'none', '#2A3A34', 1)
    d.icon(1245, 373, 'shield', '#C8EF9C', 50)
    cards = [
        ('browser', '1. 建立浏览环境', '每个环境拥有独立的 Cookie、缓存和登录状态。'),
        ('globe', '2. 检查网络连接', '直连或指定代理由你选择；失败时提供恢复方法。'),
        ('folder', '3. 管理本机数据', '数据默认留在本机；未接入的服务明确提示。'),
    ]
    for i, (name, heading, desc) in enumerate(cards):
        x = 270 + i * 414
        d.card(x, 565, 394, 194)
        d.rect(x + 17, 582, 31, 31, '#EDF5EF', 'none', 9)
        d.icon(x + 24, 589, name, '#426D56', 17)
        d.text(x + 17, 641, heading, 10, C['ink'], 650)
        d.text(x + 17, 667, desc[:38], 8, C['muted'], 400)
        d.text(x + 17, 683, desc[38:], 8, C['muted'], 400)
        d.text(x + 17, 730, '查看工作流程  →', 8, C['primary'], 600)


def make_error(d):
    title(d, '环境列表 / 网络诊断', '代理连接诊断', '失败信息应说明问题并给出下一步，不暴露原始错误对象。', '返回新建流程')
    d.rect(330, 272, 1090, 119, '#FFF3F4', '#F2CED3', 12)
    d.circle(361, 309, 19, '#FFE2E5')
    d.icon(350, 298, 'warning', '#BD3A4C', 22)
    d.text(394, 307, '无法连接此代理', 12, '#873041', 650)
    d.text(394, 331, '请检查代理协议、服务器地址、端口和认证信息，然后重新检查。', 8, '#A35661', 450)
    d.text(394, 349, '当前配置已保留，浏览器不会自动改用本机网络。', 8, '#A35661', 450)
    d.card(330, 410, 1090, 353)
    d.text(351, 442, '你可以这样处理', 10, C['ink'], 650)
    steps = [
        '确认代理地址和端口没有输入错误。',
        '确认代理账户仍可用；认证信息默认以掩码显示。',
        '检查代理服务商是否允许当前设备连接。',
        '修复后重新执行连接检查，再启动环境。',
    ]
    for i, line in enumerate(steps):
        y = 480 + i * 38
        d.circle(362, y - 2, 9, '#F0F3F5')
        d.text(362, y + 1, str(i + 1), 7, '#6B7C8B', 600, 'middle')
        d.text(381, y + 1, line, 9, '#596777', 450)
    d.line(351, 652, 1399, 652)
    d.text(351, 677, '未发起真实网络请求。', 8, C['quiet'], 400)
    d.button(1110, 668, 130, '返回检查设置', False, 31)
    d.button(1251, 668, 148, '重新检测', True, 31)


def make_search(d):
    title(d, '快速访问', '搜索', '快速前往常用页面或开始新任务。')
    d.rect(409, 259, 720, 420, '#FFFFFF', '#D9E0E6', 13, 1, 'filter="url(#shadow)"')
    d.rect(410, 260, 718, 57, '#FFFFFF', 'none', 13)
    d.icon(429, 278, 'search', '#768494', 19)
    d.text(456, 295, '搜索环境、分组和操作', 9, '#9AA4AE', 400)
    d.line(410, 317, 1128, 317)
    d.text(429, 341, '快速前往', 7, '#87929F', 650, extra='letter-spacing="1"')
    links = [('browser', '环境列表'), ('globe', '代理资源'), ('sparkle', 'AI 创作中心'), ('settings', '系统设置')]
    for i, (name, label) in enumerate(links):
        y = 359 + i * 43
        if i == 0:
            d.rect(420, y, 698, 37, '#F3F6F8', 'none', 7)
        d.icon(434, y + 10, name, '#718399', 16)
        d.text(461, y + 24, label, 8, '#4E5D6C', 500)
        if i == 0:
            d.text(1096, y + 24, 'Enter', 7, '#8A95A1', 400, 'end')
    d.line(420, 538, 1118, 538)
    d.text(429, 559, '创建', 7, '#87929F', 650, extra='letter-spacing="1"')
    d.rect(420, 574, 698, 37, '#FFFFFF', 'none', 7)
    d.icon(434, 584, 'browser', '#718399', 16)
    d.text(461, 598, '新建浏览环境', 8, '#4E5D6C', 500)
    d.text(1096, 598, 'Ctrl N', 7, '#8A95A1', 400, 'end')
    d.text(409, 704, '搜索只匹配当前工作空间可见的真实记录。', 8, C['quiet'], 400)


def make_media_panel(d, tasks=False):
    d.rect(0, 0, 440, 520, '#FFFFFF', '#E3E8ED', 12)
    d.rect(0, 0, 440, 54, '#F8FAFB')
    d.line(0, 54, 440, 54, C['line'])
    d.circle(25, 26, 11, '#EDF3FF')
    d.icon(17, 18, 'image', C['primary'], 16)
    d.text(44, 30, '媒体提取中心', 10, C['ink'], 650)
    d.text(421, 30, '×', 14, '#788593', 400, 'middle')
    d.rect(14, 65, 412, 32, '#E9EDF1', '#E0E5E9', 8)
    d.rect(18 if not tasks else 223, 69, 202, 24, '#FFFFFF', 'none', 6)
    d.text(119, 85, '已捕获媒体', 8, C['primary'] if not tasks else '#667483', 650 if not tasks else 450, 'middle')
    d.text(321, 85, '下载队列', 8, C['primary'] if tasks else '#667483', 650 if tasks else 450, 'middle')
    if not tasks:
        d.rect(14, 107, 412, 38, '#FFFFFF')
        labels = [('全部', 28), ('视频', 88), ('音频', 145), ('图片', 202)]
        for i, (label, x) in enumerate(labels):
            active = i == 0
            d.rect(x, 115, 51, 22, '#26343F' if active else '#F1F4F6', '#26343F' if active else '#E3E8ED', 11)
            d.text(x + 25.5, 130, label, 7, '#FFFFFF' if active else '#74808D', 550, 'middle')
        d.line(0, 151, 440, 151, C['line'])
        d.circle(220, 260, 31, '#F0F4F7')
        d.icon(204, 244, 'image', '#68829C', 32)
        d.text(220, 315, '当前页面没有捕获到媒体', 10, '#445465', 650, 'middle')
        d.text(220, 337, '开始播放或刷新当前页面后，', 8, C['muted'], 400, 'middle')
        d.text(220, 353, '检测到的视频、音频和图片会显示在这里。', 8, C['muted'], 400, 'middle')
        d.button(162, 374, 116, '刷新当前页面', False, 29)
    else:
        d.line(0, 106, 440, 106, C['line'])
        d.circle(220, 253, 30, '#F0F4F7')
        d.icon(204, 237, 'download', '#68829C', 32)
        d.text(220, 309, '暂无下载任务', 10, '#445465', 650, 'middle')
        d.text(220, 331, '从已捕获媒体中选择资源后，', 8, C['muted'], 400, 'middle')
        d.text(220, 347, '下载进度与结果会显示在这里。', 8, C['muted'], 400, 'middle')
    d.rect(0, 466, 440, 54, '#F8FAFB')
    d.line(0, 466, 440, 466, C['line'])
    d.icon(15, 483, 'shield', '#698092', 15)
    d.text(38, 495, '下载遵循当前环境代理', 7, '#718090', 450)
    d.text(416, 495, '收起', 8, C['primary'], 600, 'end')


def make_x_grok_panel(d):
    d.rect(0, 0, 380, 560, '#FFFFFF', '#E3E8ED', 12)
    d.rect(0, 0, 380, 48, '#F8FAFB')
    d.line(0, 48, 380, 48, C['line'])
    d.circle(24, 24, 10, '#EDF5EF')
    d.icon(16, 16, 'sparkle', '#476F59', 16)
    d.text(43, 28, 'X 发帖控制', 10, C['ink'], 650)
    d.text(361, 28, '×', 14, '#788593', 400, 'middle')
    d.rect(12, 60, 356, 86, '#F8FAFB', C['line'], 9)
    d.rect(24, 72, 64, 18, C['warnsoft'], 'none', 9)
    d.circle(33, 81, 3, '#B87525')
    d.text(42, 84, '未连接', 7, '#94601F', 600)
    d.text(24, 108, '当前没有可用的 X 浏览环境', 9, '#344252', 650)
    d.text(24, 126, '先在目标环境中登录 X，再打开此控制面板。', 7, C['muted'], 400)
    d.rect(12, 158, 356, 76, '#FFFFFF', C['line'], 9)
    d.text(24, 180, '发帖状态', 8, C['soft'], 600)
    d.text(24, 199, '未启动 · 等待环境', 8, C['muted'], 450)
    d.text(345, 205, '--:--', 15, '#8995A2', 650, 'end', 'font-family="Consolas,monospace"')
    d.rect(12, 246, 356, 62, '#FFFFFF', C['line'], 9)
    d.text(24, 269, '发布周期', 8, C['soft'], 600)
    d.text(24, 288, '可选 5、10、15 或 30 分钟', 7, C['muted'], 400)
    d.rect(251, 258, 103, 29, '#FFFFFF', C['line2'], 6)
    d.text(263, 277, '10 分钟 / 次   ⌄', 7, '#596777', 550)
    d.button(12, 320, 216, '启动定时发帖', True, 31, True)
    d.button(238, 320, 130, '立即发帖', False, 31, True)
    d.text(12, 376, 'Grok 创作提示词', 8, C['soft'], 600)
    d.rect(12, 384, 356, 78, '#FFFFFF', C['line2'], 7)
    prompt = '请写一条关于最新科技、AI或数字化生活的精简推文（X post）。语言幽默有趣或富有洞察力，字数在120字以内。直接输出推文正文，严禁输出任何引号、前缀说明或解释。'
    for i in range(0, len(prompt), 33):
        d.text(21, 402 + (i // 33) * 13, prompt[i:i + 33], 6.5, '#596777', 400)
    d.text(354, 478, '保存提示词', 7, '#245EE8', 600, 'end')
    d.text(12, 498, '执行日志', 8, C['soft'], 600)
    d.rect(12, 507, 356, 39, '#F8FAFB', C['line'], 7)
    d.text(22, 531, '暂无发帖日志。启动后记录真实任务状态。', 7, C['muted'], 400)


SCREENS = [
    ('01', '工作台', 'overview', 'overview', make_overview),
    ('02', '环境列表', 'environments', 'environments', make_environments),
    ('03', '新建环境-基本信息', 'create-basic', 'create', lambda d: make_create(d, 1)),
    ('04', '新建环境-网络连接', 'create-network', 'create', lambda d: make_create(d, 2)),
    ('05', '新建环境-指纹配置', 'create-fingerprint', 'create', lambda d: make_create(d, 3)),
    ('06', '环境详情', 'detail', 'detail', make_detail),
    ('07', '环境浏览器', 'browser', 'browser', make_browser),
    ('08', '代理资源', 'proxies', 'proxies', make_proxies),
    ('09', 'AI创作-视频', 'creator-video', 'creator', lambda d: make_creator(d, 'video')),
    ('10', 'AI创作-长文排版', 'creator-article', 'creator', lambda d: make_creator(d, 'article')),
    ('11', 'AI创作-图文笔记', 'creator-post', 'creator', lambda d: make_creator(d, 'post')),
    ('12', 'AI创作-作品库', 'creator-assets', 'creator', lambda d: make_creator(d, 'assets')),
    ('13', 'AI创作-发布配置', 'creator-publish', 'creator', lambda d: make_creator(d, 'publish')),
    ('14', '团队成员', 'members', 'members', make_members),
    ('15', '操作记录', 'audit', 'audit', make_audit),
    ('16', '订阅计费', 'billing', 'billing', make_billing),
    ('17', '系统设置', 'settings', 'settings', make_settings),
    ('18', '首次使用引导', 'onboarding', 'overview', make_onboarding),
    ('19', '代理异常恢复', 'proxy-error', 'error', make_error),
    ('20', '全局快速搜索', 'search', 'overview', make_search),
]


def main():
    SCREEN_DIR.mkdir(parents=True, exist_ok=True)
    magick = shutil.which('magick')
    for index, label, route, active, renderer in SCREENS:
        drawing = Drawing()
        shell(drawing, active, {
            'overview': '工作台', 'environments': '环境列表', 'create-basic': '新建环境',
            'create-network': '新建环境', 'create-fingerprint': '新建环境', 'detail': '环境详情',
            'browser': '环境浏览器', 'proxies': '代理资源', 'creator-video': 'AI 创作',
            'creator-article': 'AI 创作', 'creator-post': 'AI 创作', 'creator-assets': 'AI 创作',
            'creator-publish': 'AI 创作', 'members': '团队成员', 'audit': '操作记录',
            'billing': '订阅计费', 'settings': '系统设置', 'onboarding': '首次使用',
            'proxy-error': '代理连接诊断', 'search': '搜索',
        }[route])
        renderer(drawing)
        svg_path = SCREEN_DIR / f'{index}-{label}.svg'
        png_path = SCREEN_DIR / f'{index}-{label}.png'
        drawing.finish(svg_path)
        if magick:
            subprocess.run([magick, str(svg_path), '-resize', f'{W}x{H}!', str(png_path)], check=True, capture_output=True)
    panels = [
        ('21', '媒体提取-已捕获为空', 440, 520, lambda d: make_media_panel(d, False)),
        ('22', '媒体提取-下载队列为空', 440, 520, lambda d: make_media_panel(d, True)),
        ('23', 'X-Grok发帖控制', 380, 560, make_x_grok_panel),
    ]
    for index, label, width, height, renderer in panels:
        drawing = Drawing()
        renderer(drawing)
        svg_path = SCREEN_DIR / f'{index}-{label}.svg'
        png_path = SCREEN_DIR / f'{index}-{label}.png'
        drawing.finish(svg_path, width, height)
        if magick:
            subprocess.run([magick, str(svg_path), '-resize', f'{width}x{height}!', str(png_path)], check=True, capture_output=True)
    print(f'已生成 {len(SCREENS) + len(panels)} 张页面图稿，目录：{SCREEN_DIR}')


if __name__ == '__main__':
    main()
