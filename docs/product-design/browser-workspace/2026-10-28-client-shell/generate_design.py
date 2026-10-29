from pathlib import Path
from html import escape
import importlib.util
import shutil
import subprocess
import re

ROOT = Path(__file__).resolve().parent
BASE = ROOT.parent / '2026-10-25' / 'generate_screens.py'
spec = importlib.util.spec_from_file_location('existing_design', BASE)
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
D = base.Drawing
base.C.update(primary='#315BEA', canvas='#F5F7FB', sidebar='#18212F', line='#E4E9F0')
base.ICON_PATHS.update({
    'home': '<path d="m3 10 9-7 9 7v11H3V10Z M9 21v-7h6v7"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'close': '<path d="m6 6 12 12M18 6 6 18"/>',
    'refresh': '<path d="M20 9a8 8 0 1 0 0 6M20 3v6h-6"/>',
    'chevron': '<path d="m8 10 4 4 4-4"/>',
    'lock': '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    'minimize': '<path d="M5 12h14"/>',
    'maximize': '<rect x="5" y="5" width="14" height="14"/>',
    'menu': '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    'download': '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    'cube': '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z M3 7l9 5 9-5M12 12v10M7.5 4.5l9 5v5"/>',
    'shield': '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z M8.5 12l2.5 2.5 4.5-5"/>',
})

W, H = 1440, 900
INK, MUTED, QUIET = '#162336', '#69788C', '#9AA5B5'
BLUE, LINE = '#315BEA', '#E4E9F0'


def text(d, x, y, value, size=13, color=INK, weight=400, anchor='start'):
    d.text(x, y, value, size, color, weight, anchor)


def button(d, x, y, width, label, primary=False, icon=None, height=38):
    d.rect(x, y, width, height, BLUE if primary else '#FFFFFF', BLUE if primary else '#DDE4ED', 7)
    if icon:
        d.icon(x + 15, y + (height - 18) / 2, icon, '#FFFFFF' if primary else MUTED, 18)
        text(d, x + width / 2 + 10, y + height / 2 + 5, label, 13, '#FFFFFF' if primary else INK, 500, 'middle')
    else:
        text(d, x + width / 2, y + height / 2 + 5, label, 13, '#FFFFFF' if primary else INK, 500, 'middle')


def hotspot(d, x, y, width, height, action, label):
    d.raw(f'<rect x="{x}" y="{y}" width="{width}" height="{height}" fill="#FFFFFF" fill-opacity="0" pointer-events="all" role="button" tabindex="0" aria-label="{escape(label)}" data-action="{action}" class="hotspot"/>')


def chrome(d, browsing=False, managed=False):
    d.rect(0, 0, W, H, '#FFFFFF')
    d.rect(0, 0, W, 44, '#EEF1F6')
    d.rect(8, 5, 230, 39, '#E4E9F0' if browsing else '#FFFFFF', '#DCE3ED' if not browsing else 'none', 9)
    if not browsing:
        d.rect(9, 34, 228, 11, '#FFFFFF')
    d.icon(23, 16, 'home', BLUE if not browsing else MUTED, 17)
    text(d, 50, 30, '首页 · 栖界', 13, INK if not browsing else MUTED, 500)
    if browsing:
        d.rect(244, 5, 232, 39, '#FFFFFF', '#DCE3ED', 9)
        d.rect(245, 34, 230, 11, '#FFFFFF')
        d.icon(260, 16, 'fingerprint' if managed else 'browser', BLUE, 17)
        text(d, 287, 30, '环境标签' if managed else '新标签页', 13, INK, 500)
        d.icon(448, 16, 'close', MUTED, 15)
        hotspot(d, 441, 8, 30, 32, 'home', '关闭当前标签')
    d.icon(491 if browsing else 259, 15, 'plus', '#59677C', 19)
    for name, x in [('minimize', 1304), ('maximize', 1350), ('close', 1396)]:
        d.icon(x, 15, name, '#46546A', 17)
    d.rect(0, 44, W, 50, '#FFFFFF')
    d.line(0, 94, W, 94, LINE)
    for name, x, color in [('back', 21, '#9AA5B5'), ('back', 57, '#B0B8C6'), ('refresh', 94, '#7D899C')]:
        if x == 57:
            d.raw(f'<g transform="translate(132 0) scale(-1 1)">')
            d.icon(57, 60, name, color, 18)
            d.raw('</g>')
        else:
            d.icon(x, 60, name, color, 18)
    d.rect(131, 52, 1118, 34, '#F1F4F8', 'none', 18)
    d.icon(145, 61, 'globe' if browsing else 'lock', '#8B97A8', 16)
    text(d, 180 if browsing else 690, 75, 'about:blank' if managed else '输入网址' if browsing else 'http://127.0.0.1:8088/#overview', 13, '#8A96A8' if browsing else '#536278', 400, 'start' if browsing else 'middle')
    if not browsing:
        d.rect(1187, 59, 43, 20, '#E8EDF5', 'none', 5)
        text(d, 1208, 73, '只读', 12, '#7A879A', 400, 'middle')
    for name, x in [('download', 1274), ('menu', 1385)]:
        d.icon(x, 59, name, '#8592A7', 19)
    if managed:
        d.icon(1321, 59, 'fingerprint', BLUE, 19)
    hotspot(d, 8, 5, 230, 39, 'home', '切换首页')
    if browsing:
        hotspot(d, 244, 5, 195, 39, 'managed' if managed else 'newtab', '切换当前标签')
    hotspot(d, 481 if browsing else 249, 5, 41, 39, 'newtab', '打开新标签页')


