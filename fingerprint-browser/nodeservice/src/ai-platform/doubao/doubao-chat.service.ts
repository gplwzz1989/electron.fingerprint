import { Observable, Subscriber } from 'rxjs';
import {
  ChatService,
  Conversation,
  Message,
  SendMessageOptions,
  StreamEvent,
  Attachment,
  SendAttachment,
  ImageInfo,
  VideoInfo,
} from '../interfaces';
import { $http, createHttpInstance } from '../../http'; // Added createHttpInstance
import { AxiosRequestConfig, AxiosInstance } from 'axios'; // Added AxiosInstance
import * as fs from 'fs/promises'; // For async file operations
import * as path from 'path'; // For path manipulation
import crc from 'crc'; // For CRC32 calculation, similar to Douyin
import { aws4Interceptor } from 'aws4-axios'; // For AWS v4 signing
import { CalcSha256Hex } from '../../media-platform/douyin/douyin-base.service';
import { generateRandomString } from '@/media-platform/pipixia/pipixia-video.service';
import { getSignServerUrl, Task } from '@/utils';
import * as querystring from 'node:querystring';
import buffer from 'buffer';
import { error } from 'winston';
import { isNewDocumentId } from '@/ai-platform/doubao/doc-id-classifier'; // For SHA256 calculation

// Updated Interfaces based on Fiddler data

export interface DoubaoUploadAuthToken {
  access_key: string;
  secret_key: string;
  session_token: string;
  expired_time: string;
  current_time: string;
}

export interface DoubaoPrepareUploadResponse {
  code: number;
  msg: string;
  data: {
    service_id: string;
    upload_path_prefix: string;
    upload_host: string;
    upload_auth_token: DoubaoUploadAuthToken;
  };
}

export interface DoubaoApplyImageUploadStoreInfo {
  StoreUri: string;
  Auth: string; // SpaceKey/...
  UploadID: string;
}

export interface DoubaoApplyImageUploadResponse {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    Error?: { CodeN: string; Code: string; Message: string };
  };
  Result: {
    UploadAddress: {
      StoreInfos: DoubaoApplyImageUploadStoreInfo[];
      UploadHosts: string[];
      UploadHeader: Record<string, string>;
      SessionKey: string; // Base64 encoded JSON
      Cloud: string;
      CloudAuth: string;
    };
    InnerUploadAddress: {
      // This is the one used in the upload POST
      UploadNodes: Array<{
        StoreInfos: DoubaoApplyImageUploadStoreInfo[];
        UploadHost: string;
        UploadHeader: Record<string, string>;
        SessionKey: string;
      }>;
    };
  };
}

export interface DoubaoUploadFileResponse {
  code: number;
  apiversion: string;
  message: string;
  data: {
    crc32: string;
  };
}

export interface DoubaoCommitImageUploadResponse {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    Error?: { CodeN: string; Code: string; Message: string };
  };
  Result: {
    Results: Array<{
      Uri: string;
      UriStatus: number;
    }>;
    RequestId: string;
    PluginResult: Array<{
      FileName: string;
      SourceUri: string;
      ImageUri: string;
      ImageWidth: number;
      ImageHeight: number;
      ImageMd5: string;
      ImageFormat: string;
      ImageSize: number;
      FrameCnt: number;
      ContentType: string;
      NotFound: boolean;
      Orientation: { Rotation: number; Fliph: boolean; Flipv: boolean };
      ColorModel: string;
      ImageAve: string;
    }>;
  };
}

export interface DoubaoPreHandleMessagePayload {
  uplink_entity: {
    entity_type: number; // 1 for file
    entity_content: {
      file: {
        file_name: string;
        key: string; // StoreUri
        md5: string;
        file_type: number; // 1 for docx (based on Fiddler, might need mapping for others)
        image?: { key: string }; // Seems to be present for docx
        size: number;
      };
    };
    identifier: string; // UUID
  };
  conversation_id: string;
  bot_id: string;
  section_id: string;
  local_message_id: string;
}

export interface DoubaoPreHandleMessageResponse {
  code: number;
  msg: string;
  data: {
    dst_page_id: string;
    page_type: number;
    status: number;
  };
  message: string;
}

export interface DoubaoPageUpgradeStatusResponse {
  code: number;
  msg: string;
  data: {
    dst_page_id: string;
    page_type: number;
    status: number;
  };
}

export interface DoubaoExportPageCreateResponse {
  code: number;
  msg: string;
  data: {
    job_id: string;
    job_timeout: number;
    query_interval_sec: number;
    first_query_interval_sec: number;
  };
}

export interface DoubaoExportPageResultResponse {
  code: number;
  msg: string;
  data: {
    job_id: string;
    job_status: number;
    file_name: string;
    file_size: number;
    url: string;
    export_file_type: number;
    fail_sub_status: number;
  };
}

export interface DoubaoVideoPlayInfo {
  definition: string; // e.g., '720p'
  main: string; // Video download URL
  backup: string;
  height: number;
  width: number;
}

export interface DoubaoGetVideoPlayInfoResponse {
  code: number;
  msg: string;
  data: {
    view_count: number;
    play_infos: DoubaoVideoPlayInfo[];
  };
}

export interface DoubaoChatServiceOptions {
  cookie: string;
  deviceId?: string;
  webTabId?: string;
  botId?: string;
  sectionId?: string;
  fp?: string;
}

