import { describe, test, expect } from 'vitest';
import { AIDeepSeek } from '../../../src/ai-platform/deepseek';
import { convertCookieStr } from '../../../src/utils';

// 真实 Cookie 或 Token
// 方式1: 使用cookie格式
const cookie = convertCookieStr(
  '[{"name":"HWWAFSESID","value":"49e2649ff60b951c4cb","domain":"chat.deepseek.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":true,"sameSite":"unspecified"},{"name":"HWWAFSESTIME","value":"1774403850821","domain":"chat.deepseek.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":true,"sameSite":"unspecified"},{"name":"smidV2","value":"20260325095732765a777084c7af9e3280f79b8e1be822008c6b8fab90049f0","domain":"chat.deepseek.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1808963852.95852,"sameSite":"unspecified"},{"name":".thumbcache_6b2e5483f9d858d7c661c5e276b6a6ae","value":"FRQf/7VBaDpNCpQHiAvtiwyqh9zgdv1oAMx8SshJXfs4kNnyijTM2lTTrDT5X8rsJoKgGkU5yq0znjFHdibUSw%3D%3D","domain":"chat.deepseek.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1808963853.174918,"sameSite":"unspecified"},{"name":"ds_session_id","value":"0111e9b16d694c24ae63603d4f0c1621","domain":"chat.deepseek.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":true,"sameSite":"strict"},{"name":"accToken","value":"PMTPcQAlCmhYrc9XtkGRr8OgWwv7fvRGnYMROkCorgu/U/S/V9eMbx7z2HqLFGdt","sameSite":"unspecified"}]',
);

// 方式2: 直接使用token (从抓包数据的authorization header中获取)
// const token = 'uif5tnROgjVxMmRCt65bxBIbeXu5wkJp4Ml3N6DPuF/RQLVikmV225rXwyLBtY1U';

describe.runIf(true)('【DeepSeek Chat 测试】', () => {
  const deepseekChat = new AIDeepSeek.DeepSeekChat(cookie);
  let conversationId = '12c8b109-10d2-41a8-99c6-82967905df14';

  test('获取会话列表', async () => {
    const result = await deepseekChat.getConversations();
    console.log('会话列表:', JSON.stringify(result, null, 2));

    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);

    if (result.items.length > 0) {
      conversationId = result.items[0].id;
      console.log('第一个会话ID:', conversationId);
    }
  });

  test('获取消息历史', async () => {
    if (!conversationId) {
      console.warn('没有会话ID，跳过获取消息历史测试');
      return;
    }

    const result = await deepseekChat.getMessages(conversationId);
    console.log('消息历史:', JSON.stringify(result, null, 2));

    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  test('发送消息 (流式)', async () => {
    const prompt = '你好啊deepseek';
    console.log(`发送消息: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';

      deepseekChat.sendMessage(prompt, { conversationId: conversationId, thinkMode: 'think' }).subscribe({
        next: (event) => {
          if (event.type === 'text') {
            process.stdout.write(event.data || '');
            fullText = event.fullContent || '';
          } else if (event.type === 'thinking') {
            console.log('\n[思考中]');
            console.log(event.data);
          } else if (event.type === 'start') {
            console.log('\n[开始生成]');
            console.log('消息ID:', event.messageId);
            console.log('会话ID:', event.conversationId);
          } else if (event.type === 'end') {
            console.log('\n[生成结束]');
          }
        },
        error: (err) => {
          console.error('发送消息失败:', err);
          reject(err);
        },
        complete: () => {
          console.log('\n完整回复:', fullText);
          expect(fullText.length).toBeGreaterThan(0);
          resolve();
        },
      });
    });
  }, 60000);

  test('发送消息到已有会话 (流式)', async () => {
    if (!conversationId) {
      console.warn('没有会话ID，跳过此测试');
      return;
    }

    const prompt = '继续聊天';
    console.log(`发送消息到会话 ${conversationId}: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';

      deepseekChat.sendMessage(prompt, { conversationId }).subscribe({
        next: (event) => {
          if (event.type === 'text') {
            process.stdout.write(event.data || '');
            fullText = event.fullContent || '';
          } else if (event.type === 'start') {
            console.log('\n[开始生成]');
          } else if (event.type === 'end') {
            console.log('\n[生成结束]');
          }
        },
        error: (err) => {
          console.error('发送消息失败:', err);
          reject(err);
        },
        complete: () => {
          console.log('\n完整回复:', fullText);
          expect(fullText.length).toBeGreaterThan(0);
          resolve();
        },
      });
    });
  }, 60000);

  test('发送新会话消息', async () => {
    const prompt = '写一首关于春天的诗';
    console.log(`发送新会话消息: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      let newConversationId = '';

      deepseekChat.sendMessage(prompt, { conversationId: undefined }).subscribe({
        next: (event) => {
          if (event.type === 'text') {
            process.stdout.write(event.data || '');
            fullText = event.fullContent || '';
          } else if (event.type === 'start') {
            console.log('\n[开始生成]');
            newConversationId = event.conversationId || '';
            console.log('新会话ID:', newConversationId);
          } else if (event.type === 'end') {
            console.log('\n[生成结束]');
          }
        },
        error: (err) => {
          console.error('发送消息失败:', err);
          reject(err);
        },
        complete: () => {
          console.log('\n完整回复:', fullText);
          console.log('会话ID:', newConversationId);
          expect(fullText.length).toBeGreaterThan(0);
          expect(newConversationId.length).toBeGreaterThan(0);
          resolve();
        },
      });
    });
  }, 60000);

  test('发送消息 (流式带附件)', async () => {
    const prompt = '这个文件是讲的什么';
    console.log(`发送消息: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      deepseekChat
        .sendMessage(prompt, {
          conversationId: '',
          thinkMode: 'think',
          attachments: [{ filePath: 'https://p11-flow-imagex-sign.byteimg.com/tos-cn-p-9ecd54/o4ugIw6QIbNjEfm7AAxRQLuGxSpgoBep86ZmVv~tplv-a9rns2rl98-video_dsz_watermark_1_5.png?rk3s=49177a0b&x-expires=2089264652&x-signature=Wt6VS6DtX9W7kOG4gCxRIocF4aw%3D', type: 'png', size: 123123 }],
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write('\n' + event.data || '');
            } else if (event.type === 'thinking') {
              process.stdout.write('\nthink\n' + event.data || '');
            } else if (event.type === 'start') {
              console.log('\n[开始生成]');
              console.log('消息ID:', event.messageId);
              console.log('会话ID:', event.conversationId);
            } else if (event.type === 'error') {
              process.stdout.write('错误', event.error);
            } else if (event.type === 'end') {
              console.log('\n[生成结束]');
            }
          },
          error: (err) => {
            console.error('发送消息失败:', err);
            reject(err);
          },
          complete: () => {
            console.log('\n完整回复:');
            resolve();
          },
        });
    });
  }, 60000);
});
