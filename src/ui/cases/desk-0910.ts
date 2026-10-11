import type { Deduction, Grades, Observation, ReadResult } from '../../pipeline/types'

/**
 * 真实案卷：2026-09-10，一张真桌面照，Claude 按 skills/holmes/SKILL.md 手跑，
 * 照片主人逐条打分。命中 5/6，假观察 0/16。
 * 判决与那条唯一不中的分析见 logs/skill-realphoto-2026-09-10T16-28-24/VERDICT.md。
 * 这份数据只用于回放页 ?replay=1，不参与管线。
 */

export const CASE_NO = '0910-1720'

const o = (id: string, what: string, where: string, confidence: Observation['confidence']): Observation => ({
  id,
  what,
  where,
  detail: '',
  confidence,
})

export const OBSERVATIONS: Observation[] = [
  o('O1', '左侧两块屏幕并排，左边深色终端，右边浅米色网页', '桌面后方', 'high'),
  o('O2', '右侧一块大屏完全黑着，装在白色支架上', '桌面右后', 'high'),
  o('O3', '中间摊开一台深色笔记本，接着电源线', '桌面正中', 'high'),
  o('O4', '白蓝双色机械键盘配粉白腕托，斜放在鼠标垫上，不正对任何屏幕', '桌面右侧', 'high'),
  o('O5', '黑色鼠标垫印着 LPL 字样、奖杯图案和外星人头像', '桌面右侧', 'high'),
  o('O6', '一罐红色易拉罐立在鼠标垫上，紧挨键盘右侧', '键盘右侧', 'high'),
  o('O7', '白色游戏鼠标在鼠标垫最右端', '鼠标垫右侧', 'high'),
  o('O8', '黑色机箱透出蓝光，一副白色头戴耳机挂在旁边', '画面最右', 'high'),
  o('O9', '浅青色陶瓷杯放在右侧显示器支架旁，离键盘区有距离', '桌面右后', 'high'),
  o('O10', '桌面左前方一个黑色手机支架，是空的', '桌面左前', 'medium'),
  o('O11', '一串金属珠链和一把钥匙散在桌面左侧', '桌面左侧', 'medium'),
  o('O12', '白色数据线在左侧盘成一圈，另一根黑线在右侧显示器前盘着', '桌面左侧与中右', 'high'),
  o('O13', '笔记本左前方躺着一个白色扁长条设备', '笔记本左前', 'medium'),
  o('O14', '桌面边缘偏厚，下方可见金属支架结构和一根垂下的线', '整张桌', 'medium'),
  o('O15', '右侧显示器支架底座附近一个白色物体透出红光', '显示器下方', 'medium'),
  o('O16', '背景左侧是深棕木质柜门，其余墙面全空，没有任何挂饰', '画面后方', 'low'),
]

export const DEDUCTIONS: Deduction[] = [
  {
    id: 'D1',
    claim: '你打英雄联盟，而且看职业联赛，不只是自己开黑',
    chain: [
      'LPL 是英雄联盟的中国职业联赛，印着联赛奖杯的鼠标垫是官方周边，不是随手买的通用垫。',
      '白色游戏鼠标、机箱灯、头戴耳机成套配齐，这套外设是为游戏配的，不是为办公配的。',
    ],
    observation_ids: ['O5', 'O7', 'O8'],
    trace_ids: ['desk.gaming-setup'],
    confidence: 0.68,
    alternative: '垫子是别人送的，或者你只是喜欢这个视觉风格。',
    kind: 'safe',
  },
  {
    id: 'D2',
    claim: '你把干活和打游戏拆成了两套设备，笔记本干活，台式打游戏',
    chain: [
      '笔记本摊在正中接着电源，屏上是文档，左边两块屏跟着它在工作。',
      '右边那块大屏配的是独立机箱和整套游戏外设，和笔记本这套物理上分在桌子两端。',
    ],
    observation_ids: ['O1', 'O2', 'O3', 'O8'],
    trace_ids: [],
    confidence: 0.58,
    alternative: '台式才是主力，笔记本只是今天临时接管。',
    kind: 'safe',
  },
  {
    id: 'D3',
    claim: '右边那台台式机今天没开过',
    chain: [
      '大屏是全黑，不是待机亮度。',
      '键盘被斜推到鼠标垫上压着腕托，不对任何一块屏幕。',
      '饮料罐直接立在鼠标垫上，正在用鼠标的人不会把罐子放垫子上。',
    ],
    observation_ids: ['O2', 'O4', 'O6'],
    trace_ids: [],
    confidence: 0.52,
    alternative: '刚打完随手一放，屏幕只是睡了。',
    kind: 'bold',
  },
  {
    id: 'D4',
    claim: '这是张电动升降桌，你为久坐花过钱',
    chain: ['桌面边缘偏厚，下方能看到金属支架结构。', '桌下垂着一根线，普通桌子不需要供电。'],
    observation_ids: ['O14'],
    trace_ids: [],
    confidence: 0.5,
    alternative: '那只是普通桌子的走线孔。',
    kind: 'safe',
  },
  {
    id: 'D5',
    claim: '你一整天不离桌，喝的东西按区域分两处放',
    chain: [
      '桌上同时有一罐饮料和一个陶瓷杯，且不在一处：罐子在游戏区，杯子在显示器区。',
      '两个都没收走。',
    ],
    observation_ids: ['O6', 'O9'],
    trace_ids: ['desk.multi-cups'],
    confidence: 0.45,
    alternative: '杯子是别人的，或者只是没顺手收。',
    kind: 'safe',
  },
  {
    id: 'D6',
    claim: '这桌上每件东西都是你自己挑的，没有一件是单位发的',
    chain: [
      '键盘是白蓝配色带独立腕托，鼠标垫是联赛周边，耳机和鼠标是同一套白色系。',
      '显示器上了支架，机箱带灯，这些都要额外花钱和花时间才会有。',
    ],
    observation_ids: ['O2', 'O4', 'O5', 'O7', 'O8'],
    trace_ids: [],
    confidence: 0.42,
    alternative: '其中一部分是团队福利或活动赠品。',
    kind: 'bold',
  },
]

/** 照片主人本人给的分 */
export const GRADES: Grades = {
  observations: {},
  deductions: { D1: 'hit', D2: 'hit', D3: 'miss', D4: 'hit', D5: 'hit', D6: 'hit' },
}

/** 主人对那条不中的原话，回放页要用它收尾 */
export const OWNER_REBUTTAL = {
  deductionId: 'D3',
  quote: '现在关着，但是中午开了一下。',
  lesson: '三条依据全是真的。观察没错，是推理跨了时间界——证据只撑得住"此刻没在用"。',
}

export const CASE: ReadResult = {
  observations: OBSERVATIONS,
  deductions: DEDUCTIONS,
  closing: '你左边那块屏上正开着我。哪条错了，正好拿去点「不中」。',
  meta: {
    provider: 'anthropic',
    model: 'claude-opus-5',
    lang: 'zh',
    subject: 'desk',
    timings: { observeMs: 0, deduceMs: 0 },
    usage: {},
    raw: { observe: '', deduce: '' },
    invalidRefs: [],
    visionCheck: { verdict: 'ok', reasons: [] },
  },
}
