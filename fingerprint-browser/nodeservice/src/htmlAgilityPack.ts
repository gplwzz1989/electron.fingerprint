import { select } from 'xpath';
import { DOMParser as Dom } from 'xmldom';

const removeDefaultXhtmlNamespace = (html: string): string =>
  html.replace(/\sxmlns=(["'])http:\/\/www\.w3\.org\/1999\/xhtml\1/g, '');

export class DocumentNode {
  htmlContent: string;
  doc: Document;

  constructor(html: string) {
    this.htmlContent = removeDefaultXhtmlNamespace(html);
    this.doc = new Dom({
      // TODO：吃掉DOM库产生的错误信息，通常是由载入的HTML不符合标准
      errorHandler: {
        error: () => {},
      },
    }).parseFromString(this.htmlContent, 'text/xml');
  }
  InsertBefore(newChild: Node, refChild: Node) {
    this.doc.insertBefore(newChild, refChild);
  }

  ReplaceNode(newNode: Node, oldNode: Node) {
    this.doc.replaceChild(newNode, oldNode);
  }

  SelectNodes(path: string): Array<Element> {
    return select(path, this.doc).map((x) => <Element>x);
  }
  SelectHtmlNodes(path: string): Array<HTMLElement> {
    return select(path, this.doc).map((x) => <HTMLElement>x);
  }
  SelectSingleNode(path: string): Element | null {
    const nodes = select(path, this.doc);
    if (nodes?.length > 0) return <Element>nodes[0];
    return null;
  }
  GetElementbyId(id: string): Element | null {
    return this.doc.getElementById(id);
  }

  OuterHtml(): string {
    return this.doc.toString();
  }

  InnerText(): string {
    const nodes = this.doc.childNodes;
    const length = nodes.length;
    let words = '';
    for (let i = 0; i < length; i++) {
      words += nodes[i]?.textContent ?? '';
      const nodeName = nodes[i]?.nodeName;
      if (nodeName == 'p' || nodeName == 'br' || nodeName.startsWith('h')) {
        words += '\n';
      }
    }
    return words;
  }
}

export class HtmlDocument {
  DocumentNode!: DocumentNode;

  constructor() {}
  public LoadHtml(html: string) {
    this.DocumentNode = new DocumentNode(html);
  }
}
