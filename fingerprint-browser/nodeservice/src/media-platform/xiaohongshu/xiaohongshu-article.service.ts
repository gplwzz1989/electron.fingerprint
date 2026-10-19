import { $http } from '@/http';
import { ImageInfo } from '@/media-platform/baseModel';
import { BaseResult } from '@/media-platform/baseResult';
import { convertCookieStr, Guid, isJson } from '@/utils';
import { getNewSign, uploadXiaohongshuDynamicImage } from './xiaohongshu-base.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HtmlDocument } from '@/htmlAgilityPack';

export interface XiaohongshuArticleImageGenerateInput {
  cookie: string;
  content?: string;
  title?: string;
  model?: XiaohongshuArticleImageModel | XiaohongshuLongTextArticleContent | string | number;
  albumId?: number;
  templateId?: number | string;
  themeId?: number;
  summary?: string;
  author?: string;
  coverImage?: string;
  images?: Array<ImageInfo>;
  uploadHtmlImages?: boolean;
  maxCharsPerCard?: number;
  proxyAgent?: HttpsProxyAgent<string> | object;
}

export interface XiaohongshuArticleImageModel {
  id?: number;
  name?: string;
  articleContent?: string | XiaohongshuLongTextArticleContent;
  albumId?: number;
  templateId?: number | string;
  themeId?: number;
  summary?: string;
  author?: string;
  coverImage?: string;
  colorMap?: Record<string, string>;
  colors?: Array<XiaohongshuArticleTemplateColor>;
  previewImages?: Array<string>;
  cover?: Partial<XiaohongshuLongTextCover>;
  maxCharsPerCard?: number;
}

export interface XiaohongshuArticleTemplateColor {
  mainColor: string;
  colorMap: Record<string, string>;
  previewImages: Array<string>;
}

export interface XiaohongshuArticleTemplate extends XiaohongshuArticleImageModel {
  id: number;
  name: string;
  albumId: number;
  templateId: number;
  themeId: number;
  colorMap: Record<string, string>;
  colors: Array<XiaohongshuArticleTemplateColor>;
  previewImages: Array<string>;
}

export interface XiaohongshuLongTextArticleContent {
  config: {
    colorMap: Record<string, string>;
    cover: XiaohongshuLongTextCover;
    themeId: number;
  };
  cards: Array<XiaohongshuLongTextCard>;
}

export interface XiaohongshuLongTextCover {
  readingStats: string;
  titleText: string;
  authorText: string;
  summeryText: string;
  imgPath: string;
  coverImages: Array<{
    imageUrl: string;
    darkMode: number;
    authorDarkMode: number;
    titleDarkMode: number;
  }>;
  darkMode: boolean;
  authorDarkMode: boolean;
  titleDarkMode: boolean;
  styleType: number;
  wordNum: number;
  costTime: number;
}

export interface XiaohongshuLongTextCard {
  type: 'doc';
  content: Array<XiaohongshuLongTextNode>;
}

export type XiaohongshuLongTextNode =
  | {
      type: 'paragraph';
      attrs: XiaohongshuLongTextNodeAttrs;
      content?: Array<XiaohongshuLongTextTextNode>;
    }
  | {
      type: 'heading';
      attrs: XiaohongshuLongTextNodeAttrs & { level: number; index: string };
      content?: Array<XiaohongshuLongTextTextNode>;
    }
  | {
      type: 'image';
      attrs: {
        imgs: Array<{
          desc: string;
          height: number;
          src: string;
          uuid: string;
          width: number;
        }>;
        wrapmode: string;
        isNotSurround: boolean;
      };
    }
  | {
      type: 'orderedList';
      attrs: {
        start: number;
        styleType: number;
        uuid: string;
        left: boolean;
      };
      content: Array<XiaohongshuLongTextListItemNode>;
    }
  | {
      type: 'bulletList';
      attrs: {
        styleType: number;
        uuid: string;
        left: boolean;
      };
      content: Array<XiaohongshuLongTextListItemNode>;
    }
  | {
      type: 'blockquote';
      attrs: {
        uuid: string;
        hasSplit: boolean;
        charPositionInPara: number;
        textLength: number;
        left: boolean;
      };
      content: Array<XiaohongshuLongTextParagraphNode>;
    }
  | {
      type: 'topDecoration';
      attrs: {
        uuid: string | null;
      };
    }
  | {
      type: 'articleTitle';
      attrs: {
        uuid: string | null;
        author: string;
        articleTitle: string;
        readingStats: string;
      };
    };

export interface XiaohongshuLongTextTextMark {
  type: 'highlight';
}

export interface XiaohongshuLongTextTextNode {
  type: 'text';
  text: string;
  marks?: Array<XiaohongshuLongTextTextMark>;
}

export interface XiaohongshuLongTextNodeAttrs {
  textAlign: string;
  uuid: string;
  hasSplit: boolean;
  charPositionInPara: number;
  textLength: number;
  left: boolean;
}

export interface XiaohongshuLongTextParagraphNode {
  type: 'paragraph';
  attrs: XiaohongshuLongTextNodeAttrs;
  content?: Array<XiaohongshuLongTextTextNode>;
}

export interface XiaohongshuLongTextListItemNode {
  type: 'listItem';
  attrs: {
    order: number | null;
    uuid: string;
    hideBullet: boolean;
    hideOrder: boolean;
    charPositionInPara: number;
    textLength: number;
    left: boolean;
  };
  content: Array<XiaohongshuLongTextParagraphNode>;
}

export interface XiaohongshuArticleImagesResponse {
  code: number;
  success: boolean;
  msg?: string;
  data?: {
    article_images?: Array<string>;
  };
}

export interface XiaohongshuArticleTemplatePreviewResponse {
  code: number;
  success: boolean;
  msg?: string;
  data?: {
    templates?: Array<XiaohongshuArticleTemplatePreviewItem>;
  };
}

export interface XiaohongshuArticleSummaryResponse {
  code: number;
  success: boolean;
  msg?: string;
  data?: {
    summary?: string;
  };
}

export interface XiaohongshuArticleGeneratedSummary {
  pic_summary?: string;
  capa_summary?: string;
  author?: string;
  pic_title?: string;
  text_title?: string;
}

export interface XiaohongshuArticleTemplatePreviewItem {
  id: number;
  name?: string;
  cover_types?: Array<XiaohongshuArticleTemplateCoverType>;
}

export interface XiaohongshuArticleTemplateCoverType {
  style_type?: number;
  name?: string;
  preview_url?: string;
  cover_images?: Array<XiaohongshuArticleTemplateCoverImage>;
}

export interface XiaohongshuArticleTemplateCoverImage {
  image_url: string;
  dark_mode?: number;
  author_dark_mode?: number;
  title_dark_mode?: number;
}

export interface XiaohongshuArticleImageGenerateOutput extends BaseResult {
  dataList: Array<ImageInfo>;
}

export interface XiaohongshuSingleImageGenerateInput {
  cookie: string;
  text: string;
  textAttribute?: string | Record<string, unknown>;
  styleJson?: string | Record<string, unknown>;
  extraInfo?: string | Record<string, unknown>;
  proxyAgent?: HttpsProxyAgent<string> | object;
}

export interface XiaohongshuSingleImageGenerateOutput extends BaseResult {
  dataList: Array<ImageInfo>;
}

export interface XiaohongshuArticleTemplateListItem {
  id: number;
  name: string;
  previewImage: string;
}

export interface XiaohongshuArticleTemplateListOutput extends BaseResult {
  dataList: Array<XiaohongshuArticleTemplateListItem>;
}

type XiaohongshuLongTextContentSegment =
  | { type: 'text'; text: string }
  | { type: 'paragraph'; content: Array<XiaohongshuLongTextTextNode> }
  | { type: 'heading'; text: string; level: 1 | 2 }
  | { type: 'orderedList'; items: Array<string> }
  | { type: 'bulletList'; items: Array<string> }
  | { type: 'blockquote'; paragraphs: Array<Array<XiaohongshuLongTextTextNode>> }
  | { type: 'image'; image: ImageInfo };

interface XiaohongshuLongTextNodeSplitOptions {
  uuid?: string;
  hasSplit?: boolean;
  charPositionInPara?: number;
  left?: boolean;
}

interface XiaohongshuLongTextCardBuildState {
  cards: Array<XiaohongshuLongTextCard>;
  currentNodes: Array<XiaohongshuLongTextNode>;
  currentLength: number;
  maxCharsPerCard: number;
  firstCardMaxChars?: number;
  layoutProfile: XiaohongshuArticleLayoutProfile;
}

export interface XiaohongshuArticleSummaryRequestContent {
  title: string;
  content: {
    type: 'doc';
    content: Array<XiaohongshuLongTextNode>;
  };
}

interface XiaohongshuArticleThemeLayout {
  width: number;
  height: number;
  top_margin: number;
  right_margin: number;
  bottom_margin: number;
  left_margin: number;
  component_spacing: number;
  subtitle_extra_margin_top: number;
  image_special_spacing: number;
  top_special_spacing: number;
  image_capture_min_height_v: number;
  image_capture_min_height_h: number;
  paragraph_spacing: number;
}

interface XiaohongshuArticleThemeImageLayout {
  single: {
    left_gap: number;
    right_gap: number;
  };
  dual?: {
    middle_gap: number;
    left_gap: number;
    right_gap: number;
  };
}

interface XiaohongshuArticleThemeTextLayout {
  fontSize: number;
  lineHeight: number;
  charWidth?: number;
  textWidth?: number;
  paragraphExtraHeight?: number;
  highlightExtraHeight?: number;
}

interface XiaohongshuArticleLayoutProfile {
  themeId: number;
  layout: XiaohongshuArticleThemeLayout;
  imageLayout: XiaohongshuArticleThemeImageLayout;
  textLayout: XiaohongshuArticleThemeTextLayout;
  contentWidth: number;
  contentHeight: number;
  textWidth: number;
  imageWidth: number;
  pageBottomSafety: number;
}

const defaultColorMap: Record<string, string> = {
  fc_1: '#210602',
  fc_0: '#B0160C',
  fc_19: '#F1C0BC',
  fc_18: '#684A45',
  fc_17: '#B0160C',
  bgCoverColor: '#FDFBFB',
  fc_12: '#B0160C',
  fc_11: '#FFFFFF',
  fc_10: '#252525',
  fc_20: '#FCE9E8',
  fc_16: '#252525',
  fc_15: '#FBF5F4',
  fc_14: '#FDFBFB',
  fc_13: '#FDFBFB',
  bgInnerColor: '#FDFBFB',
  fc_9: '#FDFBFB',
  fc_8: '#F7ECEC',
  fc_7: '#B8857F',
  fc_6: '#FBF5F4',
  fc_5: '#F8F0EE',
  fc_4: '#EAD7D6',
  fc_3: '#684A45',
  fc_2: '#210602',
};

// 官方模板 id 到生成接口 themeId 的映射。
const xiaohongshuArticleTemplateThemeMap: Record<number, number> = {
  1: 1,
  2: 0,
  3: 3,
  4: 2,
  5: 4,
  6: 5,
  7: 6,
  48: 48,
  49: 49,
  50: 50,
  51: 51,
  52: 52,
  53: 53,
  54: 7,
  55: 55,
  56: 8,
  57: 10,
  59: 59,
  60: 60,
  61: 61,
  62: 62,
};

const xiaohongshuArticleThemeAlbumMap: Record<number, number> = {
  0: 2,
  1: 1,
  2: 4,
  3: 3,
  4: 5,
  5: 6,
  6: 7,
  7: 54,
  8: 56,
  10: 57,
  48: 48,
  49: 49,
  50: 50,
  51: 51,
  52: 52,
  53: 53,
  55: 55,
  59: 59,
  60: 60,
  61: 61,
  62: 62,
};