def sidebar(d):
    d.rect(0, 94, 236, 806, '#18212F')
    d.rect(25, 126, 44, 44, BLUE, 'none', 13)
    d.icon(34, 135, 'cube', '#FFFFFF', 26)
    text(d, 83, 151, '栖界', 27, '#F6F8FC', 700)
    text(d, 83, 173, '指纹浏览器 · 团队工作空间', 12, '#A4B1C5')
    d.rect(18, 207, 200, 68, '#222E40', '#354156', 9)
    d.rect(31, 224, 34, 34, '#344155', 'none', 8)
    d.icon(39, 232, 'users', '#CCD6E6', 18)
    text(d, 77, 234, '选择团队', 14, '#F1F5FA', 600)
    text(d, 77, 255, '登录后查看团队', 12, '#A2B0C5')
    d.icon(192, 232, 'chevron', '#A4B1C5', 14)
    groups = [
        ('工作空间', 309, [('工作台', 'grid', 324)]),
        ('核心资源', 395, [('指纹管理', 'fingerprint', 410), ('浏览器环境', 'browser', 460), ('代理管理', 'globe', 510), ('账号管理', 'users', 560)]),
        ('团队与服务', 642, [('团队成员', 'team', 655), ('订阅与用量', 'card', 705), ('设置', 'settings', 755)]),
    ]
    for label, label_y, rows in groups:
        text(d, 31, label_y, label, 12, '#8090A8')
        for title, icon, y in rows:
            active = title == '工作台'
            if active:
                d.rect(18, y, 200, 44, BLUE, 'none', 8)
            d.icon(33, y + 13, icon, '#FFFFFF' if active else '#95A6BE', 19)
            text(d, 66, y + 28, title, 14, '#FFFFFF' if active else '#C2CDDE', 500 if active else 400)
    d.line(27, 843, 209, 843, '#303C4F')
    d.icon(31, 862, 'shield', '#8F9FB6', 15)
    text(d, 55, 875, '会话按环境独立保存', 12, '#8F9FB6')
    hotspot(d, 18, 207, 200, 68, 'login', '登录后选择团队')


