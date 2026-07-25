// 知识网络 / 二次大脑 · 主题节点数据
// 每个节点 = 一个问题主题，挂载多本书的视角（含冲突观点）、我的迭代理解、与其他节点的有向连线。
// perspectives[].book 用《书名》精确对应 wereading-blog/js/books.js 里的 BOOK_LIST 标题，
// 渲染时按 normTitle 解析出书单索引，保证点「来自《XX》」能跳到对应书。
window.KNOWLEDGE_NODES = [
  {
    id: "executive",
    title: "执行力",
    aliases: ["如何提升执行力", "行动力", "落地难", "想到做不到", "执行力差", "如何开始行动"],
    summary: "我现在的看法：执行力不是靠意志力硬扛，而是把模糊目标拆成「下一步具体动作」+ 把启动阻力降到最低。能开始，就赢了大半。",
    edges: [
      { to: "procrastination", rel: "执行力差 ↔ 拖延", type: "related" },
      { to: "perfectionism", rel: "完美主义 → 不敢开始 → 执行力掉", type: "cause" },
      { to: "habit", rel: "执行力 → 好习惯撑住", type: "related" }
    ],
    perspectives: [
      { book: "《高效能人士的 7 个习惯》", stance: "support", viewpoint: "「积极主动」+「要事第一」：先把大目标切成每周的少数几件要事，而不是被紧急的事推着走。", method: "每周列 3 件要事，先做最不想做的那件（先吃青蛙）。" },
      { book: "《福格行为模型》", stance: "support", viewpoint: "行为 = 动机 + 能力 + 提示；绝大多数「执行力差」是提示缺失或能力门槛太高，不是人懒。", method: "把动作拆到最小（只写一行字），并放一个显眼提示（如打开文档就弹提醒）。" },
      { book: "《自控力》", stance: "nuance", viewpoint: "意志力是有限资源，靠它硬扛会耗尽，反而更拖。", method: "减少日常决策、预设环境（如睡前把运动服摆好），少消耗意志力。" },
      { book: "《慢生产力》", stance: "conflict", viewpoint: "它主张「慢下来反而更快」：盲目求快会制造返工和无谓消耗，真正的执行力是先想清再动手，而不是立刻冲。", method: "动手前先花 10 分钟写清「这件事到底要什么结果」。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "procrastination",
    title: "拖延",
    aliases: ["怎么改掉拖延", "拖延症", "明明知道该做却不动", "deadline战士", "重度拖延"],
    summary: "拖延不是懒，是情绪调节失败——用「等会儿再做」逃避当下那点焦虑。治本的办法是让「开始」这件小事不引发抗拒。",
    edges: [
      { to: "executive", rel: "拖延 ↔ 执行力", type: "related" },
      { to: "perfectionism", rel: "完美主义 → 怕做不好 → 拖延", type: "cause" },
      { to: "emotional-drain", rel: "拖延 → 内耗加剧", type: "cause" }
    ],
    perspectives: [
      { book: "《自控力》", stance: "support", viewpoint: "拖延和意志力损耗高度相关；光靠自律会越拖越糟。", method: "给自己设「如果…就…」预案（如果坐到电脑前，就先打开文档）。" },
      { book: "《福格行为模型》", stance: "support", viewpoint: "把「开始写报告」拆成「打开文档打一行字」，启动门槛越低越容易动。", method: "用微小行为 + 即时奖励（做完给自己一句夸）。" },
      { book: "《稀缺》", stance: "nuance", viewpoint: "稀缺会抢占带宽，人在「穷忙」里更容易拖——不是懒，是 cognitive 空间被占满了。", method: "给重要的事留一点「带宽余量」，别把日程排到极限。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "perfectionism",
    title: "完美主义",
    aliases: ["完美主义", "不敢开始", "过度追求完美", "怕出错", "必须做到最好"],
    summary: "完美主义常常是用「做不到的完美」，来逃避「不完美的开始」。先完成再完美，完成本身就是进步。",
    edges: [
      { to: "procrastination", rel: "完美主义 → 拖延", type: "cause" },
      { to: "executive", rel: "完美主义 → 执行力掉", type: "cause" }
    ],
    perspectives: [
      { book: "《终身成长》", stance: "support", viewpoint: "固定型思维催生完美主义（怕出错=证明我不行）；改成成长型，「出错=学习素材」。", method: "把口头禅从「我必须完美」换成「我这次在进步」。" },
      { book: "《优秀到不能被忽视》", stance: "nuance", viewpoint: "追求「优秀」本身值得，但别让完美卡住产出——市场先看到的是你做出来了什么。", method: "给每件事设「够好就发」的截止线。" },
      { book: "《慢生产力》", stance: "conflict", viewpoint: "它认为「慢慢磨到完美」才是真品质，反对为了快而粗糙。", method: "区分「该慢的工艺」和「该快的交付」，别一刀切。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "emotional-drain",
    title: "情绪内耗",
    aliases: ["情绪内耗", "想太多", "精神内耗", "内耗严重", "反复想一件事", "钻牛角尖"],
    summary: "内耗 = 在脑子里反复演同一件事却不行动，能量全耗在「想」上。解药就一句：把念头落地成一件小事。",
    edges: [
      { to: "procrastination", rel: "内耗 → 拖延", type: "cause" },
      { to: "people-pleasing", rel: "内耗 ↔ 讨好", type: "related" },
      { to: "separation", rel: "内耗 ↔ 课题分离", type: "related" }
    ],
    perspectives: [
      { book: "《蛤蟆先生去看心理医生》", stance: "support", viewpoint: "很多内耗来自「儿童自我状态」被情绪挟持，反复回想别人怎么看我。", method: "觉察自己此刻处在哪个自我状态，先把自己拉回「成人状态」。" },
      { book: "《自卑与超越》", stance: "support", viewpoint: "阿德勒：内耗常因过度关注「别人怎么看我」，把别人的课题扛在自己肩上。", method: "问自己「这事的结果最终由谁承担」，把别人的课题还回去。" },
      { book: "《内在动机》", stance: "nuance", viewpoint: "内耗多发生在做「不自主」的事上；找回内控点会明显减轻。", method: "在被迫的事里，找一点「这是我选的角度」。" },
      { book: "《贪婪的多巴胺》", stance: "nuance", viewpoint: "多巴胺总驱使人追「下一个更好」，于是永远不满足、反复比较→内耗。", method: "练习「当下满足」，刻意停在不追求更多的时候。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "separation",
    title: "课题分离",
    aliases: ["课题分离", "阿德勒", "不该我操心的", "别人的事", "边界感", "关我什么事"],
    summary: "区分「这是谁的课题」：别人的情绪、评价、选择是别人的课题，我只需对自己的选择负责。不是冷漠，是把能量收回到自己能改的地方。",
    edges: [
      { to: "people-pleasing", rel: "课题分离 → 不讨好", type: "related" },
      { to: "emotional-drain", rel: "课题分离 → 内耗少", type: "related" }
    ],
    perspectives: [
      { book: "《自卑与超越》", stance: "support", viewpoint: "阿德勒的核心：一切烦恼来自人际关系，而解药之一是课题分离——不干涉别人的课题，也不让被人干涉自己的。", method: "遇事先问「这事的结果最终由谁承担」，谁承担就是谁的课题。" },
      { book: "《好的爱，有边界》", stance: "support", viewpoint: "爱里有边界不等于冷漠；关心对方，但不替对方扛后果。", method: "可以对伴侣说「我理解你难受」，但不替他做决定。" },
      { book: "《蛤蟆先生去看心理医生》", stance: "nuance", viewpoint: "心理咨询也强调「不干涉对方课题」，过度介入反而让对方长不大。", method: "陪伴而不替代。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "people-pleasing",
    title: "讨好型人格",
    aliases: ["讨好型人格", "老好人", "不敢拒绝", "怕得罪人", "总想让所有人满意", "不会说不"],
    summary: "讨好是用「让所有人满意」换安全感，代价是慢慢丢了自己。健康的边界感，反而让人更愿意靠近你。",
    edges: [
      { to: "separation", rel: "讨好 → 课题分离能治", type: "related" },
      { to: "emotional-drain", rel: "讨好 → 内耗", type: "cause" }
    ],
    perspectives: [
      { book: "《自卑与超越》", stance: "support", viewpoint: "讨好常源于「自卑情结」，用迎合换归属感；阿德勒主张建立「横向关系」而非「纵向讨好」。", method: "把关系从「我低你高」调成「我们平等」。" },
      { book: "《非暴力沟通》", stance: "support", viewpoint: "拒绝也可以很温柔：说事实 + 感受 + 需要，不指责。", method: "「我这次安排不过来，下次再约」比硬着头皮答应更长久。" },
      { book: "《好的爱，有边界》", stance: "support", viewpoint: "边界感健康的人不讨好；边界不是墙，是门。", method: "先想清楚自己能接受什么，再开口。" },
      { book: "《蛤蟆先生去看心理医生》", stance: "nuance", viewpoint: "讨好常是「儿童状态」在求认可；长大是从「要别人夸」到「自己认可」。", method: "练习为自己的选择负责，而不是为别人的笑脸负责。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "habit",
    title: "习惯",
    aliases: ["习惯养成", "怎么养成好习惯", "改掉坏习惯", "微习惯", "自律", "行为改变"],
    summary: "习惯是「自动运行的程序」；改习惯不靠意志力死磕，而是改「提示→渴望→反应→奖励」这条回路，尤其是让好事更容易发生。",
    edges: [
      { to: "executive", rel: "习惯 → 撑住执行力", type: "related" },
      { to: "compounding", rel: "习惯 → 复利", type: "cause" }
    ],
    perspectives: [
      { book: "《掌控习惯》", stance: "support", viewpoint: "身份认同驱动习惯：与其说「我要读书」，不如说「我是个读者」。", method: "两分钟法则（新习惯不超过两分钟）+ 习惯叠加（刷牙后立刻冥想）。" },
      { book: "《福格行为模型》", stance: "support", viewpoint: "微小行为 + 即时情绪奖励最容易固化成习惯。", method: "做完立刻给自己一点庆祝（哪怕心里说句 Nice）。" },
      { book: "《高效能人士的 7 个习惯》", stance: "support", viewpoint: "主动积极、要事第一是底层习惯，先于一切技巧。", method: "每天先用 10 分钟排「要事」。" },
      { book: "《刻意练习》", stance: "conflict", viewpoint: "它提醒：习惯让人自动，但「刻意练习」恰恰要走出舒适区、保持不舒服——纯自动化会停在平台期。", method: "日常习惯保底，关键能力另留「刻意不舒服」的时间。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "compounding",
    title: "复利",
    aliases: ["复利", "复利思维", "长期主义", "慢慢变富", "滚雪球", "持续积累"],
    summary: "复利不只在钱，在认知、关系、健康上都是「微小持续 > 一次爆发」。难点从来不是利率，是别中断。",
    edges: [
      { to: "habit", rel: "复利 ← 习惯", type: "related" },
      { to: "wealth", rel: "复利 → 财富", type: "cause" }
    ],
    perspectives: [
      { book: "《穷查理宝典》", stance: "support", viewpoint: "多元思维模型 + 长期复利，会产生 lollapalooza（多因素叠加）效应。", method: "每天让自己比昨天聪明一点点，跨年就是质变。" },
      { book: "《纳瓦尔宝典》", stance: "support", viewpoint: "财富 = 特定知识 × 杠杆（代码/媒体/团队）× 复利。", method: "积累可复利的能力：写作、信誉、产品。" },
      { book: "《巴菲特之道》", stance: "support", viewpoint: "巴菲特靠长期复利致富，不追热点、不频繁交易。", method: "买好公司，长期持有，少操作。" },
      { book: "《金钱心理学》", stance: "nuance", viewpoint: "复利最难的不是利率，是「别中断」+ 控制贪婪与恐惧。", method: "留出安全垫，避免在最低点被迫卖出。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "cognitive-bias",
    title: "认知偏差",
    aliases: ["认知偏差", "思维误区", "决策陷阱", "大脑bug", "思考盲区", "认知陷阱"],
    summary: "大脑有一堆出厂 shortcut，平时省事，关键时刻坑你。知道自己会怎么「想错」，比学会怎么「想对」更划算。",
    edges: [
      { to: "scarcity", rel: "稀缺 → 偏差更狠", type: "cause" },
      { to: "emotional-drain", rel: "偏差 ↔ 内耗", type: "related" }
    ],
    perspectives: [
      { book: "《思考，快与慢》", stance: "support", viewpoint: "系统 1 直觉快但易错，系统 2 慢但准；多数误判是系统 1 抢答了。", method: "重要决定先「慢下来」，给自己 10 分钟再拍板。" },
      { book: "《穷查理宝典》", stance: "support", viewpoint: "多元思维模型能对抗「铁锤人倾向」（手里拿锤子看什么都像钉子）。", method: "用多个学科视角看同一个问题。" },
      { book: "《怪诞行为学》", stance: "support", viewpoint: "锚定、框架效应、损失厌恶……我们常被呈现方式牵着走。", method: "做选择前先问「这个信息是被人包装过的吗」。" },
      { book: "《社会心理学》", stance: "nuance", viewpoint: "从众、服从权威是极强的情境偏差，未必是「你蠢」。", method: "独处时再判断一次，别在人群里做决定。" },
      { book: "《黑天鹅》", stance: "conflict", viewpoint: "它反对用「高斯分布/平均值」思维理解世界——极端事件才是关键，而我们的偏差让我们系统性低估它。", method: "为「罕见但致命」的事留冗余，而不是只优化平均情况。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "intimacy",
    title: "亲密关系",
    aliases: ["亲密关系", "怎么经营感情", "老吵架", "伴侣沟通", "为什么相处累", "婚姻"],
    summary: "好的关系不是不吵架，而是能把冲突变成互相理解。多数争吵的表面是事件，底下是「我被看见了吗」。",
    edges: [
      { to: "separation", rel: "亲密关系 ↔ 课题分离", type: "related" },
      { to: "people-pleasing", rel: "亲密关系 ↔ 讨好", type: "related" },
      { to: "nvc", rel: "亲密关系 → 非暴力沟通", type: "related" }
    ],
    perspectives: [
      { book: "《亲密关系》", stance: "support", viewpoint: "冲突多源于「投射」与童年模式：你吵的常不是眼前这件事，而是旧伤口。", method: "把对方当镜子，先问「我为什么这么难受」。" },
      { book: "《非暴力沟通》", stance: "support", viewpoint: "说观察不评判、说感受不指责、说需要不命令。", method: "冲突时先讲自己的感受，而不是先定性对方。" },
      { book: "《好的爱，有边界》", stance: "support", viewpoint: "有边界的爱才长久；没有边界，爱会变成吞噬。", method: "可以亲密，也可以保留「我不认同你」的空间。" },
      { book: "《关键对话》", stance: "nuance", viewpoint: "高危对话要先建「安全感」，否则内容再对也谈崩。", method: "开口前先确认对方觉得「你是来解决问题的，不是来赢的」。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "nvc",
    title: "非暴力沟通",
    aliases: ["非暴力沟通", "怎么好好说话", "沟通技巧", "表达感受", "不伤人地说话"],
    summary: "沟通的四步：观察—感受—需要—请求。核心不是话术，是把「指责」换成「我需要什么」，让对方愿意听。",
    edges: [
      { to: "intimacy", rel: "非暴力沟通 → 亲密关系", type: "related" },
      { to: "people-pleasing", rel: "非暴力沟通 → 不讨好也能拒绝", type: "related" }
    ],
    perspectives: [
      { book: "《非暴力沟通》", stance: "support", viewpoint: "多数冲突来自「评判对方」；换成讲自己的观察与需要，对抗感立刻降下来。", method: "「你总不回消息（观察），我有点慌（感受），因为我需要被惦记（需要），下次忙完回个表情好吗（请求）」。" },
      { book: "《关键对话》", stance: "support", viewpoint: "关键对话里，先保住对方的安全感，再谈内容。", method: "用「我的目的是…」开场，而不是「你错了」。" },
      { book: "《用事实说话》", stance: "nuance", viewpoint: "有些场景光讲感受不够，得把「硬事实」说清，否则对方当你情绪化。", method: "先摆可验证的事实，再谈感受。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "wealth",
    title: "财富认知",
    aliases: ["财富认知", "怎么变有钱", "金钱观", "穷人思维", "富人思维", "赚钱逻辑"],
    summary: "财富不是省出来的，是「认知差 × 杠杆 × 时间」长出来的。先把概念弄清楚，钱是后面自然的结果。",
    edges: [
      { to: "compounding", rel: "财富 ← 复利", type: "cause" }
    ],
    perspectives: [
      { book: "《纳瓦尔宝典》", stance: "support", viewpoint: "财富 = 特定知识 × 杠杆（代码/媒体/团队）× 复利；把自己产品化。", method: "找到你独特又被人需要的本事，用杠杆放大它。" },
      { book: "《富爸爸穷爸爸》", stance: "support", viewpoint: "资产 > 负债，让钱为你工作，而不是你为钱工作。", method: "每花一笔钱先问「这是资产还是负债」。" },
      { book: "《财富自由之路》", stance: "support", viewpoint: "概念清晰程度决定财富水平——很多穷人思维是概念没理清。", method: "把「财富自由」拆成具体数字和 timeline。" },
      { book: "《金钱心理学》", stance: "nuance", viewpoint: "理财最大的敌人往往是自己：贪婪与恐惧比不懂公式更致命。", method: "定下纪律并机械化执行，别临场靠情绪。" }
    ],
    updatedAt: "2026-07",
    version: 1
  },
  {
    id: "scarcity",
    title: "稀缺",
    aliases: ["稀缺", "带宽", "穷忙", "没时间", "顾不上", "陷入困局"],
    summary: "缺什么，什么就占满注意力；稀缺让人变「窄」，反而更难脱困。给自己留余量，是跳出稀缺的第一步。",
    edges: [
      { to: "procrastination", rel: "稀缺 → 更拖", type: "cause" },
      { to: "cognitive-bias", rel: "稀缺 → 偏差更狠", type: "cause" }
    ],
    perspectives: [
      { book: "《稀缺》", stance: "support", viewpoint: "稀缺会俘获带宽，导致「借用」与短视——不是人笨，是认知空间被占满了。", method: "给重要的事留一点缓冲，别把日程排到极限。" },
      { book: "《贫穷的本质》", stance: "nuance", viewpoint: "穷不一定是懒，常是「穷人的选择空间被结构性压缩」，决策质量受环境限制。", method: "先改善环境与余量，再谈个人努力。" }
    ],
    updatedAt: "2026-07",
    version: 1
  }
];