// 这些模板的标题由第一张正文卡片内的 articleTitle 节点渲染。
const xiaohongshuArticleCardTitleThemeIds = new Set<number>([6, 10, 48, 49, 50, 51, 52, 53, 54, 57, 59]);
const xiaohongshuArticleTopDecorationThemeIds = new Set<number>([49, 50, 51, 52, 53, 57]);
const xiaohongshuArticleDefaultMaxCharsPerCard = 380;
const xiaohongshuArticleTitleFirstCardMaxChars = 278;
const xiaohongshuArticleTitleFirstCardMaxCharsByTheme: Record<number, number> = {
  7: 160,
  10: 160,
  48: 160,
  52: 160,
};
const xiaohongshuArticleTitleLayoutExtraReserveByTheme: Record<number, number> = {
  6: 190,
  7: 300,
  10: 380,
  48: 260,
  49: 220,
  50: 125,
  52: 150,
  53: 110,
};
const xiaohongshuArticleDefaultTopDecorationFirstCardMaxChars = 190;
const xiaohongshuArticleTopDecorationFirstCardMaxChars: Record<number, number> = {
  49: 192,
  50: 235,
  51: 192,
  52: 160,
  53: 213,
};
const xiaohongshuArticleTemplateMaxCharsPerCard: Record<number, number> = {
  7: 320,
  8: 300,
  10: 320,
  48: 350,
  49: 384,
  51: 384,
  52: 300,
  55: 350,
  60: 300,
  61: 240,
};
const xiaohongshuArticleDefaultImageWidth = 780;
const xiaohongshuArticleDefaultImageHeight = 604;
const xiaohongshuArticleEmptyParagraphLayoutLength = 8;
const xiaohongshuArticleImageMinLayoutLength = 140;
const xiaohongshuArticleImageWrapperExtraHeight = 16;
const xiaohongshuArticleImageWrapperExtraHeightByTheme: Record<number, number> = {
  60: 205,
};
const xiaohongshuArticleListItemExtraHeightByTheme: Record<number, number> = {
  60: 20,
};
const xiaohongshuArticleMinParagraphStartLength = 0;
const xiaohongshuArticleBottomReservedLineCount = 2;
const xiaohongshuArticleDefaultPageBottomSafety = 0;
const xiaohongshuArticleThemePageBottomSafety: Record<number, number> = {
  7: 70,
  8: 80,
  10: 0,
  48: 0,
  52: 0,
  55: 140,
  60: 0,
  61: 152,
};
const xiaohongshuArticleDisableImageAutoScaleThemeIds = new Set<number>([10, 50, 53, 60]);
const xiaohongshuArticleImageCardTextReserveByTheme: Record<number, number> = {
  60: 200,
  61: 240,
};
const xiaohongshuArticleImageLayoutLengthAdjustByTheme: Record<number, number> = {
  50: -115,
  53: -115,
};
const xiaohongshuArticleImageMaxLayoutHeightAdjustByTheme: Record<number, number> = {
  49: -110,
  50: -115,
  53: -115,
};
const xiaohongshuArticleFirstCardBottomSafetyLineCountByTheme: Record<number, number> = {
  51: 2,
};
const xiaohongshuArticleMinParagraphStartLengthByTheme: Record<number, number> = {
  49: 0,
};
const xiaohongshuArticleDefaultThemeLayout: XiaohongshuArticleThemeLayout = {
  width: 900,
  height: 1500,
  top_margin: 50,
  right_margin: 50,
  bottom_margin: 50,
  left_margin: 50,
  component_spacing: 45,
  subtitle_extra_margin_top: 45,
  image_special_spacing: 45,
  top_special_spacing: 45,
  image_capture_min_height_v: 45,
  image_capture_min_height_h: 45,
  paragraph_spacing: 45,
};
const xiaohongshuArticleDefaultThemeImageLayout: XiaohongshuArticleThemeImageLayout = {
  single: { left_gap: 0, right_gap: 0 },
  dual: { middle_gap: 20, left_gap: 0, right_gap: 0 },
};
const xiaohongshuArticleThemeLayoutMap: Record<number, XiaohongshuArticleThemeLayout> = {
  0: { width: 900, height: 1500, top_margin: 60, right_margin: 60, bottom_margin: 60, left_margin: 60, component_spacing: 25, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 25 },
  1: { width: 900, height: 1500, top_margin: 80, right_margin: 80, bottom_margin: 80, left_margin: 80, component_spacing: 30, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 30 },
  2: { width: 900, height: 1500, top_margin: 50, right_margin: 50, bottom_margin: 50, left_margin: 100, component_spacing: 60, subtitle_extra_margin_top: 20, paragraph_spacing: 40, image_special_spacing: 45, top_special_spacing: 45, image_capture_min_height_v: 45, image_capture_min_height_h: 45 },
  3: { width: 900, height: 1500, top_margin: 50, right_margin: 50, bottom_margin: 50, left_margin: 100, component_spacing: 60, subtitle_extra_margin_top: 20, paragraph_spacing: 40, image_special_spacing: 45, top_special_spacing: 45, image_capture_min_height_v: 45, image_capture_min_height_h: 45 },
  4: { width: 900, height: 1500, top_margin: 75, right_margin: 50, bottom_margin: 75, left_margin: 50, component_spacing: 40, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 25 },
  5: { width: 900, height: 1500, top_margin: 60, right_margin: 60, bottom_margin: 60, left_margin: 60, component_spacing: 40, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 25 },
  6: { width: 900, height: 1500, top_margin: 60, right_margin: 60, bottom_margin: 60, left_margin: 60, component_spacing: 40, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 25 },
  7: { width: 900, height: 1500, top_margin: 75, right_margin: 50, bottom_margin: 75, left_margin: 50, component_spacing: 25, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 25 },
  8: { width: 900, height: 1500, top_margin: 90, right_margin: 70, bottom_margin: 90, left_margin: 70, component_spacing: 35, subtitle_extra_margin_top: 0, paragraph_spacing: 35, image_special_spacing: 45, top_special_spacing: 45, image_capture_min_height_v: 45, image_capture_min_height_h: 45 },
  10: { width: 900, height: 1500, top_margin: 70, right_margin: 50, bottom_margin: 70, left_margin: 50, component_spacing: 25, subtitle_extra_margin_top: 25, image_special_spacing: 25, top_special_spacing: 25, image_capture_min_height_v: 25, image_capture_min_height_h: 25, paragraph_spacing: 25 },
  48: { width: 900, height: 1500, top_margin: 60, right_margin: 60, bottom_margin: 60, left_margin: 60, component_spacing: 40, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 25 },
  49: { width: 900, height: 1500, top_margin: 60, right_margin: 60, bottom_margin: 60, left_margin: 60, component_spacing: 25, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 25 },
  50: { width: 900, height: 1500, top_margin: 80, right_margin: 80, bottom_margin: 80, left_margin: 80, component_spacing: 30, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 30 },
  51: { width: 900, height: 1500, top_margin: 75, right_margin: 50, bottom_margin: 75, left_margin: 50, component_spacing: 40, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 25 },
  52: { width: 900, height: 1500, top_margin: 50, right_margin: 50, bottom_margin: 50, left_margin: 100, component_spacing: 60, subtitle_extra_margin_top: 20, paragraph_spacing: 40, image_special_spacing: 45, top_special_spacing: 45, image_capture_min_height_v: 45, image_capture_min_height_h: 45 },
  53: { width: 900, height: 1500, top_margin: 50, right_margin: 50, bottom_margin: 50, left_margin: 100, component_spacing: 60, subtitle_extra_margin_top: 20, paragraph_spacing: 40, image_special_spacing: 45, top_special_spacing: 45, image_capture_min_height_v: 45, image_capture_min_height_h: 45 },
  54: { width: 900, height: 1500, top_margin: 65, right_margin: 50, bottom_margin: 65, left_margin: 50, component_spacing: 30, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 30 },
  55: { width: 900, height: 1500, top_margin: 100, right_margin: 70, bottom_margin: 100, left_margin: 70, component_spacing: 30, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 30 },
  59: { width: 900, height: 1500, top_margin: 150, right_margin: 50, bottom_margin: 60, left_margin: 50, component_spacing: 30, subtitle_extra_margin_top: 40, paragraph_spacing: 20, image_special_spacing: 45, top_special_spacing: 45, image_capture_min_height_v: 45, image_capture_min_height_h: 45 },
  60: { width: 900, height: 1500, top_margin: 80, right_margin: 35, bottom_margin: 120, left_margin: 35, component_spacing: 0, subtitle_extra_margin_top: 0, paragraph_spacing: -75, image_special_spacing: 45, top_special_spacing: 45, image_capture_min_height_v: 45, image_capture_min_height_h: 45 },
  61: { width: 900, height: 1500, top_margin: 90, right_margin: 97, bottom_margin: 90, left_margin: 97, component_spacing: 60, subtitle_extra_margin_top: 0, paragraph_spacing: 60, image_special_spacing: 45, top_special_spacing: 45, image_capture_min_height_v: 45, image_capture_min_height_h: 45 },
  62: { width: 900, height: 1500, top_margin: 100, right_margin: 70, bottom_margin: 100, left_margin: 70, component_spacing: 30, subtitle_extra_margin_top: 30, image_special_spacing: 30, top_special_spacing: 30, image_capture_min_height_v: 30, image_capture_min_height_h: 30, paragraph_spacing: 30 },
};
const xiaohongshuArticleThemeImageLayoutMap: Record<number, XiaohongshuArticleThemeImageLayout> = {
  0: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  1: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  2: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 14, left_gap: 0, right_gap: 0 } },
  3: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 14, left_gap: 0, right_gap: 0 } },
  4: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  5: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  6: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  7: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  8: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 0, left_gap: 0, right_gap: 0 } },
  10: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  48: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  49: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  50: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  51: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 20, left_gap: 0, right_gap: 0 } },
  52: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 14, left_gap: 0, right_gap: 0 } },
  53: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 14, left_gap: 0, right_gap: 0 } },
  55: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 19, left_gap: 0, right_gap: 0 } },
  59: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 19, left_gap: 0, right_gap: 0 } },
  60: { single: { left_gap: 100, right_gap: 100 }, dual: { middle_gap: 56, left_gap: 65, right_gap: 65 } },
  61: { single: { left_gap: 52, right_gap: 52 }, dual: { middle_gap: 40, left_gap: 40, right_gap: 40 } },
  62: { single: { left_gap: 0, right_gap: 0 }, dual: { middle_gap: 19, left_gap: 0, right_gap: 0 } },
};
const xiaohongshuArticleThemeTextLayoutMap: Record<number, XiaohongshuArticleThemeTextLayout> = {
  0: { fontSize: 34, lineHeight: 34 * 1.8, charWidth: 34.68 },
  1: { fontSize: 34, lineHeight: 34 * 1.7, charWidth: 30.8 },
  2: { fontSize: 34, lineHeight: 34 * 1.75, charWidth: 32.6 },
  3: { fontSize: 34, lineHeight: 56, charWidth: 31 },
  4: { fontSize: 36, lineHeight: 36 * 1.75, charWidth: 34 },
  5: { fontSize: 34, lineHeight: 34 * 1.8, charWidth: 34.68 },
  6: { fontSize: 34, lineHeight: 34 * 1.8, charWidth: 34.68 },
  7: { fontSize: 36, lineHeight: 36 * 1.75, charWidth: 34 },
  8: { fontSize: 38, lineHeight: 38 * 1.7, charWidth: 36 },
  10: { fontSize: 36, lineHeight: 36 * 1.75 },
  48: { fontSize: 34, lineHeight: 34 * 1.8, charWidth: 34.68 },
  49: { fontSize: 34, lineHeight: 34 * 1.8, charWidth: 34.68 },
  50: { fontSize: 34, lineHeight: 34 * 1.7, charWidth: 33.5 },
  51: { fontSize: 36, lineHeight: 36 * 1.75, charWidth: 34 },
  52: { fontSize: 34, lineHeight: 56, charWidth: 31 },
  53: { fontSize: 34, lineHeight: 34 * 1.75, charWidth: 34 },
  54: { fontSize: 36, lineHeight: 36 * 1.75 },
  55: { fontSize: 34, lineHeight: 34 * 1.75, charWidth: 29 },
  59: { fontSize: 34, lineHeight: 34 * 1.65, charWidth: 32, highlightExtraHeight: 12 },
  60: { fontSize: 38, lineHeight: 38 * 1.5, charWidth: 37.24, textWidth: 680, paragraphExtraHeight: 120 },
  61: { fontSize: 38, lineHeight: 38 * 1.6, charWidth: 33.5, highlightExtraHeight: 22 },
  62: { fontSize: 34, lineHeight: 34 * 1.75 },
};

const createXiaohongshuArticleTemplate = (
  id: number,
  name: string,
  themeId: number,
  mainColor: string,
  colorMap: Record<string, string>,
  previewImages: Array<string>,
): XiaohongshuArticleTemplate => ({
  id,
  name,
  albumId: id,
  templateId: id,
  themeId,
  colorMap,
  colors: [{ mainColor, colorMap, previewImages }],
  previewImages,
  maxCharsPerCard: xiaohongshuArticleDefaultMaxCharsPerCard,
});

export const defaultXiaohongshuArticleTemplate: XiaohongshuArticleTemplate = {
  id: 2,
  name: '理性现代',
  albumId: 2,
  templateId: 2,
  themeId: 0,
  colorMap: defaultColorMap,
  colors: [
    {
      mainColor: '#b0160c',
      colorMap: defaultColorMap,
      previewImages: [
        'https://ci.xiaohongshu.com/athena-legacy/104100o831pbfle7d2466akc6k6200000000000tj8dq70.png',
        'https://ci.xiaohongshu.com/athena-legacy/104100o831pbflfmq2a06akc6k6200000000000t9f6thu.png',
        'https://ci.xiaohongshu.com/athena-legacy/104100o831pbflgd72806akc6k6200000000000r3o1d72.png',
      ],
    },
  ],
  previewImages: [
    'https://ci.xiaohongshu.com/athena-legacy/104100o831pbfle7d2466akc6k6200000000000tj8dq70.png',
    'https://ci.xiaohongshu.com/athena-legacy/104100o831pbflfmq2a06akc6k6200000000000t9f6thu.png',
    'https://ci.xiaohongshu.com/athena-legacy/104100o831pbflgd72806akc6k6200000000000r3o1d72.png',
  ],
  maxCharsPerCard: xiaohongshuArticleDefaultMaxCharsPerCard,
};