def home():
    d = D()
    chrome(d)
    sidebar(d)
    d.rect(236, 94, 1204, 64, '#FFFFFF')
    d.line(236, 158, 1440, 158, LINE)
    text(d, 268, 132, '工作空间', 13, '#8090A6')
    text(d, 343, 132, '/', 13, '#BBC5D3')
    text(d, 367, 132, '工作台', 14, INK, 600)
    text(d, 1244, 132, '注册', 13, MUTED)
    button(d, 1294, 110, 114, '登录工作空间', height=32)
    d.rect(236, 159, 1204, 741, '#F5F7FB')
    text(d, 268, 201, '团队工作空间', 12, BLUE, 600)
    text(d, 268, 243, '欢迎使用栖界', 32, INK, 700)
    text(d, 268, 270, '从可复用指纹开始，管理独立环境与平台账号。', 14, MUTED)
    button(d, 1254, 218, 154, '新建环境', True, 'plus', 40)
    quick = [('指纹管理', '保存参数，在多个环境中复用', 'fingerprint'), ('浏览器环境', '选择指纹，配置启动网址与代理', 'browser'), ('账号管理', '选择平台，连接你的社媒账号', 'users')]
    for i, (title, subtitle, icon) in enumerate(quick):
        x = 268 + i * 386
        d.rect(x, 308, 368, 96, '#FFFFFF', LINE, 9)
        d.rect(x + 18, 328, 38, 38, '#EEF3FF', 'none', 10)
        d.icon(x + 27, 337, icon, BLUE, 20)
        text(d, x + 72, 343, title, 15, INK, 600)
        text(d, x + 72, 369, subtitle, 12, MUTED)
        d.icon(x + 332, 344, 'arrow', '#9DAAC0', 17)
        hotspot(d, x, 308, 368, 96, 'login', title)
    text(d, 268, 452, '最近使用的环境', 17, INK, 600)
    text(d, 1408, 452, '全部环境 →', 13, BLUE, 400, 'end')
    d.rect(268, 476, 1140, 354, '#FFFFFF', LINE, 9)
    d.rect(269, 477, 1138, 44, '#FAFBFD', 'none', 8)
    d.rect(269, 509, 1138, 12, '#FAFBFD')
    for title, x in [('环境名称', 290), ('指纹 / 版本', 563), ('代理连接', 793), ('运行状态', 1043), ('操作', 1328)]:
        text(d, x, 504, title, 12, '#77859B', 500)
    d.line(269, 521, 1407, 521, LINE)
    d.rect(810, 575, 56, 56, '#F2F5F9', 'none', 16)
    d.icon(825, 590, 'browser', '#96A6BC', 26)
    text(d, 838, 669, '登录后查看团队环境', 17, '#34445B', 600, 'middle')
    text(d, 838, 698, '你的指纹、环境和账号会在登录后显示于此。', 13, '#8793A6', 400, 'middle')
    button(d, 774, 723, 128, '登录', True, height=36)
    text(d, 268, 871, '指纹可跨设备复用，环境会话独立保存。', 12, '#8A97A9')
    for x, y, w, h in [(1294, 110, 114, 32), (1254, 218, 154, 40), (774, 723, 128, 36), (1224, 114, 48, 30)]:
        hotspot(d, x, y, w, h, 'login', '打开登录预览')
    return d


def newtab():
    d = D()
    chrome(d, True)
    d.rect(0, 95, W, 805, '#FFFFFF')
    d.rect(658, 278, 56, 56, BLUE, 'none', 16)
    d.icon(670, 290, 'cube', '#FFFFFF', 32)
    text(d, 734, 319, '栖界', 33, INK, 650)
    d.rect(428, 391, 584, 52, '#F3F5F9', '#E8ECF2', 26)
    d.icon(448, 407, 'globe', '#8A99AD', 20)
    text(d, 486, 423, '输入网址，开始浏览', 15, '#8D99AB')
    text(d, 720, 850, 'Ctrl + L 输入网址    ·    Ctrl + T 新建标签页', 12, '#A0ABBB', 400, 'middle')
    hotspot(d, 428, 391, 584, 52, 'focus-address', '输入网址')
    return d


def managed():
    d = D()
    chrome(d, True, True)
    d.rect(0, 95, W, 805, '#FFFFFF')
    return d


def export(name, drawing):
    output = ROOT / 'screens'
    output.mkdir(exist_ok=True)
    drawing.finish(output / (name + '.svg'), W, H)
    # 位图只导出可见设计层，交互热区留在 SVG 与 HTML 中。
    visible = re.sub(r'<rect\b[^>]*class="hotspot"[^>]*/>', '', (output / (name + '.svg')).read_text(encoding='utf-8'))
    subprocess.run([shutil.which('magick'), 'svg:-', str(output / (name + '.png'))], input=visible.encode('utf-8'), check=True, capture_output=True)


