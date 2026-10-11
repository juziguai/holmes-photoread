import type { Trace } from './types'

export const DEVICE_TRACES: Trace[] = [
  {
    id: 'devices.phone-scratches',
    domain: 'devices',
    zh: '手机背面或边框大量划痕，不带壳',
    en: 'Phone heavily scratched, no case',
    causes: [
      { zh: '和钥匙硬币同兜，对物品不爱惜', en: 'Kept in the same pocket as keys and coins; careless with things', weight: 'medium' },
      { zh: '二手机或别人淘汰下来的', en: 'Second-hand or a hand-me-down', weight: 'weak' },
    ],
    source: 'Sherlock S1E1',
  },
  {
    id: 'devices.charging-port-scuffs',
    domain: 'devices',
    zh: '充电口周围一圈细划痕',
    en: 'Ring of scuff marks around the charging port',
    causes: [
      { zh: '晚上插线时手不稳（疲劳、光线差、老花）', en: 'Unsteady hands when plugging in at night (tired, dim light, poor eyesight)', weight: 'medium' },
    ],
    source: 'Sherlock S1E1',
    caution: { zh: '原剧推的是酗酒，属敏感类别；只写"插线时手不稳"', en: 'The show inferred alcoholism, which is off limits here; write only \'plugs it in with an unsteady hand\'' },
  },
  {
    id: 'devices.apple-ecosystem',
    domain: 'devices',
    zh: '清一色苹果设备',
    en: 'All-Apple devices',
    causes: [
      { zh: '苹果生态用户，设计 / 创意 / 互联网行业概率偏高', en: 'Apple ecosystem user; design/creative/tech more likely', weight: 'medium' },
    ],
    region: 'china-tier1',
    source: 'common',
  },
  {
    id: 'devices.cable-count',
    domain: 'devices',
    zh: '桌上充电线种类多（多种接口）',
    en: 'Many charging cables with different connectors',
    causes: [
      { zh: '设备多，旧设备不淘汰', en: 'Many devices; old ones never retired', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'devices.old-hardware-kept',
    domain: 'devices',
    zh: '旧手机、旧硬盘、旧路由器成堆',
    en: 'Piles of old phones, drives, routers',
    causes: [
      { zh: '技术从业者的"以后可能用得上"', en: 'Techie "might need it someday" hoarding', weight: 'medium' },
      { zh: '搬家少，住得久', en: 'Rarely moves; long tenure at this address', weight: 'weak' },
    ],
    source: 'common',
  },
]
