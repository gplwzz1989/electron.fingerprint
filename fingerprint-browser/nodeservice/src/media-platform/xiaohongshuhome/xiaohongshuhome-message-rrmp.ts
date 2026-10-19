import crypto from 'crypto';

class XiaohongshuhomeProtoWriter {
  private readonly bytes: number[] = [];

  public writeUint32(value: number): this {
    let current = value >>> 0;
    while (current >= 0x80) {
      this.bytes.push((current & 0x7f) | 0x80);
      current >>>= 7;
    }
    this.bytes.push(current);
    return this;
  }

  public writeInt32(value: number): this {
    return this.writeUint32(value | 0);
  }

  public writeUint64(value: number): this {
    let low = value >>> 0;
    let high = Math.floor(value / 0x100000000) >>> 0;
    while (high > 0) {
      this.bytes.push((low & 0x7f) | 0x80);
      low = ((low >>> 7) | (high << 25)) >>> 0;
      high >>>= 7;
    }
    while (low >= 0x80) {
      this.bytes.push((low & 0x7f) | 0x80);
      low >>>= 7;
    }
    this.bytes.push(low);
    return this;
  }

  public writeString(value: string): this {
    const content = Buffer.from(value, 'utf8');
    this.writeUint32(content.length);
    this.bytes.push(...content);
    return this;
  }

  public writeBool(value: boolean): this {
    this.bytes.push(value ? 1 : 0);
    return this;
  }

  public finish(): Buffer {
    return Buffer.from(this.bytes);
  }
}

const XIAOHONGSHUHOME_MESSAGE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDTIVVdZ4E+rOAQ3CfnKrFIdqm2ccfVjTycIGTNYPfp95rTeZZXs1obdlTYJyVAinFUnVreEedLvx7Dm1Se0yEWr/1PawPyycRNkfhBV7FZqKIlFQkW4nFsyC3I/WI4XloByDt4TBOUYqHdRdR9luu09QaMQrPehZASOgNWWp5a7QIDAQAB
-----END PUBLIC KEY-----`;

const encodeChatSendMessage = (message: {
  mid: string;
  ts: number;
  token: string;
  sender: string;
  receiver: string;
  content: string;
  contentType: number;
  nickname: string;
  groupChat: boolean;
  refId: string;
  triggerSource: number;
}): Buffer => {
  const writer = new XiaohongshuhomeProtoWriter();
  writer.writeUint32(10).writeString(message.mid);
  writer.writeUint32(16).writeUint64(message.ts);
  writer.writeUint32(26).writeString(message.token);
  writer.writeUint32(34).writeString(message.sender);
  writer.writeUint32(42).writeString(message.receiver);
  writer.writeUint32(50).writeString(message.content);
  writer.writeUint32(56).writeInt32(message.contentType);
  writer.writeUint32(66).writeString(message.nickname);
  writer.writeUint32(72).writeBool(message.groupChat);
  writer.writeUint32(90).writeString(message.refId);
  writer.writeUint32(96).writeInt32(message.triggerSource);
  return writer.finish();
};

export const encodeXiaohongshuhomeChatOneMessage = (args: {
  sender: string;
  receiver: string;
  content: string;
  contentType?: number;
  mid?: string;
  ts?: number;
  triggerSource?: number;
}): Buffer => {
  const sendMessage = encodeChatSendMessage({
    mid: args.mid ?? crypto.randomUUID().replace(/-/g, ''),
    ts: args.ts ?? Date.now(),
    token: '',
    sender: args.sender,
    receiver: args.receiver,
    content: args.content,
    contentType: args.contentType ?? 1,
    nickname: '',
    groupChat: false,
    refId: '',
    triggerSource: args.triggerSource ?? 1,
  });
  const writer = new XiaohongshuhomeProtoWriter();
  writer.writeUint32(8).writeInt32(1);
  writer.writeUint32(74).writeUint32(sendMessage.length);
  const prefix = writer.finish();
  return Buffer.concat([prefix, sendMessage]);
};

const rsaEncrypt = (payload: Buffer): Buffer => {
  const encryptedChunks: Buffer[] = [];
  for (let index = 0; index < payload.length; index += 117) {
    encryptedChunks.push(
      crypto.publicEncrypt(
        {
          key: XIAOHONGSHUHOME_MESSAGE_PUBLIC_KEY,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        payload.subarray(index, index + 117),
      ),
    );
  }
  return Buffer.concat(encryptedChunks);
};

/**
 * 构造小红书主页私信接口需要的加密请求体。
 */
export const buildXiaohongshuhomeSendMessageBody = (args: {
  sender: string;
  receiver: string;
  content: string;
  contentType?: number;
  mid?: string;
  ts?: number;
  triggerSource?: number;
}): { message: string } => {
  const encrypted = rsaEncrypt(encodeXiaohongshuhomeChatOneMessage(args));
  return { message: encrypted.toString('latin1') };
};

