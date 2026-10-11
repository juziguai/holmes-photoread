import type { Trace } from './types'

export const ROOM_TRACES: Trace[] = [
  {
    id: 'room.bed-made',
    domain: 'room',
    zh: '床铺整齐',
    en: 'Bed made',
    causes: [
      { zh: '自律习惯，或有军旅 / 寄宿经历', en: 'Disciplined habit, or military/boarding-school background', weight: 'weak' },
    ],
    source: 'common',
  },
  {
    id: 'room.things-in-pairs',
    domain: 'room',
    zh: '两把椅子、两套餐具、两个杯子成对',
    en: 'Two chairs, two sets of cutlery, cups in pairs',
    causes: [
      { zh: '合住或有伴侣', en: 'Shares the space or has a partner', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'room.moving-boxes',
    domain: 'room',
    zh: '纸箱未拆、墙上什么都没挂',
    en: 'Unopened boxes, bare walls',
    causes: [
      { zh: '刚搬来，或租房不打算久留', en: 'Just moved in, or renting without intent to stay', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'room.wall-decor',
    domain: 'room',
    zh: '墙上有海报、画、照片墙',
    en: 'Posters, art, or a photo wall',
    causes: [
      { zh: '住得久、把这当家；内容直接指向兴趣圈', en: 'Long tenure, treats it as home; content points to interests', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'room.window-highrise',
    domain: 'room',
    zh: '窗外是密集高层',
    en: 'Dense high-rises outside the window',
    causes: [
      { zh: '城市核心区居住', en: 'Lives in a dense urban core', weight: 'medium' },
    ],
    region: 'mainland-china',
    source: 'common',
  },
  {
    id: 'bag.keychain',
    domain: 'bag',
    zh: '钥匙串上的东西',
    en: 'What hangs on the keychain',
    causes: [
      { zh: '车钥匙品牌：有车且能读出档次', en: 'Car key brand: owns a car, tier readable', weight: 'strong' },
      { zh: '门禁卡多：通勤经过多个楼宇或小区', en: 'Many access cards: commutes through several buildings', weight: 'medium' },
      { zh: '小工具（开瓶器、小刀、U 盘）：实用型', en: 'Tools (opener, knife, USB stick): practical type', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'bag.everyday-carry',
    domain: 'bag',
    zh: '包里的东西摊开：充电宝、耳机、纸巾、雨伞',
    en: 'Bag contents laid out: power bank, earbuds, tissues, umbrella',
    causes: [
      { zh: '通勤时间长（充电宝、耳机）', en: 'Long commute (power bank, earbuds)', weight: 'medium' },
      { zh: '常年带伞：所在城市多雨，或吃过亏', en: 'Always carries an umbrella: rainy city, or learned the hard way', weight: 'weak' },
    ],
    source: 'common',
  },
]
