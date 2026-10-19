import crypto from 'crypto';

export const getCsdnSign = async (
  method: string,
  url: string,
  accept: string,
  date: string,
  contentType: string,
  params: object,
  headers: object,
): Promise<string> => {
  const a = '9znpamsyl2c7cdrr9sas0le9vbc3r6ba';
  let h = '';

  let u = params;
  if (u || -1 === url.indexOf('?')) {
    u || (u = {});
  } else {
    (u = Patch(url)), (url = url.split('?')[0]);
  }
  const m = '';
  (h += ''.concat(method, '\n')),
    (h += ''.concat(accept, '\n')),
    (h += ''.concat(m, '\n')),
    (h += ''.concat(contentType, '\n')),
    (h += ''.concat(date, '\n'));
  const k = ToCase(headers);
  const g = Array.from(Object.keys(k)).sort((a, b) => a.localeCompare(b));

  for (const v of g) {
    h += v + ':' + k[v] + '\n';
  }

  const P = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.csdn\.net)/;
  let A = url.replace(P, '');
  if (params && Object.keys(params)?.length > 0) {
    let ft = 0;
    for (const key of Array.from(Object.keys(u)).sort((a, b) => a.localeCompare(b))) {
      if (ft == 0) A = A + '?' + key + '=' + u[key];
      else A += '&' + key + '=' + u[key];
      ft++;
    }
  }
  h += A;
  return crypto.createHmac('sha256', a).update(h).digest('base64');
};

const Patch = (e: string) => {
  const n = {};
  const t = /[?&]([^=&#]+)=([^&#]*)/g;
  const a = e.match(t);
  if (a)
    for (const c in a) {
      const r = a[c].split('='),
        o = r[0].substring(1);
      const u = r[1];
      if (n[o]) {
        n[o] = ''.concat(n[o], u);
      } else {
        n[o] = u;
      }
    }
  return n;
};

const ToCase = (e: object) => {
  const n = {};
  for (const t in e) {
    const a = t.toLowerCase();
    a.startsWith('x-ca-') &&
      (('x-ca-signature' !== a && 'x-ca-signature-headers' !== a && 'x-ca-key' !== a && 'x-ca-nonce' !== a) ||
        (n[a] = e[t]));
  }
  return n;
};