export const xiaohongshuArticleTemplates: Array<XiaohongshuArticleTemplate> = [
  createXiaohongshuArticleTemplate(6, '清晰明朗', 5, '#F5F5F5', { fc_1: '#262626', fc_0: '#ffffff', bgCoverColor: '#FFFFFF', fc_12: '#E5E5E5', fc_11: '#929292', fc_10: '#8C8C8C', fc_14: '#FFF8DF', fc_13: '#FFE592', bgInnerColor: '#FFFFFF', fc_9: '#191919', fc_8: '#262626', fc_7: '#FFFFFF', fc_6: '#FFFFFF', fc_5: '#F5F5F5', fc_4: '#FFE592', fc_3: '#FFF8DF', fc_2: '#FFFFFF' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831pbhfn0l2806akc6k6200000000000vetlcgi.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831pbhfogf2806akc6k6200000000000s8cqeac.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831pbhfpphi606akc6k6200000000000sp8dp9o.png']),
  createXiaohongshuArticleTemplate(7, '简约基础', 6, '#F9F9F9', { fc_1: '#272727', fc_0: '#FFFFFF', bgInnerColor: '#FFFFFF', bgCoverColor: '#FFFFFF', fc_7: '#EFEFEF', fc_6: '#272727', fc_5: '#1C1C1C', fc_4: '#FFFFFF', fc_3: '#1C1C1C', fc_2: '#EFEFEF' }, ['https://ci.xiaohongshu.com/athena-legacy/104000o831pbhv3km280ag6jc5s.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831pbhv2342a06akc6k6200000000000o6582f0.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831pbhv3co2c06akc6k6200000000000ve4qh7k.png']),
  createXiaohongshuArticleTemplate(1, '优雅几何', 1, '#6FC8FC', { fc_1: '#58caff', fc_0: '#58caff', fc_29: '#1f1f1f', fc_28: '#58caff', fc_23: '#58caff', fc_22: '#333c46', fc_21: '#58caff', fc_20: '#58caff', fc_27: '#ffffff', fc_26: '#2b3134', fc_25: '#ffffff', fc_24: '#252728', fc_30: '#a4e2ff', fc_9: '#23405f', fc_8: '#23405f', fc_7: '#58caff', fc_6: '#3a3a3a', fc_5: '#f1f8ff', fc_4: '#58caff', fc_3: '#58caff', fc_2: '#23405f', fc_19: '#58caff', fc_18: '#58caff', fc_17: '#252728', bgCoverColor: '#2b3134', fc_12: '#58caff', fc_11: '#58caff', fc_10: '#23405f', fc_32: '#1f1f1f', fc_31: '#7ecdfa', fc_16: '#f1f8ff', fc_15: '#2e3132', fc_14: '#58caff', fc_13: '#58caff', bgInnerColor: '#252728' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831mavjq78kq068d918esd8lo004gi5oc2hpe9m.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mavjs0i50068d918esd8lo004gi5oa4m04h8.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mavjtjh4u068d918esd8lo004gi5oe5obd3k.png']),
  createXiaohongshuArticleTemplate(4, '杂志先锋', 2, '#00E180', { fc_1: '#ffffff', fc_0: '#2d2d2d', bgCoverColor: '#ffffff', fc_10: '#faeae1', bgInnerColor: '#fafafa', fc_9: '#ededed', fc_8: '#ededed', fc_7: '#fafafa', fc_6: '#f0f0f0', fc_5: '#ff7f3b', fc_4: '#ff7f3b', fc_3: '#00d278', fc_2: '#00e180' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831mavp7vsku068d918esd8lo004gi5oc0jg38m.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mavp9dq50lm8d918esd8lo004gi5oa5dlai0.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mavpb7al2068d918esd8lo004gi5ob5e3r2o.png']),
  createXiaohongshuArticleTemplate(5, '文艺清新', 4, '#AAC7E2', { fc_1: '#0057b7', fc_0: '#333333', bgInnerColor: '#F9F9F9', bgCoverColor: '#D9EAFD', fc_7: '#787878', fc_6: '#d9eafd', fc_5: '#f9f9f9', fc_4: '#aac7e2', fc_3: '#bbdbff', fc_2: '#aac7e2' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831mavv00j4u068d918esd8lo004gi5of3f8h6c.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mavv1eh4s768d918esd8lo004gi5ochnivd0.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mavv2q0l2068d918esd8lo004gi5odh794e0.png']),
  createXiaohongshuArticleTemplate(53, '交叉拓扑', 53, '#DCF07F', { fc_1: '#ffffff', fc_0: '#2d2d2d', bgCoverColor: '#ffffff', fc_10: '#e0e6f4', bgInnerColor: '#ffffff', fc_9: '#ededed', fc_8: '#e0e6f4', fc_7: '#fafafa', fc_6: '#f0f0f0', fc_5: '#a5bff4', fc_4: '#bbd2ff', fc_3: '#b3de3e', fc_2: '#dcf07f' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831kkvg4cm2a0m8d918esd8lo004gi5o8hn6op8.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831kkvg74e48068d918esd8lo004gi5ofocu1fm.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831kkvg71r2g068d918esd8lo004gi5o8n5qq6o.png']),
  createXiaohongshuArticleTemplate(56, '轻感明快', 8, '#F9F9F9', { fc_1: '#414141', fc_0: '#F9F9F9', bgInnerColor: '#F9F9F9', bgCoverColor: '#F9F9F9', fc_8: '#E0E0E0', fc_7: '#414141', fc_6: '#323232', fc_5: '#414141', fc_4: '#F9F9F9', fc_3: '#D9D9D9', fc_2: '#DBDBDB' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831ktlf03fia068d918esd8lo004gi5obtdgc3o.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831ktlf3332g068d918esd8lo004gi5oa03qg6a.png', 'https://ci.xiaohongshu.com/athena-legacy/104000o831ktlf625ig08roiceo.png']),
  createXiaohongshuArticleTemplate(55, '大图纯享', 55, '#555555', { fc_1: '#303030', fc_0: '#282828', bgInnerColor: '#FFFFFF', bgCoverColor: '#FFFFFF', fc_9: '#FFFFFF', fc_8: '#FFFFFF', fc_7: '#FFFFFF', fc_6: '#282828', fc_5: '#282828', fc_4: '#4D4D4D', fc_3: '#FFFFFF', fc_2: '#000000' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831l5irsj5ko06ce1s58900000000000j509guk.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831rikvt1ki0068d918esd8lo004gi5offdfo6c.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831rikvuh226068d918esd8lo004gi5oa7dmsli.png']),
  createXiaohongshuArticleTemplate(48, '黑白极简', 48, '#121212', { fc_1: '#EAEAEA', fc_0: '#ffffff', bgCoverColor: '#121212', fc_12: '#EAEAEA', fc_11: '#797979', fc_10: '#9B9B9B', fc_13: '#414141', bgInnerColor: '#121212', fc_9: '#B3B3B3', fc_8: '#F5F5F5', fc_7: '#F5F5F5', fc_6: '#121212', fc_5: '#121212', fc_4: '#EAEAEA', fc_3: '#5A5A5A', fc_2: '#121212' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831pbhnl322406akc6k6200000000000pgj6mc4.png']),
  createXiaohongshuArticleTemplate(59, '灵感备忘', 59, '#2E2E2E', { fc_1: '#E8E8E8', fc_0: '#181818', bgInnerColor: '#181818', bgCoverColor: '#181818', fc_6: '#252525', fc_5: '#B7B7B7', fc_4: '#F0B80C', fc_3: '#503D03', fc_2: '#DCDCDC' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831mo2as3pks06ce1s58900000000000n7kuv44.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831n0t5h1j52068d918esd8lo004gi5oabelo1o.png', 'https://ci.xiaohongshu.com/athena-legacy/104000o831n0t5n2o4q0d8vtebo.png']),
  createXiaohongshuArticleTemplate(60, '手帐书写', 60, '#FFEDA8', { fc_1: '#F5F1E2', fc_0: '#ffffff', bgCoverColor: '#816853', fc_11: '#FFFFFF', fc_10: '#FCD3E2', bgInnerColor: '#F3F1E7', fc_9: '#000000', fc_8: '#433909', fc_7: '#FBFAF5', fc_6: '#FBEFBE', fc_5: '#F3F1E7', fc_4: '#FFE0E6', fc_3: '#58483F', fc_2: '#0F0F0F' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831mrta9rt4u06akc6k6200000000000quob9ek.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831n0sdvj450068d918esd8lo004gi5of7kddmg.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831n0se1lukq068d918esd8lo004gi5ofk8inic.png']),
  createXiaohongshuArticleTemplate(50, '平实叙事', 50, '#b3ffc4', { fc_1: '#2f3231', fc_0: '#2b2b2b', fc_29: '#d3d2d2', fc_28: '#2a2a2a', fc_23: '#7ce494', fc_22: '#dcdcdc', fc_21: '#c9f697', fc_20: '#565656', fc_27: '#2a2a2a', fc_26: '#ffffff', fc_25: '#ffffff', fc_24: '#1f1f1f', fc_30: '#b3ffc4', fc_9: '#c9f697', fc_8: '#c9f697', fc_7: '#3d3d3d', fc_6: '#e9e9e9', fc_5: '#3d3d3d', fc_4: '#2f3231', fc_3: '#f0ffad', fc_2: '#dcdcdc', fc_19: '#5e6e18', fc_18: '#c9f697', fc_17: '#f5f5f5', bgCoverColor: '#ffffff', fc_12: '#2f3231', fc_11: '#565656', fc_10: '#c9f697', fc_32: '#ffffff', fc_31: '#89ec9f', fc_16: '#3d3d3d', fc_15: '#e9e9e9', fc_14: '#8f8f8f', fc_13: '#5e6e18', bgInnerColor: '#f5f5f5' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831mjur2b8l00m8d918esd8lo004gi5ocanusgu.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mjur69950068d918esd8lo004gi5ofpuc4pk.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mjv5shnku068d918esd8lo004gi5oc2iian4.png']),
  createXiaohongshuArticleTemplate(49, '逻辑结构', 49, '#0876EF', { fc_1: '#252525', fc_0: '#0876EF', fc_19: '#BBD7F6', fc_18: '#36587C', fc_17: '#0876EF', bgCoverColor: '#F9FBFD', fc_12: '#0876EF', fc_11: '#FFFFFF', fc_10: '#252525', fc_20: '#DDEDFF', fc_16: '#252525', fc_15: '#F1F7FC', fc_14: '#F9FBFD', fc_13: '#F9FBFD', bgInnerColor: '#F9FBFD', fc_9: '#F9FBFD', fc_8: '#DDEDFF', fc_7: '#6DA1DB', fc_6: '#F2F6FB', fc_5: '#EBF2F9', fc_4: '#C7D8EB', fc_3: '#46586B', fc_2: '#252525' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831pbh93jdia06akc6k6200000000000v7cspf8.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831pbh95c22c06akc6k6200000000000q3e02da.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831pbh99e82806akc6k6200000000000omnau7a.png']),
  defaultXiaohongshuArticleTemplate,
  createXiaohongshuArticleTemplate(51, '素雅底纹', 51, '#EDD9C5', { fc_1: '#6d4721', fc_0: '#333333', bgInnerColor: '#F9F9F9', bgCoverColor: '#F9F9F9', fc_7: '#787878', fc_6: '#f9f9f9', fc_5: '#f9f9f9', fc_4: '#e0ccb8', fc_3: '#f4dec9', fc_2: '#edd9c5' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831kks8raj2g068d918esd8lo004gi5o8splhq8.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831kks8t3ijq068d918esd8lo004gi5of0h7bq2.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831kks916oj6068d918esd8lo004gi5o9lu7rh4.png']),
  createXiaohongshuArticleTemplate(54, '札记集尘', 7, '#D0D89E', { fc_1: '#1E2E19', fc_0: '#D0D89E', bgInnerColor: '#E7EFBF', bgCoverColor: '#E7EFBF', fc_6: '#1E2E19', fc_5: '#1E2E19', fc_4: '#1E2E19', fc_3: '#4D6331', fc_2: '#1A1D19' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831ktl8dt448068d918esd8lo004gi5odr3mecq.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831ktl8e24j6068d918esd8lo004gi5oe1atnpq.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831ktl8fk43qe68d918esd8lo004gi5od5tefh8.png']),
  createXiaohongshuArticleTemplate(3, '线条复古', 3, '#FFEEA4', { fc_1: '#fcf5e1', fc_0: '#ffeea4', bgInnerColor: '#fffefa', bgCoverColor: '#fffefa', fc_8: '#fffefa', fc_7: '#030303', fc_6: '#a2a2a2', fc_5: '#E2CFC5', fc_4: '#fcf5e1', fc_3: '#ffeea4', fc_2: '#cfa188' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831mavnvpi4qe68d918esd8lo004gi5odtkut5e.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mavo11550068d918esd8lo004gi5o88q3s50.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831mavo2d950068d918esd8lo004gi5of0o1ork.png']),
  createXiaohongshuArticleTemplate(52, '拼接色块', 52, '#DDECFF', { fc_1: '#ddecff', fc_0: '#fff8af', bgInnerColor: '#ffffff', bgCoverColor: '#ffffff', fc_8: '#ffffff', fc_7: '#030303', fc_6: '#a2a2a2', fc_5: '#BFD8ED', fc_4: '#ddecff', fc_3: '#fff8af', fc_2: '#338ad2' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831kksbd9oig068d918esd8lo004gi5obao7cea.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831kksbfq0k8068d918esd8lo004gi5ob9f5tqi.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831kksbgfa3q068d918esd8lo004gi5ofga9f66.png']),
  createXiaohongshuArticleTemplate(57, '黄昏手稿', 10, '#BDA875', { fc_1: '#1C1C1C', fc_0: '#BDA875', bgInnerColor: '#ECDDBB', bgCoverColor: '#ECDDBB', fc_4: '#BDA875', fc_3: '#CC0F3B', fc_2: '#CAA978' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831ps8sjcok006ce1s58900000000000n7hufks.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831ps8sklq3q06ce1s58900000000000jvth43e.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831ps8sm8n5406ce1s58900000000000l3h7kai.png']),
  createXiaohongshuArticleTemplate(61, '涂鸦马克', 61, '#BFEEFF', { fc_1: '#150D50', fc_0: '#F0FAFF', bgInnerColor: '#F0FAFF', bgCoverColor: '#F0FAFF', fc_9: '#BFEEFF', fc_8: '#2378B9', fc_7: '#FDFFFF', fc_6: '#52546F', fc_5: '#1ABCF7', fc_4: '#2E297F', fc_3: '#E2F5FF', fc_2: '#8BE0FF' }, ['https://ci.xiaohongshu.com/athena-legacy/104100o831ns1eeqr4u06ce1s58900000000000i68c46s.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831ns1egdjl006ce1s58900000000000io1gadi.png', 'https://ci.xiaohongshu.com/athena-legacy/104100o831ns1ej744q06ce1s58900000000000ngd0ktc.png']),
];

export const getXiaohongshuArticleTemplateList = (): XiaohongshuArticleTemplateListOutput => ({
  code: 0,
  msg: '',
  dataList: xiaohongshuArticleTemplates.map((template) => ({
    id: template.id,
    name: template.name,
    previewImage: template.previewImages[0] ?? '',
  })),
});

export const generateXiaohongshuArticleImages = async (
  input: XiaohongshuArticleImageGenerateInput,
): Promise<XiaohongshuArticleImageGenerateOutput> => {
  const result: XiaohongshuArticleImageGenerateOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (!input?.cookie) {
      throw new Error('小红书长文生成图片失败：缺少登录 Cookie');
    }
    input.cookie=convertCookieStr(input.cookie);

    let articleContent = await resolveArticleContent(input);
    if (!articleContent) {
      throw new Error('小红书长文生成图片失败：缺少正文内容');
    }

    if (isArticleContent(articleContent)) {
      articleContent = await applyArticleContentCoverRecommend(input, articleContent);
    }

    const albumId = resolveAlbumId(input);
    const response = await generateArticleImagesResponse(input.cookie, articleContent, albumId, input.proxyAgent);
    const images = response?.data?.article_images ?? [];
    if (!response?.success || response.code !== 0 || !images.length) {
      throw new Error(`小红书长文生成图片失败：${response?.msg ?? '未生成图片'}`);
    }

    result.dataList = images.map((url) => ({
      pathOrUrl: url,
      format: inferImageFormat(url),
    }));
  } catch (e) {
    result.code = -1;
    result.msg = e instanceof Error && e.message ? e.message : '小红书长文生成图片失败，请稍后重试';
    result.dataList = [];
  }

  return result;
};

export const generateXiaohongshuSingleImage = async (
  input: XiaohongshuSingleImageGenerateInput,
): Promise<XiaohongshuSingleImageGenerateOutput> => {
  const result: XiaohongshuSingleImageGenerateOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (!input?.cookie) {
      throw new Error('小红书单图生成失败：缺少登录 Cookie');
    }
    if (!input?.text?.trim()) {
      throw new Error('小红书单图生成失败：缺少文字内容');
    }

    const response = await generateSingleImageResponse({
      ...input,
      cookie: convertCookieStr(input.cookie),
    });
    const images = response?.data?.text2_img_type_results?.filter((item) => !!item?.img_url) ?? [];
    if (!response?.success || response.code !== 0 || !images.length) {
      throw new Error(`小红书单图生成失败：${response?.msg ?? '未生成图片'}`);
    }

    result.dataList = images.map((item) => ({
      pathOrUrl: item.img_url as string,
      format: inferImageFormat(item.img_url as string),
    }));
  } catch (e) {
    result.code = -1;
    result.msg = e instanceof Error && e.message ? e.message : '小红书单图生成失败，请稍后重试';
    result.dataList = [];
  }

  return result;
};

export interface XiaohongshuSingleImageGenerateResponse {
  code: number;
  success: boolean;
  msg?: string;
  data?: {
    text2_img_type_results?: Array<XiaohongshuSingleImageResult>;
  };
}

export interface XiaohongshuSingleImageResult {
  img_url?: string;
  img_type?: number;
  config_id?: number;
  album_name?: string;
  can_change?: boolean;
  render_json?: string;
  attr_json?: string;
  extra_info?: string;
  report_data?: string;
}

export const generateSingleImageResponse = async (
  input: XiaohongshuSingleImageGenerateInput,
): Promise<XiaohongshuSingleImageGenerateResponse> => {
  const urlPath = '/api/galaxy/v2/creator/post/inspiration/text2imgv3';
  const url = `https://creator.xiaohongshu.com${urlPath}`;
  const postData = JSON.stringify({
    page_type: 'cover',
    text_config_list: [
      {
        index: 0,
        text: input.text,
        text_attribute: serializeSingleImageJson(
          input.textAttribute,
          JSON.stringify({
            edit_content: input.text,
            text_list: [input.text],
            text_size: 0,
            line_space: 0,
            word_space: 0,
            use_system_fonts: 0,
          }),
        ),
      },
    ],
    style_json: serializeSingleImageJson(input.styleJson, ''),
    page_num: 1,
    request_id: `${Date.now()}_${Guid.NewGuid().toString()}`,
    extra_info: serializeSingleImageJson(input.extraInfo, ''),
  });
  const sign = await getNewSign(urlPath, postData);
  const signJo = JSON.parse(sign);
  if (!signJo || !signJo['X-s']) {
    throw new Error('小红书单图生成失败：签名失败，请稍后重试');
  }

  const headers = {
    cookie: appendSignCookie(input.cookie, signJo),
    referer: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=image',
    Origin: 'https://creator.xiaohongshu.com',
    Authorization: '',
    'Content-Type': 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/110.0.0.0',
    'X-s': signJo['X-s'],
    'X-t': signJo['X-t'],
    'X-S-Common': signJo['X-S-Common'] ?? '',
  };

  const result = await $http.post(url, postData, {
    headers,
    httpAgent: input.proxyAgent,
    httpsAgent: input.proxyAgent,
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
  });

  return result.data;
};

export const generateArticleImagesResponse = async (
  cookie: string,
  articleContent: string | XiaohongshuLongTextArticleContent,
  albumId: number = Number(defaultXiaohongshuArticleTemplate.albumId) || 2,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<XiaohongshuArticleImagesResponse> => {
  const urlPath = '/web_api/sns/v6/creator/long_text/article/images?_proxy_timeout=600000';
  const url = `https://edith.xiaohongshu.com${urlPath}`;
  const postData = JSON.stringify({
    article_content: typeof articleContent === 'string' ? articleContent : JSON.stringify(articleContent),
    album_id: albumId,
  });
  const sign = await getNewSign(urlPath, postData);
  const signJo = JSON.parse(sign);
  if (!signJo || !signJo['X-s']) {
    throw new Error('小红书长文生成图片失败：签名失败，请稍后重试');
  }

  const headers = {
    cookie: appendSignCookie(cookie, signJo),
    referer: 'https://creator.xiaohongshu.com/',
    Origin: 'https://creator.xiaohongshu.com',
    Authorization: '',
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/110.0.0.0',
  };
  headers['X-s'] = signJo['X-s'];
  headers['X-t'] = signJo['X-t'];
  headers['X-S-Common'] = signJo['X-S-Common'] ?? '';

  const result = await $http.post(url, postData, {
    headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
  });

  return result.data;
};

export const getArticleTemplatePreviewResponse = async (
  cookie: string,
  articleContent: string | XiaohongshuLongTextArticleContent,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<XiaohongshuArticleTemplatePreviewResponse> => {
  const urlPath = '/web_api/sns/v6/creator/long_text/template/preview?_proxy_timeout=600000';
  const url = `https://edith.xiaohongshu.com${urlPath}`;
  const postData = JSON.stringify({
    article_content: typeof articleContent === 'string' ? articleContent : JSON.stringify(articleContent),
  });
  const sign = await getNewSign(urlPath, postData);
  const signJo = JSON.parse(sign);
  if (!signJo || !signJo['X-s']) {
    throw new Error('小红书长文模板封面推荐失败：签名失败，请稍后重试');
  }

  const headers = {
    cookie: appendSignCookie(cookie, signJo),
    referer: 'https://creator.xiaohongshu.com/',
    Origin: 'https://creator.xiaohongshu.com',
    Authorization: '',
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/110.0.0.0',
  };
  headers['X-s'] = signJo['X-s'];
  headers['X-t'] = signJo['X-t'];
  headers['X-S-Common'] = signJo['X-S-Common'] ?? '';

  const result = await $http.post(url, postData, {
    headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
  });

  return result.data;
};

export const generateArticleSummaryResponse = async (
  cookie: string,
  summaryContent: XiaohongshuArticleSummaryRequestContent,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<XiaohongshuArticleSummaryResponse> => {
  const urlPath = '/web_api/sns/v6/creator/long_text/edit/summary/generate?_proxy_timeout=600000';
  const url = `https://edith.xiaohongshu.com${urlPath}`;
  const postData = JSON.stringify({
    content: JSON.stringify(summaryContent),
  });
  const sign = await getNewSign(urlPath, postData);
  const signJo = JSON.parse(sign);
  if (!signJo || !signJo['X-s']) {
    throw new Error('小红书长文摘要生成失败：签名失败，请稍后重试');
  }

  const headers = {
    cookie: appendSignCookie(cookie, signJo),
    referer: 'https://creator.xiaohongshu.com/',
    Origin: 'https://creator.xiaohongshu.com',
    Authorization: '',
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/110.0.0.0',
  };
  headers['X-s'] = signJo['X-s'];
  headers['X-t'] = signJo['X-t'];
  headers['X-S-Common'] = signJo['X-S-Common'] ?? '';

  const result = await $http.post(url, postData, {
    headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
  });

  return result.data;
};

export const buildXiaohongshuArticleContent = (
  input: XiaohongshuArticleImageGenerateInput,
): XiaohongshuLongTextArticleContent => {
  const sourceContent = input.content ?? '';
  const normalizedContent = normalizeContent(sourceContent, input.images ?? []);
  const model = getModelObject(input.model);
  const template = resolveTemplate(input, model);
  const content = normalizedContent.content;
  const title = input.title ?? '';
  const wordNum = Array.from(content.replace(/\s/g, '')).length;
  const costTime = Math.max(1, Math.ceil(wordNum / 350));
  const coverImage = input.coverImage ?? model?.coverImage ?? '';
  const coverImages = coverImage
    ? [{ imageUrl: coverImage, darkMode: 0, authorDarkMode: 0, titleDarkMode: 0 }]
    : [];
  const cover: XiaohongshuLongTextCover = {
    readingStats: `全文${wordNum}字 | 阅读需${costTime}分钟`,
    titleText: title,
    authorText: input.author ?? model?.author ?? '',
    summeryText: input.summary ?? model?.summary ?? createSummary(content),
    imgPath: coverImage,
    coverImages,
    darkMode: false,
    authorDarkMode: false,
    titleDarkMode: false,
    styleType: 0,
    wordNum,
    costTime,
    ...(model?.cover ?? {}),
  };
  const layoutProfile = createArticleLayoutProfile(template);
  const maxCharsPerCard = input.maxCharsPerCard ?? getArticleCardMaxLayoutLength(layoutProfile);
  const cards = buildCards(
    sourceContent,
    normalizedContent.images,
    maxCharsPerCard,
    input.maxCharsPerCard !== undefined
      ? getArticleTitleFirstCardMaxChars(template, maxCharsPerCard)
      : getArticleTitleFirstCardMaxLayoutLength(template, title, layoutProfile, maxCharsPerCard),
    layoutProfile,
  );
  if (isArticleCardTitleTemplate(template)) {
    applyArticleTitleCardNodes(cards, cover, template);
  }

  return {
    config: {
      colorMap: template.colorMap ?? defaultColorMap,
      cover,
      themeId: input.themeId ?? template.themeId ?? 0,
    },
    cards,
  };
};

const applyArticleContentCoverRecommend = async (
  input: XiaohongshuArticleImageGenerateInput,
  articleContent: XiaohongshuLongTextArticleContent,
): Promise<XiaohongshuLongTextArticleContent> => {
  const response = await getArticleTemplatePreviewResponse(input.cookie, articleContent, input.proxyAgent);
  if (!response?.success || response.code !== 0) {
    throw new Error(`小红书长文模板封面推荐失败：${response?.msg ?? '未获取到模板推荐'}`);
  }

  const imageCover = findArticleTemplateImageCover(input, response.data?.templates ?? []);
  if (!imageCover) {
    return articleContent;
  }

  setArticleContentCoverValues(articleContent.config.cover, imageCover);
  return articleContent;
};

const findArticleTemplateImageCover = (
  input: XiaohongshuArticleImageGenerateInput,
  templates: Array<XiaohongshuArticleTemplatePreviewItem>,
): XiaohongshuArticleTemplateCoverType | undefined => {
  const model = getModelObject(input.model);
  const template = resolveTemplate(input, model);
  const inputTemplateId =
    parseTemplateNumber(input.albumId) ??
    parseTemplateNumber(input.templateId) ??
    parseTemplateNumber(model?.albumId) ??
    parseTemplateNumber(model?.templateId) ??
    parseTemplateNumber(model?.id) ??
    getRawModelTemplateId(input.model);
  const templateIds = [
    inputTemplateId,
    parseTemplateNumber(template.id),
    parseTemplateNumber(template.albumId),
    parseTemplateNumber(template.templateId),
  ].filter((id): id is number => id !== undefined);
  const names = [model?.name, template.name].filter((name): name is string => !!name);

  for (const templateId of templateIds) {
    const imageCover = getTemplateImageCover(templates.find((item) => item.id === templateId));
    if (imageCover) {
      return imageCover;
    }
  }

  for (const name of names) {
    for (const previewTemplate of templates.filter((item) => item.name === name)) {
      const imageCover = getTemplateImageCover(previewTemplate);
      if (imageCover) {
        return imageCover;
      }
    }
  }

  if (isArticleCardTitleTemplate(template)) {
    const imageCover = getTemplateImageCover(templates.find((item) => item.id === defaultXiaohongshuArticleTemplate.id));
    if (imageCover) {
      return imageCover;
    }
  }

  return undefined;
};

const getTemplateImageCover = (
  template?: XiaohongshuArticleTemplatePreviewItem,
): XiaohongshuArticleTemplateCoverType | undefined => {
  const imageCover = template?.cover_types?.find((coverType) => !!coverType.cover_images?.length);
  if (imageCover) {
    return imageCover;
  }
  return template?.cover_types?.find((coverType) => {
    return coverType.name?.includes('有图封面') && (!!coverType.preview_url || !!coverType.cover_images?.length);
  });
};

const setArticleContentCoverValues = (
  cover: XiaohongshuLongTextCover,
  imageCover: XiaohongshuArticleTemplateCoverType,
): void => {
  const firstCoverImage = imageCover.cover_images?.[0];
  if (firstCoverImage?.image_url) {
    cover.imgPath = firstCoverImage.image_url;
  }
  if (imageCover.style_type !== undefined) {
    cover.styleType = imageCover.style_type;
  }
  cover.coverImages = (imageCover.cover_images ?? []).map((image) => ({
    imageUrl: image.image_url,
    darkMode: image.dark_mode ?? 0,
    authorDarkMode: image.author_dark_mode ?? 0,
    titleDarkMode: image.title_dark_mode ?? 0,
  }));

  if (firstCoverImage) {
    cover.darkMode = (firstCoverImage.dark_mode ?? 0) === 1;
    cover.authorDarkMode = (firstCoverImage.author_dark_mode ?? 0) === 1;
    cover.titleDarkMode = (firstCoverImage.title_dark_mode ?? 0) === 1;
  }
};

const resolveArticleContent = async (
  input: XiaohongshuArticleImageGenerateInput,
): Promise<string | XiaohongshuLongTextArticleContent> => {
  const model = input.model;
  if (typeof model === 'string') {
    const parsed = parseModelString(model);
    if (parsed) {
      return parsed;
    }
  }
  if (typeof model === 'object' && model) {
    if (isArticleContent(model)) {
      return model;
    }
    if (model.articleContent) {
      return model.articleContent;
    }
  }
  const resolvedInput = {
    ...input,
    ...(await resolveHtmlContent(input)),
  };
  const generatedSummary = await resolveArticleGeneratedSummary(resolvedInput);
  return buildXiaohongshuArticleContent({
    ...resolvedInput,
    ...(generatedSummary ? { summary: generatedSummary } : {}),
  });
};

const resolveArticleGeneratedSummary = async (
  input: XiaohongshuArticleImageGenerateInput,
): Promise<string | undefined> => {
  const model = getModelObject(input.model);
  if (input.summary !== undefined || model?.summary !== undefined) {
    return undefined;
  }
  try {
    const response = await generateArticleSummaryResponse(
      input.cookie,
      createArticleSummaryRequestContent(input),
      input.proxyAgent,
    );
    if (!response?.success || response.code !== 0) {
      return undefined;
    }
    return parseArticlePicSummary(response.data?.summary);
  } catch (e) {
    return undefined;
  }
};

const createArticleSummaryRequestContent = (
  input: XiaohongshuArticleImageGenerateInput,
): XiaohongshuArticleSummaryRequestContent => ({
  title: input.title ?? '',
  content: {
    type: 'doc',
    content: createArticleSummaryNodes(buildSegments(input.content ?? '', input.images ?? [])),
  },
});

const createArticleSummaryNodes = (
  segments: Array<XiaohongshuLongTextContentSegment>,
): Array<XiaohongshuLongTextNode> => {
  const nodes: Array<XiaohongshuLongTextNode> = [];
  for (const segment of segments) {
    if (segment.type === 'image') {
      nodes.push(createImageNode(segment.image));
      continue;
    }
    if (segment.type === 'paragraph') {
      nodes.push(createParagraphNodeByContent(segment.content));
      continue;
    }
    if (segment.type === 'heading') {
      nodes.push(createHeadingNode(segment.text, segment.level));
      continue;
    }
    if (segment.type === 'orderedList') {
      nodes.push(createListNode('orderedList', segment.items));
      continue;
    }
    if (segment.type === 'bulletList') {
      nodes.push(createListNode('bulletList', segment.items));
      continue;
    }
    if (segment.type === 'blockquote') {
      nodes.push(createBlockquoteNode(segment.paragraphs));
      continue;
    }
    nodes.push(createTextNode(segment.text));
  }
  return nodes.length ? nodes : [createTextNode('')];
};

const parseArticlePicSummary = (summary?: string): string | undefined => {
  if (!summary) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(summary) as XiaohongshuArticleGeneratedSummary;
    const picSummary = parsed?.pic_summary?.trim();
    return picSummary || undefined;
  } catch (e) {
    return undefined;
  }
};

const resolveAlbumId = (input: XiaohongshuArticleImageGenerateInput): number => {
  const model = getModelObject(input.model);
  const template = resolveTemplate(input, model);
  const albumId = Number(template.albumId ?? template.templateId ?? template.id);
  if (Number.isFinite(albumId) && albumId > 0) {
    return albumId;
  }
  const defaultAlbumId = Number(defaultXiaohongshuArticleTemplate.albumId);
  if (Number.isFinite(defaultAlbumId) && defaultAlbumId > 0) {
    return defaultAlbumId;
  }
  return 2;
};

const resolveTemplate = (
  input: XiaohongshuArticleImageGenerateInput,
  model: XiaohongshuArticleImageModel | null,
): XiaohongshuArticleImageModel => {
  const templateId =
    parseTemplateNumber(input.albumId) ??
    parseTemplateNumber(input.templateId) ??
    parseTemplateNumber(model?.albumId) ??
    parseTemplateNumber(model?.templateId) ??
    parseTemplateNumber(model?.id) ??
    getRawModelTemplateId(input.model);
  const modelThemeId = parseTemplateNumber(input.themeId) ?? parseTemplateNumber(model?.themeId);
  const matchedTemplate = findXiaohongshuArticleTemplate(templateId, modelThemeId, model?.name);
  const baseTemplate = cloneTemplate(matchedTemplate ?? defaultXiaohongshuArticleTemplate);
  const themeId =
    modelThemeId ??
    matchedTemplate?.themeId ??
    (templateId !== undefined ? xiaohongshuArticleTemplateThemeMap[templateId] : undefined) ??
    defaultXiaohongshuArticleTemplate.themeId;
  baseTemplate.maxCharsPerCard = xiaohongshuArticleTemplateMaxCharsPerCard[themeId] ?? baseTemplate.maxCharsPerCard;
  const albumId =
    templateId ??
    matchedTemplate?.albumId ??
    (themeId !== undefined ? xiaohongshuArticleThemeAlbumMap[themeId] : undefined) ??
    defaultXiaohongshuArticleTemplate.albumId;
  return {
    ...baseTemplate,
    ...(model ?? {}),
    albumId,
    templateId: albumId,
    themeId,
    colorMap: model?.colorMap ?? model?.colors?.[0]?.colorMap ?? baseTemplate.colorMap,
    colors: model?.colors ?? baseTemplate.colors,
    previewImages: model?.previewImages ?? baseTemplate.previewImages,
  };
};

const isArticleCardTitleTemplate = (template: XiaohongshuArticleImageModel): boolean => {
  const themeId = getArticleTemplateThemeId(template);
  return themeId !== undefined && xiaohongshuArticleCardTitleThemeIds.has(themeId);
};

const shouldUseTopDecoration = (template: XiaohongshuArticleImageModel): boolean => {
  const themeId = getArticleTemplateThemeId(template);
  return themeId !== undefined && xiaohongshuArticleTopDecorationThemeIds.has(themeId);
};

const getArticleTemplateThemeId = (template: XiaohongshuArticleImageModel): number | undefined => {
  const themeId = parseTemplateNumber(template.themeId);
  if (themeId !== undefined) {
    return themeId;
  }
  const templateId = [template.id, template.albumId, template.templateId]
    .map((id) => parseTemplateNumber(id))
    .find((id) => id !== undefined);
  if (templateId === undefined) {
    return undefined;
  }
  return xiaohongshuArticleTemplateThemeMap[templateId] ?? templateId;
};

const findXiaohongshuArticleTemplate = (
  templateId?: number,
  themeId?: number,
  name?: string,
): XiaohongshuArticleTemplate | undefined => {
  if (templateId !== undefined) {
    const template = xiaohongshuArticleTemplates.find((item) => {
      return item.id === templateId || item.albumId === templateId || item.templateId === templateId;
    });
    if (template) {
      return template;
    }
  }
  if (themeId !== undefined) {
    const template = xiaohongshuArticleTemplates.find((item) => item.themeId === themeId);
    if (template) {
      return template;
    }
  }
  if (name) {
    return xiaohongshuArticleTemplates.find((item) => item.name === name);
  }
  return undefined;
};

const getRawModelTemplateId = (model: XiaohongshuArticleImageGenerateInput['model']): number | undefined => {
  if (typeof model === 'number') {
    return parseTemplateNumber(model);
  }
  if (typeof model === 'string' && /^\d+$/.test(model.trim())) {
    return parseTemplateNumber(model);
  }
  return undefined;
};

const parseTemplateNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined;
};

const cloneTemplate = (template: XiaohongshuArticleTemplate): XiaohongshuArticleTemplate => ({
  ...template,
  colorMap: { ...template.colorMap },
  colors: template.colors.map((color) => ({
    ...color,
    colorMap: { ...color.colorMap },
    previewImages: [...color.previewImages],
  })),
  previewImages: [...template.previewImages],
});

const resolveHtmlContent = async (
  input: XiaohongshuArticleImageGenerateInput,
): Promise<Pick<XiaohongshuArticleImageGenerateInput, 'content' | 'images'>> => {
  const content = input.content ?? '';
  if (!isHtmlContent(content)) {
    return { content, images: input.images ?? [] };
  }
  const normalized = normalizeContent(content, []);
  const htmlImages = input.uploadHtmlImages === false
    ? normalized.images
    : await uploadHtmlImages(input.cookie, normalized.images);
  return {
    content: replaceHtmlImageSources(content, htmlImages),
    images: input.images ?? [],
  };
};

const normalizeContent = (content: string, images: Array<ImageInfo>): { content: string; images: Array<ImageInfo> } => {
  if (!isHtmlContent(content)) {
    return { content, images };
  }
  const html = new HtmlDocument();
  html.LoadHtml(wrapHtml(content));
  const htmlImages = extractHtmlImages(content);
  return {
    content: html.DocumentNode.InnerText(),
    images: [...htmlImages, ...images],
  };
};

const extractHtmlImages = (content: string): Array<ImageInfo> => {
  const html = new HtmlDocument();
  html.LoadHtml(wrapHtml(content));
  return html.DocumentNode.SelectNodes('//img')
    .map((img) => {
      const pathOrUrl = getHtmlImageSrc(img);
      if (!pathOrUrl) {
        return null;
      }
      const { width, height } = getHtmlImageSize(img);
      return {
        pathOrUrl,
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      };
    })
    .filter((image): image is ImageInfo => !!image);
};

const getHtmlImageSrc = (img: Element): string => {
  const src =
    img.getAttribute('src') ??
    img.getAttribute('data-src') ??
    img.getAttribute('data-original') ??
    img.getAttribute('data-original-src') ??
    img.getAttribute('original-src') ??
    '';
  return normalizeHtmlImageSrc(src);
};

const normalizeHtmlImageSrc = (src: string): string => {
  const value = src.trim();
  if (value.startsWith('//')) {
    return `https:${value}`;
  }
  return value;
};

const getHtmlImageSize = (img: Element): Pick<ImageInfo, 'width' | 'height'> => {
  const width = getHtmlImageDimension(img, [
    'width',
    'data-width',
    'data-w',
    'data-raw-width',
    'data-rawwidth',
    'data-original-width',
    'data-originalwidth',
  ]);
  const height = getHtmlImageDimension(img, [
    'height',
    'data-height',
    'data-h',
    'data-raw-height',
    'data-rawheight',
    'data-original-height',
    'data-originalheight',
  ]);
  return {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
};

const getHtmlImageDimension = (img: Element, attrs: Array<string>): number | undefined => {
  for (const attr of attrs) {
    const size = parseImageSize(img.getAttribute(attr));
    if (size) {
      return size;
    }
  }
  return parseStyleImageSize(img.getAttribute('style'), attrs[0]);
};

const parseImageSize = (value: string | null): number | undefined => {
  const matched = value?.trim().match(/^(\d+(?:\.\d+)?)(?:px)?$/i);
  const size = matched ? Number(matched[1]) : NaN;
  return Number.isFinite(size) && size > 0 ? size : undefined;
};

const parseStyleImageSize = (style: string | null, property: string): number | undefined => {
  if (!style) {
    return undefined;
  }
  const matched = style.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*(\\d+(?:\\.\\d+)?)px\\b`, 'i'));
  const size = matched ? Number(matched[1]) : NaN;
  return Number.isFinite(size) && size > 0 ? size : undefined;
};

const replaceHtmlImageSources = (content: string, images: Array<ImageInfo>): string => {
  if (!images.length) {
    return content;
  }
  const html = new HtmlDocument();
  html.LoadHtml(wrapHtml(content));
  const imgNodes = html.DocumentNode.SelectNodes('//img');
  for (let i = 0; i < imgNodes.length; i++) {
    const image = images[i];
    if (image?.pathOrUrl) {
      imgNodes[i].setAttribute('src', image.pathOrUrl);
    }
  }
  return html.DocumentNode.OuterHtml();
};

const uploadHtmlImages = async (cookie: string, images: Array<ImageInfo>): Promise<Array<ImageInfo>> => {
  const result: Array<ImageInfo> = [];
  for (const image of images) {
    if (!image.pathOrUrl) {
      continue;
    }
    try {
      const uploadResult = await uploadXiaohongshuDynamicImage(cookie, image.pathOrUrl);
      result.push({
        ...image,
        pathOrUrl: uploadResult.previewUrl,
      });
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : '图片上传失败';
      throw new Error(`小红书长文 HTML 图片上传失败：${message}`);
    }
  }
  return result;
};

const isHtmlContent = (content: string): boolean => {
  return /<\/?[a-z][\s\S]*>/i.test(content);
};

const wrapHtml = (content: string): string => {
  return /^<html[\s>]/i.test(content.trim()) ? content : `<html><body>${content}</body></html>`;
};

const parseModelString = (model: string): string | XiaohongshuLongTextArticleContent | null => {
  const value = model.trim();
  if (!value.startsWith('{')) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch (e) {
    throw new Error('小红书长文生成图片失败：模板参数格式不正确');
  }
  if (isArticleContent(parsed)) {
    return parsed;
  }
  const parsedModel = parsed as XiaohongshuArticleImageModel;
  if (parsedModel?.articleContent) {
    return parsedModel.articleContent;
  }
  return null;
};

const getModelObject = (
  model: XiaohongshuArticleImageGenerateInput['model'],
): XiaohongshuArticleImageModel | null => {
  if (typeof model !== 'object' || !model || isArticleContent(model)) {
    return null;
  }
  return model;
};

const isArticleContent = (value: unknown): value is XiaohongshuLongTextArticleContent => {
  const data = value as XiaohongshuLongTextArticleContent;
  return !!data?.config && Array.isArray(data?.cards);
};

const buildCards = (
  content: string,
  images: Array<ImageInfo>,
  maxCharsPerCard: number,
  firstCardMaxChars?: number,
  layoutProfile: XiaohongshuArticleLayoutProfile = createArticleLayoutProfile(defaultXiaohongshuArticleTemplate),
): Array<XiaohongshuLongTextCard> => {
  return buildCardsBySegments(buildSegments(content, images), maxCharsPerCard, firstCardMaxChars, layoutProfile);
};

const buildCardsBySegments = (
  segments: Array<XiaohongshuLongTextContentSegment>,
  maxCharsPerCard: number,
  firstCardMaxChars?: number,
  layoutProfile: XiaohongshuArticleLayoutProfile = createArticleLayoutProfile(defaultXiaohongshuArticleTemplate),
): Array<XiaohongshuLongTextCard> => {
  const state: XiaohongshuLongTextCardBuildState = {
    cards: [],
    currentNodes: [],
    currentLength: 0,
    maxCharsPerCard: Math.max(1, maxCharsPerCard),
    firstCardMaxChars,
    layoutProfile,
  };

  for (const segment of segments) {
    if (segment.type === 'image') {
      pushImageSegment(state, segment.image);
      continue;
    }
    if (segment.type === 'paragraph') {
      pushParagraphContentSegment(state, segment.content);
      continue;
    }
    if (segment.type === 'heading') {
      pushStructuredNode(state, createHeadingNode(segment.text, segment.level));
      continue;
    }
    if (segment.type === 'orderedList') {
      pushListSegment(state, 'orderedList', segment.items);
      continue;
    }
    if (segment.type === 'bulletList') {
      pushListSegment(state, 'bulletList', segment.items);
      continue;
    }
    if (segment.type === 'blockquote') {
      pushStructuredNode(state, createBlockquoteNode(segment.paragraphs));
      continue;
    }
    pushTextSegment(state, segment.text);
  }

  flushCurrentCard(state);
  return state.cards.length ? state.cards : [{ type: 'doc', content: [createTextNode('')] }];
};

const applyArticleTitleCardNodes = (
  cards: Array<XiaohongshuLongTextCard>,
  cover: XiaohongshuLongTextCover,
  template: XiaohongshuArticleImageModel,
): void => {
  if (!cards.length || !cover.titleText) {
    return;
  }
  const firstCard = cards[0];
  if (firstCard.content.some((node) => node.type === 'articleTitle')) {
    return;
  }
  const titleNodes = shouldUseTopDecoration(template)
    ? [createTopDecorationNode(), createArticleTitleNode(cover)]
    : [createArticleTitleNode(cover)];
  firstCard.content = [...titleNodes, ...firstCard.content];
};

const pushImageSegment = (state: XiaohongshuLongTextCardBuildState, image: ImageInfo): void => {
  let node = createImageNode(image, state.layoutProfile, getCurrentImageMaxLayoutHeight(state, image));
  let nodeLength = getNodeTextLength(node, state);
  if (state.currentNodes.length && state.currentLength + nodeLength > getCurrentCardMaxChars(state)) {
    if (shouldKeepOverflowImageAtCardEnd(state)) {
      state.currentNodes.push(node);
      state.currentLength += nodeLength;
      flushCurrentCard(state);
      return;
    }
    flushCurrentCard(state);
    node = createImageNode(image, state.layoutProfile);
    nodeLength = getNodeTextLength(node, state);
  }
  state.currentNodes.push(node);
  state.currentLength += nodeLength;
};

const shouldKeepOverflowImageAtCardEnd = (state: XiaohongshuLongTextCardBuildState): boolean => {
  return state.layoutProfile.themeId === 49 && state.cards.length === 1;
};

const getCurrentImageMaxLayoutHeight = (
  state: XiaohongshuLongTextCardBuildState,
  image: ImageInfo,
): number | undefined => {
  if (!state.currentNodes.length) {
    return undefined;
  }
  if (xiaohongshuArticleDisableImageAutoScaleThemeIds.has(state.layoutProfile.themeId)) {
    return undefined;
  }
  const spacing = getNodeSpacingLength(state, 'image');
  const availableHeight = getCurrentCardMaxChars(state) - state.currentLength - spacing;
  const adjustedAvailableHeight = availableHeight - getImageMaxLayoutHeightAdjust(state.layoutProfile);
  if (adjustedAvailableHeight < getImageMinLayoutLength(image, state.layoutProfile)) {
    return undefined;
  }
  return adjustedAvailableHeight;
};

const getCurrentCardAvailableTextChars = (
  state: XiaohongshuLongTextCardBuildState,
  nodeType: XiaohongshuLongTextNode['type'],
  content?: Array<XiaohongshuLongTextTextNode>,
): number => {
  const spacing = getNodeSpacingLength(state, nodeType);
  const imageTextReserve =
    nodeType === 'paragraph' && state.currentNodes.some((node) => node.type === 'image')
      ? xiaohongshuArticleImageCardTextReserveByTheme[state.layoutProfile.themeId] ?? 0
      : 0;
  const availableHeight =
    getCurrentCardMaxChars(state) -
    state.currentLength -
    spacing -
    imageTextReserve -
    getTextContentExtraHeight(content, state.layoutProfile);
  return getTextCharsByHeight(availableHeight, state.layoutProfile.textLayout, state.layoutProfile.textWidth);
};

const pushParagraphContentSegment = (
  state: XiaohongshuLongTextCardBuildState,
  content: Array<XiaohongshuLongTextTextNode>,
): void => {
  const text = getTextContentText(content).trim();
  const chars = Array.from(text);
  if (!chars.length) {
    pushStructuredNode(state, createParagraphNodeByContent([]));
    return;
  }

  const uuid = Guid.NewGuid().toString();
  let offset = 0;
  while (offset < chars.length) {
    const remaining = chars.length - offset;
    const available = getCurrentCardAvailableTextChars(state, 'paragraph', content);
    if (state.currentNodes.length && available <= 0) {
      flushCurrentCard(state);
      continue;
    }
    if (
      offset === 0 &&
      state.currentNodes.length &&
      remaining > available &&
      available < getMinParagraphStartLength(state)
    ) {
      flushCurrentCard(state);
      continue;
    }

    if (state.currentNodes.length && remaining > available) {
      const chunkContent = sliceTextContentNodes(content, offset, available);
      const node = createParagraphNodeByContent(chunkContent, {
        uuid,
        hasSplit: offset > 0,
        charPositionInPara: offset,
        left: true,
      });
      state.currentNodes.push(node);
      state.currentLength += getNodeTextLength(node, state);
      flushCurrentCard(state);
      offset += available;
      continue;
    }

    const chunkLength = Math.max(1, Math.min(remaining, available));
    const chunkContent = sliceTextContentNodes(content, offset, chunkLength);
    const hasMoreText = offset + chunkLength < chars.length;
    const node = createParagraphNodeByContent(chunkContent, {
      uuid,
      hasSplit: offset > 0,
      charPositionInPara: offset,
      left: hasMoreText,
    });
    state.currentNodes.push(node);
    state.currentLength += getNodeTextLength(node, state);
    offset += chunkLength;
    if (hasMoreText) {
      flushCurrentCard(state);
    }
  }
};

const getMinParagraphStartLength = (state: XiaohongshuLongTextCardBuildState): number => {
  return xiaohongshuArticleMinParagraphStartLengthByTheme[state.layoutProfile.themeId] ??
    xiaohongshuArticleMinParagraphStartLength;
};

const pushStructuredNode = (state: XiaohongshuLongTextCardBuildState, node: XiaohongshuLongTextNode): void => {
  let nodeLength = getNodeTextLength(node, state);
  if (state.currentNodes.length && state.currentLength + nodeLength > getCurrentCardMaxChars(state)) {
    flushCurrentCard(state);
    nodeLength = getNodeTextLength(node, state);
  }
  state.currentNodes.push(node);
  state.currentLength += nodeLength;
  if (state.currentLength >= getCurrentCardMaxChars(state)) {
    flushCurrentCard(state);
  }
};

const pushListSegment = (
  state: XiaohongshuLongTextCardBuildState,
  type: 'orderedList' | 'bulletList',
  items: Array<string>,
): void => {
  let listStart = 1;
  let pendingItems: Array<XiaohongshuLongTextListItemNode> = [];
  for (let index = 0; index < items.length; index++) {
    const itemText = items[index].trim();
    const chars = Array.from(itemText);
    const itemUuid = Guid.NewGuid().toString();
    let offset = 0;
    if (!chars.length) {
      if (!pendingItems.length) {
        listStart = index + 1;
      }
      pendingItems.push(createListItemNode('', undefined, false));
      continue;
    }
    while (offset < chars.length) {
      const remaining = chars.length - offset;
      const fitLength = getFittingListItemTextLength(
        state,
        type,
        pendingItems,
        listStart,
        chars,
        offset,
        remaining,
        index,
        items.length,
        itemUuid,
      );
      if (fitLength <= 0) {
        if (pendingItems.length) {
          pushStructuredNode(state, createListNodeByItems(type, pendingItems, listStart, true));
          pendingItems = [];
          flushCurrentCard(state);
          continue;
        }
        if (state.currentNodes.length) {
          flushCurrentCard(state);
          continue;
        }
      }
      const chunkLength = Math.max(1, fitLength);
      const hasMoreText = offset + chunkLength < chars.length;
      if (!pendingItems.length) {
        listStart = index + 1;
      }
      pendingItems.push(createListItemNode(chars.slice(offset, offset + chunkLength).join(''), {
        uuid: itemUuid,
        hasSplit: offset > 0,
        charPositionInPara: offset,
        left: hasMoreText,
      }, offset > 0));
      offset += chunkLength;
      if (hasMoreText) {
        pushStructuredNode(state, createListNodeByItems(type, pendingItems, listStart, true));
        pendingItems = [];
        flushCurrentCard(state);
      }
    }
  }
  if (pendingItems.length) {
    pushStructuredNode(state, createListNodeByItems(type, pendingItems, listStart));
  }
};

const getFittingListItemTextLength = (
  state: XiaohongshuLongTextCardBuildState,
  type: 'orderedList' | 'bulletList',
  pendingItems: Array<XiaohongshuLongTextListItemNode>,
  listStart: number,
  chars: Array<string>,
  offset: number,
  maxLength: number,
  itemIndex: number,
  itemCount: number,
  itemUuid: string,
): number => {
  let low = 1;
  let high = maxLength;
  let best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const hasMoreText = offset + mid < chars.length;
    const start = pendingItems.length ? listStart : itemIndex + 1;
    const candidateItem = createListItemNode(chars.slice(offset, offset + mid).join(''), {
      uuid: itemUuid,
      hasSplit: offset > 0,
      charPositionInPara: offset,
      left: hasMoreText,
    }, offset > 0);
    const candidateNode = createListNodeByItems(
      type,
      [...pendingItems, candidateItem],
      start,
      hasMoreText || itemIndex < itemCount - 1,
    );
    const candidateLength = getNodeTextLength(candidateNode, state);
    if (state.currentLength + candidateLength <= getCurrentCardMaxChars(state)) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
};

const pushTextSegment = (state: XiaohongshuLongTextCardBuildState, sourceText: string): void => {
  const text = sourceText.trim();
  const chars = Array.from(text);
  if (!chars.length) {
    if (state.currentNodes.length) {
      pushStructuredNode(state, createTextNode(''));
    }
    return;
  }

  const uuid = Guid.NewGuid().toString();
  let offset = 0;
  while (offset < chars.length) {
    const remaining = chars.length - offset;
    const available = getCurrentCardAvailableTextChars(state, 'paragraph');
    if (state.currentNodes.length && available <= 0) {
      flushCurrentCard(state);
      continue;
    }

    if (state.currentNodes.length && remaining > available) {
      const chunk = chars.slice(offset, offset + available).join('');
      const node = createTextNode(chunk, {
        uuid,
        hasSplit: false,
        charPositionInPara: offset,
        left: true,
      });
      state.currentNodes.push(node);
      state.currentLength += getNodeTextLength(node, state);
      flushCurrentCard(state);
      offset += available;
      continue;
    }

    const chunkLength = Math.max(1, Math.min(remaining, available));
    const chunk = chars.slice(offset, offset + chunkLength).join('');
    const hasMoreText = offset + chunkLength < chars.length;
    const node = createTextNode(chunk, {
      uuid,
      hasSplit: offset > 0,
      charPositionInPara: offset,
      left: hasMoreText,
    });
    state.currentNodes.push(node);
    state.currentLength += getNodeTextLength(node, state);
    offset += chunkLength;
    if (hasMoreText) {
      flushCurrentCard(state);
    }
  }
};

const flushCurrentCard = (state: XiaohongshuLongTextCardBuildState): void => {
  if (!state.currentNodes.length) {
    return;
  }
  state.cards.push({ type: 'doc', content: state.currentNodes });
  state.currentNodes = [];
  state.currentLength = 0;
};

const getCurrentCardMaxChars = (state: XiaohongshuLongTextCardBuildState): number => {
  if (!state.cards.length && state.firstCardMaxChars !== undefined) {
    return Math.max(1, Math.min(state.maxCharsPerCard, state.firstCardMaxChars));
  }
  return state.maxCharsPerCard;
};

const getArticleTitleFirstCardMaxChars = (
  template: XiaohongshuArticleImageModel,
  maxCharsPerCard: number,
): number | undefined => {
  const themeId = getArticleTemplateThemeId(template);
  if (themeId === undefined || !xiaohongshuArticleCardTitleThemeIds.has(themeId)) {
    return undefined;
  }
  const firstCardMaxChars = shouldUseTopDecoration(template)
    ? xiaohongshuArticleTopDecorationFirstCardMaxChars[themeId] ??
      xiaohongshuArticleDefaultTopDecorationFirstCardMaxChars
    : xiaohongshuArticleTitleFirstCardMaxCharsByTheme[themeId] ?? xiaohongshuArticleTitleFirstCardMaxChars;
  return Math.min(Math.max(1, maxCharsPerCard), firstCardMaxChars);
};

const createArticleLayoutProfile = (template: XiaohongshuArticleImageModel): XiaohongshuArticleLayoutProfile => {
  const themeId = getArticleTemplateThemeId(template) ?? 0;
  const layout = xiaohongshuArticleThemeLayoutMap[themeId] ?? xiaohongshuArticleDefaultThemeLayout;
  const imageLayout = xiaohongshuArticleThemeImageLayoutMap[themeId] ?? xiaohongshuArticleDefaultThemeImageLayout;
  const textLayout = xiaohongshuArticleThemeTextLayoutMap[themeId] ?? xiaohongshuArticleThemeTextLayoutMap[0];
  const contentWidth = layout.width - layout.left_margin - layout.right_margin;
  const imageWidth = Math.max(1, contentWidth - imageLayout.single.left_gap - imageLayout.single.right_gap);
  return {
    themeId,
    layout,
    imageLayout,
    textLayout,
    contentWidth,
    contentHeight: layout.height - layout.top_margin - layout.bottom_margin,
    textWidth: textLayout.textWidth ?? contentWidth,
    imageWidth,
    pageBottomSafety: xiaohongshuArticleThemePageBottomSafety[themeId] ?? xiaohongshuArticleDefaultPageBottomSafety,
  };
};

const getArticleCardMaxLayoutLength = (profile: XiaohongshuArticleLayoutProfile): number => {
  return Math.max(
    profile.textLayout.lineHeight,
    profile.contentHeight - getEffectivePageBottomSafety(profile),
  );
};

const getEffectivePageBottomSafety = (profile: XiaohongshuArticleLayoutProfile): number => {
  const defaultBottomSafety = profile.textLayout.lineHeight * xiaohongshuArticleBottomReservedLineCount;
  return profile.pageBottomSafety > defaultBottomSafety ? profile.pageBottomSafety : defaultBottomSafety;
};

const getArticleTitleFirstCardMaxLayoutLength = (
  template: XiaohongshuArticleImageModel,
  title: string,
  profile: XiaohongshuArticleLayoutProfile,
  maxLayoutLength: number,
): number | undefined => {
  const themeId = profile.themeId;
  if (!xiaohongshuArticleCardTitleThemeIds.has(themeId)) {
    return undefined;
  }
  const titleReserve = getArticleTitleLayoutLength(title, profile, shouldUseTopDecoration(template));
  const firstCardBottomSafety = getArticleFirstCardBottomSafetyLength(profile);
  return Math.max(
    profile.textLayout.lineHeight,
    Math.min(maxLayoutLength, maxLayoutLength - titleReserve - firstCardBottomSafety),
  );
};

const getArticleFirstCardBottomSafetyLength = (profile: XiaohongshuArticleLayoutProfile): number => {
  return (xiaohongshuArticleFirstCardBottomSafetyLineCountByTheme[profile.themeId] ?? 0) * profile.textLayout.lineHeight;
};

const getArticleTitleLayoutLength = (
  title: string,
  profile: XiaohongshuArticleLayoutProfile,
  hasTopDecoration: boolean,
): number => {
  const titleFontSize = profile.themeId === 10 || profile.themeId === 7 ? 52 : 56;
  const titleLineHeight = titleFontSize * 1.35;
  const titleCharsPerLine = Math.max(1, Math.floor(profile.contentWidth / titleFontSize));
  const titleLines = Math.max(1, Math.ceil(Array.from(title || '').length / titleCharsPerLine));
  const topDecorationHeight = hasTopDecoration ? profile.layout.top_special_spacing + 80 : 0;
  return (
    topDecorationHeight +
    titleLines * titleLineHeight +
    120 +
    (xiaohongshuArticleTitleLayoutExtraReserveByTheme[profile.themeId] ?? 0)
  );
};

const buildSegments = (content: string, images: Array<ImageInfo>): Array<XiaohongshuLongTextContentSegment> => {
  if (!isHtmlContent(content)) {
    return [
      ...content.split(/\r?\n/).map((text) => ({ type: 'text' as const, text })),
      ...images.map((image) => ({ type: 'image' as const, image })),
    ];
  }
  const html = new HtmlDocument();
  html.LoadHtml(wrapHtml(content));
  const htmlBody = html.DocumentNode.SelectSingleNode('//body') ?? html.DocumentNode.doc;
  const segments: Array<XiaohongshuLongTextContentSegment> = [];
  const restImages = [...images];
  collectHtmlSegments(htmlBody, restImages, segments);
  for (const image of restImages) {
    segments.push({ type: 'image', image });
  }
  return segments.length ? segments : [{ type: 'text', text: html.DocumentNode.InnerText() }];
};

const collectHtmlSegments = (
  node: Node,
  images: Array<ImageInfo>,
  segments: Array<XiaohongshuLongTextContentSegment>,
): void => {
  const nodeName = node.nodeName?.toLowerCase();
  if (nodeName === 'img') {
    const image = images.shift();
    if (image) {
      segments.push({ type: 'image', image });
    }
    return;
  }
  if (nodeName === 'p') {
    if (hasImageNode(node)) {
      for (const childNode of Array.from(node.childNodes ?? [])) {
        collectHtmlSegments(childNode, images, segments);
      }
      return;
    }
    segments.push({ type: 'paragraph', content: collectRichTextContent(node) });
    return;
  }
  if (nodeName === 'blockquote') {
    const paragraphs = collectBlockquoteParagraphs(node);
    if (paragraphs.length) {
      segments.push({ type: 'blockquote', paragraphs });
    }
    return;
  }
  if (nodeName === 'h1' || nodeName === 'h2') {
    const text = getNormalizedNodeText(node);
    if (text) {
      segments.push({ type: 'heading', text, level: nodeName === 'h1' ? 1 : 2 });
    }
    return;
  }
  if (nodeName === 'ol' || nodeName === 'ul') {
    const items = collectListItemTexts(node);
    if (items.length) {
      segments.push({ type: nodeName === 'ol' ? 'orderedList' : 'bulletList', items });
    }
    return;
  }
  if (isHighlightNode(node)) {
    const content = collectRichTextContent(node);
    if (content.length) {
      segments.push({ type: 'paragraph', content });
    }
    return;
  }
  if (node.nodeName === '#text') {
    const textSegments = splitTextContent(node.textContent ?? '');
    for (const text of textSegments) {
      segments.push({ type: 'text', text });
    }
    return;
  }
  const childNodes = Array.from(node.childNodes ?? []);
  for (const childNode of childNodes) {
    collectHtmlSegments(childNode, images, segments);
  }
  if (['div', 'section', 'article', 'br', 'h3', 'h4'].includes(nodeName) && !(hasImageNode(node) && !getNormalizedNodeText(node))) {
    segments.push({ type: 'text', text: '' });
  }
};

const hasImageNode = (node: Node): boolean => {
  if (node.nodeName?.toLowerCase() === 'img') {
    return true;
  }
  return Array.from(node.childNodes ?? []).some((childNode) => hasImageNode(childNode));
};

const collectListItemTexts = (node: Node): Array<string> => {
  return Array.from(node.childNodes ?? [])
    .filter((childNode) => childNode.nodeName?.toLowerCase() === 'li')
    .map((childNode) => getNormalizedNodeText(childNode))
    .filter(Boolean);
};

const collectBlockquoteParagraphs = (node: Node): Array<Array<XiaohongshuLongTextTextNode>> => {
  const paragraphNodes = Array.from(node.childNodes ?? []).filter((childNode) => {
    return childNode.nodeName?.toLowerCase() === 'p';
  });
  if (paragraphNodes.length) {
    return paragraphNodes.map((childNode) => collectRichTextContent(childNode)).filter((content) => content.length);
  }
  const content = collectRichTextContent(node);
  return content.length ? [content] : [];
};

const collectRichTextContent = (
  node: Node,
  marks: Array<XiaohongshuLongTextTextMark> = [],
): Array<XiaohongshuLongTextTextNode> => {
  const nextMarks = isHighlightNode(node) ? [...marks, { type: 'highlight' as const }] : marks;
  if (node.nodeName === '#text') {
    return splitTextContent(node.textContent ?? '').map((text) => createTextContentNode(text, nextMarks));
  }
  return Array.from(node.childNodes ?? []).flatMap((childNode) => collectRichTextContent(childNode, nextMarks));
};

const hasHighlightNode = (node: Node): boolean => {
  if (isHighlightNode(node)) {
    return true;
  }
  return Array.from(node.childNodes ?? []).some((childNode) => hasHighlightNode(childNode));
};

const isHighlightNode = (node: Node): boolean => {
  const nodeName = node.nodeName?.toLowerCase();
  if (nodeName === 'mark') {
    return true;
  }
  const className = getNodeAttribute(node, 'class').toLowerCase();
  const style = getNodeAttribute(node, 'style').toLowerCase();
  const dataType = getNodeAttribute(node, 'data-type').toLowerCase();
  return (
    className.includes('highlight') ||
    dataType === 'highlight' ||
    style.includes('background-color') ||
    style.includes('background:')
  );
};

const getNodeAttribute = (node: Node, name: string): string => {
  return ((node as Element).getAttribute?.(name) ?? '').toString();
};

const getNormalizedNodeText = (node: Node): string => {
  return (node.textContent ?? '').replace(/\s+/g, ' ').trim();
};

const splitTextContent = (content: string): Array<string> => {
  const text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!text.includes('\n')) {
    const trimmed = text.trim();
    return trimmed ? [trimmed] : [];
  }
  return text
    .split(/\n/)
    .map((item) => item.trim())
    .filter((item, index, list) => item || (index > 0 && index < list.length - 1));
};

const createTextNode = (text: string, splitOptions?: XiaohongshuLongTextNodeSplitOptions): XiaohongshuLongTextNode => {
  const attrs = createNodeAttrs(text, splitOptions);
  if (isHeadingText(text)) {
    return {
      type: 'heading',
      attrs: { ...attrs, level: 1, index: '' },
      content: text ? [createTextContentNode(text)] : undefined,
    };
  }
  return createParagraphNodeByContent(text ? [createTextContentNode(text)] : [], splitOptions);
};

const createParagraphNodeByContent = (
  content: Array<XiaohongshuLongTextTextNode>,
  splitOptions?: XiaohongshuLongTextNodeSplitOptions,
): XiaohongshuLongTextParagraphNode => {
  const text = getTextContentText(content);
  return {
    type: 'paragraph',
    attrs: createNodeAttrs(text, splitOptions),
    content: content.length ? content : undefined,
  };
};

const createHeadingNode = (text: string, level: 1 | 2): XiaohongshuLongTextNode => ({
  type: 'heading',
  attrs: { ...createNodeAttrs(text), level, index: '' },
  content: text ? [createTextContentNode(text)] : undefined,
});

const createListNode = (
  type: 'orderedList' | 'bulletList',
  items: Array<string>,
  start: number = 1,
  left: boolean = false,
): XiaohongshuLongTextNode => {
  return createListNodeByItems(type, items.map((item) => createListItemNode(item)), start, left);
};

const createListNodeByItems = (
  type: 'orderedList' | 'bulletList',
  content: Array<XiaohongshuLongTextListItemNode>,
  start: number = 1,
  left: boolean = false,
): XiaohongshuLongTextNode => {
  if (type === 'orderedList') {
    return {
      type,
      attrs: {
        start,
        styleType: 0,
        uuid: Guid.NewGuid().toString(),
        left,
      },
      content,
    };
  }
  return {
    type,
    attrs: {
      styleType: 0,
      uuid: Guid.NewGuid().toString(),
      left,
    },
    content,
  };
};

const createListItemNode = (
  text: string,
  splitOptions?: XiaohongshuLongTextNodeSplitOptions,
  hideMarker: boolean = false,
): XiaohongshuLongTextListItemNode => {
  const textLength = Array.from(text).length;
  return {
    type: 'listItem',
    attrs: {
      order: null,
      uuid: splitOptions?.uuid ?? Guid.NewGuid().toString(),
      hideBullet: hideMarker,
      hideOrder: hideMarker,
      charPositionInPara: splitOptions?.charPositionInPara ?? 0,
      textLength,
      left: splitOptions?.left ?? false,
    },
    content: [
      createParagraphNodeByContent(text ? [createTextContentNode(text)] : [], splitOptions),
    ],
  };
};

const createBlockquoteNode = (paragraphs: Array<Array<XiaohongshuLongTextTextNode>>): XiaohongshuLongTextNode => {
  const content = paragraphs.map((paragraph) => createParagraphNodeByContent(paragraph));
  return {
    type: 'blockquote',
    attrs: {
      uuid: Guid.NewGuid().toString(),
      hasSplit: false,
      charPositionInPara: 0,
      textLength: content.reduce((total, paragraph) => total + paragraph.attrs.textLength, 0),
      left: false,
    },
    content,
  };
};

const createTopDecorationNode = (): XiaohongshuLongTextNode => ({
  type: 'topDecoration',
  attrs: {
    uuid: null,
  },
});

const createArticleTitleNode = (cover: XiaohongshuLongTextCover): XiaohongshuLongTextNode => ({
  type: 'articleTitle',
  attrs: {
    uuid: '',
    author: cover.authorText ?? '',
    articleTitle: cover.titleText,
    readingStats: '',
  },
});

const createTextContentNode = (
  text: string,
  marks: Array<XiaohongshuLongTextTextMark> = [],
): XiaohongshuLongTextTextNode => {
  return marks.length ? { type: 'text', marks: [...marks], text } : { type: 'text', text };
};

const getTextContentText = (content: Array<XiaohongshuLongTextTextNode>): string => {
  return content.map((item) => item.text).join('');
};

const sliceTextContentNodes = (
  content: Array<XiaohongshuLongTextTextNode>,
  start: number,
  length: number,
): Array<XiaohongshuLongTextTextNode> => {
  const result: Array<XiaohongshuLongTextTextNode> = [];
  const end = start + length;
  let cursor = 0;
  for (const item of content) {
    const chars = Array.from(item.text);
    const itemStart = cursor;
    const itemEnd = cursor + chars.length;
    cursor = itemEnd;
    if (itemEnd <= start) {
      continue;
    }
    if (itemStart >= end) {
      break;
    }
    const chunkStart = Math.max(0, start - itemStart);
    const chunkEnd = Math.min(chars.length, end - itemStart);
    const text = chars.slice(chunkStart, chunkEnd).join('');
    if (text) {
      result.push(createTextContentNode(text, item.marks ?? []));
    }
  }
  return result;
};

const createImageNode = (
  image: ImageInfo,
  profile: XiaohongshuArticleLayoutProfile = createArticleLayoutProfile(defaultXiaohongshuArticleTemplate),
  maxLayoutHeight?: number,
): XiaohongshuLongTextNode => {
  const size = getArticleImageSize(image.width, image.height, profile, maxLayoutHeight);
  return {
    type: 'image',
    attrs: {
      imgs: [
        {
          desc: '',
          height: size.height,
          src: image.pathOrUrl,
          uuid: Guid.NewGuid().toString(),
          width: size.width,
        },
      ],
      wrapmode: 'none',
      isNotSurround: false,
    },
  };
};

const createNodeAttrs = (
  text: string,
  splitOptions?: XiaohongshuLongTextNodeSplitOptions,
): XiaohongshuLongTextNodeAttrs => ({
  textAlign: 'left',
  uuid: splitOptions?.uuid ?? Guid.NewGuid().toString(),
  hasSplit: splitOptions?.hasSplit ?? false,
  charPositionInPara: splitOptions?.charPositionInPara ?? 0,
  textLength: Array.from(text).length,
  left: splitOptions?.left ?? false,
});

const getNodeTextLength = (
  node: XiaohongshuLongTextNode,
  state?: XiaohongshuLongTextCardBuildState,
): number => {
  const profile = state?.layoutProfile ?? createArticleLayoutProfile(defaultXiaohongshuArticleTemplate);
  const spacing = state ? getNodeSpacingLength(state, node.type) : 0;
  if (node.type === 'image') {
    const image = node.attrs.imgs[0];
    return spacing + getImageLayoutLength(image?.width, image?.height, profile);
  }
  if (node.type === 'topDecoration' || node.type === 'articleTitle') {
    return 0;
  }
  if (node.type === 'orderedList' || node.type === 'bulletList') {
    return spacing + getListLayoutLength(node, profile);
  }
  if (node.type === 'blockquote') {
    return spacing + getBlockquoteLayoutLength(node, profile);
  }
  if (node.type === 'heading') {
    return spacing + getHeadingLayoutLength(node, profile);
  }
  if (node.type === 'paragraph' && node.attrs.textLength === 0) {
    return spacing + xiaohongshuArticleEmptyParagraphLayoutLength;
  }
  return spacing + getParagraphLayoutLength(node.attrs.textLength, profile, node.content);
};

const getNodeSpacingLength = (
  state: XiaohongshuLongTextCardBuildState,
  nodeType: XiaohongshuLongTextNode['type'],
): number => {
  if (!state.currentNodes.length) {
    return 0;
  }
  const previousNode = state.currentNodes[state.currentNodes.length - 1];
  const layout = state.layoutProfile.layout;
  if (nodeType === 'paragraph' && previousNode.type === 'paragraph') {
    return layout.paragraph_spacing;
  }
  if (nodeType === 'image' || previousNode.type === 'image') {
    return layout.image_special_spacing;
  }
  return layout.component_spacing;
};

const getTextCharsByHeight = (
  height: number,
  textLayout: XiaohongshuArticleThemeTextLayout,
  textWidth: number,
): number => {
  const availableHeight = height - (textLayout.paragraphExtraHeight ?? 0);
  if (availableHeight <= 0) {
    return 0;
  }
  const lineCount = Math.floor(availableHeight / textLayout.lineHeight);
  if (lineCount <= 0) {
    return 0;
  }
  return lineCount * getTextCharsPerLine(textLayout, textWidth);
};

const getTextCharsPerLine = (textLayout: XiaohongshuArticleThemeTextLayout, textWidth: number): number => {
  const charWidth = textLayout.charWidth ?? textLayout.fontSize;
  return Math.max(1, Math.floor(textWidth / charWidth));
};

const getTextBlockLayoutLength = (
  textLength: number,
  textLayout: XiaohongshuArticleThemeTextLayout,
  textWidth: number,
): number => {
  const charsPerLine = getTextCharsPerLine(textLayout, textWidth);
  const lineCount = Math.max(1, Math.ceil(textLength / charsPerLine));
  return lineCount * textLayout.lineHeight;
};

const getParagraphLayoutLength = (
  textLength: number,
  profile: XiaohongshuArticleLayoutProfile,
  content?: Array<XiaohongshuLongTextTextNode>,
): number => {
  return (
    getTextBlockLayoutLength(textLength, profile.textLayout, profile.textWidth) +
    (profile.textLayout.paragraphExtraHeight ?? 0) +
    getTextContentExtraHeight(content, profile)
  );
};

const getTextContentExtraHeight = (
  content: Array<XiaohongshuLongTextTextNode> | undefined,
  profile: XiaohongshuArticleLayoutProfile,
): number => {
  if (!content?.some((item) => item.marks?.some((mark) => mark.type === 'highlight'))) {
    return 0;
  }
  return profile.textLayout.highlightExtraHeight ?? 0;
};

const getListItemExtraHeight = (profile: XiaohongshuArticleLayoutProfile): number => {
  return xiaohongshuArticleListItemExtraHeightByTheme[profile.themeId] ?? 0;
};

const getHeadingLayoutLength = (
  node: Extract<XiaohongshuLongTextNode, { type: 'heading' }>,
  profile: XiaohongshuArticleLayoutProfile,
): number => {
  const fontSize = node.attrs.level === 1 ? profile.textLayout.fontSize * 1.35 : profile.textLayout.fontSize * 1.18;
  const lineHeight = fontSize * 1.35;
  const charWidth = fontSize * (node.attrs.level === 1 ? 1.08 : 1.04);
  const charsPerLine = Math.max(1, Math.floor(profile.textWidth / charWidth));
  const lineCount = Math.max(1, Math.ceil(node.attrs.textLength / charsPerLine));
  const extraHeight = (node.attrs.level === 1 ? 34 : 24) +
    Math.max(profile.layout.subtitle_extra_margin_top, profile.textLayout.lineHeight * 0.5);
  return Math.ceil(lineCount * lineHeight + extraHeight);
};

const getListLayoutLength = (
  node: Extract<XiaohongshuLongTextNode, { type: 'orderedList' | 'bulletList' }>,
  profile: XiaohongshuArticleLayoutProfile,
): number => {
  const itemGap = profile.themeId === 61 ? 40 : profile.themeId === 8 ? 20 : 25;
  return node.content.reduce((total, item, index) => {
    return total + getListItemLayoutLength(item, profile) + (index > 0 ? itemGap : 0);
  }, 0);
};

const getListItemLayoutLength = (
  item: XiaohongshuLongTextListItemNode,
  profile: XiaohongshuArticleLayoutProfile,
): number => {
  const listTextLayout = {
    ...profile.textLayout,
    textWidth: Math.max(1, profile.textWidth - 80),
  };
  return getTextBlockLayoutLength(
    item.attrs.textLength,
    listTextLayout,
    listTextLayout.textWidth ?? profile.textWidth,
  ) + getListItemExtraHeight(profile);
};

const getBlockquoteLayoutLength = (
  node: Extract<XiaohongshuLongTextNode, { type: 'blockquote' }>,
  profile: XiaohongshuArticleLayoutProfile,
): number => {
  const paragraphGap = profile.themeId === 8 ? 60 : 30;
  const contentLength = node.content.reduce((total, paragraph, index) => {
    return total +
      getParagraphLayoutLength(paragraph.attrs.textLength, profile, paragraph.content) +
      (index > 0 ? paragraphGap : 0);
  }, 0);
  return contentLength + 44;
};

const getImageMinLayoutLength = (
  image: ImageInfo,
  profile: XiaohongshuArticleLayoutProfile,
): number => {
  const imageWidth = image.width && image.width > 0 ? image.width : xiaohongshuArticleDefaultImageWidth;
  const imageHeight = image.height && image.height > 0 ? image.height : xiaohongshuArticleDefaultImageHeight;
  const minHeight = imageHeight > imageWidth
    ? profile.layout.image_capture_min_height_v
    : profile.layout.image_capture_min_height_h;
  return Math.max(xiaohongshuArticleImageMinLayoutLength, minHeight + getImageWrapperExtraHeight(profile));
};

const getImageLayoutLength = (
  width?: number,
  height?: number,
  profile: XiaohongshuArticleLayoutProfile = createArticleLayoutProfile(defaultXiaohongshuArticleTemplate),
): number => {
  const imageSize = getArticleImageSize(width, height, profile);
  const imageWidth = imageSize.width;
  const imageHeight = imageSize.height;
  const renderWidth = Math.min(profile.imageWidth, imageWidth);
  const renderHeight = imageHeight * (renderWidth / imageWidth);
  return Math.max(
    xiaohongshuArticleImageMinLayoutLength,
    Math.ceil(renderHeight + getImageWrapperExtraHeight(profile) + getImageLayoutLengthAdjust(profile)),
  );
};

const getImageWrapperExtraHeight = (profile: XiaohongshuArticleLayoutProfile): number => {
  return xiaohongshuArticleImageWrapperExtraHeightByTheme[profile.themeId] ??
    xiaohongshuArticleImageWrapperExtraHeight;
};

const getImageLayoutLengthAdjust = (profile: XiaohongshuArticleLayoutProfile): number => {
  return xiaohongshuArticleImageLayoutLengthAdjustByTheme[profile.themeId] ?? 0;
};

const getImageMaxLayoutHeightAdjust = (profile: XiaohongshuArticleLayoutProfile): number => {
  return xiaohongshuArticleImageMaxLayoutHeightAdjustByTheme[profile.themeId] ?? 0;
};

const getArticleImageSize = (
  width?: number,
  height?: number,
  profile: XiaohongshuArticleLayoutProfile = createArticleLayoutProfile(defaultXiaohongshuArticleTemplate),
  maxLayoutHeight?: number,
): { width: number; height: number } => {
  const imageWidth = width && width > 0 ? Math.round(width) : undefined;
  const imageHeight = height && height > 0 ? Math.round(height) : undefined;
  if (imageWidth && imageHeight) {
    return scaleDownArticleImageSize(imageWidth, imageHeight, profile, maxLayoutHeight);
  }
  if (imageWidth) {
    const heightByDefaultRatio = Math.round(imageWidth * (xiaohongshuArticleDefaultImageHeight / xiaohongshuArticleDefaultImageWidth));
    return scaleDownArticleImageSize(imageWidth, heightByDefaultRatio, profile, maxLayoutHeight);
  }
  if (imageHeight) {
    const widthByDefaultRatio = Math.round(imageHeight * (xiaohongshuArticleDefaultImageWidth / xiaohongshuArticleDefaultImageHeight));
    return scaleDownArticleImageSize(widthByDefaultRatio, imageHeight, profile, maxLayoutHeight);
  }
  return scaleDownArticleImageSize(
    xiaohongshuArticleDefaultImageWidth,
    xiaohongshuArticleDefaultImageHeight,
    profile,
    maxLayoutHeight,
  );
};

const scaleDownArticleImageSize = (
  width: number,
  height: number,
  profile: XiaohongshuArticleLayoutProfile = createArticleLayoutProfile(defaultXiaohongshuArticleTemplate),
  maxLayoutHeight?: number,
): { width: number; height: number } => {
  const maxLayoutLength =
    maxLayoutHeight ?? profile.contentHeight - profile.layout.image_special_spacing - getEffectivePageBottomSafety(profile);
  const maxImageHeight = Math.max(1, maxLayoutLength - getImageWrapperExtraHeight(profile));
  const ratio = Math.min(1, profile.imageWidth / width, maxImageHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const isHeadingText = (text: string): boolean => {
  return /^[一二三四五六七八九十\d]+[、.．]\s*\S+/.test(text) || /^#{1,3}\s+\S+/.test(text);
};

const createSummary = (content: string): string => {
  return content
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 80);
};

const inferImageFormat = (url: string): string => {
  const pathname = url.split('?')[0];
  const ext = pathname.split('.').pop()?.toLowerCase();
  return ext && ext.length <= 5 ? ext : 'jpg';
};

const serializeSingleImageJson = (
  value: string | Record<string, unknown> | undefined,
  fallback: string,
): string => {
  if (value === undefined) {
    return fallback;
  }
  return typeof value === 'string' ? value : JSON.stringify(value);
};

const appendSignCookie = (cookie: string, signJo: Record<string, string>): string => {
  if (!signJo?.['a1']) {
    return cookie;
  }
  const nextCookie = cookie.replace(/(^|;\s*)a1=/, '$1a1old=');
  return `${nextCookie};a1=${signJo['a1']}`;
};
