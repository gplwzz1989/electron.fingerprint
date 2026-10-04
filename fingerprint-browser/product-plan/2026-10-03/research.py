import concurrent.futures
import datetime
import json
import pathlib
import re
import urllib.request
from html.parser import HTMLParser


class PageText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'):
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, data):
        if not self.hidden and data.strip():
            self.parts.append(re.sub(r'\s+', ' ', data.strip()))


urls = [
    'https://www.adspower.com/', 'https://www.adspower.com/pricing', 'https://www.adspower.com/download',
    'https://multilogin.com/', 'https://multilogin.com/pricing/', 'https://multilogin.com/download/',
    'https://gologin.com/', 'https://gologin.com/pricing/', 'https://gologin.com/download/',
    'https://dolphin-anty.com/', 'https://dolphin-anty.com/pricing/',
    'https://incogniton.com/', 'https://incogniton.com/pricing/',
    'https://www.bitbrowser.net/', 'https://www.bitbrowser.net/download/',
]


def fetch(url):
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=25) as response:
            raw = response.read().decode('utf-8', errors='replace')
            final_url = response.url
        parser = PageText()
        parser.feed(raw)
        return {'url': url, 'final_url': final_url, 'ok': True, 'text': '\n'.join(parser.parts)}
    except Exception:
        return {'url': url, 'ok': False, 'error': '本次未能读取官方页面，相关信息需要另行核实。'}


if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        pages = list(pool.map(fetch, urls))
    result = {'retrieved_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'pages': pages}
    pathlib.Path(__file__).with_name('竞品官方资料.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    for page in pages:
        print(page['url'], '读取成功' if page['ok'] else page['error'])
        if page['ok']:
            lines = page['text'].splitlines()
            keywords = re.compile(r'team|cloud|automat|api|proxy|windows|mac|apple|intel|arm|fingerprint|synchron|同步|团队|自动化|苹果|内核|权限', re.I)
            matches = [line[:260] for line in lines if keywords.search(line)]
            print('\n'.join(matches[:32]))
