import type { Trace } from './types'

/**
 * 人物痕迹库。
 *
 * 收录标准（这条线决定了这个项目是侦探还是算命）：
 * 只收「人自己的选择、习惯、经历留在身上的可核对痕迹」——戴过什么、磨在哪里、
 * 晒出什么边界、多久没剃、鞋底哪侧先秃。
 * 一律不收面相骨相（五官形状 → 性格/智力/命运）、族裔、健康与病史、性取向、颜值。
 * 判断标准很简单：这条痕迹是他「做过的事」留下的，还是他「生下来就长这样」？后者一律不收。
 */
export const PERSON_TRACES: Trace[] = [
  /* ---------------------------------------------------------------- 手 */
  {
    id: 'hands.ring-mark-no-ring',
    domain: 'hands',
    zh: '无名指根部有一圈浅色压痕/晒痕，但没戴戒指',
    en: 'A pale band or indentation at the base of the ring finger, with no ring on it',
    causes: [
      { zh: '长期戴戒指，最近才摘下', en: 'Wore a ring for a long time and took it off recently', weight: 'strong' },
      { zh: '工作要求摘首饰：医护、食品、机加工、健身举铁', en: 'Job requires removing jewelry: clinical, food, machining, lifting', weight: 'medium' },
    ],
    source: 'common',
    caution: { zh: '只陈述"戒指常戴、现在没戴"，不推断感情状况或评价关系', en: 'State only that a ring is usually worn and is off now; never infer relationship status or judge it' },
  },
  {
    id: 'hands.string-callus',
    domain: 'hands',
    zh: '一只手四个指尖有硬茧，另一只手没有',
    en: 'Hard calluses on four fingertips of one hand only',
    causes: [
      { zh: '弹弦乐器：吉他、贝斯、尤克里里、二胡', en: 'Plays a string instrument: guitar, bass, ukulele, erhu', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'hands.nails-short-one-hand',
    domain: 'hands',
    zh: '只有一只手的指甲剪到极短',
    en: 'Nails cut extremely short on one hand only',
    causes: [
      { zh: '按弦的手：吉他、古典吉他右手留甲左手秃', en: 'The fretting hand of a guitarist (classical players keep the picking nails long)', weight: 'strong' },
      { zh: '攀岩、器械体操', en: 'Climbing or gymnastics', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'hands.tape-residue-knuckles',
    domain: 'hands',
    zh: '手指关节缠着布基胶带，或残留镁粉白痕',
    en: 'Fingers taped, or chalk residue on the hands',
    causes: [
      { zh: '攀岩/抱石', en: 'Rock climbing or bouldering', weight: 'strong' },
      { zh: '举重、体操、拳击', en: 'Weightlifting, gymnastics, boxing', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'hands.palm-bar-callus',
    domain: 'hands',
    zh: '掌根横排一列老茧，虎口发厚',
    en: 'A row of calluses across the base of the fingers; thick web of the thumb',
    causes: [
      { zh: '长期握杠铃/单杠/器械', en: 'Regular barbell, pull-up bar or machine work', weight: 'strong' },
      { zh: '体力工具作业：搬运、木工、园艺', en: 'Manual tool work: hauling, carpentry, gardening', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'hands.ink-side-of-hand',
    domain: 'hands',
    zh: '小指外侧和掌缘有墨迹或铅灰',
    en: 'Ink or graphite smudged along the outer edge of the little finger',
    causes: [
      { zh: '左手书写：手压着刚写的字往右推', en: 'Writes left-handed: the hand drags across fresh ink', weight: 'strong' },
      { zh: '平板手写、大量草稿', en: 'Handwriting on a tablet, or heavy note-taking', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'hands.stained-fingertips',
    domain: 'hands',
    zh: '指尖或指甲缝有洗不掉的颜色（颜料、染发剂、机油、姜黄）',
    en: 'Colour that will not wash out of the fingertips or nail beds (paint, dye, grease, turmeric)',
    causes: [
      { zh: '动手职业：美发、绘画、维修、厨房', en: 'Hands-on trade: hairdressing, painting, repair, kitchen work', weight: 'medium' },
      { zh: '近期的一次性活动：染发、装修、下厨', en: 'A recent one-off: dyeing hair, decorating, cooking', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'hands.dry-knuckles',
    domain: 'hands',
    zh: '手背和指关节干裂脱皮，指甲周围起倒刺',
    en: 'Cracked, peeling skin over the knuckles and around the nails',
    causes: [
      { zh: '一天洗很多次手：医护、餐饮、育儿、实验室', en: 'Washes hands many times a day: clinical, food service, childcare, lab', weight: 'medium' },
      { zh: '干冷气候或长时间户外', en: 'Dry cold climate or long hours outdoors', weight: 'medium' },
    ],
    source: 'common',
    caution: { zh: '只推场景与频次，不得推断任何健康或心理状况', en: 'Infer setting and frequency only; never any health or mental-state inference' },
  },
  {
    id: 'hands.watch-tan',
    domain: 'hands',
    zh: '手腕有一圈明显的表带晒痕',
    en: 'A clear watch-strap tan line on the wrist',
    causes: [
      { zh: '常年戴同一块表且大量户外时间', en: 'Wears the same watch daily and spends real time outdoors', weight: 'strong' },
    ],
    source: 'common',
  },

  /* ---------------------------------------------------------------- 脸（只读状态与打理，不读长相） */
  {
    id: 'face.nose-pad-marks',
    domain: 'face',
    zh: '鼻梁两侧有对称的浅红压痕，但此刻没戴眼镜',
    en: 'Symmetrical red dents on the bridge of the nose, but no glasses on',
    causes: [
      { zh: '刚摘下常年佩戴的眼镜', en: 'Just removed glasses that are worn all day', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'face.sunglass-tan',
    domain: 'face',
    zh: '眼周一圈比脸颊白，边界很利落',
    en: 'A sharp pale mask around the eyes against a tanned face',
    causes: [
      { zh: '长时间戴墨镜的户外运动：骑行、跑步、滑雪、球类', en: 'Long outdoor sessions in sunglasses: cycling, running, skiing, field sports', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'face.helmet-strap-mark',
    domain: 'face',
    zh: '下颌或颧骨有带状压痕，鬓角被压塌',
    en: 'A strap mark along the jaw or cheekbone, hair flattened at the temples',
    causes: [
      { zh: '刚摘下头盔：骑行、机车、工地、球类', en: 'Just took off a helmet: cycling, motorcycle, site work, sport', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'face.mask-line',
    domain: 'face',
    zh: '耳后压痕，或鼻梁到脸颊有口罩形状的色差',
    en: 'Marks behind the ears, or a mask-shaped tone line across the face',
    causes: [
      { zh: '刚长时间戴口罩：通勤、医疗、工业、粉尘作业', en: 'Long stretch in a mask: commute, clinical, industrial, dusty work', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'face.stubble-length',
    domain: 'face',
    zh: '胡茬长度与边缘修剪状态',
    en: 'Length of stubble and how sharply it is edged',
    causes: [
      { zh: '距上次剃须的大致时间：整齐边界=一两天内', en: 'Roughly how long since the last shave; a crisp edge means a day or two', weight: 'strong' },
      { zh: '边界锋利+两鬓利落=专业修面', en: 'Very crisp edges suggest a barber rather than a home shave', weight: 'medium' },
    ],
    source: 'common',
    caution: { zh: '只推时间与打理方式，不评价外貌，不推性格', en: 'Infer timing and grooming only; no comment on appearance, no personality reading' },
  },
  {
    id: 'face.pillow-crease',
    domain: 'face',
    zh: '单侧脸颊有折痕，同侧头发压塌',
    en: 'A crease down one cheek with the hair flattened on the same side',
    causes: [
      { zh: '刚睡醒，而且是侧睡', en: 'Just woke up, sleeping on that side', weight: 'strong' },
      { zh: '趴在桌上补觉', en: 'Napped face-down on a desk', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'face.goggle-ring',
    domain: 'face',
    zh: '眼眶周围一圈环形压痕，睫毛还是潮的',
    en: 'A ring of pressure marks around the eye sockets',
    causes: [
      { zh: '刚游完泳或刚摘护目镜', en: 'Just out of the pool, or just removed safety goggles', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'face.headphone-ear-marks',
    domain: 'face',
    zh: '耳廓上缘有压痕，或耳周头发被压出一道',
    en: 'A dent along the top of the ear, or a channel pressed into the hair around it',
    causes: [
      { zh: '长时间戴头戴式耳机：坐班、剪辑、客服、游戏', en: 'Hours in over-ear headphones: desk work, editing, support, gaming', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'face.wind-flush',
    domain: 'face',
    zh: '颧骨和鼻尖发红发干，眼镜/护目镜位置留白',
    en: 'Wind-burnt cheeks and nose with a pale patch where eyewear sat',
    causes: [
      { zh: '近日长时间在风里：滑雪、骑行、海边、高原', en: 'Recent hours in wind: skiing, cycling, coast, high altitude', weight: 'medium' },
    ],
    source: 'common',
  },

  /* ---------------------------------------------------------------- 头发 */
  {
    id: 'hair.regrowth-band',
    domain: 'hair',
    zh: '发根一段和发梢颜色明显不同',
    en: 'A band of different colour at the roots',
    causes: [
      { zh: '上次染发的时间：以每月约一厘米倒推', en: 'Time since the last colour: hair grows roughly a centimetre a month', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'hair.hat-crease',
    domain: 'hair',
    zh: '一圈环形压痕横过头发',
    en: 'A ring pressed all the way around the hair',
    causes: [
      { zh: '刚摘帽子，而且戴了好几个小时', en: 'Just took off a hat that had been on for hours', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'hair.fresh-cut-neckline',
    domain: 'hair',
    zh: '后颈发际线边缘极其锋利，衣领上有碎发',
    en: 'A razor-sharp neckline with cut hairs still on the collar',
    causes: [
      { zh: '一两天内理过发', en: 'Haircut within a day or two', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'hair.tie-dent',
    domain: 'hair',
    zh: '长发上有一道皮筋压出的横痕',
    en: 'A horizontal kink where a hair tie sat',
    causes: [
      { zh: '刚把扎起来的头发放下来', en: 'Just let tied-up hair down', weight: 'medium' },
      { zh: '一天里大部分时间扎着：运动、厨房、实验室、育儿', en: 'Tied up most of the day: sport, kitchen, lab, childcare', weight: 'medium' },
    ],
    source: 'common',
  },

  /* ---------------------------------------------------------------- 衣着 */
  {
    id: 'clothing.rolled-one-trouser-leg',
    domain: 'clothing',
    zh: '只卷起右边（或链条侧）一条裤腿',
    en: 'One trouser leg rolled up, on the chain side',
    causes: [
      { zh: '骑自行车通勤，防裤腿卷进链条', en: 'Commutes by bicycle; keeps the cuff out of the chain', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'clothing.lanyard-badge',
    domain: 'clothing',
    zh: '挂着工牌绳、门禁卡或已经磨白的挂绳',
    en: 'A lanyard, access badge, or a strap worn pale with use',
    causes: [
      { zh: '在需要刷卡的场所长期通勤：园区、医院、学校、工厂', en: 'Daily access-controlled workplace: campus, hospital, school, plant', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'clothing.event-badge-left-on',
    domain: 'clothing',
    zh: '会议吊牌、赛事号码布或手环还没摘',
    en: 'A conference badge, race bib, or wristband still on',
    causes: [
      { zh: '刚参加完活动，还没回家换衣服', en: 'Straight from the event, not home yet', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'clothing.cuff-wear',
    domain: 'clothing',
    zh: '袖口内侧起球、发亮或磨薄',
    en: 'Sleeve cuffs pilled, shiny, or worn thin on the inside',
    causes: [
      { zh: '长期伏案，前臂在桌沿反复摩擦', en: 'Long hours at a desk with the forearm dragging on the edge', weight: 'medium' },
      { zh: '这件衣服穿了很久且常穿', en: 'A garment worn often and for years', weight: 'medium' },
    ],
    source: 'The Red-Headed League',
  },
  {
    id: 'clothing.fold-creases-new',
    domain: 'clothing',
    zh: '衣服上还留着出厂的方格折痕',
    en: 'Factory fold lines still crossing the garment',
    causes: [
      { zh: '刚拆封第一次穿', en: 'Straight out of the packaging, first wear', weight: 'strong' },
      { zh: '出差路上从行李箱里拿出来', en: 'Pulled from a suitcase on a trip', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'clothing.sitting-wrinkles',
    domain: 'clothing',
    zh: '大腿前侧密集横褶，腰侧却很平',
    en: 'Dense horizontal creases across the thighs, smooth at the waist',
    causes: [
      { zh: '刚坐了很久：长途通勤、开会、开车', en: 'Just sat for hours: long commute, meetings, driving', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'clothing.pet-hair',
    domain: 'clothing',
    zh: '深色衣物上有浅色短毛，集中在大腿和前襟',
    en: 'Short pale hairs on dark clothing, concentrated on the thighs and chest',
    causes: [
      { zh: '养猫（毛细短，前襟居多）或养狗（腿部居多）', en: 'Lives with a cat (fine hair, mostly on the chest) or a dog (mostly on the legs)', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'clothing.race-shirt',
    domain: 'clothing',
    zh: '赛事、马拉松、会议或社团的纪念 T 恤',
    en: 'A race, marathon, conference or club shirt',
    causes: [
      { zh: '参加过那件事，且愿意让人看见', en: 'Took part in that event and is happy to signal it', weight: 'strong' },
      { zh: '别人送的、或家人参加的', en: 'A gift, or a family member took part', weight: 'weak' },
    ],
    source: 'common',
  },
  {
    id: 'clothing.shoulder-wear-one-side',
    domain: 'clothing',
    zh: '只有一侧肩线起毛、塌陷或颜色变浅',
    en: 'Wear, sag or fading on one shoulder only',
    causes: [
      { zh: '长期单肩背包，且总是同一侧', en: 'Carries a bag on one shoulder, always the same one', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'clothing.workwear-details',
    domain: 'clothing',
    zh: '反光条、耐磨膝盖、多口袋工装或防静电材质',
    en: 'Reflective strips, reinforced knees, tool pockets, or anti-static fabric',
    causes: [
      { zh: '需要可视度或耐磨的作业环境：工地、物流、维修、洁净车间', en: 'A job needing visibility or durability: site, logistics, repair, cleanroom', weight: 'medium' },
      { zh: '纯风格选择：工装风', en: 'Style choice: workwear as fashion', weight: 'medium' },
    ],
    source: 'common',
  },

  /* ---------------------------------------------------------------- 随身物 */
  {
    id: 'accessories.watch-on-right',
    domain: 'accessories',
    zh: '手表戴在右手',
    en: 'Watch worn on the right wrist',
    causes: [
      { zh: '左利手：表戴非惯用手', en: 'Left-handed: the watch goes on the non-dominant wrist', weight: 'medium' },
      { zh: '惯用手需要频繁贴桌面或戴手套', en: 'The dominant hand rests on surfaces or wears gloves', weight: 'medium' },
    ],
    source: 'common',
    caution: { zh: '照片可能是镜像（前置摄像头自拍），先确认左右再下结论', en: 'The photo may be mirrored (front-camera selfie): confirm left from right before concluding' },
  },
  {
    id: 'accessories.fitness-band',
    domain: 'accessories',
    zh: '运动手环/运动手表，表带有汗渍或磨损',
    en: 'A fitness band or sports watch with a sweat-stained, worn strap',
    causes: [
      { zh: '固定训练且在意数据，多半连睡觉也戴', en: 'Trains on a schedule and tracks it, often overnight too', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'accessories.phone-case-cards',
    domain: 'accessories',
    zh: '手机壳背面塞着卡，或贴着门禁贴片',
    en: 'Cards tucked into the phone case, or an access sticker on the back',
    causes: [
      { zh: '每天要刷的卡不止一张：门禁、交通、食堂', en: 'More than one card to tap daily: door, transit, canteen', weight: 'medium' },
      { zh: '不带钱包出门', en: 'Goes out without a wallet', weight: 'medium' },
    ],
    region: 'china-east-asia',
    source: 'common',
  },
  {
    id: 'accessories.cracked-corner-screen',
    domain: 'accessories',
    zh: '手机屏一角蛛网状裂纹，仍在用',
    en: 'A spiderweb crack in one corner of a phone screen, still in use',
    causes: [
      { zh: '摔过且不打算修：预算、嫌麻烦、快换机了', en: 'Dropped it and chose not to fix it: budget, hassle, or upgrading soon', weight: 'medium' },
    ],
    source: 'common',
    caution: { zh: '不推断具体收入或财务状况', en: 'Never infer income or financial circumstances' },
  },
  {
    id: 'accessories.many-fobs',
    domain: 'accessories',
    zh: '钥匙串上挂着多个门禁扣、储物柜牌或登山扣',
    en: 'A key ring loaded with several fobs, locker tags, or a carabiner',
    causes: [
      { zh: '固定出入好几个地方：公司、健身房、合租、父母家', en: 'Regularly enters several places: office, gym, shared flat, family home', weight: 'medium' },
      { zh: '登山扣外挂=户外习惯外溢到日常', en: 'A carabiner suggests outdoor habits leaking into daily carry', weight: 'weak' },
    ],
    source: 'common',
  },

  /* ---------------------------------------------------------------- 鞋 */
  {
    id: 'shoes.trail-residue',
    domain: 'shoes',
    zh: '鞋侧和鞋底纹里有干泥、草籽或沙',
    en: 'Dried mud, seeds or sand in the sidewall and tread',
    causes: [
      { zh: '近日走过非铺装路面：徒步、工地、郊野、雨天工地', en: 'Recently off pavement: hiking, site, trail, wet ground', weight: 'strong' },
    ],
    source: 'A Study in Scarlet',
  },
  {
    id: 'shoes.heel-crushed',
    domain: 'shoes',
    zh: '鞋后跟被踩塌，鞋帮变形',
    en: 'Heel counters crushed flat from being stepped on',
    causes: [
      { zh: '常当拖鞋踢着穿：频繁进出、居家办公、要脱鞋的场所', en: 'Slips them on and off constantly: in and out, works from home, shoes-off spaces', weight: 'medium' },
    ],
    region: 'east-asia',
    source: 'common',
  },
  {
    id: 'shoes.pristine-vs-worn',
    domain: 'shoes',
    zh: '鞋面干净到几乎没有折痕，鞋底也没磨',
    en: 'Uppers barely creased and soles hardly worn',
    causes: [
      { zh: '新买不久', en: 'Bought recently', weight: 'medium' },
      { zh: '开车/网约车通勤，日常步数很少', en: 'Drives or rides everywhere; very few steps a day', weight: 'medium' },
      { zh: '这双是"换着穿"的其中一双', en: 'One of several pairs in rotation', weight: 'medium' },
    ],
    source: 'common',
  },
  {
    id: 'shoes.sport-specific',
    domain: 'shoes',
    zh: '专项运动鞋：碳板跑鞋、攀岩鞋、羽球鞋、足球钉鞋',
    en: 'Sport-specific shoes: carbon-plate racers, climbing shoes, court shoes, cleats',
    causes: [
      { zh: '认真练那项运动，而不是随便穿穿', en: 'Trains that sport seriously rather than casually', weight: 'strong' },
    ],
    source: 'common',
  },

  /* ---------------------------------------------------------------- 体态与晒痕 */
  {
    id: 'posture.desk-set',
    domain: 'posture',
    zh: '站着时头略前引、圆肩，坐下自动含胸',
    en: 'Head slightly forward and shoulders rounded, settling into a hunch when seated',
    causes: [
      { zh: '每天在屏幕前坐很久', en: 'Many hours a day in front of a screen', weight: 'medium' },
    ],
    source: 'common',
    caution: { zh: '这是习惯不是诊断，禁止推断疾病、疼痛或治疗', en: 'A habit, not a diagnosis: no illness, pain or treatment inferences' },
  },
  {
    id: 'posture.trained-stance',
    domain: 'posture',
    zh: '站姿双脚同宽、背挺、手自然贴身，转身干脆',
    en: 'Stands square and upright, hands at the sides, turns crisply',
    causes: [
      { zh: '受过队列/仪态训练：军警、舞蹈、乐队、空乘', en: 'Drilled posture: military or police, dance, marching band, cabin crew', weight: 'medium' },
    ],
    source: 'Joseph Bell',
  },
  {
    id: 'body.sleeve-tan-line',
    domain: 'body',
    zh: '上臂有短袖界限的晒痕，手背与前臂色差明显',
    en: 'A T-shirt tan line on the upper arm with a clear break at the wrist',
    causes: [
      { zh: '大量户外时间且穿短袖：骑行、球类、工地、跑步', en: 'Lots of outdoor time in short sleeves: cycling, field sport, site work, running', weight: 'strong' },
    ],
    source: 'common',
  },
  {
    id: 'body.glove-line',
    domain: 'body',
    zh: '手背晒黑但手指根部以下发白，边界是手套形状',
    en: 'Tanned backs of the hands with pale fingers, edged like a glove',
    causes: [
      { zh: '戴半指手套的户外活动：骑行、划船、举铁、球类', en: 'Fingerless gloves outdoors: cycling, rowing, lifting, racquet sports', weight: 'strong' },
    ],
    source: 'common',
  },
]
