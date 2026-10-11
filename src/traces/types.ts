export type Weight = 'strong' | 'medium' | 'weak'

/** 读什么：桌面/物品，还是人身上 */
export type Subject = 'desk' | 'person'

export type Domain =
  // 物
  | 'desk'
  | 'devices'
  | 'room'
  | 'books'
  | 'bag'
  // 人（只读"人身上留下的痕迹"，不读长相）
  | 'hands'
  | 'face'
  | 'hair'
  | 'clothing'
  | 'accessories'
  | 'shoes'
  | 'posture'
  | 'body'

/** 域归属：bag 两边都算（桌上的包、身上的包） */
export const DOMAIN_SUBJECTS: Record<Domain, Subject[]> = {
  desk: ['desk'],
  devices: ['desk'],
  room: ['desk'],
  books: ['desk'],
  bag: ['desk', 'person'],
  hands: ['person'],
  face: ['person'],
  hair: ['person'],
  clothing: ['person'],
  accessories: ['person'],
  shoes: ['person'],
  posture: ['person'],
  body: ['person'],
}

export interface TraceCause {
  zh: string
  en: string
  weight: Weight
}

/** 基础率只在某地成立时才标。用代码值：同一条要同时渲染进中文和英文参考文件 */
export type Region = 'mainland-china' | 'china-tier1' | 'china-east-asia' | 'east-asia' | 'canon'

export const REGION_LABEL: Record<Region, { zh: string; en: string }> = {
  'mainland-china': { zh: '中国大陆', en: 'mainland China' },
  'china-tier1': { zh: '一线城市', en: 'tier-1 Chinese cities' },
  'china-east-asia': { zh: '中国大陆/东亚', en: 'mainland China / East Asia' },
  'east-asia': { zh: '东亚', en: 'East Asia' },
  canon: { zh: '历史案例', en: 'historical case' },
}

export interface Trace {
  /** `域.名字`，如 desk.keyboard-shine */
  id: string
  domain: Domain
  /** 看到什么（痕迹本身） */
  zh: string
  en: string
  /** 什么经历/习惯会留下它 */
  causes: TraceCause[]
  /** 基础率适用范围；不写 = 通用 */
  region?: Region
  /** common / Sherlock S1E1 / Elementary S1E1 / A Study in Scarlet / Joseph Bell */
  source?: string
  /** 使用注意（镜像、敏感、易误判） */
  caution?: { zh: string; en: string }
}
