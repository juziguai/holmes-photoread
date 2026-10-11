import type { Observation, Deduction, ReadResult, Subject } from '../pipeline/types'

/** 样例案卷：没填 Key 的访客也能看见成品长什么样（?demo=1 / ?demo=person） */

function meta(subject: Subject, observeMs: number, deduceMs: number): ReadResult['meta'] {
  return {
    provider: 'anthropic',
    model: 'claude-opus-5',
    lang: 'zh',
    subject,
    timings: { observeMs, deduceMs },
    usage: {},
    raw: { observe: '', deduce: '' },
    invalidRefs: [],
    visionCheck: { verdict: 'ok', reasons: [] },
  }
}

const DESK_OBS: Observation[] = [
  { id: 'O1', what: '机械键盘的 W、A、S、D 四个键帽磨到反光，其余键帽仍是哑光', where: '桌面正中', detail: '空格键左半边也有磨痕', confidence: 'high' },
  { id: 'O2', what: '两台显示器，右侧那台竖着摆', where: '桌面后半', detail: '竖屏那台接了独立支架', confidence: 'high' },
  { id: 'O3', what: '马克杯内壁有两道深浅不同的褐色渍环', where: '键盘右上方', detail: '杯口有一处小磕碰', confidence: 'high' },
  { id: 'O4', what: '桌面左侧一摞书，最上面一本夹着三张彩色便签', where: '左侧', detail: '书脊有明显折痕，非全新', confidence: 'high' },
  { id: 'O5', what: '一个登机牌残根压在鼠标垫下', where: '鼠标垫右下角', detail: '日期部分被遮住，看得见"MU"两个字母', confidence: 'medium' },
  { id: 'O6', what: '桌下露出一个未拆封的猫砂袋一角', where: '画面左下', detail: '', confidence: 'medium' },
  { id: 'O7', what: '显示器支架横臂上有一层灰，桌面前半却很干净', where: '桌面纵深方向', detail: '灰尘呈明显前后梯度', confidence: 'high' },
  { id: 'O8', what: '一条 USB-C 线缠在桌角，线头附近的胶皮有裂纹', where: '桌面右后角', detail: '', confidence: 'medium' },
  { id: 'O9', what: '人体工学椅的扶手包裹层已经磨破', where: '画面右下', detail: '磨破位置在左扶手前端', confidence: 'medium' },
  { id: 'O10', what: '一支荧光笔没盖笔帽，横在便签本上', where: '左侧书堆旁', detail: '', confidence: 'high' },
  { id: 'O11', what: '桌面右侧有一小片圆形水痕，直径与马克杯底相当', where: '键盘右侧', detail: '', confidence: 'medium' },
  { id: 'O12', what: '插线板上六个孔占了五个，其中两个是快充头', where: '桌下', detail: '', confidence: 'medium' },
]

const DESK_DED: Deduction[] = [
  {
    id: 'D1',
    claim: '你每天在这张桌子前坐足八小时以上，而且不是最近才开始的。',
    chain: ['WASD 磨到反光而其余键帽还是哑光，说明手长期停在同一区域。', '扶手磨破需要成千上万次上下手，不是几个月能磨出来的。'],
    observation_ids: ['O1', 'O9'],
    trace_ids: ['desk.keyboard-shine'],
    confidence: 0.68,
    alternative: '这是台共用设备，磨损是好几个人叠出来的。',
    kind: 'safe',
  },
  {
    id: 'D2',
    claim: '你写代码或做需要长文本的工作，不是纯做表格的。',
    chain: ['第二块屏竖着摆，只有长文档、代码、日志才值得这么放。', 'WASD 的磨损集中区同时说明键盘用得重。'],
    observation_ids: ['O2', 'O1'],
    trace_ids: ['desk.dual-monitor'],
    confidence: 0.55,
    alternative: '竖屏也可能是给聊天窗、监控面板或剪辑时间线用的。',
    kind: 'safe',
  },
  {
    id: 'D3',
    claim: '家里有猫，而且不止养了一两天。',
    chain: ['猫砂是消耗品，会囤整袋的通常已经形成固定补货节奏。'],
    observation_ids: ['O6'],
    trace_ids: [],
    confidence: 0.5,
    alternative: '替朋友代购，或者刚刚开始养。',
    kind: 'safe',
  },
  {
    id: 'D4',
    claim: '你续杯从不洗杯，一天里至少喝到第二杯才想起来。',
    chain: ['杯内两道深浅不同的渍环，是没喝完就续水留下的。', '桌上还有一圈杯底水痕，说明杯子长期不离桌。'],
    observation_ids: ['O3', 'O11'],
    trace_ids: [],
    confidence: 0.6,
    alternative: '两道环也可能是不同饮品各留一道。',
    kind: 'safe',
  },
  {
    id: 'D5',
    claim: '最近三周内你坐过一趟国内航班，回来后没怎么收拾桌子。',
    chain: ['压在鼠标垫下的登机牌残根写着 MU，是国内航司。', '桌面前半干净而后半积灰，说明只擦手边、很久没整体收拾。'],
    observation_ids: ['O5', 'O7'],
    trace_ids: ['desk.travel-receipts'],
    confidence: 0.42,
    alternative: '登机牌可能压了半年都没人动，灰尘梯度只能证明清洁习惯。',
    kind: 'bold',
  },
  {
    id: 'D6',
    claim: '你手上有一件推进中的事，靠彩色便签在纸书里做标记。',
    chain: ['三张不同颜色的便签夹在同一本书里，是分类而不是随手记。', '荧光笔没盖帽横在本子上，说明这事今天还在做。'],
    observation_ids: ['O4', 'O10'],
    trace_ids: [],
    confidence: 0.45,
    alternative: '便签也可能是上一任读者留下的，笔只是懒得盖。',
    kind: 'bold',
  },
]

