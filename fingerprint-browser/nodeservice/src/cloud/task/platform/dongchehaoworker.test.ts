import { describe, expect, it } from 'vitest';
import { DongCheHaoStatementType } from '@/platform-body/video/dongchehao';
import { getDongCheHaoCreatorStatement } from './dongchehaoworker';

describe('DongCheHaoWorker content statements', () => {
  it.each([
    [DongCheHaoStatementType.AIGC, '内容含AI生成'],
    [DongCheHaoStatementType.fictional, '内容含虚构演绎'],
    [DongCheHaoStatementType.marketing, '内容含营销信息'],
    [DongCheHaoStatementType.personalOpinion, '个人观点，仅供参考'],
  ])('maps statement type %s to the official text', (type, text) => {
    expect(getDongCheHaoCreatorStatement({ type })).toEqual({ text });
  });

  it('keeps an omitted statement different from the explicit no-label option', () => {
    expect(getDongCheHaoCreatorStatement()).toBeUndefined();
    expect(getDongCheHaoCreatorStatement({ type: DongCheHaoStatementType.none })).toEqual({
      text: '内容无需标注',
    });
  });
});
