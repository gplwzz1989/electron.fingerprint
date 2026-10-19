import { DocumentNode as DocBase, HtmlDocument as HtmlBase } from '../../htmlAgilityPack';

// eslint-disable-next-line @typescript-eslint/no-namespace
export module HtmlAgilityPack {
  export class DocumentNode extends DocBase {}

  export class HtmlDocument extends HtmlBase {}
}
