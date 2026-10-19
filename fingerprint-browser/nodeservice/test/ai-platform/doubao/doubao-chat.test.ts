import { describe, expect, test } from 'vitest';
import { DoubaoChat } from '../../../src/ai-platform/doubao/doubao-chat';
import * as fs from 'fs';
import * as path from 'path';
import { convertCookieStr } from '../../../src/utils';
import { VideoInfo } from '../../../src/ai-platform/interfaces';
import buffer from 'buffer';

// 真实 Cookie
const cookie = convertCookieStr(
  '[{"name":"hook_slardar_session_id","value":"202603301802439A7F033E764FC6355B99","domain":"www.doubao.com","hostOnly":true,"path":"/chat","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ttwid","value":"1%7CwCFvF9yfjECBAj6Kqjk_iEbxP5SWf4x850YlK5XpFLs%7C1774864963%7Ceed68acb45318fb2c73d71b57619f23aa88d1ac2e8af7beb61dc5deba9b62fc9","domain":".doubao.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1805968963.87999,"sameSite":"no_restriction"},{"name":"i18next","value":"zh","domain":"www.doubao.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1806400964,"sameSite":"strict"},{"name":"flow_ssr_sidebar_expand","value":"1","domain":"www.doubao.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"biz_trace_id","value":"708631b6","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"s_v_web_id","value":"verify_mnd0rx9u_kjKsDFYF_IZCc_4j0b_8jxc_clymb1G32CUz","domain":"www.doubao.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1780048966,"sameSite":"unspecified"},{"name":"passport_csrf_token","value":"33af23f98358d3b3ac6d84baeec6b361","domain":".doubao.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1780048966.963262,"sameSite":"no_restriction"},{"name":"passport_csrf_token_default","value":"33af23f98358d3b3ac6d84baeec6b361","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1780048966.963336,"sameSite":"unspecified"},{"name":"multi_sids","value":"889966524371632%3A5e4e63c07b21b27a19f3e6fd4f7edcd1","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1780048985.352113,"sameSite":"unspecified"},{"name":"odin_tt","value":"a3c17ae7433e531f96ce18fae04acfcfa9ce5c3aa7ccd21ed286a9fe33adcc3e7b1a8b208565fea8fce2483484f9db28846d3d67d9d74c22667ca9c17090fcfc","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1806400985.352192,"sameSite":"unspecified"},{"name":"n_mh","value":"ZWAHLX8HzBA6zFtA1kPTOTad0tS9bb2Kp7TAnX74Uug","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1785232985.352247,"sameSite":"unspecified"},{"name":"sid_guard","value":"5e4e63c07b21b27a19f3e6fd4f7edcd1%7C1774864985%7C2592000%7CWed%2C+29-Apr-2026+10%3A03%3A05+GMT","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1805968985.352265,"sameSite":"unspecified"},{"name":"uid_tt","value":"39b83664cdd0146ec492f70cc92d7492","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1777456985.352283,"sameSite":"unspecified"},{"name":"uid_tt_ss","value":"39b83664cdd0146ec492f70cc92d7492","domain":".doubao.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1777456985.352299,"sameSite":"no_restriction"},{"name":"sid_tt","value":"5e4e63c07b21b27a19f3e6fd4f7edcd1","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1777456985.352315,"sameSite":"unspecified"},{"name":"sessionid","value":"5e4e63c07b21b27a19f3e6fd4f7edcd1","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1777456985.352329,"sameSite":"unspecified"},{"name":"sessionid_ss","value":"5e4e63c07b21b27a19f3e6fd4f7edcd1","domain":".doubao.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1777456985.352344,"sameSite":"no_restriction"},{"name":"session_tlb_tag","value":"sttt%7C15%7CXk5jwHshsnoZ8-b9T37c0f________-yQxwE6tFthgC2PsPo3PziWm5qgcq1J1D4k8q8Sxpm5f8%3D","domain":".doubao.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1777456985.352361,"sameSite":"no_restriction"},{"name":"is_staff_user","value":"false","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1777456985.352376,"sameSite":"unspecified"},{"name":"has_biz_token","value":"false","domain":".doubao.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1777456985.352396,"sameSite":"unspecified"},{"name":"sid_ucp_v1","value":"1.0.0-KGM4YmM5MGM0NWY5MmE3ZTRjOGNkNDg3ZDM4NTY1YjU5OTYyMWMyMzcKIAiwpbDUt63KARDZlKnOBhjCsR4gDDDt0N7NBjgHQPQHGgJscSIgNWU0ZTYzYzA3YjIxYjI3YTE5ZjNlNmZkNGY3ZWRjZDE","domain":".doubao.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1777456985.352409,"sameSite":"unspecified"},{"name":"ssid_ucp_v1","value":"1.0.0-KGM4YmM5MGM0NWY5MmE3ZTRjOGNkNDg3ZDM4NTY1YjU5OTYyMWMyMzcKIAiwpbDUt63KARDZlKnOBhjCsR4gDDDt0N7NBjgHQPQHGgJscSIgNWU0ZTYzYzA3YjIxYjI3YTE5ZjNlNmZkNGY3ZWRjZDE","domain":".doubao.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1777456985.352426,"sameSite":"no_restriction"},{"name":"msToken","value":"otrkEZOg2mR41bISvdgJ5SB47nKkcGRFum_FX1sRkYve3mSd2zWMg6ODGML0aCdndmOSAhozIkuAioclQ7_QjDc6JmEXw9FVCpqq1WXNAFbyPlNrTJoGdRnz1fKMd8bpu2TZZUYqh7CF_hbfeoUz9wSqUjCTptJZ_iE=","sameSite":"unspecified"},{"name":"device_id","value":"7622986944888423978","sameSite":"unspecified"},{"name":"web_id","value":"7622986939536344639","sameSite":"unspecified"},{"name":"tea_uuid","value":"7622986939536344639","sameSite":"unspecified"}]'
);
// const cookie =
//   convertCookieStr("[{\"name\":\"hook_slardar_session_id\",\"value\":\"202603051929255DB3344E9EF395B9ECC2\",\"domain\":\"www.doubao.com\",\"hostOnly\":true,\"path\":\"/chat\",\"secure\":false,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"ttwid\",\"value\":\"1%7CMlTAUBdIrdlH5hcR53jDJGVzxkOAgREAEYMqQgSJt3g%7C1772710166%7Ce114237cd3d696a1f904e1946ee804558784ac623ccaee28d4ea254e8e74ae3e\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1803814166.311574,\"sameSite\":\"no_restriction\"},{\"name\":\"i18next\",\"value\":\"zh\",\"domain\":\"www.doubao.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1804246166,\"sameSite\":\"strict\"},{\"name\":\"flow_ssr_sidebar_expand\",\"value\":\"1\",\"domain\":\"www.doubao.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"s_v_web_id\",\"value\":\"verify_mmddv4n1_YVqUZ1X7_eCZU_4BQ1_9PUw_yWMoHP84tH2i\",\"domain\":\"www.doubao.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1777894169,\"sameSite\":\"unspecified\"},{\"name\":\"passport_csrf_token\",\"value\":\"ef044b4ddeb78b3051b2e2b8ccfc24b9\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1777894169.274085,\"sameSite\":\"no_restriction\"},{\"name\":\"passport_csrf_token_default\",\"value\":\"ef044b4ddeb78b3051b2e2b8ccfc24b9\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1777894169.274154,\"sameSite\":\"unspecified\"},{\"name\":\"odin_tt\",\"value\":\"47330622cdcc6a7c02ec90dc8a90f468e42863f871512b836e2b8c01166d204f7a94d0609160467ac595f85d7e353d16531a163174cc446a0581289dc2be5ffd\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":true,\"session\":false,\"expirationDate\":1804246201.603115,\"sameSite\":\"unspecified\"},{\"name\":\"n_mh\",\"value\":\"byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":true,\"session\":false,\"expirationDate\":1783078201.603222,\"sameSite\":\"unspecified\"},{\"name\":\"sid_guard\",\"value\":\"8d1ae7e124bc4209ae6348760a3779f5%7C1772710201%7C2592000%7CSat%2C+04-Apr-2026+11%3A30%3A01+GMT\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":true,\"session\":false,\"expirationDate\":1803814201.603253,\"sameSite\":\"unspecified\"},{\"name\":\"uid_tt\",\"value\":\"226b0dfde9046cc0963f223d38801f3b\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.603274,\"sameSite\":\"unspecified\"},{\"name\":\"uid_tt_ss\",\"value\":\"226b0dfde9046cc0963f223d38801f3b\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.60329,\"sameSite\":\"no_restriction\"},{\"name\":\"sid_tt\",\"value\":\"8d1ae7e124bc4209ae6348760a3779f5\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.603306,\"sameSite\":\"unspecified\"},{\"name\":\"sessionid\",\"value\":\"8d1ae7e124bc4209ae6348760a3779f5\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.603322,\"sameSite\":\"unspecified\"},{\"name\":\"sessionid_ss\",\"value\":\"8d1ae7e124bc4209ae6348760a3779f5\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.603336,\"sameSite\":\"no_restriction\"},{\"name\":\"session_tlb_tag\",\"value\":\"sttt%7C14%7CjRrn4SS8QgmuY0h2Cjd59f_________XcIr9R0SB602fz0d7Nmk4eQQWkpz9i6YvFMMLxRd4xrM%3D\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.603352,\"sameSite\":\"no_restriction\"},{\"name\":\"is_staff_user\",\"value\":\"false\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.603371,\"sameSite\":\"unspecified\"},{\"name\":\"sid_ucp_v1\",\"value\":\"1.0.0-KGQ3ZDFkYmVlYTZhZDMwNmIwYzRkZWU5M2YzNzJiNmQ5NjZhYzQwZTMKIAiDzqCYlc2WBRC50qXNBhjCsR4gDDDl5NSsBjgHQPQHGgJsZiIgOGQxYWU3ZTEyNGJjNDIwOWFlNjM0ODc2MGEzNzc5ZjU\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.603399,\"sameSite\":\"unspecified\"},{\"name\":\"ssid_ucp_v1\",\"value\":\"1.0.0-KGQ3ZDFkYmVlYTZhZDMwNmIwYzRkZWU5M2YzNzJiNmQ5NjZhYzQwZTMKIAiDzqCYlc2WBRC50qXNBhjCsR4gDDDl5NSsBjgHQPQHGgJsZiIgOGQxYWU3ZTEyNGJjNDIwOWFlNjM0ODc2MGEzNzc5ZjU\",\"domain\":\".doubao.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1775302201.603417,\"sameSite\":\"no_restriction\"}]");

