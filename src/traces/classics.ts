import type { Trace } from './types'

/** 影视与原著里的经典痕迹：给推理段定调，也用作测试样本 */
export const CLASSIC_TRACES: Trace[] = [
  {
    id: 'hands.beeswax',
    domain: 'hands',
    zh: '手细腻，带蜂蜡药膏的味道',
    en: 'Soft hands that smell of beeswax ointment',
    causes: [
      { zh: '外科医生：频繁刷手，手裂，靠蜂蜡药膏养', en: 'Surgeon: constant scrubbing cracks the skin; beeswax ointment repairs it', weight: 'strong' },
    ],
    region: 'canon',
    source: 'Elementary S1E1',
  },
  {
    id: 'body.wrist-tan',
    domain: 'body',
    zh: '脸晒黑，手腕以上是白的',
    en: 'Tanned face, no tan above the wrists',
    causes: [
      { zh: '穿长袖制服在户外或热带待过', en: 'Wore long-sleeved uniform outdoors or in the tropics', weight: 'strong' },
    ],
    region: 'canon',
    source: 'A Study in Scarlet',
  },
  {
    id: 'hands.pen-callus',
    domain: 'hands',
    zh: '中指第一关节内侧有茧',
    en: 'Callus on the inside of the middle finger',
    causes: [
      { zh: '长期握笔写字：学生、教师、画画', en: 'Holds a pen for hours: student, teacher, artist', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'shoes.heel-outer-wear',
    domain: 'shoes',
    zh: '鞋跟外侧磨损',
    en: 'Heels worn on the outer edge',
    causes: [
      { zh: '外八步态，走路多', en: 'Toes-out gait; walks a lot', weight: 'medium' },
    ],
    source: 'common',
    caution: { zh: '单侧磨损重不做健康推断', en: 'Heavy wear on one side only: never turn this into a health inference' },
  },
  {
    id: 'body.hat-not-removed',
    domain: 'body',
    zh: '进屋不摘帽，举止有官威',
    en: 'Keeps hat on indoors, carries authority',
    causes: [
      { zh: '刚退伍的士官：军队习惯还没改掉', en: 'Recently discharged NCO: army habits not yet unlearned', weight: 'strong' },
    ],
    region: 'canon',
    source: 'Joseph Bell',
  },
  {
    id: 'clothing.right-cuff-shine',
    domain: 'clothing',
    zh: '右袖口有一段发亮磨光，左肘处有块磨薄的补丁',
    en: 'Five inches of shine on the right cuff, and a worn patch at the left elbow',
    causes: [
      { zh: '长期趴在桌上手写：右腕蹭桌面，左肘支着', en: 'Writes by hand for hours: right wrist on the desk, left elbow propped', weight: 'strong' },
    ],
    region: 'canon',
    source: 'The Red-Headed League',
  },
  {
    id: 'body.travel-tattoo',
    domain: 'body',
    zh: '刺青用了某地才有的着色手法',
    en: 'A tattoo shaded with a technique practised in only one part of the world',
    causes: [
      { zh: '本人到过那里，或在当地社群里生活过', en: 'Has been there, or lived inside that community', weight: 'medium' },
    ],
    region: 'canon',
    source: 'The Red-Headed League',
    caution: { zh: '只推"去过哪里"，绝不由此推族裔、国籍或移民身份', en: 'Infer only that they have been there, never ethnicity, nationality or immigration status' },
  },
  {
    id: 'posture.army-doctor-composite',
    domain: 'posture',
    zh: '军人姿态 + 脸晒黑而腕部发白 + 左臂动作僵硬 + 举止像医生',
    en: 'Military bearing, a face tanned but pale wrists, a stiffly held left arm, and a medical manner',
    causes: [
      { zh: '在热带服役并受过伤的军医——四条弱证据交叉后才成立，单拿任何一条都不够', en: 'An army doctor wounded in the tropics: four weak signals crossing, none sufficient alone', weight: 'strong' },
    ],
    region: 'canon',
    source: 'A Study in Scarlet',
    caution: { zh: '这条是"交叉"的示范：结论的力量来自四条互相独立的痕迹同时指向一处', en: 'This is the crossing pattern: the force comes from four independent marks pointing the same way' },
  },
  {
    id: 'accessories.pawn-scratches',
    domain: 'accessories',
    zh: '怀表壳内侧刻着几组细小的当票号码',
    en: 'Pawnbroker ticket numbers scratched inside a watch case',
    causes: [
      { zh: '这块表被反复典当又赎回', en: 'The watch was pawned and redeemed more than once', weight: 'strong' },
    ],
    region: 'canon',
    source: 'The Sign of Four',
    caution: { zh: '原著里这条推对了，却把华生惹哭了——推得准不等于该说；涉及钱的结论要么不说，要么只说事件不说处境', en: 'In the story this was right and still hurt Watson: being correct is not permission to say it. On money, either stay silent or name the event, never the circumstances' },
  },
]