const PERSON_OBS: Observation[] = [
  { id: 'O1', what: '左手腕有一圈清晰的表带晒痕，此刻手表戴在右手', where: '双手手腕', detail: '晒痕边界锐利，宽约两厘米', confidence: 'high' },
  { id: 'O2', what: '右手食指与中指第二关节缠着布基胶带，边缘起毛', where: '右手', detail: '胶带是旧的，不是刚缠上去的', confidence: 'high' },
  { id: 'O3', what: '只有右边一条裤腿卷到小腿肚', where: '下半身', detail: '左腿裤脚正常垂下', confidence: 'high' },
  { id: 'O4', what: '深色卫衣前襟和大腿位置附着大量浅色短毛', where: '上衣前襟', detail: '毛很细，长度约两厘米', confidence: 'high' },
  { id: 'O5', what: '脖子上挂着一条磨白的工牌挂绳，牌面朝里', where: '颈部', detail: '挂绳边缘起毛', confidence: 'high' },
  { id: 'O6', what: '发根约两厘米一段颜色比发梢深', where: '头顶', detail: '分界线整齐', confidence: 'medium' },
  { id: 'O7', what: '鼻梁两侧有对称的浅红压痕，画面里没有眼镜', where: '面部', detail: '', confidence: 'medium' },
  { id: 'O8', what: '球鞋外侧鞋帮有一道横向的擦痕，鞋底纹路里嵌着细砂', where: '双脚', detail: '两只鞋擦痕位置对称', confidence: 'medium' },
  { id: 'O9', what: '手背指关节干燥起皮，指甲剪得很短且两手一致', where: '双手', detail: '', confidence: 'medium' },
  { id: 'O10', what: '背景是室内墙面，挂着一条带扣的织带', where: '画面右后方', detail: '', confidence: 'low' },
]

const PERSON_DED: Deduction[] = [
  {
    id: 'D1',
    claim: '你骑车通勤，而且骑的是链条车不是共享单车。',
    chain: ['只卷右边裤腿是防裤脚绞进链条的动作，左腿不需要。', '鞋帮对称的横向擦痕和鞋底细砂，是长期蹬踏与停靠留下的。'],
    observation_ids: ['O3', 'O8'],
    trace_ids: ['clothing.rolled-one-trouser-leg'],
    confidence: 0.66,
    alternative: '卷一条裤腿也可能纯是穿搭习惯，擦痕来自别的运动。',
    kind: 'safe',
  },
  {
    id: 'D2',
    claim: '你在攀岩，练到需要固定护指的程度。',
    chain: ['指关节缠布基胶带是护指，不是护伤。', '胶带起毛说明缠了不止一次，指甲两手都剪极短也是同一件事的要求。'],
    observation_ids: ['O2', 'O9'],
    trace_ids: ['hands.tape-residue-knuckles'],
    confidence: 0.58,
    alternative: '举重和器械体操也会缠同样的位置。',
    kind: 'safe',
  },
  {
    id: 'D3',
    claim: '家里有猫，而且它上过你的腿。',
    chain: ['浅色细短毛集中在前襟和大腿，是被抱和被踩的位置。'],
    observation_ids: ['O4'],
    trace_ids: ['clothing.pet-hair'],
    confidence: 0.5,
    alternative: '也可能是刚从养猫的人那里回来。',
    kind: 'safe',
  },
  {
    id: 'D4',
    claim: '你上班的地方要刷卡进门，而且是每天去，不是偶尔去。',
    chain: ['挂绳磨白起毛，是每天摘挂磨出来的。', '牌面朝里说明是习惯性挂着而不是为了展示。'],
    observation_ids: ['O5'],
    trace_ids: ['clothing.lanyard-badge'],
    confidence: 0.52,
    alternative: '也可能是健身房或学校的门禁。',
    kind: 'safe',
  },
  {
    id: 'D5',
    claim: '你两个月前染过一次头发，而且没打算补色。',
    chain: ['发根深色一段约两厘米，头发一个月长一厘米左右。', '分界线整齐说明是一次性上色而不是自然渐变。'],
    observation_ids: ['O6'],
    trace_ids: ['hair.regrowth-band'],
    confidence: 0.4,
    alternative: '光线角度也会让发根显得更深。',
    kind: 'bold',
  },
  {
    id: 'D6',
    claim: '拍这张照片前几分钟你才摘下眼镜，而且平时一直戴着。',
    chain: ['鼻梁两侧对称的压痕十几分钟就会消退。', '压痕颜色还在，说明摘下没多久。'],
    observation_ids: ['O7'],
    trace_ids: ['face.nose-pad-marks'],
    confidence: 0.45,
    alternative: '也可能刚摘的是墨镜或护目镜。',
    kind: 'bold',
  },
]

const DEMOS: Record<Subject, ReadResult> = {
  desk: {
    observations: DESK_OBS,
    deductions: DESK_DED,
    closing: '总会有点什么没料到。说说看，哪条错了？',
    meta: meta('desk', 8400, 11200),
  },
  person: {
    observations: PERSON_OBS,
    deductions: PERSON_DED,
    closing: '我读的是你身上的痕迹，不是你的长相。哪条最离谱？',
    meta: meta('person', 7900, 12600),
  },
}

export function demoResult(subject: Subject): ReadResult {
  return DEMOS[subject]
}