describe.runIf(true)('【豆包 Chat 测试】', () => {
  const doubaoChat = new DoubaoChat(cookie);
  let conversationId = '';

  test('获取会话列表', async () => {
    const result = await doubaoChat.getConversations('');
    console.log('会话列表:', JSON.stringify(result, null, 2));
    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    if (result.items.length > 0) {
      conversationId = result.items[0].id;
    }
  });

  test('获取消息历史', async () => {
    if (!conversationId) {
      console.warn('没有会话ID，跳过获取消息历史测试');
      return;
    }
    const result = await doubaoChat.getMessages(conversationId);
    console.log('消息历史:', JSON.stringify(result, null, 2));
    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  test('发送消息 (流式)', async () => {
    // const tv= [
    //   "aid=497858&device_id=7618111815055296026&device_platform=web&fp=verify_mmu8zdnh_SIKXiJtk_GCBo_4QUH_AAHi_l8aaH9SYFzGs&language=zh&pc_version=3.10.2&pkg_type=release_version&real_aid=497858&region=&samantha_web=1&sys_region=&tea_uuid=7473056724686685706&use-olympus-account=1&version_code=20800&web_id=7473056724686685706&web_tab_id=2464ffd1-4daf-4d22-b7f5-d028fdac4df6",
    //   '{"client_meta":{"conversation_id":"38417423125744642","bot_id":"7338286299411103781","last_section_id":"38417423125744898","last_message_index":140},"messages":[{"local_message_id":"c1546d80-22a5-11f1-8921-49ee815aec12","content_block":[{"block_type":10000,"content":{"text_block":{"text":"你好","icon_url":"","icon_url_dark":"","summary":""},"pc_event_block":""},"block_id":"e90c6563-8e6e-4314-a45c-9bda5a3fa5d5","parent_id":"","meta_info":[],"append_fields":[]}],"message_status":0}],"option":{"send_message_scene":"","create_time_ms":1773823117728,"collect_id":"","is_audio":false,"answer_with_suggest":false,"tts_switch":false,"need_deep_think":0,"click_clear_context":false,"from_suggest":false,"is_regen":false,"is_replace":false,"disable_sse_cache":false,"select_text_action":"","resend_for_regen":false,"scene_type":0,"unique_key":"d0ad59af-40de-4120-8d8e-d5d4881b5bdd","start_seq":0,"need_create_conversation":false,"regen_query_id":[],"edit_query_id":[],"regen_instruction":"","no_replace_for_regen":false,"message_from":0,"shared_app_name":"","sse_recv_event_options":{"support_chunk_delta":true},"is_ai_playground":false},"ext":{"use_deep_think":"0","fp":"verify_mmu8zdnh_SIKXiJtk_GCBo_4QUH_AAHi_l8aaH9SYFzGs","commerce_credit_config_enable":"0","sub_conv_firstmet_type":"0"}}'
    // ]
    // const b64=buffer.Buffer.from(JSON.stringify(tv),'utf-8').toString('base64');
    // console.log(b64);
    // 使用一个测试用的 prompt
    const prompt = '帮我生产手机测聘前10文章，图文混编，直接输出';
    console.log(`发送消息: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat.sendMessage(prompt, { conversationId: '', attachments: [], skill: { type: 0 } }).subscribe({
        next: (event) => {
          if (event.type === 'text') {
            process.stdout.write(event.data || '');
            fullText = event.fullContent || '';
          } else if (event.type === 'start') {
            console.log('\n[开始生成]');
          } else if (event.type === 'image') {
            console.log('\n[图片信息]', JSON.stringify(event.images));
          } else if (event.type === 'attachment') {
            console.log('\n[收到附件卡片]:', JSON.stringify(event.attachment, null, 2));
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
  }, 300000); // 增加超时时间

  test('发送新会话消息 (流式)', async () => {
    // 使用一个测试用的 prompt
    const prompt = '帮我写一篇关于关于夏天的文章' + '';
    console.log(`发送消息: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat.sendMessage(prompt, { conversationId: undefined }).subscribe({
        next: (event) => {
          if (event.type === 'text') {
            process.stdout.write(event.data || '');
            fullText = event.fullContent || '';
          } else if (event.type === 'start') {
            console.log('\n[开始生成]', JSON.stringify(event, null, 2));
          } else if (event.type === 'attachment') {
            console.log('\n[收到附件卡片]:', JSON.stringify(event.attachment, null, 2));
          } else if (event.type === 'end') {
            console.log('\n[生成结束]', JSON.stringify(event, null, 2));
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
  }, 30000);

  test('发送消息 - 快速模式', async () => {
    const prompt = '你好啊';
    console.log(`发送消息 (快速模式): ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat
        .sendMessage(prompt, {
          conversationId,
          thinkMode: 'fast',
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              console.log(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'start') {
              console.log('\n[快速模式 - 开始生成]');
            } else if (event.type === 'end') {
              console.log('\n[快速模式 - 生成结束]');
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
  }, 30000);

  test('发送消息 - 深度思考模式', async () => {
    const prompt = '你好啊';
    console.log(`发送消息 (深度思考模式): ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat
        .sendMessage(prompt, {
          conversationId,
          thinkMode: 'think',
          includeThinkingProcess: false, // 不包含思考过程
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'start') {
              console.log('\n[深度思考模式 - 开始生成]');
            } else if (event.type === 'end') {
              console.log('\n[深度思考模式 - 生成结束]');
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
  }, 60000); // 深度思考可能需要更长时间

  test('发送消息 - 深度思考模式 (包含思考过程)', async () => {
    const prompt = '你好啊';
    console.log(`发送消息 (深度思考模式 - 包含思考过程): ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      let thinkingText = '';
      doubaoChat
        .sendMessage(prompt, {
          conversationId,
          thinkMode: 'think',
          includeThinkingProcess: true, // 包含思考过程
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'thinking') {
              process.stdout.write(`[思考: ${event.thinkingText}]`);
              thinkingText += event.thinkingText || '';
            } else if (event.type === 'start') {
              console.log('\n[深度思考模式(含思考过程) - 开始生成]');
            } else if (event.type === 'end') {
              console.log('\n[深度思考模式(含思考过程) - 生成结束]');
            }
          },
          error: (err) => {
            console.error('发送消息失败:', err);
            reject(err);
          },
          complete: () => {
            console.log('\n完整回复:', fullText);
            console.log('思考过程:', thinkingText);
            expect(fullText.length).toBeGreaterThan(0);
            expect(thinkingText.length).toBeGreaterThan(0);
            resolve();
          },
        });
    });
  }, 60000);

  test('发送消息 - 专家模式', async () => {
    const prompt = '你好啊';
    console.log(`发送消息 (专家模式): ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat
        .sendMessage(prompt, {
          conversationId,
          thinkMode: 'expert',
          includeThinkingProcess: false, // 不包含思考过程
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'start') {
              console.log('\n[专家模式 - 开始生成]');
            } else if (event.type === 'end') {
              console.log('\n[专家模式 - 生成结束]');
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
  }, 60000); // 专家模式可能需要更长时间

  test('发送带附件的消息 (流式)', async () => {
    const prompt = '总结';
    // Create a dummy file
    const dummyFilePath =
      'https://p26-flow-sign.byteimg.com/tos-cn-i-ik7evvg4ik/rc/online_export/615c897b73694f65bbc7ea11102f7662.docx?lk3s=8e244e95&rcl=20260305092846BA6968564CFBDE83EA4F&rrcfp=f62b3ce6&x-expires=1772677726&x-signature=8dC8NgfOYjM2QUo3ScdG2%2Fkkvx0%3D';
    //fs.writeFileSync(dummyFilePath, '这是一个测试文件内容，用于测试豆包的文件上传和分析功能。');

    console.log(`发送带附件的消息: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat
        .sendMessage(prompt, {
          conversationId: '38416292927708162',
          attachments: [
            {
              filePath:
                'https://assets-download.lapi.cc/geo/users/0YayyYZWPyRJqZPdkIgiFFR03Xgb8g9w/documents/1773130433627-4ea308c8-0fa0-433f-9395-383359251519.docx',
              type: 'docx',
              name: '文件1',
            },
          ],
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'start') {
              console.log('\n[开始生成]');
            } else if (event.type === 'attachment') {
              console.log('\n[收到附件卡片]:', JSON.stringify(event.attachment, null, 2));
            } else if (event.type === 'end') {
              console.log('\n[生成结束]');
            } else if (event.type === 'error') {
              console.log('\n[错误]');
            }
          },
          error: (err) => {
            console.error('发送消息失败:', err.message);
            // Clean up
            // if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
            // reject(err);
          },
          complete: () => {
            console.log('\n完整回复:', fullText);
            // Clean up
            if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
            resolve();
          },
        });
    });
  }, 60000); // 增加超时时间

  test('发送带附件的消息 (生图模式)', async () => {
    const prompt = '优化，加入更多的小动物';
    // Create a dummy file

    console.log(`生图模式: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat
        .sendMessage(prompt, {
          conversationId: '',
          attachments: [
            {
              filePath:
                'https://p6-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/rc_gen_image/5bee4885557f460baabd13b80501f941.jpeg~tplv-a9rns2rl98-image_raw_b.png?lk3s=8e244e95&rcl=20260312143630EF4852891C52A4F17895&rrcfp=ddbb2dc7&x-expires=2088657407&x-signature=DuuC1P7kvhrJxVup6h1Ki%2Fi8x9I%3D',
              type: 'png',
              name: '文件1.png',
            },
          ],
          skill: { type: 2 },
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'start') {
              console.log('\n[开始生成]');
            } else if (event.type === 'image') {
              console.log('\n[收到附件卡片]:', JSON.stringify(event.images, null, 2));
            } else if (event.type === 'end') {
              console.log('\n[生成结束]');
            } else if (event.type === 'error') {
              console.log('\n[错误]');
            }
          },
          error: (err) => {
            console.error('发送消息失败:', err.message);
            // Clean up
            // if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
            // reject(err);
          },
          complete: () => {
            console.log('\n完整回复:', fullText);
            // Clean up

            resolve();
          },
        });
    });
  }, 60000); // 增加超时时间

  test('发送带附件的消息 (生图模式带比例)', async () => {
    const prompt = '优化，加入更多的小动物';
    // Create a dummy file

    console.log(`生图模式: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat
        .sendMessage(prompt, {
          conversationId: '',
          skill: { type: 2, ratio: '4:3' },
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'start') {
              console.log('\n[开始生成]');
            } else if (event.type === 'image') {
              console.log('\n[收到附件卡片]:', JSON.stringify(event.images, null, 2));
            } else if (event.type === 'end') {
              console.log('\n[生成结束]');
            } else if (event.type === 'error') {
              console.log('\n[错误]');
            }
          },
          error: (err) => {
            console.error('发送消息失败:', err.message);
            // Clean up
            // if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
            // reject(err);
          },
          complete: () => {
            console.log('\n完整回复:', fullText);
            // Clean up

            resolve();
          },
        });
    });
  }, 60000); // 增加超时时间

  test('发送带附件的消息 (生视频模式)', async () => {
    const prompt = '动起来';
    // Create a dummy file

    console.log(`生视频模式: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      doubaoChat
        .sendMessage(prompt, {
          conversationId: '25731142113026',
          attachments: [
            {
              filePath:
                'https://p6-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/rc_gen_image/5bee4885557f460baabd13b80501f941.jpeg~tplv-a9rns2rl98-image_raw_b.png?lk3s=8e244e95&rcl=20260312143630EF4852891C52A4F17895&rrcfp=ddbb2dc7&x-expires=2088657407&x-signature=DuuC1P7kvhrJxVup6h1Ki%2Fi8x9I%3D',
              type: 'png',
              name: '文件1.png',
            },
          ],
          skill: { type: 3, ratio: '16:9' },
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'start') {
              console.log('\n[开始生成]');
            } else if (event.type === 'image') {
              console.log('\n[收到附件卡片]:', JSON.stringify(event.images, null, 2));
            } else if (event.type === 'end') {
              console.log('\n[生成结束]');
            } else if (event.type === 'error') {
              console.log('\n[错误]');
            }
          },
          error: (err) => {
            console.error('发送消息失败:', err.message);
            // Clean up
            // if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
            // reject(err);
          },
          complete: () => {
            console.log('\n完整回复:', fullText);
            // Clean up

            resolve();
          },
        });
    });
  }, 60000); // 增加超时时间

  test('解析卡片信息', async () => {
    const result = await doubaoChat.getAttachmentInfo('G98rdhgQjocs21xWViNcplIfnQh');
    console.log('文件信息:', JSON.stringify(result, null, 2));
  });

  test('下载附件信息', async () => {
    const result = await doubaoChat.downloadAttachment('G98rdhgQjocs21xWViNcplIfnQh','2');
    console.log('文件信息:', JSON.stringify(result.read(10), null, 2));
  });

  test('解析视频信息', async () => {
    const videoId = 'v0269cg10004d6t0bifog65hvg1o4rjg'; // 从Fiddler数据中获取的视频ID
    const result: VideoInfo = (await doubaoChat.getAttachmentInfo(videoId, undefined, 'video')) as VideoInfo;
    console.log('视频信息:', JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
    if (result) {
      expect(result.vid).toBe(videoId);
      expect(result.url).toBeDefined();
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    }
  });

  test('普通消息生成图片 (skill=0)', async () => {
    const prompt = '帮我生成关于春天花开的图片';
    console.log(`普通消息生成图片: ${prompt}`);

    return new Promise<void>((resolve, reject) => {
      let fullText = '';
      let receivedImages = false;

      doubaoChat
        .sendMessage(prompt, {
          conversationId: '', // 新会话
          skill: { type: 0 }, // 普通模式
        })
        .subscribe({
          next: (event) => {
            if (event.type === 'text') {
              process.stdout.write(event.data || '');
              fullText = event.fullContent || '';
            } else if (event.type === 'start') {
              console.log('\n[开始生成]', JSON.stringify(event, null, 2));
            } else if (event.type === 'image') {
              console.log('\n[收到图片]:', JSON.stringify(event.images, null, 2));
              receivedImages = true;
              expect(event.images).toBeDefined();
              expect(Array.isArray(event.images)).toBe(true);
              expect(event.images.length).toBeGreaterThan(0);
              // 验证图片信息结构
              event.images.forEach((img) => {
                expect(img.url).toBeDefined();
                expect(img.width).toBeGreaterThan(0);
                expect(img.height).toBeGreaterThan(0);
              });
            } else if (event.type === 'end') {
              console.log('\n[生成结束]', JSON.stringify(event, null, 2));
            }
          },
          error: (err) => {
            console.error('发送消息失败:', err.message);
            reject(err);
          },
          complete: () => {
            console.log('\n完整回复:', fullText);
            console.log('是否收到图片:', receivedImages);
            expect(receivedImages).toBe(true); // 确保收到了图片
            resolve();
          },
        });
    });
  }, 60000); // 增加超时时间
});