function serializeDoubaoSignBody(body: unknown): string {
  if (body == null) {
    return '';
  }

  if (typeof body === 'string') {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  return JSON.stringify(body);
}

export async function applyDoubaoABogusSignature(
  params: Record<string, any>,
  body: unknown,
  unsign: boolean = false,
): Promise<Record<string, any>> {
  const signedParams = { ...params };
  delete signedParams.a_bogus;

  if (!signedParams.msToken) {
    signedParams.msToken = generateRandomString(16);
  }

  const signData = buffer.Buffer.from(
    JSON.stringify([querystring.stringify(signedParams), serializeDoubaoSignBody(body)]),
    'utf-8',
  ).toString('base64');

  const sign = await getSign(signData, unsign);
  signedParams.a_bogus = sign?.length > 20 ? sign : undefined;
  if (!(sign?.length > 20)) {
    signedParams.msToken = undefined;
  }

  return signedParams;
}

export class DoubaoChatService implements ChatService {
  private baseUrl = 'https://www.doubao.com';
  public cookie: string;
  private deviceId: string;
  private webTabId: string;
  private web_id: string;
  private tea_uuid: string;
  private botId: string;
  private sectionId: string;
  private fp: string;

  // 默认的 Query 参数，来自 Fiddler 抓包
  private defaultQueryParams = {
    aid: '497858',
    device_id: '', // 将从构造函数参数设置
    device_platform: 'web',
    fp: '',
    language: 'zh',
    pc_version: '3.10.3', // Updated to 3.9.0 based on Fiddler
    pkg_type: 'release_version',
    real_aid: '497858',
    region: '',
    samantha_web: '1',
    sys_region: '',
    tea_uuid: '',
    'use-olympus-account': '1',
    version_code: '20800',
    web_id: '',
    web_tab_id: '', // 将从构造函数参数设置
    msToken: '',
  };

  constructor(options: string | DoubaoChatServiceOptions) {
    if (typeof options === 'string') {
      this.cookie = options;
      this.deviceId = options.includes(';device_id') ? options?.split(';device_id=')[1]?.split(';')[0] : '';
      this.webTabId = '';
      this.botId = '7338286299411103781';
      this.sectionId = '';
      this.fp = options.includes('s_v_web_id') ? options?.split('s_v_web_id=')[1]?.split(';')[0] : '';
      this.web_id = options.includes(';web_id') ? options?.split(';web_id=')[1]?.split(';')[0] : '';
      this.tea_uuid = options.includes(';tea_uuid') ? options?.split(';tea_uuid=')[1]?.split(';')[0] : '';
      this.defaultQueryParams.msToken = options.includes('msToken=')
        ? options?.split('msToken=')[1]?.split(';')[0]
        : '';
      this.defaultQueryParams.fp = this.fp;
      this.defaultQueryParams.device_id = this.deviceId;
      this.defaultQueryParams.tea_uuid = this.tea_uuid;
      this.defaultQueryParams.web_id = this.web_id;
    } else {
      this.cookie = options.cookie;
      this.deviceId = options.deviceId || '';
      this.webTabId = options.webTabId || '';
      this.web_id = '';
      this.tea_uuid = '';
      this.botId = options.botId || '7338286299411103781';
      this.sectionId = options.sectionId || '';
      this.fp =
        options.fp || options?.cookie.includes('s_v_web_id')
          ? options?.cookie?.split('s_v_web_id=')[1]?.split(';')[0]
          : '';
      this.defaultQueryParams.fp = this.fp;
    }

    // 更新 defaultQueryParams
    this.defaultQueryParams.device_id = this.deviceId;
    this.defaultQueryParams.web_tab_id = this.webTabId;
  }

  private generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private formatEmbeddedImageAltText(text: string): string {
    return text.replace(/\r?\n/g, ' ').replace(/\]/g, '\\]');
  }

  private convertUtf8ByteOffsetToCharIndex(textChars: string[], byteOffset: number): number {
    if (!Number.isFinite(byteOffset) || byteOffset <= 0) {
      return 0;
    }

    let currentByteOffset = 0;
    for (let index = 0; index < textChars.length; index++) {
      if (currentByteOffset >= byteOffset) {
        return index;
      }

      currentByteOffset += Buffer.byteLength(textChars[index], 'utf8');
      if (currentByteOffset >= byteOffset) {
        return index + 1;
      }
    }

    return textChars.length;
  }

  private buildTextContentWithEmbeddedImages(block: any): string {
    const text = typeof block?.content?.text_block?.text === 'string' ? block.content.text_block.text : '';
    const textChars = Array.from(text) as string[];
    const insertions: Array<{ charIndex: number; markdown: string }> = [];

    if (Array.isArray(block?.meta_info)) {
      for (const metaItem of block.meta_info) {
        if (metaItem?.type !== 202) {
          continue;
        }

        try {
          const imageDataStr = metaItem.info || metaItem.tag_info;
          if (!imageDataStr) {
            continue;
          }

          const imageData = JSON.parse(imageDataStr);
          if (!Array.isArray(imageData?.media) || imageData.media.length === 0) {
            continue;
          }

          const imageMarkdownList: string[] = [];
          for (const media of imageData.media) {
            if (media?.type !== 1 || !media.image) {
              continue;
            }

            const image = media.image;
            const imageUrl = (Array.isArray(image.full_size_url) && image.full_size_url[0]) || image.thumb_url || '';
            if (!imageUrl) {
              continue;
            }

            const caption =
              typeof image.img_caption === 'string' && image.img_caption.trim()
                ? this.formatEmbeddedImageAltText(image.img_caption.trim())
                : '图片';
            imageMarkdownList.push(`![${caption}](${imageUrl})`);
          }

          if (imageMarkdownList.length > 0) {
            const rawPos = Number.isFinite(Number(imageData?.pos)) ? Number(imageData.pos) : Buffer.byteLength(text, 'utf8');
            insertions.push({
              charIndex: this.convertUtf8ByteOffsetToCharIndex(textChars, rawPos),
              markdown: imageMarkdownList.join('\n'),
            });
          }
        } catch (error) {
          // Ignore invalid embedded image metadata
        }
      }
    }

    if (insertions.length === 0) {
      return text;
    }

    const sortedInsertions = insertions.sort((a, b) => a.charIndex - b.charIndex);
    let result = '';
    let lastIndex = 0;

    for (const insertion of sortedInsertions) {
      const safePos = Math.max(0, Math.min(textChars.length, insertion.charIndex));
      result += textChars.slice(lastIndex, safePos).join('');

      if (result && !result.endsWith('\n')) {
        result += '\n';
      }

      result += insertion.markdown;

      if (textChars[safePos] !== '\n') {
        result += '\n';
      }

      lastIndex = safePos;
    }

    result += textChars.slice(lastIndex).join('');
    return result;
  }

  private getRequestConfig(): AxiosRequestConfig {
    this.defaultQueryParams.web_tab_id = this.generateUUID();
    return {
      headers: {
        Cookie: this.cookie,
        'Agw-Js-Conv': 'str', // 来自抓包
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json; encoding=utf-8',
        Origin: 'https://www.doubao.com',
        Referer: 'https://www.doubao.com/chat/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/110.0.0.0',
      },
      params: this.defaultQueryParams,
    };
  }

  // Helper to create an Axios instance with AWS v4 signing
  // Following Douyin's implementation pattern
  private createSignedHttpClient(
    auth: DoubaoUploadAuthToken,
    service: string,
    region: string = 'cn-north-1',
  ): AxiosInstance {
    const signedHttp = createHttpInstance();
    signedHttp.interceptors.request.use(
      aws4Interceptor({
        instance: signedHttp,
        options: {
          region: region,
          service: service,
        },
        credentials: {
          accessKeyId: auth.access_key,
          secretAccessKey: auth.secret_key,
          sessionToken: auth.session_token,
        },
      }),
    );
    return signedHttp;
  }

  /**
   * Step 1: Get initial upload credentials and service ID.
   * Corresponds to POST https://www.doubao.com/alice/resource/prepare_upload
   * @param resourceType 1=file/document, 2=image
   */
  private async prepareUpload(resourceType: number = 1): Promise<DoubaoPrepareUploadResponse> {
    const url = `${this.baseUrl}/alice/resource/prepare_upload`;
    const payload = {
      tenant_id: '5',
      scene_id: '5',
      resource_type: resourceType,
    };
    const config = this.getRequestConfig();
    if (config.headers) {
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await $http.post<DoubaoPrepareUploadResponse>(url, payload, config);
    if (response.data.code !== 0) {
      throw new Error(`Failed to prepare upload: ${response.data.msg}`);
    }
    return response.data;
  }

  /**
   * Step 2: Request specific upload arguments for the file.
   * Corresponds to GET https://www.doubao.com/top/v1?Action=ApplyImageUpload...
   * Following Douyin's pattern: only set minimal headers in request config
   */
  private async applyImageUpload(
    serviceId: string,
    fileSize: number,
    fileExtension: string,
    auth: DoubaoUploadAuthToken,
  ): Promise<DoubaoApplyImageUploadResponse> {
    const signedHttp = this.createSignedHttpClient(auth, 'imagex');
    const url = `${this.baseUrl}/top/v1`;
    const params = {
      Action: 'ApplyImageUpload',
      Version: '2018-08-01',
      ServiceId: serviceId,
      NeedFallback: 'true',
      FileSize: fileSize.toString(),
      FileExtension: `.${fileExtension}`,
      s: Math.random().toString(36).substring(2),
    };

    // Following Douyin's pattern: create headers object and only set what's needed
    const headers = {};
    // Don't set any headers here - let aws4Interceptor handle it
    // The default headers from createHttpInstance will be used

    const config: AxiosRequestConfig = {
      headers: headers,
      params: params,
    };

    const response = await signedHttp.get<DoubaoApplyImageUploadResponse>(url, config);
    if (response.data.ResponseMetadata?.Error) {
      throw new Error(`Failed to apply image upload: ${response.data.ResponseMetadata.Error.Message}`);
    }
    return response.data;
  }

  /**
   * Step 3a: Initialize multi-part upload (for images)
   * Corresponds to POST https://tos-lf-x.snssdk.com/upload/v1/...?uploadmode=part&phase=init
   */
  private async initMultiPartUpload(
    storeUri: string,
    uploadHost: string,
    authSpaceKey: string,
    userId: string,
  ): Promise<string> {
    const url = `https://${uploadHost}/upload/v1/${storeUri}`;
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: authSpaceKey,
        'X-Storage-U': userId,
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary9gyOWJ1stFA4lQL2',
        Accept: '*/*',
        Origin: 'https://www.doubao.com',
        Referer: 'https://www.doubao.com/',
      },
      params: {
        uploadmode: 'part',
        phase: 'init',
      },
    };

    // Empty multipart body
    const body = '------WebKitFormBoundary9gyOWJ1stFA4lQL2--';
    const response = await $http.post<{ code: number; data: { uploadid: string } }>(url, body, config);
    if (response.data.code !== 2000) {
      throw new Error(`Failed to init multi-part upload`);
    }
    return response.data.data.uploadid;
  }

  /**
   * Step 3b: Upload file part (for images)
   * Corresponds to POST https://tos-lf-x.snssdk.com/upload/v1/...?uploadid=...&part_number=1&phase=transfer
   */
  private async uploadFilePart(
    fileBuffer: Buffer,
    storeUri: string,
    uploadHost: string,
    authSpaceKey: string,
    userId: string,
    uploadId: string,
    partNumber: number = 1,
  ): Promise<string> {
    const url = `https://${uploadHost}/upload/v1/${storeUri}`;

    let crc32Str = crc.crc32(fileBuffer).toString(16).replace('-', '');
    while (crc32Str.length < 8) {
      crc32Str = `0${crc32Str}`;
    }

    const config: AxiosRequestConfig = {
      headers: {
        Authorization: authSpaceKey,
        'Content-CRC32': crc32Str,
        'X-Storage-U': userId,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="undefined"',
        Accept: '*/*',
        Origin: 'https://www.doubao.com',
        Referer: 'https://www.doubao.com/',
      },
      params: {
        uploadid: uploadId,
        part_number: partNumber.toString(),
        phase: 'transfer',
      },
    };

    const response = await $http.post<{ code: number; data: { crc32: string } }>(url, fileBuffer, config);
    if (response.data.code !== 2000) {
      throw new Error(`Failed to upload file part`);
    }
    return response.data.data.crc32;
  }

  /**
   * Step 3c: Finish multi-part upload (for images)
   * Corresponds to POST https://tos-lf-x.snssdk.com/upload/v1/...?uploadmode=part&phase=finish&uploadid=...
   */
  private async finishMultiPartUpload(
    storeUri: string,
    uploadHost: string,
    authSpaceKey: string,
    userId: string,
    uploadId: string,
    partCrc32: string,
    partNumber: number = 1,
  ): Promise<void> {
    const url = `https://${uploadHost}/upload/v1/${storeUri}`;
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: authSpaceKey,
        'X-Storage-U': userId,
        'Content-Type': 'text/plain;charset=UTF-8',
        Accept: '*/*',
        Origin: 'https://www.doubao.com',
        Referer: 'https://www.doubao.com/',
      },
      params: {
        uploadmode: 'part',
        phase: 'finish',
        uploadid: uploadId,
      },
    };

    // Body format: "1:299b5434" (part_number:crc32)
    const body = `${partNumber}:${partCrc32}`;
    const response = await $http.post<{ code: number }>(url, body, config);
    if (response.data.code !== 2000) {
      throw new Error(`Failed to finish multi-part upload`);
    }
  }

  /**
   * Step 3: Upload the file content directly (for documents).
   * Corresponds to POST https://tos-hl-x.snssdk.com/upload/v1/...
   * The Fiddler trace shows a single-part upload.
   */
  private async uploadFile(
    fileBuffer: Buffer,
    storeUri: string,
    uploadHost: string,
    authSpaceKey: string,
    userId: string, // X-Storage-U header
  ): Promise<DoubaoUploadFileResponse> {
    const url = `https://${uploadHost}/upload/v1/${storeUri}`;

    let crc32Str = crc.crc32(fileBuffer).toString(16).replace('-', '');
    while (crc32Str.length < 8) {
      crc32Str = `0${crc32Str}`;
    }

    const config: AxiosRequestConfig = {
      headers: {
        // Don't set Content-Length manually - Axios will handle it
        Authorization: authSpaceKey,
        'Content-CRC32': crc32Str,
        'X-Storage-U': userId,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="undefined"', // As seen in Fiddler
        Accept: '*/*',
        Origin: 'https://www.doubao.com',
        Referer: 'https://www.doubao.com/',
      },
      // No cookie for this cross-site request, as seen in Fiddler
    };

    const response = await $http.post<DoubaoUploadFileResponse>(url, fileBuffer, config);
    if (response.data.code !== 2000) {
      throw new Error(`Failed to upload file part: ${response.data.message}`);
    }
    return response.data;
  }

  /**
   * Step 4: Commit the attachment upload.
   * Corresponds to POST https://www.doubao.com/top/v1?Action=CommitImageUpload...
   * Following Douyin's pattern
   */
  private async commitImageUpload(
    serviceId: string,
    sessionKey: string, // Base64 encoded JSON
    auth: DoubaoUploadAuthToken,
  ): Promise<DoubaoCommitImageUploadResponse> {
    const signedHttp = this.createSignedHttpClient(auth, 'imagex');
    const url = `${this.baseUrl}/top/v1`;
    const payload = {
      SessionKey: sessionKey,
    };
    const params = {
      Action: 'CommitImageUpload',
      Version: '2018-08-01',
      ServiceId: serviceId,
    };

    // Following Douyin's pattern: create headers object
    const headers = {};
    headers['X-Amz-Content-Sha256'] = CalcSha256Hex(JSON.stringify(payload));
    headers['Content-Type'] = 'application/json';

    const config: AxiosRequestConfig = {
      headers: headers,
      params: params,
    };

    const response = await signedHttp.post<DoubaoCommitImageUploadResponse>(url, payload, config);
    if (response.data.ResponseMetadata?.Error) {
      throw new Error(`Failed to commit image upload: ${response.data.ResponseMetadata.Error.Message}`);
    }
    return response.data;
  }

  /**
   * Step 5: Pre-handle the message with the attachment.
   * Corresponds to POST https://www.doubao.com/alice/message/pre_handle_v2
   */
  private async preHandleMessage(
    fileKey: string, // The StoreUri from ApplyImageUpload
    fileName: string,
    fileSize: number,
    fileType: string, // e.g., docx
    conversationId: string,
    botId: string,
    sectionId: string,
    localMessageId: string,
  ): Promise<DoubaoPreHandleMessageResponse> {
    const url = `${this.baseUrl}/alice/message/pre_handle_v2`;
    const payload: DoubaoPreHandleMessagePayload = {
      uplink_entity: {
        entity_type: 1, // 1 for file
        entity_content: {
          file: {
            file_name: fileName,
            key: fileKey,
            md5: '', // MD5 is not in the Fiddler trace for this step, can be calculated if needed
            file_type: 1, // 1 for docx, might need a mapping for other types
            image: { key: fileKey }, // Present for docx in Fiddler
            size: fileSize,
          },
        },
        identifier: this.generateUUID(), // Unique identifier for this entity
      },
      conversation_id: conversationId,
      bot_id: botId,
      section_id: sectionId,
      local_message_id: localMessageId,
    };

    // Create specific config for pre_handle_v2 with query params from Fiddler trace
    const config = this.getRequestConfig();
    config.params = {
      version_code: '20800',
      language: 'zh',
      device_platform: 'web',
      aid: '497858',
      real_aid: '497858',
      pkg_type: 'release_version',
      device_id: this.deviceId,
      pc_version: '3.9.0',
      web_id: this.web_id,
      tea_uuid: this.tea_uuid,
      region: '',
      sys_region: '',
      samantha_web: '1',
      'use-olympus-account': '1',
      web_tab_id: this.webTabId || this.generateUUID(),
    };

    if (config.headers) {
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await $http.post<DoubaoPreHandleMessageResponse>(url, payload, config);
    if (response.data.code !== 0) {
      //throw new Error(`Failed to pre-handle message: ${response.data.msg}`);
    }
    return response.data;
  }

  /**
   * Build attachment block based on file type
   * Supports images (type: 1) and documents (type: 3)
   * Extensible for future attachment types
   */
  private buildAttachmentBlock(uploadedAtt: Attachment): any {
    const isImage = this.isImageType(uploadedAtt.type);
    const storeUri = uploadedAtt.url.replace('https://p26-flow-sign.byteimg.com/', '');

    if (isImage) {
      // Image attachment structure (type: 1)
      return {
        type: 1,
        identifier: uploadedAtt.id,
        image: {
          name: uploadedAtt.name,
          uri: storeUri,
          image_ori: {
            url: '',
            width: (uploadedAtt as any).width || 0,
            height: (uploadedAtt as any).height || 0,
            format: '',
            url_formats: {},
          },
        },
        parse_state: 0,
        review_state: 1,
        upload_status: 1,
        progress: 100,
        src: '',
      };
    } else {
      // Document/file attachment structure (type: 3)
      return {
        type: 3,
        identifier: uploadedAtt.id,
        file: {
          name: uploadedAtt.name,
          uri: storeUri,
          url: uploadedAtt.url,
          size: uploadedAtt.size,
          file_type: this.getFileTypeCode(uploadedAtt.type),
        },
        review_state: 1,
        parse_state: 1,
        progress: 100,
        upload_status: 1,
        src: '',
      };
    }
  }

  /**
   * Check if file extension is an image type
   */
  private isImageType(extension: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    return imageExtensions.includes(extension.toLowerCase());
  }

  /**
   * Map file extension to Doubao file_type code
   * Extensible for future file types
   */
  private getFileTypeCode(extension: string): number {
    const fileTypeMap: Record<string, number> = {
      docx: 1,
      doc: 1,
      pdf: 2,
      xlsx: 3,
      xls: 3,
      pptx: 4,
      ppt: 4,
      txt: 5,
    };
    return fileTypeMap[extension.toLowerCase()] || 0;
  }

  /**
   * Orchestrates the attachment upload process.
   * Takes a local file path or URL, uploads it, and returns the Attachment details.
   */
  private async uploadAttachment(
    sendAttachment: SendAttachment,
    conversationId: string,
    botId: string,
    sectionId: string,
    localMessageId: string,
  ): Promise<Attachment> {
    const filePath = sendAttachment.filePath;
    let fileExtension = sendAttachment.type;
    let fileName = sendAttachment.name;

    let fileBuffer: Buffer;
    if (filePath?.toLowerCase().startsWith('http')) {
      const response = await $http.get(filePath, { responseType: 'arraybuffer' });
      if (response?.status != 200) {
        throw new Error(`下载附件失败:${response?.status ?? '网络错误'}`);
      }
      fileBuffer = Buffer.from(response.data);

      // If no extension provided, try to get from Content-Type header
      if (!fileExtension && response.headers['content-type']) {
        const contentType = response.headers['content-type'];
        const mimeToExt: Record<string, string> = {
          'application/pdf': 'pdf',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'application/vnd.ms-excel': 'xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'application/vnd.ms-powerpoint': 'ppt',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
          'text/plain': 'txt',
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
        };
        fileExtension = mimeToExt[contentType.split(';')[0].trim()];
      }

      // If still no extension, try to extract from URL path
      if (!fileExtension) {
        const urlPath = new URL(filePath).pathname;
        const urlExt = path.extname(urlPath).replace('.', '');
        if (urlExt) {
          fileExtension = urlExt;
        }
      }
    } else {
      fileBuffer = await fs.readFile(filePath);

      // If no extension provided, extract from file path
      if (!fileExtension) {
        fileExtension = path.extname(filePath).replace('.', '');
      }
    }

    // If no fileName provided, use basename from filePath
    if (!fileName) {
      fileName = path.basename(filePath);
    }

    // Ensure fileName has extension
    if (fileExtension && !fileName.toLowerCase().endsWith(`.${fileExtension.toLowerCase()}`)) {
      fileName = `${fileName}.${fileExtension}`;
    }

    // Fallback: if still no extension, use 'bin' as default
    if (!fileExtension) {
      fileExtension = 'bin';
      if (!fileName.includes('.')) {
        fileName = `${fileName}.bin`;
      }
    }

    // Always use actual buffer size
    const fileSize = fileBuffer.length;

    // Determine if this is an image file
    const isImage = this.isImageType(fileExtension);

    // 1. Prepare Upload (resource_type: 1=file, 2=image)
    const prepareUploadRes = await this.prepareUpload(isImage ? 2 : 1);
    const { service_id, upload_auth_token } = prepareUploadRes.data;

    // 2. Apply Image Upload (get specific upload URL and auth)
    const applyImageUploadRes = await this.applyImageUpload(service_id, fileSize, fileExtension, upload_auth_token);
    const uploadNode = applyImageUploadRes.Result.InnerUploadAddress.UploadNodes[0];
    const { StoreUri, Auth: spaceKeyAuth, UploadID: uploadId } = uploadNode.StoreInfos[0];
    const uploadHostForFile = uploadNode.UploadHost;
    const sessionKey = applyImageUploadRes.Result.UploadAddress.SessionKey; // Use the top-level SessionKey for commit

    // Extract userId from cookie (e.g., uid_tt) for X-Storage-U header
    const userIdMatch = this.cookie.match(/uid_tt=([^;]+)/);
    const userId = userIdMatch ? userIdMatch[1] : 'unknown_user'; // Fallback if not found

    // 3. Upload the file (different flow for images vs documents)
    if (isImage) {
      // Multi-part upload for images
      const multiPartUploadId = await this.initMultiPartUpload(StoreUri, uploadHostForFile, spaceKeyAuth, userId);
      const partCrc32 = await this.uploadFilePart(
        fileBuffer,
        StoreUri,
        uploadHostForFile,
        spaceKeyAuth,
        userId,
        multiPartUploadId,
        1,
      );
      await this.finishMultiPartUpload(
        StoreUri,
        uploadHostForFile,
        spaceKeyAuth,
        userId,
        multiPartUploadId,
        partCrc32,
        1,
      );
    } else {
      // Single upload for documents
      await this.uploadFile(fileBuffer, StoreUri, uploadHostForFile, spaceKeyAuth, userId);
    }

    // 4. Commit Image Upload
    const commitImageUploadRes = await this.commitImageUpload(service_id, sessionKey, upload_auth_token);
    if (!commitImageUploadRes.Result?.PluginResult?.length) {
      throw new Error('Commit image upload did not return plugin results.');
    }
    const pluginResult = commitImageUploadRes.Result.PluginResult[0];
    const finalUri = pluginResult.SourceUri; // Use SourceUri from PluginResult
    const finalUrl = `https://p26-flow-sign.byteimg.com/${finalUri}`; // Construct a plausible URL based on Fiddler response

    // 5. Pre-handle message (important for the attachment to be recognized)
    await this.preHandleMessage(
      finalUri,
      fileName,
      fileSize,
      fileExtension,
      conversationId,
      botId,
      sectionId,
      localMessageId,
    );

    // Build attachment object with image dimensions if available
    const attachment: Attachment = {
      id: uploadId, // Use the UploadID from ApplyImageUpload as the attachment ID
      url: finalUrl, // The CDN URL for display/preview
      name: fileName,
      size: fileSize,
      type: fileExtension,
      downloadUrl: finalUrl, // Assuming the URL is also the download URL for now
      title: fileName,
    };

    // Add image dimensions if this is an image file
    if (isImage && pluginResult.ImageWidth && pluginResult.ImageHeight) {
      (attachment as any).width = pluginResult.ImageWidth;
      (attachment as any).height = pluginResult.ImageHeight;
    }

    return attachment;
  }

  async getConversations(
    cursor?: string,
    limit: number = 20,
  ): Promise<{ code?: number; msg?: string; items: Conversation[]; nextCursor?: string; hasMore: boolean }> {
    const payload = {
      cmd: 3200,
      uplink_body: {
        pull_recent_conv_chain_uplink_body: {
          limit: limit,
          message_count_per_conv: 10,
          api_version: 1,
          // 确保 conv_version 是一个数字类型
          conv_version: cursor ? Number(cursor) : 0,
          // 根据是否存在 cursor 动态设置 direction
          direction: cursor ? 1 : 3,
          option: {
            not_need_message: true,
            need_complete_conversation: true,
            need_coco_conversation: true,
            need_coco_bot: true,
            need_pc_pin_chain: true,
            pc_pin_query_type: 0,
          },
        },
      },
      sequence_id: this.generateUUID(),
      channel: 2,
      version: '1',
    };

    const response = await $http.post(`${this.baseUrl}/im/chain/recent_conv`, payload, this.getRequestConfig());
    const responseCode = typeof response.data?.status_code === 'number' ? response.data.status_code : 0;
    const responseMsg = response.data?.status_desc;
    const body = response.data.downlink_body?.pull_recent_conv_chain_downlink_body;

    if (!body) {
      return {
        code: responseCode,
        msg: typeof responseMsg === 'string' ? responseMsg : undefined,
        items: [],
        hasMore: false,
      };
    }

    const items: Conversation[] = (body.cells || []).map((cell: any) => {
      const conv = cell.conversation;
      return {
        id: conv.conversation_id,
        title: conv.name === '豆包' ? '手机版对话' : conv.name || '新对话',
        createTime: parseInt(conv.create_time) * 1000,
        updateTime: parseInt(conv.update_time) * 1000,
        pinned: !!conv.pinned_time,
      };
    });

    return {
      code: responseCode,
      msg: typeof responseMsg === 'string' ? responseMsg : undefined,
      items: items.slice(0, 20),
      nextCursor: body.next_conv_version,
      hasMore: body.has_more,
    };
  }

  async getMessages(
    conversationId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<{ code?: number; msg?: string; items: Message[]; nextCursor?: string; hasMore: boolean }> {
    const payload = {
      cmd: 3100,
      uplink_body: {
        pull_singe_chain_uplink_body: {
          conversation_id: conversationId,
          anchor_index: cursor ? parseInt(cursor) : 0,
          conversation_type: 3,
          direction: 1,
          limit: limit,
          ext: {},
          filter: { index_list: [] },
        },
      },
      sequence_id: this.generateUUID(),
      channel: 2,
      version: '1',
    };

    const response = await $http.post(`${this.baseUrl}/im/chain/single`, payload, this.getRequestConfig());
    const responseCode = typeof response.data?.status_code === 'number' ? response.data.status_code : 0;
    const responseMsg = response.data?.status_desc;
    const body = response.data.downlink_body?.pull_singe_chain_downlink_body;

    if (!body) {
      return {
        code: responseCode,
        msg: typeof responseMsg === 'string' ? responseMsg : undefined,
        items: [],
        hasMore: false,
      };
    }

    const items: Message[] = await Promise.all(
      (body.messages || [])
        .filter((msg: any) => {
          // Filter out messages with send_scene=17 (system messages)
          return msg.send_scene !== '17';
        })
        .map(async (msg: any) => {
          let content = '';
          const attachments: Attachment[] = [];
          const images: ImageInfo[] = [];
          const videos: VideoInfo[] = [];

          try {
            // Handle content_type = 20 (entity messages with images and text)
            if (msg.content_type === 20 && typeof msg.content === 'string') {
              try {
                const contentObj = JSON.parse(msg.content);

                // Extract text
                if (contentObj.text) {
                  content = contentObj.text;
                }

                // Extract images from entities
                if (contentObj.entities && Array.isArray(contentObj.entities)) {
                  for (const entity of contentObj.entities) {
                    if (entity.entity_type === 2 && entity.entity_content?.image) {
                      const image = entity.entity_content.image;
                      images.push({
                        url: image.image_ori?.url || '',
                        width: image.image_ori?.width || 0,
                        height: image.image_ori?.height || 0,
                        key: image.key,
                        thumbnailUrl: image.image_thumb?.url,
                        previewUrl: image.preview_img?.url,
                      });
                    }
                  }
                }
              } catch (e) {
                // Fallback to raw content
                content = msg.content;
              }
            }
            // Handle content_type = 1 with samantha_context (images in ext)
            else if (msg.content_type === 1 && msg.ext?.samantha_context) {
              try {
                // Parse text content
                const contentObj = JSON.parse(msg.content);
                if (contentObj.text) {
                  content = contentObj.text;
                }

                // Parse samantha_context for images
                const contextObj = JSON.parse(msg.ext.samantha_context);
                if (contextObj.query_context?.ref_images && Array.isArray(contextObj.query_context.ref_images)) {
                  for (const refImage of contextObj.query_context.ref_images) {
                    images.push({
                      url: refImage.url || '',
                      width: 0,
                      height: 0,
                      key: refImage.image_token,
                      thumbnailUrl: refImage.url,
                    });
                  }
                }
              } catch (e) {
                // Fallback to raw content
                const contentObj = JSON.parse(msg.content);
                content = contentObj.text || msg.content;
              }
            }
            // Handle content_block structure
            else if (msg.content_block) {
              for (const block of msg.content_block) {
                // Handle text blocks (10000)
                if (block.block_type === 10000) {
                  content += this.buildTextContentWithEmbeddedImages(block);
                }
                // Handle user-uploaded attachments (10052)
                else if (block.block_type === 10052 && block.content?.attachment_block) {
                  const attachmentBlock = block.content.attachment_block;
                  if (attachmentBlock.attachments && attachmentBlock.attachments.length > 0) {
                    for (const att of attachmentBlock.attachments) {
                      const fileInfo = att.file;
                      attachments.push({
                        id: att.identifier,
                        url: fileInfo.url,
                        name: fileInfo.name,
                        size: fileInfo.size,
                        type: path.extname(fileInfo.name).replace('.', ''),
                        title: fileInfo.name,
                        downloadUrl: fileInfo.url,
                        redirect: isNewDocumentId(att.identifier),
                      });
                    }
                  }
                }
                // Handle bot-generated files (10030)
                else if (block.block_type === 10030 && block.content?.artifact_block) {
                  const artifact = block.content.artifact_block;
                  if (artifact.resource_id) {
                    attachments.push({
                      id: artifact.resource_id,
                      url: '',
                      name: artifact.title,
                      size: 0,
                      type: 'artifact',
                      title: artifact.title,
                      createTime: parseInt(msg.create_time) * 1000,
                      redirect: isNewDocumentId(artifact.resource_id),
                    });
                  }
                }
                // Handle creation blocks (2074) - images and videos
                else if (block.block_type === 2074 && block.content?.creation_block) {
                  const creationBlock = block.content.creation_block;
                  if (creationBlock.creations && Array.isArray(creationBlock.creations)) {
                    for (const creation of creationBlock.creations) {
                      // Handle images (type: 1)
                      if (creation.type === 1 && creation.image) {
                        const image = creation.image;
                        images.push({
                          url: image.image_ori_raw?.url || image.image_ori?.url || '',
                          width: image.image_ori_raw?.width || image.image_ori?.width || 0,
                          height: image.image_ori_raw?.height || image.image_ori?.height || 0,
                          key: image.key,
                          thumbnailUrl: image.image_thumb?.url,
                          previewUrl: image.image_preview?.url,
                        });
                      }
                      // Handle videos (type: 2)
                      else if (creation.type === 2 && creation.video) {
                        const video = creation.video;
                        videos.push({
                          vid: video.vid,
                          url: '',
                          coverUrl: video.cover?.image_thumb?.url || video.cover?.image_ori?.url || '',
                          width: parseInt(video.width) || 0,
                          height: parseInt(video.height) || 0,
                          duration: video.duration || 0,
                          videoType: video.video_type,
                        });
                      }
                    }
                  }
                }
              }
            } else if (typeof msg.content === 'string' && msg.content.startsWith('[')) {
              // Parse JSON content blocks
              const blocks = JSON.parse(msg.content);
              for (const block of blocks) {
                // Handle text blocks
                if (block.content?.text_block?.text || (Array.isArray(block.meta_info) && block.meta_info.length > 0)) {
                  content += this.buildTextContentWithEmbeddedImages(block);
                }
                // Handle attachments
                else if (block.content?.attachment_block) {
                  const attachmentBlock = block.content.attachment_block;
                  if (attachmentBlock.attachments && attachmentBlock.attachments.length > 0) {
                    for (const att of attachmentBlock.attachments) {
                      const fileInfo = att.file;
                      attachments.push({
                        id: att.identifier,
                        url: fileInfo.url,
                        name: fileInfo.name,
                        size: fileInfo.size,
                        type: path.extname(fileInfo.name).replace('.', ''),
                        title: fileInfo.name,
                        downloadUrl: fileInfo.url,
                      });
                    }
                  }
                }
                // Handle artifacts
                else if (block.content?.artifact_block) {
                  const artifact = block.content.artifact_block;
                  if (artifact.resource_id) {
                    attachments.push({
                      id: artifact.resource_id,
                      url: '',
                      name: artifact.title,
                      size: 0,
                      type: 'artifact',
                      title: artifact.title,
                      createTime: parseInt(msg.create_time) * 1000,
                      redirect: isNewDocumentId(artifact.resource_id),
                    });
                  }
                }
                // Handle creation blocks - images and videos
                else if (block.content?.creation_block) {
                  const creationBlock = block.content.creation_block;
                  if (creationBlock.creations && Array.isArray(creationBlock.creations)) {
                    for (const creation of creationBlock.creations) {
                      // Handle images
                      if (creation.type === 1 && creation.image) {
                        const image = creation.image;
                        images.push({
                          url: image.image_ori_raw?.url || image.image_ori?.url || '',
                          width: image.image_ori_raw?.width || image.image_ori?.width || 0,
                          height: image.image_ori_raw?.height || image.image_ori?.height || 0,
                          key: image.key,
                          thumbnailUrl: image.image_thumb?.url,
                          previewUrl: image.image_preview?.url,
                        });
                      }
                      // Handle videos
                      else if (creation.type === 2 && creation.video) {
                        const video = creation.video;
                        videos.push({
                          vid: video.vid,
                          url: '',
                          coverUrl: video.cover?.image_thumb?.url || video.cover?.image_ori?.url || '',
                          width: parseInt(video.width) || 0,
                          height: parseInt(video.height) || 0,
                          duration: video.duration || 0,
                          videoType: video.video_type,
                        });
                      }
                    }
                  }
                }
              }
            } else if (msg.content_type === 1 && typeof msg.content === 'string') {
              // Handle simple text content
              try {
                const contentObj = JSON.parse(msg.content);
                content = contentObj.text || msg.content;
              } catch (e) {
                content = msg.content;
              }
            } else {
              content = msg.content;
            }

            // Compatibility: historical assistant "document attachment" may be carried in msg.ext.samantha_artifact
            // (see src/ai-platform/fiddler数据/豆包历史消息带文档附件.txt). It might not appear as block_type=10030.
            try {
              const rawArtifact = msg.ext?.samantha_artifact;
              const artifactObj = typeof rawArtifact === 'string' ? JSON.parse(rawArtifact) : rawArtifact;

              const artifacts = Array.isArray(artifactObj) ? artifactObj : artifactObj ? [artifactObj] : [];
              for (const art of artifacts) {
                let artifactId = art?.resource_id;
                if (typeof artifactId === 'number') artifactId = String(artifactId);
                if (!artifactId || typeof artifactId !== 'string') continue;
                if (attachments.some((a) => a.id === artifactId)) continue;

                const title = typeof art?.title === 'string' ? art.title : '';
                attachments.push({
                  id: artifactId,
                  url: '',
                  name: title || artifactId,
                  size: 0,
                  type: 'artifact',
                  title: title || artifactId,
                  createTime: parseInt(msg.create_time) * 1000,
                  redirect: isNewDocumentId(artifactId),
                });
              }
            } catch (e) {
              // ignore invalid samantha_artifact
            }

            // If content is still empty, try tts_content as fallback
            // BUT: Skip tts_content for pure creation messages (videos/images/documents)
            const isCreationMessage = msg.ext?.use_creation === '1' || msg.ext?.use_creation === 1;
            const hasCreationContent =
              images.length > 0 || videos.length > 0 || attachments.some((att) => att.type === 'artifact');

            if (!content && msg.tts_content && !(isCreationMessage && hasCreationContent)) {
              content = msg.tts_content;
            }
          } catch (e) {
            // Fallback: try tts_content first, then content
            // BUT: Skip tts_content for pure creation messages
            const isCreationMessage = msg.ext?.use_creation === '1' || msg.ext?.use_creation === 1;
            const hasCreationContent =
              images.length > 0 || videos.length > 0 || attachments.some((att) => att.type === 'artifact');

            if (!(isCreationMessage && hasCreationContent)) {
              content = msg.tts_content || msg.content || '';
            } else {
              content = '';
            }
          }

          // Build the message object
          const message: Message = {
            id: msg.message_id,
            conversationId: msg.conversation_id,
            role: msg.user_type === 1 ? 'user' : 'assistant',
            content: content,
            createTime: parseInt(msg.create_time) * 1000,
            attachments: attachments.length > 0 ? attachments : undefined,
          };

          // Add images and videos to extra field if present
          if (images.length > 0 || videos.length > 0) {
            message.extra = {
              ...(message.extra || {}),
              images: images.length > 0 ? images : undefined,
              videos: videos.length > 0 ? videos : undefined,
            };
          }

          return message;
        }),
    );

    const nextCursor = body?.next_index ?? undefined;

    return {
      code: responseCode,
      msg: typeof responseMsg === 'string' ? responseMsg : undefined,
      items,
      nextCursor,
      hasMore: items.length >= limit,
    };
  }
  async getExportedAttachmentInfo(resourceId: string, type: number = 1): Promise<Attachment | null> {
    try {
      // 1. Check page upgrade status
      const upgradeUrl = `${this.baseUrl}/samantha/otter/doc/d2d/page_upgrade_status/get`;
      const upgradeConfig = this.getRequestConfig();
      upgradeConfig.params = { ...upgradeConfig.params, page_id: resourceId };

      const upgradePayload = { page_type: 1, page_id: resourceId };
      const upgradeRes = await $http.post<DoubaoPageUpgradeStatusResponse>(upgradeUrl, upgradePayload, upgradeConfig);
      if (upgradeRes.data.code !== 0) {
        console.error('Failed to get page upgrade status:', upgradeRes.data.msg);
        return null;
      }
      const dstPageId = upgradeRes.data.data.dst_page_id;

      // 2. Create export job
      // type: 1=DOCX, 2=PDF, 3=Markdown
      const createUrl = `${this.baseUrl}/samantha/otter/export/page/create`;
      const createPayload = {
        page_token: dstPageId,
        type: type,
      };
      const createRes = await $http.post<DoubaoExportPageCreateResponse>(
        createUrl,
        createPayload,
        this.getRequestConfig(),
      );
      if (createRes.data.code !== 0) {
        console.error('Failed to create export job:', createRes.data.msg);
        return null;
      }
      const jobId = createRes.data.data.job_id;

      // 3. Poll for result
      const resultUrl = `${this.baseUrl}/samantha/otter/export/page/result`;
      const resultPayload = { job_id: jobId };

      let attempts = 0;
      const maxAttempts = 20; // 20 * 1s = 20s timeout roughly

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const resultRes = await $http.post<DoubaoExportPageResultResponse>(
          resultUrl,
          resultPayload,
          this.getRequestConfig(),
        );

        if (resultRes.data.code === 0) {
          const jobStatus = resultRes.data.data.job_status;
          if (jobStatus === 2) {
            // Success
            const data = resultRes.data.data;
            // Determine file extension based on export type
            let fileType = 'docx';
            if (type === 2) fileType = 'pdf';
            else if (type === 3) fileType = 'md';

            return {
              id: resourceId,
              url: data.url,
              name: data.file_name,
              size: data.file_size,
              type: fileType,
              title: data.file_name?.split('.')[0],
              downloadUrl: data.url,
            };
          } else if (jobStatus === 3 || jobStatus === 4) {
            // Failed
            console.error('Export job failed with status:', jobStatus);
            break;
          }
          // If status is 1 (processing), continue polling
        }
        attempts++;
      }
    } catch (error) {
      console.error('Error getting exported attachment info:', error);
    }
    return null;
  }

  /**
   * Get video play information (download URL) by video ID
   * Corresponds to POST https://www.doubao.com/samantha/video/get_play_info
   * @param vid Video ID (e.g., 'v0369cg10004d6rnl47og65lltijtdlg')
   * @returns VideoInfo with download URL and metadata
   */
  async getVideoPlayInfo(vid: string): Promise<VideoInfo | null> {
    try {
      const url = `${this.baseUrl}/samantha/video/get_play_info`;
      const payload = { vid };

      const config = this.getRequestConfig();
      config.headers = {
        ...config.headers,
        'Agw-Js-Conv': 'str',
        'Content-Type': 'application/json',
      };

      const response = await $http.post<DoubaoGetVideoPlayInfoResponse>(url, payload, config);

      if (response.data.code !== 0) {
        console.error('Failed to get video play info:', response.data.msg);
        return null;
      }

      const playInfos = response.data.data.play_infos;
      if (!playInfos || playInfos.length === 0) {
        console.error('No play info available for video:', vid);
        return null;
      }

      // Get the first (usually highest quality) play info
      const playInfo = playInfos[0];

      return {
        vid: vid,
        url: playInfo.main,
        coverUrl: '', // Cover URL is not in this response, should be from previous message
        width: playInfo.width,
        height: playInfo.height,
        duration: 0, // Duration is not in this response
        videoType: 'mp4', // Assume mp4 format
      };
    } catch (error) {
      console.error('Error getting video play info:', error);
      return null;
    }
  }

  private processContentBlocks(
    blocks: any[],
    subscriber: Subscriber<StreamEvent>,
    messageId: string,
    conversationId: string,
    createTime: number,
    emittedAttachments: Map<string, number>,
    includeThinkingProcess: boolean = false,
    thinkingBlockId: string | null = null,
    skipArtifactTextContent: boolean = false,
  ) {
    for (const block of blocks) {
      // Handle thinking blocks (10040) - only include if requested
      if (block.block_type === 10040 && block.content?.thinking_block) {
        // Skip thinking blocks unless explicitly requested
        if (!includeThinkingProcess) {
          continue;
        }
      }
      // Handle text blocks (10000) - extract text content and images from meta_info
      if (block.block_type === 10000) {
        // First, handle text content if present
        if (block.content?.text_block?.text) {
          const text = block.content.text_block.text;

          // Check if this text block is a child of a thinking block
          // Either by checking parent_id against blocks in current array, or against tracked thinkingBlockId
          const isThinkingContent =
            block.parent_id &&
            (blocks.some((b) => b.block_id === block.parent_id && b.block_type === 10040) ||
              block.parent_id === thinkingBlockId);

          // Handle thinking content
          if (isThinkingContent) {
            if (includeThinkingProcess) {
              // Emit as 'thinking' event
              subscriber.next({
                type: 'thinking',
                thinkingText: text,
              });
            }
            // Skip emitting text event (whether included or not)
            continue;
          }

          // Emit text event without accumulation
          if (text) {
            subscriber.next({
              type: 'text',
              data: text,
            });
          }
        }

        // Then, handle meta_info array to extract embedded images
        if (block.meta_info && Array.isArray(block.meta_info)) {
          for (const metaItem of block.meta_info) {
            if (metaItem.type === 202) {
              try {
                // Parse the image data from info or tag_info field
                const imageDataStr = metaItem.info || metaItem.tag_info;
                if (imageDataStr) {
                  const imageData = JSON.parse(imageDataStr);

                  // Extract image information from the parsed data
                  if (imageData.media && Array.isArray(imageData.media) && imageData.media.length > 0) {
                    const imageMarkdownList: string[] = [];
                    for (const media of imageData.media) {
                      if (media.type === 1 && media.image) {
                        const image = media.image;
                        const imageUrl = (image.full_size_url && image.full_size_url[0]) || image.thumb_url;
                        const caption = image.img_caption || '';
                        const imageKey = `embedded-image:${image.id || image.item_id || imageUrl}`;

                        // Emit image as text in markdown format: ![caption](url)\n
                        if (imageUrl && !emittedAttachments.has(imageKey)) {
                          imageMarkdownList.push(`![${caption}](${imageUrl})`);
                          emittedAttachments.set(imageKey, 1);
                        }
                      }
                    }

                    if (imageMarkdownList.length > 0) {
                      subscriber.next({
                        type: 'text',
                        data: `${imageMarkdownList.join(' ')}\n`,
                      });
                    }
                  }
                }
              } catch (error) {
                // Silently ignore parsing errors
                console.error('Error parsing meta_info image data:', error);
              }
            }
          }
        }
      }
      // Handle user-uploaded attachments (10052)
      else if (block.block_type === 10052 && block.content?.attachment_block) {
        const attachmentBlock = block.content.attachment_block;
        if (attachmentBlock.attachments && attachmentBlock.attachments.length > 0) {
          for (const att of attachmentBlock.attachments) {
            const fileInfo = att.file;
            const attachmentId = att.identifier;

            // Track emission count for this attachment
            const emitCount = emittedAttachments.get(attachmentId) || 0;

            // Only emit once per attachment
            if (emitCount === 0) {
              const attachment: Attachment = {
                id: attachmentId,
                url: fileInfo.url,
                name: fileInfo.name,
                size: fileInfo.size,
                type: path.extname(fileInfo.name).replace('.', ''),
                title: fileInfo.name,
                downloadUrl: fileInfo.url,
                createTime: createTime,
                redirect: isNewDocumentId(attachmentId),
              };
              subscriber.next({
                type: 'attachment',
                attachment: attachment,
                createTime: createTime,
              });
            }

            emittedAttachments.set(attachmentId, 1);
          }
        }
      }
      // Handle bot-generated files (10030) - only parse basic info
      else if (block.block_type === 10030 && block.content?.artifact_block) {
        const artifact = block.content.artifact_block;
        if (artifact.resource_id) {
          const attachmentId = artifact.resource_id;

          // Only emit once per attachment
          if (!emittedAttachments.has(attachmentId)) {
            const attachment: Attachment = {
              id: attachmentId,
              url: '',
              name: artifact.title,
              size: 0,
              type: 'artifact',
              title: artifact.title,
              createTime: createTime,
              redirect: isNewDocumentId(attachmentId),
            };
            subscriber.next({
              type: 'attachment',
              attachment: attachment,
              createTime: createTime,
            });
          }

          emittedAttachments.set(attachmentId, 1);
        }
      }
      // Handle creation blocks (2074) - images and videos generated by AI
      else if (block.block_type === 2074 && block.content?.creation_block) {
        const creationBlock = block.content.creation_block;
        if (creationBlock.creations && Array.isArray(creationBlock.creations)) {
          const collectedImages: ImageInfo[] = [];
          const collectedVideos: VideoInfo[] = [];

          for (const creation of creationBlock.creations) {
            // Handle images (type: 1)
            if (creation.type === 1 && creation.image) {
              const image = creation.image;
              // Only process completed images (status: 2)
              if (image.status === 2) {
                const imageInfo: ImageInfo = {
                  url: image.image_ori_raw?.url || image.image_ori?.url || '',
                  width: image.image_ori_raw?.width || image.image_ori?.width || 0,
                  height: image.image_ori_raw?.height || image.image_ori?.height || 0,
                  key: image.key,
                  thumbnailUrl: image.image_thumb?.url,
                  previewUrl: image.image_preview?.url,
                };

                // Only add if URL is valid
                if (imageInfo.url) {
                  collectedImages.push(imageInfo);
                }
              }
            }
            // Handle videos (type: 2)
            else if (creation.type === 2 && creation.video) {
              const video = creation.video;
              // Only process completed videos (status: 2)
              if (video.status === 2) {
                const videoInfo: VideoInfo = {
                  vid: video.vid,
                  url: '',
                  coverUrl: video.cover?.image_thumb?.url || video.cover?.image_ori?.url || '',
                  width: parseInt(video.width) || 0,
                  height: parseInt(video.height) || 0,
                  duration: video.duration || 0,
                  videoType: video.video_type,
                };

                // Only add if vid is valid
                if (videoInfo.vid) {
                  collectedVideos.push(videoInfo);
                }
              }
            }
          }

          // Emit image event if we have collected images
          if (collectedImages.length > 0) {
            subscriber.next({
              type: 'image',
              images: collectedImages,
            });
          }

          // Emit video event if we have collected videos
          if (collectedVideos.length > 0) {
            subscriber.next({
              type: 'video',
              videos: collectedVideos,
            });
          }
        }
      }
    }
  }

  private emitStreamError(subscriber: Subscriber<StreamEvent>, error: unknown): void {
    if (subscriber.closed) {
      return;
    }

    const errorInfo =
      error instanceof Error
        ? {
            message: error.message,
            code: (error as any).code,
          }
        : error;

    subscriber.next({
      type: 'error',
      error: errorInfo,
    });
    subscriber.complete();
  }

  sendMessage(content: string, options?: SendMessageOptions): Observable<StreamEvent> {
    // Check if this is an image generation request
    if (options?.skill?.type === 2) {
      return this.sendImageGenerationMessage(content, options);
    }

    // Check if this is a video generation request
    if (options?.skill?.type === 3) {
      return this.sendVideoGenerationMessage(content, options);
    }

    return new Observable((subscriber: Subscriber<StreamEvent>) => {
      const localMsgId = this.generateUUID();
      const isNewChat = !options?.conversationId;
      const conversationId = options?.conversationId || '';
      const botId = options?.botId || this.botId || '0';

      // A placeholder for section_id. In a real scenario, this might come from conversation info.
      // For now, I'll use a dummy or try to extract from cookie/default.
      const sectionId = this.sectionId || '0';

      const messageContentBlocks: any[] = [];

      // Add text content block if content is provided
      if (content) {
        messageContentBlocks.push({
          block_type: 10000,
          content: {
            text_block: {
              text: content,
              icon_url: '',
              icon_url_dark: '',
              summary: '',
            },
            pc_event_block: '',
          },
          block_id: this.generateUUID(),
          parent_id: '',
          meta_info: [],
          append_fields: [],
        });
      }

      // Handle attachments
      if (options?.attachments && options.attachments.length > 0) {
        Promise.all(
          options.attachments.map((att) => this.uploadAttachment(att, conversationId, botId, sectionId, localMsgId)),
        )
          .then((uploadedAttachments) => {
            const attachmentBlocks = uploadedAttachments.map((uploadedAtt) => this.buildAttachmentBlock(uploadedAtt));

            messageContentBlocks.unshift({
              // Attachments seem to be at the beginning of content_block in Fiddler
              block_type: 10052, // Correct block type for attachments from Fiddler
              content: {
                attachment_block: {
                  attachments: attachmentBlocks,
                },
                pc_event_block: '',
              },
              block_id: this.generateUUID(),
              parent_id: '',
              meta_info: [],
              append_fields: [],
            });

            // Continue with sending the message after attachments are processed
            this.sendDoubaoMessage(localMsgId, isNewChat, options, messageContentBlocks, subscriber);
          })
          .catch((error) => {
            this.emitStreamError(subscriber, error);
          });
      } else {
        // If no attachments, just send the message
        this.sendDoubaoMessage(localMsgId, isNewChat, options, messageContentBlocks, subscriber);
      }
    });
  }

  /**
   * Send image generation message
   * This is a specialized method for skill=2 (image generation)
   */
  private sendImageGenerationMessage(content: string, options?: SendMessageOptions): Observable<StreamEvent> {
    return new Observable((subscriber: Subscriber<StreamEvent>) => {
      const localMsgId = this.generateUUID();
      const isNewChat = !options?.conversationId;
      const conversationId = options?.conversationId || '';
      const botId = options?.botId || this.botId || '0';
      const sectionId = this.sectionId || '0';

      // Get ratio parameter (optional, no default value)
      const ratio = options?.skill?.ratio;

      // Prefix content with "帮我生成图片：" and include ratio if specified
      const imagePrompt = ratio ? `帮我生成图片：比例 「${ratio}」${content}` : `帮我生成图片：${content}`;

      const messageContentBlocks: any[] = [];

      // Handle attachments for image generation (reference image)
      if (options?.attachments && options.attachments.length > 0) {
        Promise.all(
          options.attachments.map((att) => this.uploadAttachment(att, conversationId, botId, sectionId, localMsgId)),
        )
          .then((uploadedAttachments) => {
            // Build message content with image generation format
            const contentObj: any = {
              text: imagePrompt,
              model: 'Seedream 4.5',
              template_type: 'placeholder',
              use_creation: false,
            };

            // Only add ratio if it's specified
            if (ratio) {
              contentObj.ratio = ratio;
            }

            const textContent = JSON.stringify(contentObj);

            messageContentBlocks.push({
              block_type: 10000,
              content: {
                text_block: {
                  text: textContent,
                  icon_url: '',
                  icon_url_dark: '',
                  summary: '',
                },
                pc_event_block: '',
              },
              block_id: this.generateUUID(),
              parent_id: '',
              meta_info: [],
              append_fields: [],
            });

            // Build attachment blocks for image generation
            const attachmentBlocks = uploadedAttachments.map((uploadedAtt) => ({
              type: 'image',
              key: uploadedAtt.url.replace('https://p26-flow-sign.byteimg.com/', ''),
              extra: { refer_types: 'overall' },
              identifier: this.generateUUID(),
            }));

            // Send the image generation message
            this.sendDoubaoImageMessage(
              localMsgId,
              isNewChat,
              options,
              messageContentBlocks,
              attachmentBlocks,
              subscriber,
            );
          })
          .catch((error) => {
            this.emitStreamError(subscriber, error);
          });
      } else {
        // No reference image, just text prompt
        const contentObj: any = {
          text: imagePrompt,
          model: 'Seedream 4.5',
          template_type: 'placeholder',
          use_creation: false,
        };

        // Only add ratio if it's specified
        if (ratio) {
          contentObj.ratio = ratio;
        }

        const textContent = JSON.stringify(contentObj);

        messageContentBlocks.push({
          block_type: 10000,
          content: {
            text_block: {
              text: textContent,
              icon_url: '',
              icon_url_dark: '',
              summary: '',
            },
            pc_event_block: '',
          },
          block_id: this.generateUUID(),
          parent_id: '',
          meta_info: [],
          append_fields: [],
        });

        this.sendDoubaoImageMessage(localMsgId, isNewChat, options, messageContentBlocks, [], subscriber);
      }
    });
  }

  /**
   * Send video generation message
   * This is a specialized method for skill=3 (video generation)
   */
  private sendVideoGenerationMessage(content: string, options?: SendMessageOptions): Observable<StreamEvent> {
    return new Observable((subscriber: Subscriber<StreamEvent>) => {
      const localMsgId = this.generateUUID();
      const isNewChat = !options?.conversationId;
      const conversationId = options?.conversationId || '';
      const botId = options?.botId || this.botId || '0';
      const sectionId = this.sectionId || '0';

      // Get ratio parameter (optional, no default value)
      const ratio = options?.skill?.ratio;

      // Include ratio in content if specified
      const videoPrompt = ratio ? `${content}，比例 「${ratio}」` : content;

      // Handle attachments for video generation (reference image)
      if (options?.attachments && options.attachments.length > 0) {
        Promise.all(
          options.attachments.map((att) => this.uploadAttachment(att, conversationId, botId, sectionId, localMsgId)),
        )
          .then((uploadedAttachments) => {
            // Build attachment blocks for video generation
            const attachmentBlocks = uploadedAttachments.map((uploadedAtt) => ({
              type: 'image',
              key: uploadedAtt.url.replace('https://p26-flow-sign.byteimg.com/', ''),
              identifier: this.generateUUID(),
              extra: { refer_types: 'overall' },
            }));

            // Send the video generation message
            this.sendDoubaoVideoMessage(
              localMsgId,
              isNewChat,
              options,
              videoPrompt,
              ratio,
              attachmentBlocks,
              subscriber,
            );
          })
          .catch((error) => {
            this.emitStreamError(subscriber, error);
          });
      } else {
        // No reference image, just text prompt
        this.sendDoubaoVideoMessage(localMsgId, isNewChat, options, videoPrompt, ratio, [], subscriber);
      }
    });
  }

  /**
   * Send image generation message to Doubao API
   */
  private sendDoubaoImageMessage(
    localMsgId: string,
    isNewChat: boolean,
    options: SendMessageOptions | undefined,
    messageContentBlocks: any[],
    attachments: any[],
    subscriber: Subscriber<StreamEvent>,
  ) {
    const payload: any = {
      messages: [
        {
          content: messageContentBlocks[0].content.text_block.text,
          content_type: 2009, // Image generation content type
          attachments: attachments.length > 0 ? attachments : [],
        },
      ],
      completion_option: {
        is_regen: false,
        with_suggest: false,
        need_create_conversation: isNewChat,
        launch_stage: 1,
        is_replace: false,
        is_delete: false,
        is_ai_playground: false,
        message_from: 0,
        action_bar_skill_id: 3,
        use_auto_cot: false,
        resend_for_regen: false,
        enable_commerce_credit: false,
        event_id: '0',
      },
      evaluate_option: {
        web_ab_params: '',
      },
      section_id: this.sectionId || '0',
      conversation_id: options?.conversationId || '0',
      local_message_id: localMsgId,
    };

    if (!options?.conversationId) {
      payload['local_conversation_id'] = `local_${Date.now()}324`;
      payload.section_id = undefined;
    }
    const config = this.getRequestConfig();
    config.headers = {
      ...config.headers,
      'Agw-Js-Conv': 'str, str',
      Accept: '*/*',
      'last-event-id': 'undefined',
      Referer: options?.conversationId ? `${this.baseUrl}/chat/${options.conversationId}` : `${this.baseUrl}/chat/`,
      'Content-Type': 'application/json',
    };

    // Use the completion endpoint from Fiddler data
    const url = `${this.baseUrl}/samantha/chat/completion`;
    applyDoubaoABogusSignature(config.params || {}, payload, options?.unsign)
      .then((signedParams) => {
        config.params = signedParams;
        $http
          .post(url, payload, {
            ...config,
            responseType: 'stream',
          })
          .then((response) => {
            const stream = response.data;
            let buffer = '';
            let currentMessageId = '';
            let currentConversationId = '';
            let createTime = Date.now();
            let hasEmittedStart = false;
            let hasError = false;
            const collectedImages: ImageInfo[] = [];

            stream.on('data', (chunk: Buffer) => {
              if (hasError) {
                return;
              }

              buffer += chunk.toString();
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (hasError) {
                  break;
                }

                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

                const dataStr = trimmedLine.slice(5).trim();
                if (!dataStr) continue;

                try {
                  const data = JSON.parse(dataStr);
                  const eventData = data.event_data ? JSON.parse(data.event_data) : null;

                  if (!eventData) continue;

                  // Extract message ID and conversation ID
                  if (eventData.message_id && !currentMessageId) {
                    currentMessageId = eventData.message_id;
                  }
                  if (eventData.conversation_id && !currentConversationId) {
                    currentConversationId = eventData.conversation_id;
                  }

                  // Emit start event
                  if (!hasEmittedStart && currentConversationId && currentMessageId) {
                    createTime = Date.now();
                    subscriber.next({
                      type: 'start',
                      messageId: currentMessageId,
                      conversationId: currentConversationId,
                      createTime: createTime,
                    });
                    hasEmittedStart = true;
                  }

                  // Handle text content (AI response text)
                  if (eventData.message?.content_type === 10000 && eventData.message?.content) {
                    try {
                      const contentObj = JSON.parse(eventData.message.content);
                      if (contentObj.text) {
                        subscriber.next({
                          type: 'text',
                          data: contentObj.text,
                        });
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }
                  }

                  // Handle image generation results (content_type: 2074)
                  if (eventData.message?.content_type === 2074 && eventData.message?.content) {
                    try {
                      const contentObj = JSON.parse(eventData.message.content);
                      if (contentObj.creations && Array.isArray(contentObj.creations)) {
                        for (const creation of contentObj.creations) {
                          if (creation.type === 1 && creation.image?.status === 2) {
                            // Status 2 means image is ready
                            const imageInfo: ImageInfo = {
                              url: creation.image.image_ori_raw?.url || '',
                              width: creation.image.image_ori_raw?.width || 0,
                              height: creation.image.image_ori_raw?.height || 0,
                              thumbnailUrl: creation.image.image_thumb?.url,
                              previewUrl: creation.image.image_preview?.url,
                            };

                            // Only add if URL is valid and not already collected
                            if (imageInfo.url && !collectedImages.some((img) => img.url === imageInfo.url)) {
                              collectedImages.push(imageInfo);
                            }
                          }
                        }

                        // Emit image event if we have collected images
                        if (collectedImages.length > 0) {
                          subscriber.next({
                            type: 'image',
                            images: [...collectedImages],
                          });
                        }
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }
                  }

                  // Handle completion
                  if (eventData.is_finish || data.event_type === 2003) {
                    subscriber.next({
                      type: 'end',
                      messageId: currentMessageId,
                      conversationId: currentConversationId,
                      createTime: createTime,
                    });
                    subscriber.complete();
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            });

            stream.on('end', () => {
              if (!subscriber.closed && !hasError) {
                subscriber.complete();
              }
            });

            stream.on('error', (err: Error) => {
              hasError = true;
              if (!subscriber.closed) {
                this.emitStreamError(subscriber, err);
              }
            });
          })
          .catch((error) => {
            this.emitStreamError(subscriber, error);
          });
      })
      .catch((error) => {
        this.emitStreamError(subscriber, error);
      });
  }

  /**
   * Send video generation message to Doubao API
   */
  private sendDoubaoVideoMessage(
    localMsgId: string,
    isNewChat: boolean,
    options: SendMessageOptions | undefined,
    content: string,
    ratio: string | undefined,
    attachments: any[],
    subscriber: Subscriber<StreamEvent>,
  ) {
    // Build content object
    const contentObj: any = { text: content };

    // Only add ratio if it's specified
    if (ratio) {
      contentObj.ratio = ratio;
    }

    const payload: any = {
      messages: [
        {
          content: JSON.stringify(contentObj),
          content_type: 2020, // Video generation content type
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      ],
      completion_option: {
        is_regen: false,
        with_suggest: false,
        need_create_conversation: isNewChat,
        launch_stage: 1,
        is_replace: false,
        is_delete: false,
        is_ai_playground: false,
        message_from: 0,
        action_bar_skill_id: 17, // Video generation skill ID
        use_auto_cot: false,
        resend_for_regen: false,
        enable_commerce_credit: false,
        event_id: '0',
      },
      evaluate_option: {
        web_ab_params: '',
      },
      section_id: this.sectionId || '0',
      conversation_id: options?.conversationId || '0',
      local_message_id: localMsgId,
    };

    const config = this.getRequestConfig();
    config.headers = {
      ...config.headers,
      'Agw-Js-Conv': 'str, str',
      Accept: '*/*',
      'last-event-id': 'undefined',
      Referer: options?.conversationId ? `${this.baseUrl}/chat/${options.conversationId}` : `${this.baseUrl}/chat/`,
      'Content-Type': 'application/json',
    };

    // Use the completion endpoint from Fiddler data
    const url = `${this.baseUrl}/samantha/chat/completion`;
    applyDoubaoABogusSignature(config.params || {}, payload, options?.unsign)
      .then((signedParams) => {
        config.params = signedParams;
        $http
          .post(url, payload, {
            ...config,
            responseType: 'stream',
          })
          .then((response) => {
            const stream = response.data;
            let buffer = '';
            let currentMessageId = '';
            let currentConversationId = '';
            let createTime = Date.now();
            let hasEmittedStart = false;
            let hasError = false;
            const collectedVideos: VideoInfo[] = [];

            stream.on('data', (chunk: Buffer) => {
              if (hasError) {
                return;
              }

              buffer += chunk.toString();
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (hasError) {
                  break;
                }

                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

                const dataStr = trimmedLine.slice(5).trim();
                if (!dataStr) continue;

                try {
                  const data = JSON.parse(dataStr);
                  const eventData = data.event_data ? JSON.parse(data.event_data) : null;

                  if (!eventData) continue;

                  // Extract message ID and conversation ID
                  if (eventData.message_id && !currentMessageId) {
                    currentMessageId = eventData.message_id;
                  }
                  if (eventData.conversation_id && !currentConversationId) {
                    currentConversationId = eventData.conversation_id;
                  }

                  // Emit start event
                  if (!hasEmittedStart && currentConversationId && currentMessageId) {
                    createTime = Date.now();
                    subscriber.next({
                      type: 'start',
                      messageId: currentMessageId,
                      conversationId: currentConversationId,
                      createTime: createTime,
                    });
                    hasEmittedStart = true;
                  }

                  // Handle text content (AI response text)
                  if (eventData.message?.content) {
                    try {
                      const contentObj = JSON.parse(eventData.message.content);
                      if (contentObj.text) {
                        subscriber.next({
                          type: 'text',
                          data: contentObj.text,
                        });
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }
                  }

                  // Handle video generation results (content_type: 2074)
                  if (eventData.message?.content_type === 2074 && eventData.message?.content) {
                    try {
                      const contentObj = JSON.parse(eventData.message.content);
                      if (contentObj.creations && Array.isArray(contentObj.creations)) {
                        for (const creation of contentObj.creations) {
                          if (creation.type === 2 && creation.video?.status === 2) {
                            // Status 2 means video is ready
                            const videoInfo: VideoInfo = {
                              vid: creation.video.vid,
                              url: creation.video.download_url || '',
                              coverUrl:
                                creation.video.cover?.image_thumb?.url || creation.video.cover?.image_ori?.url || '',
                              width: parseInt(creation.video.width) || 0,
                              height: parseInt(creation.video.height) || 0,
                              duration: creation.video.duration || 0,
                              videoType: creation.video.video_type,
                            };

                            // Only add if URL is valid and not already collected
                            if (videoInfo.url && !collectedVideos.some((vid) => vid.url === videoInfo.url)) {
                              collectedVideos.push(videoInfo);
                            }
                          }
                        }

                        // Emit video event if we have collected videos
                        if (collectedVideos.length > 0) {
                          subscriber.next({
                            type: 'video',
                            videos: [...collectedVideos],
                          });
                        }
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }
                  }

                  // Handle completion
                  if (eventData.is_finish || data.event_type === 2003) {
                    subscriber.next({
                      type: 'end',
                      messageId: currentMessageId,
                      conversationId: currentConversationId,
                      createTime: createTime,
                    });
                    subscriber.complete();
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            });

            stream.on('end', () => {
              if (!subscriber.closed && !hasError) {
                subscriber.complete();
              }
            });

            stream.on('error', (err: Error) => {
              hasError = true;
              if (!subscriber.closed) {
                this.emitStreamError(subscriber, err);
              }
            });
          })
          .catch((error) => {
            this.emitStreamError(subscriber, error);
          });
      })
      .catch((error) => {
        this.emitStreamError(subscriber, error);
      });
  }

  private sendDoubaoMessage(
    localMsgId: string,
    isNewChat: boolean,
    options: SendMessageOptions | undefined,
    messageContentBlocks: any[],
    subscriber: Subscriber<StreamEvent>,
  ) {
    // Determine think mode settings
    // 豆包支持: 'fast', 'think', 'expert'
    // 如果传入其他模式（如 DeepSeek 的模式），使用默认的 'fast'
    const thinkMode = options?.thinkMode || 'fast';
    let needDeepThink = 0;
    let useDeepThink = '0';
    let cotSwitch = '0';
    let isPro = '0';

    switch (thinkMode) {
      case 'think':
        needDeepThink = 1;
        useDeepThink = '1';
        cotSwitch = '1';
        break;
      case 'expert':
        needDeepThink = 3;
        useDeepThink = '3';
        cotSwitch = '3';
        isPro = '1';
        break;
      case 'fast':
      default:
        // 对于豆包不支持的模式（如 DeepSeek 的 'normal', 'thinking', 'search', 'thinking_search'）
        // 使用默认的 'fast' 模式
        needDeepThink = 0;
        useDeepThink = '0';
        cotSwitch = '0';
        break;
    }

    const payload: any = {
      client_meta: {
        conversation_id: options?.conversationId || '',
        bot_id: options?.botId || this.botId || '',
        last_section_id: this.sectionId || '',
        last_message_index: null, // Fiddler shows 40, but can be dynamic
        local_conversation_id: isNewChat ? `local_${Date.now()}426` : undefined,
      },
      messages: [
        {
          local_message_id: localMsgId,
          content_block: messageContentBlocks,
          message_status: 0,
        },
      ],
      option: {
        send_message_scene: '',
        create_time_ms: Date.now(),
        collect_id: '',
        is_audio: false,
        answer_with_suggest: false,
        tts_switch: false,
        need_deep_think: needDeepThink,
        click_clear_context: false,
        from_suggest: false,
        is_regen: false,
        is_replace: false,
        disable_sse_cache: false,
        select_text_action: '',
        resend_for_regen: false,
        scene_type: 0,
        unique_key: this.generateUUID(),
        start_seq: 0,
        need_create_conversation: isNewChat,
        conversation_init_option: isNewChat ? { need_ack_conversation: true } : undefined,
        regen_query_id: [],
        edit_query_id: [],
        regen_instruction: '',
        no_replace_for_regen: false,
        message_from: 0,
        shared_app_name: '',
        sse_recv_event_options: {
          support_chunk_delta: true,
        },
        is_ai_playground: false,
      },
      ext: {
        use_deep_think: useDeepThink,
        fp: this.fp || '',
        commerce_credit_config_enable: '0',
        sub_conv_firstmet_type: isNewChat ? '1' : '0',
        conversation_init_option: isNewChat ? '{"need_ack_conversation":true}' : undefined,
      },
    };

    // Add chat_ability when skill type is 1
    const skill = options?.skill ?? { type: 0 };
    if (skill.type === 1) {
      payload.chat_ability = {
        ability_type: 2,
        ability_param: '{"action":1,"content_context":{},"config":{"canvas_mode":1,"enable_search":false}}',
      };
    }

    const config = this.getRequestConfig();
    if (!config.params?.msToken) {
      config.params.msToken = generateRandomString(16);
    }

    const signData = buffer.Buffer.from(
      JSON.stringify([querystring.stringify(config.params), JSON.stringify(payload)]),
      'utf-8',
    ).toString('base64');

    // 获取签名
    applyDoubaoABogusSignature(config.params || {}, payload, options?.unsign)
      .then((signedParams) => {
        config.params = signedParams;
        config.headers = {
          ...config.headers,
          'Agw-Js-Conv': 'str, str',
          Accept: '*/*',
          Referer: options?.conversationId ? `${this.baseUrl}/chat/${options.conversationId}` : `${this.baseUrl}/chat/`,
          'Content-Type': 'application/json',
        };

        $http
          .post(`${this.baseUrl}/chat/completion`, payload, {
            ...config,
            responseType: 'stream',
          })
          .then((response) => {
            const stream = response.data;
            let buffer = '';
            let currentMessageId = '';
            let currentConversationId = '';
            let currentEvent = '';
            let createTime = Date.now();
            let hasEmittedStart = false;

            // Get includeThinkingProcess option (default: false)
            const includeThinkingProcess = options?.includeThinkingProcess ?? false;

            // Track emitted attachments to ensure only one emission per attachment
            const emittedAttachments = new Map<string, number>();

            // Track if we're currently in a thinking block
            let isInThinkingBlock = false;
            // Track the thinking block ID to identify thinking content in subsequent events
            let thinkingBlockId: string | null = null;
            // Track if stream has encountered an error
            let hasError = false;

            // Track if there's an artifact in this message (for skill=1)
            let hasArtifact = false;
            // Track if artifact is completed (status: 2, is_finish: true)
            let artifactCompleted = false;
            // Track if artifact content has been emitted (for skill=1)
            let hasEmittedArtifactContent = false;

            stream.on('data', (chunk: Buffer) => {
              // Stop processing if error occurred
              if (hasError) {
                return;
              }

              buffer += chunk.toString();
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                // Stop processing if error occurred
                if (hasError) {
                  break;
                }

                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                if (trimmedLine.startsWith('event:')) {
                  currentEvent = trimmedLine.slice(6).trim();
                } else if (trimmedLine.startsWith('data:')) {
                  const dataStr = trimmedLine.slice(5).trim();
                  if (!dataStr) continue;

                  try {
                    const data = JSON.parse(dataStr);

                    if (currentEvent === 'SSE_ACK') {
                      currentConversationId = data.ack_client_meta?.conversation_id;
                    } else if (currentEvent === 'STREAM_MSG_NOTIFY') {
                      currentMessageId = data.meta?.message_id;
                      createTime = data.meta?.create_time ? data.meta.create_time * 1000 : Date.now();

                      if (!hasEmittedStart && currentConversationId && currentMessageId) {
                        subscriber.next({
                          type: 'start',
                          messageId: currentMessageId,
                          conversationId: currentConversationId,
                          createTime: createTime,
                        });
                        hasEmittedStart = true;
                      }

                      // Check for initial content blocks in STREAM_MSG_NOTIFY
                      if (data.content?.content_block) {
                        // Check if there's a thinking block and capture its ID
                        const thinkingBlock = data.content.content_block.find(
                          (block: any) => block.block_type === 10040,
                        );
                        if (thinkingBlock) {
                          isInThinkingBlock = true;
                          thinkingBlockId = thinkingBlock.block_id;
                        }

                        this.processContentBlocks(
                          data.content.content_block,
                          subscriber,
                          currentMessageId,
                          currentConversationId,
                          createTime,
                          emittedAttachments,
                          includeThinkingProcess,
                          thinkingBlockId,
                          false,
                        );
                      }
                    } else if (currentEvent === 'STREAM_CHUNK') {
                      // STREAM_CHUNK updates the message. It might contain new blocks or updates to existing ones.
                      if (data.patch_op) {
                        for (const op of data.patch_op) {
                          // Check if there's an artifact block (10030) to determine if this is artifact content
                          if (skill.type === 1 && op.patch_value?.content_block) {
                            const artifactBlock = op.patch_value.content_block.find(
                              (block: any) => block.block_type === 10030,
                            );
                            if (artifactBlock?.content?.artifact_block) {
                              const artifact = artifactBlock.content.artifact_block;
                              if (artifact.resource_id) {
                                hasArtifact = true;
                              }
                              // Check if artifact is completed (status: 2, is_finish: true)
                              if (artifact.status === 2 && artifactBlock.is_finish === true) {
                                artifactCompleted = true;
                              }
                            }
                          }

                          // Handle full artifact content (patch_object: 111) for skill=1
                          // Only emit if:
                          // 1. We have confirmed there's an artifact
                          // 2. The artifact is completed (status: 2, is_finish: true)
                          // 3. Haven't emitted artifact content yet
                          // 4. The tts_content is long enough (> 500 chars) to be the full article
                          // 5. The tts_content starts with # (Markdown title)
                          if (
                            skill.type === 1 &&
                            hasArtifact &&
                            artifactCompleted &&
                            !hasEmittedArtifactContent &&
                            op.patch_object === 111 &&
                            op.patch_value?.tts_content
                          ) {
                            const content = op.patch_value.tts_content;
                            // Check if this is the full article (long content starting with #)
                            if (content.length > 200 && content.trim().startsWith('#')) {
                              subscriber.next({
                                type: 'text',
                                data: content,
                              });
                              // Mark as emitted to prevent duplicate output
                              hasEmittedArtifactContent = true;
                              // Skip further processing for this patch_op
                              continue;
                            }
                          }

                          if (op.patch_value?.content_block) {
                            // Check if thinking block is finished
                            const finishedThinkingBlock = op.patch_value.content_block.find(
                              (block: any) => block.block_type === 10040 && block.is_finish,
                            );
                            if (finishedThinkingBlock) {
                              isInThinkingBlock = false;
                              thinkingBlockId = null; // Clear the thinking block ID
                            }

                            this.processContentBlocks(
                              op.patch_value.content_block,
                              subscriber,
                              currentMessageId,
                              currentConversationId,
                              createTime,
                              emittedAttachments,
                              includeThinkingProcess,
                              thinkingBlockId,
                              false, // Don't skip text blocks - only the artifact content itself is skipped
                            );
                          }
                        }
                      }
                    } else if (currentEvent === 'CHUNK_DELTA') {
                      // CHUNK_DELTA is used for thinking process text
                      const delta = data.text;
                      if (delta) {
                        if (isInThinkingBlock) {
                          // This is thinking process text
                          if (includeThinkingProcess) {
                            // Send as 'thinking' type event
                            subscriber.next({
                              type: 'thinking',
                              thinkingText: delta,
                            });
                          }
                          // If not including thinking process, skip (do nothing)
                        } else {
                          // This is regular text (after thinking is done)
                          if (!hasEmittedStart && currentConversationId) {
                            subscriber.next({
                              type: 'start',
                              messageId: currentMessageId,
                              conversationId: currentConversationId,
                              createTime: createTime,
                            });
                            hasEmittedStart = true;
                          }

                          subscriber.next({
                            type: 'text',
                            data: delta,
                          });
                        }
                      }
                    } else if (currentEvent === 'STREAM_ERROR') {
                      // Handle stream errors (e.g., rate limiting, quota exceeded)
                      hasError = true; // Mark that error occurred

                      const errorCode = data.error_code || 'UNKNOWN_ERROR';
                      const errorMsg = data.error_msg || 'An error occurred';

                      // Create error without extra field
                      const error = new Error(errorMsg);
                      (error as any).code = errorCode;

                      // Destroy the stream to stop receiving data
                      stream.destroy();

                      // Notify subscriber of error
                      this.emitStreamError(subscriber, error);
                    } else if (currentEvent === 'SSE_REPLY_END') {
                      if (data.end_type === 1 || data.end_type === 2 || data.end_type === 3) {
                        subscriber.next({
                          type: 'end',
                          messageId: currentMessageId,
                          conversationId: currentConversationId,
                          createTime: createTime,
                        });
                        subscriber.complete();
                      }
                    }
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
            });

            stream.on('end', () => {
              // Only complete if no error occurred
              if (!subscriber.closed && !hasError) {
                subscriber.complete();
              }
            });

            stream.on('error', (err: Error) => {
              hasError = true;
              if (!subscriber.closed) {
                this.emitStreamError(subscriber, err);
              }
            });
          })
          .catch((error) => {
            this.emitStreamError(subscriber, error);
          });
      })

      .catch((error) => {
        this.emitStreamError(subscriber, error);
      });
  }
}

let portIndex = 0;
const getSign = async (postStr: string = '', unsign: boolean = false): Promise<string> => {
  // 如果 unsign 为 true，直接返回空字符串
  if (unsign) {
    return '';
  }

  portIndex++;
  for (let i = 0; i < 4; i++) {
    try {
      // 每两次重试更换一次端口
      if (i > 0 && i % 3 === 0) {
        portIndex++;
      }
      // 准备请求数据
      const postData = {
        url: '',
        cookie: postStr,
        signType: 'browser',
        signCommand: 'doubao',
      };

      const url = getSignServerUrl('doubao', portIndex);
      // 发送请求
      const result = await $http.post<{
        signature?: string;
      }>(`${url}/Sign/GetSign`, postData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      // 验证响应
      if (!result?.data?.signature || result.data?.signature === 'null') {
        await Task.Delay(1500);
        continue;
      }

      // 重置端口索引防止溢出
      if (portIndex > 100000) {
        portIndex = 0;
      }

      return result?.data?.signature;
    } catch (error) {
      console.debug(`获取签名失败`, error);
    }
  }

  return '';
};