def prototype():
    home_svg = (ROOT / 'screens/01-home.svg').read_text(encoding='utf-8')
    env_svg = (ROOT / 'screens/02-newtab.svg').read_text(encoding='utf-8')
    managed_svg = (ROOT / 'screens/04-managed.svg').read_text(encoding='utf-8')
    markup = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>栖界 · 客户端外壳方案 02</title><link rel="stylesheet" href="preview.css"><style>
    *{box-sizing:border-box}body{margin:0;background:#e9edf3;color:#17263b;font-family:"Microsoft YaHei UI","Microsoft YaHei",sans-serif}.review-bar{display:flex;align-items:center;justify-content:space-between;padding:18px 28px;background:#fff;border-bottom:1px solid #dfe6ef;font-size:13px}.review-bar b{font-size:16px}.review-bar small{margin-left:16px;color:#7d8ca2}.review-bar nav{display:flex;gap:8px}.review-bar button,.modal button{font:inherit;cursor:pointer;border:1px solid #dce4ef;background:#fff;border-radius:6px;padding:8px 14px;color:#53657e}.review-bar button.active,.modal .primary{background:#315bea;color:#fff;border-color:#315bea}.canvas{max-width:1440px;margin:24px auto;background:#fff;box-shadow:0 12px 50px #22385716;border:1px solid #d9e1ec;border-radius:9px;overflow:hidden}.screen[hidden]{display:none}.screen svg{display:block;width:100%;height:auto}.hotspot{cursor:pointer}.hotspot:focus-visible{stroke:#315bea;stroke-width:3;outline:none}.notes{max-width:1440px;margin:0 auto 28px;padding:0 8px;color:#71829b;font-size:13px;line-height:1.9}.modal-backdrop{position:fixed;inset:0;background:#18283a66;display:grid;place-items:center;padding:20px}.modal-backdrop[hidden]{display:none}.modal{width:420px;background:white;border-radius:12px;padding:28px;box-shadow:0 24px 80px #172c4933}.modal h2{margin:0 0 8px;font-size:23px}.modal p{color:#77879e;font-size:13px;line-height:1.8}.modal label{display:block;margin-top:18px;font-size:13px}.modal input{display:block;width:100%;height:40px;border:1px solid #dbe3ef;border-radius:7px;margin-top:8px;padding:0 12px;font:inherit}.modal footer{display:flex;justify-content:flex-end;gap:8px;margin-top:24px}.modal .error{color:#c5394c;font-size:13px;min-height:20px;margin-top:12px}body{padding-bottom:1px}@media(max-width:1000px){.review-bar small{display:none}.canvas{margin:16px}.notes{padding:0 18px}}
    </style></head><body><header class="review-bar"><div><b>栖界 · 客户端外壳方案 02</b><small>固定首页 / 普通标签 / 系统创建标签</small></div><nav><button class="active" data-scene="home">首页</button><button data-scene="newtab">普通标签</button><button data-scene="managed">系统创建标签</button></nav></header><main class="canvas">
    <div class="browser-chrome"><div class="tab-row"><div class="browser-tabs" role="tablist" aria-label="浏览器标签"></div><button class="add-tab" type="button" aria-label="新建标签页"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button><div class="drag-space"></div><div class="window-actions"><button disabled aria-label="最小化"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><button disabled aria-label="最大化"><svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14"/></svg></button><button disabled aria-label="关闭窗口"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div></div><div class="address-row"><button type="button" data-history="back" aria-label="后退"><svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg></button><button type="button" data-history="forward" aria-label="前进"><svg viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg></button><button type="button" aria-label="刷新" data-refresh><svg viewBox="0 0 24 24"><path d="M20 9a8 8 0 1 0 0 6M20 3v6h-6"/></svg></button><div class="address-field"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18Z"/></svg><input id="preview-address" aria-label="SaaS 地址（只读）" readonly spellcheck="false"><span class="readonly-label">只读</span></div><div class="address-actions"><span title="下载"><svg viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg></span><span title="菜单"><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg></span></div></div></div>
    <section class="screen" id="home">__HOME__</section><section class="screen" id="newtab" hidden>__ENV__</section><section class="screen" id="managed" hidden>__MANAGED__</section></main><div class="notes"><strong id="scene-description">首页地址由打包配置决定，只读、不可关闭；可调用完整客户端业务 API。</strong><p>设计预览：点击“＋”直接创建普通标签，无需登录或选择环境；可切换、关闭标签并输入网址。网址仅用于预览地址栏和标签状态，此稿不加载外部网页，不提供真实客户端 API。系统创建标签的能力由 SaaS 授权配置控制。</p><p id="preview-feedback" role="status"></p></div><div class="modal-backdrop" id="login-preview" hidden><form class="modal" novalidate><h2>登录工作空间</h2><p>使用邮箱登录，管理你的团队资源。</p><label>邮箱<input type="email" required autocomplete="off" placeholder="输入邮箱地址"></label><label>密码<input type="password" required autocomplete="off" placeholder="输入登录密码"></label><div class="error" role="alert"></div><footer><button type="button" data-close>取消</button><button type="submit" class="primary">登录</button></footer></form></div><script src="preview.js"></script></body></html>'''
    (ROOT / 'index.html').write_text(markup.replace('__HOME__', home_svg).replace('__ENV__', env_svg).replace('__MANAGED__', managed_svg), encoding='utf-8')


if __name__ == '__main__':
    export('01-home', home())
    export('02-newtab', newtab())
    export('04-managed', managed())
    prototype()
    print('已生成固定首页、普通新标签和系统创建标签的方案 02。')
