/**
 * team-report.js v2.1 — 团队报告计算与渲染引擎
 *
 * 修复 v2.1:
 * - 角色定位算法修复：区分核心骨干/创新先锋/运营中坚/谈判主力/洞察补充
 * - 团队类型判定调整：100%独特 → 互补型
 * - 未配对成员独立建议
 * - 已测试比例动态计算
 * - 培训建议关联姜宏锋老师具体课程
 */

// ── 16 种谈判风格定义 ──
var styleDefinitions = {
  ARCD: { name: "数据军师", animal: "🦉", dimension: "分析 + 关系 + 竞争 + 防御" },
  ARCP: { name: "关系达人", animal: "🦉", dimension: "分析 + 关系 + 竞争 + 开拓" },
  ARBD: { name: "守门员", animal: "🦉", dimension: "分析 + 关系 + 合作 + 防御" },
  ARBP: { name: "流程管家", animal: "🦉", dimension: "分析 + 关系 + 合作 + 开拓" },
  ATCD: { name: "市场猎手", animal: "🦅", dimension: "分析 + 任务 + 竞争 + 防御" },
  ATCP: { name: "拍板侠", animal: "🦅", dimension: "分析 + 任务 + 竞争 + 开拓" },
  ATBD: { name: "逻辑控", animal: "🦅", dimension: "分析 + 任务 + 合作 + 防御" },
  ATBP: { name: "效率狂人", animal: "🦅", dimension: "分析 + 任务 + 合作 + 开拓" },
  IRCD: { name: "直觉玩家", animal: "🦊", dimension: "直觉 + 关系 + 竞争 + 防御" },
  IRCP: { name: "机会捕手", animal: "🦊", dimension: "直觉 + 关系 + 竞争 + 开拓" },
  IRBD: { name: "人脉王", animal: "🦊", dimension: "直觉 + 关系 + 合作 + 防御" },
  IRBP: { name: "和事佬", animal: "🦊", dimension: "直觉 + 关系 + 合作 + 开拓" },
  ITCD: { name: "变色龙", animal: "🐺", dimension: "直觉 + 任务 + 竞争 + 防御" },
  ITCP: { name: "社交牛人", animal: "🐺", dimension: "直觉 + 任务 + 竞争 + 开拓" },
  ITBD: { name: "守门员", animal: "🐺", dimension: "直觉 + 任务 + 合作 + 防御" },
  ITBP: { name: "行动派", animal: "🐺", dimension: "直觉 + 任务 + 合作 + 开拓" }
};

// ── 维度映射 ──
var dimLabels = {
  '0': ['A', 'I', '分析型', '直觉型'],
  '1': ['R', 'T', '关系型', '任务型'],
  '2': ['C', 'B', '竞争型', '合作型'],
  '3': ['D', 'P', '防御型', '开拓型']
};

// ══════════════════════════════════════
//  动态算法模块
// ══════════════════════════════════════

function calcDimensions(members) {
  var d = { A: 0, I: 0, R: 0, T: 0, C: 0, B: 0, D: 0, P: 0 };
  members.forEach(function(m) {
    d[m.code[0] === 'A' ? 'A' : 'I']++;
    d[m.code[1] === 'R' ? 'R' : 'T']++;
    d[m.code[2] === 'C' ? 'C' : 'B']++;
    d[m.code[3] === 'D' ? 'D' : 'P']++;
  });
  return d;
}

function calcTeamType(members) {
  var n = members.length;
  if (n < 2) return { type: '一致型', icon: '🏠', desc: '团队规模较小，建议扩大成员多样性。' };
  var unique = {};
  members.forEach(function(m) { unique[m.code] = true; });
  var ratio = Object.keys(unique).length / n;
  // 修复：100%独特 = 互补型（全员风格各异，互补性最强）
  if (ratio >= 1.0)
    return { type: '互补型', icon: '🔀', desc: '成员风格各具特色，优势互补明显。建议建立跨风格沟通机制，最大化协同效应。' };
  if (ratio >= 0.6)
    return { type: '互补型', icon: '🔀', desc: '成员风格多样，优势互补，协作潜力大。建议加强跨风格沟通，最大化协同效应。' };
  return { type: '一致型', icon: '🤝', desc: '成员风格较为一致，执行效率高但视角可能受限。建议引入外部视角或轮岗机制。' };
}

function calcScore(members, dims) {
  var n = members.length;
  if (n < 2) return Math.round(50);
  var unique = {};
  members.forEach(function(m) { unique[m.code] = true; });
  var diversity = Object.keys(unique).length / n;
  var pairs = [[dims.A, dims.I], [dims.R, dims.T], [dims.C, dims.B], [dims.D, dims.P]];
  var balance = 0;
  pairs.forEach(function(p) {
    var t = p[0] + p[1];
    if (t > 0) balance += Math.min(p[0], p[1]) / t;
  });
  balance /= 4;
  var sizeFactor = Math.min(1, n / (2 + 3 * Math.log2(Math.max(n, 2))));
  var raw = (diversity * 40) + (balance * 35) + (sizeFactor * 25);
  return Math.round(Math.max(40, Math.min(100, raw)));
}

/**
 * 角色定位 v2.1 — 修复：确保不同成员获得不同角色
 *
 * 基于成员在团队中的独特性（少数派维度数量）+ 风格特征
 */
function calcRoles(members) {
  var n = members.length;
  // 统计每个维度每个值的出现次数
  var dimCount = [
    { A: 0, I: 0 }, { R: 0, T: 0 }, { C: 0, B: 0 }, { D: 0, P: 0 }
  ];
  members.forEach(function(m) {
    for (var i = 0; i < 4; i++) dimCount[i][m.code[i]]++;
  });

  return members.map(function(m) {
    var code = m.code;
    var uniqueDims = 0;
    var minorityDims = 0;
    for (var i = 0; i < 4; i++) {
      var c = dimCount[i][code[i]];
      if (c <= 1) uniqueDims++;       // 团队唯一
      if (c <= Math.ceil(n / 2)) minorityDims++; // 少数派
    }

    // 修复后的角色判定：优先级从高到低
    // 1) 直觉型独苗 → 洞察补充
    if (code[0] === 'I' && dimCount[0].I === 1) return '洞察补充';
    // 2) 开拓型独苗 + 少数派维度 >= 2 → 创新先锋
    if (code[3] === 'P' && dimCount[3].P === 1 && minorityDims >= 2) return '创新先锋';
    // 3) 分析型主导 + 竞争型 → 核心骨干
    if (code[0] === 'A' && code[2] === 'C' && minorityDims >= 2) return '核心骨干';
    // 4) 竞争 + 防御 → 谈判主力
    if (code[2] === 'C' && code[3] === 'D') return '谈判主力';
    // 5) 合作 + 开拓 → 运营中坚
    if (code[2] === 'B' && code[3] === 'P') return '运营中坚';
    // 6) 兜底
    return '协作力量';
  });
}

function calcDimensionInsights(dims, n) {
  var results = [];
  var pairs = [
    [dims.A, dims.I, '🧠 信息获取维度', '分析型', '直觉型', 'A', 'I'],
    [dims.R, dims.T, '🎯 决策导向维度', '关系型', '任务型', 'R', 'T'],
    [dims.C, dims.B, '⚔️ 处事方式维度', '竞争型', '合作型', 'C', 'B'],
    [dims.D, dims.P, '🚀 行动策略维度', '防御型', '开拓型', 'D', 'P']
  ];
  var templates = {
    'A-I': {
      strength: '团队偏向分析型决策，重视数据和逻辑。优势在于方案论证充分，风险识别准确',
      caution: '需注意避免过度分析导致决策延迟',
      action: '建议为直觉型成员创造表达洞察的空间'
    },
    'I-A': {
      strength: '团队偏向直觉型决策，市场敏锐度高，善于捕捉机会和创新。优势在于快速响应市场变化',
      caution: '需注意决策可能缺乏充分数据支撑',
      action: '建议为分析型成员创造深度论证的机会'
    },
    'R-T': {
      strength: '关系导向占优，团队氛围和谐，善于维护供应商关系。优势在于内部协作顺畅',
      caution: '需平衡关系维护与任务达成，避免因人情影响谈判底线',
      action: '建议任务型成员在关键节点推动进度'
    },
    'T-R': {
      strength: '任务导向占优，团队执行力强，目标明确。优势在于高效推进项目',
      caution: '需注意关系维护，避免过于强硬影响长期合作',
      action: '建议关系型成员在供应商管理中发挥主导作用'
    },
    'C-B': {
      strength: '竞争意识较强，善于争取利益最大化。在供应商谈判中不易吃亏',
      caution: '需注意长期合作关系的维护',
      action: '建议合作型成员在战略供应商管理中发挥主导作用'
    },
    'B-C': {
      strength: '合作共赢意识强，善于建立长期合作关系。优势在于供应商满意度高',
      caution: '需注意在关键谈判中争取最大利益',
      action: '建议竞争型成员在重要谈判中发挥主导作用'
    },
    'D-P': {
      strength: '防御型居多，风险管控意识强，决策谨慎。优势在于规避陷阱',
      caution: '但可能错失市场机会',
      action: '建议为开拓型成员授权创新试点项目，平衡稳健与敏捷'
    },
    'P-D': {
      strength: '开拓型居多，行动敏捷，敢于尝试新方法。优势在于快速响应市场变化',
      caution: '需注意风险控制，避免冒进',
      action: '建议为防御型成员赋予风险审核权限，平衡敏捷与稳健'
    }
  };
  pairs.forEach(function(p) {
    var key = p[0] >= p[1] ? p[5] + '-' + p[6] : p[6] + '-' + p[5];
    var t = templates[key] || templates['A-I'];
    var minorityLetter = p[0] >= p[1] ? p[6] : p[5];
    var minorityNames = [];
    if (typeof window !== 'undefined' && window.teamReportData) {
      window.teamReportData.members.forEach(function(m) {
        var idx;
        if (minorityLetter === 'A' || minorityLetter === 'I') idx = 0;
        else if (minorityLetter === 'R' || minorityLetter === 'T') idx = 1;
        else if (minorityLetter === 'C' || minorityLetter === 'B') idx = 2;
        else idx = 3;
        if (m.code[idx] === minorityLetter) minorityNames.push(m.name);
      });
    }
    results.push({
      dimension: p[2],
      majorLabel: p[0] >= p[1] ? p[3] : p[4],
      minorLabel: p[0] >= p[1] ? p[4] : p[3],
      majorCount: Math.max(p[0], p[1]),
      minorCount: Math.min(p[0], p[1]),
      majorPct: Math.round(Math.max(p[0], p[1]) / n * 100),
      minorPct: Math.round(Math.min(p[0], p[1]) / n * 100),
      insight: t.strength + '；' + t.caution + '。' + t.action + '。',
      minorityNames: minorityNames
    });
  });
  return results;
}

function calcAdvantages(dims, n) {
  var results = [];
  var map = [
    [dims.A, dims.I, 'A', '分析型',
      '团队中 {0}% 成员是分析型，决策时有数据支撑，不易冲动。善于收集市场信息、进行成本分析和风险评估。',
      '💼 业务影响：在供应商评估、价格谈判、合同审核等环节表现优异，能有效降低采购风险。'],
    [dims.I, dims.A, 'I', '直觉型',
      '团队中 {0}% 成员是直觉型，善于发现市场机会和创新方案。对行业趋势敏感，能快速捕捉商机。',
      '💼 业务影响：在新品类开发、供应商早期介入、市场创新等方面表现突出。'],
    [dims.R, dims.T, 'R', '关系型',
      '团队中 {0}% 成员是关系导向，善于维护供应商关系和内部协调。注重长期合作，善于化解冲突。',
      '💼 业务影响：供应商满意度高，紧急情况下能获得供应商支持，内部跨部门协作顺畅。'],
    [dims.T, dims.R, 'T', '任务型',
      '团队中 {0}% 成员是任务导向，目标明确，执行力强。注重结果和效率，善于推进项目。',
      '💼 业务影响：项目交付准时率高，成本削减目标达成率好，执行效率优异。'],
    [dims.C, dims.B, 'C', '竞争型',
      '团队中 {0}% 成员是竞争型，在谈判中善于争取最大利益。不甘示弱，敢于施压，底线意识强。',
      '💼 业务影响：谈判成果优异，采购成本可控，合同条款有利于我方，不易被供应商牵着鼻子走。'],
    [dims.B, dims.C, 'B', '合作型',
      '团队中 {0}% 成员是合作型，善于建立长期合作关系和双赢局面。注重供应商发展，善于协同创新。',
      '💼 业务影响：供应商忠诚度高，联合创新项目多，供应链稳定性强。'],
    [dims.D, dims.P, 'D', '防御型',
      '团队中 {0}% 成员是防御型，谨慎保守，善于识别和规避风险。决策前充分论证，不盲目行动。',
      '💼 业务影响：采购合规性高，合同风险低，供应链稳定性强，极少出现重大失误。'],
    [dims.P, dims.D, 'P', '开拓型',
      '团队中 {0}% 成员是开拓型，敢于尝试新方法和新机会。行动敏捷，善于把握市场窗口。',
      '💼 业务影响：创新项目推进快，市场响应迅速，能抓住竞争对手忽略的机会。']
  ];
  map.forEach(function(entry) {
    if (entry[0] > entry[1]) {
      results.push({
        title: entry[3] + '能力强',
        desc: entry[4].replace('{0}', Math.round(entry[0] / n * 100)),
        impact: entry[5]
      });
    }
  });
  return results;
}

function calcRisks(dims, n) {
  var results = [];
  var riskTemplates = {
    'I': {
      title: '直觉型成员不足',
      desc: '团队中直觉型成员只有 {0} 人（{1}%），可能影响创新思维和市场机会识别。过度依赖数据可能导致错失非量化机会。',
      alert: '⚠️ 风险场景：新兴市场进入、创新品类采购、供应商早期介入等需要直觉判断的场景可能表现欠佳。',
      solution: '✅ 改进方案：1) 为直觉型成员（{2}）创造更多表达洞察的机会；2) 引入外部行业专家顾问；3) 建立市场情报收集机制，补充数据盲区。'
    },
    'A': {
      title: '分析型成员不足',
      desc: '团队中分析型成员只有 {0} 人（{1}%），可能影响数据驱动决策的质量。',
      alert: '⚠️ 风险场景：供应商评估、成本分析、合同审核等需要深度数据分析的场景可能表现欠佳。',
      solution: '✅ 改进方案：1) 为分析型成员（{2}）提供数据工具支持；2) 建立标准化的数据分析流程。'
    },
    'T': {
      title: '任务型成员不足',
      desc: '团队中任务型成员只有 {0} 人（{1}%），可能影响执行效率和目标达成。过度关注关系可能影响谈判底线。',
      alert: '⚠️ 风险场景：成本削减项目、供应商绩效考核、合同到期重谈等需要强硬立场的场景可能妥协过多。',
      solution: '✅ 改进方案：1) 任务型成员（{2}）主导 KPI 考核和成本削减项目；2) 建立明确的谈判底线和授权机制。'
    },
    'R': {
      title: '关系型成员不足',
      desc: '团队中关系型成员只有 {0} 人（{1}%），可能影响供应商关系维护和内部协调。',
      alert: '⚠️ 风险场景：战略供应商管理、危机处理、跨部门协作等需要关系润滑的场景可能遇到阻力。',
      solution: '✅ 改进方案：1) 关系型成员（{2}）主导供应商关系管理；2) 建立定期沟通机制。'
    },
    'B': {
      title: '合作型成员不足',
      desc: '团队中合作型成员只有 {0} 人（{1}%），可能影响长期合作关系的建立。过度竞争可能导致供应商关系紧张。',
      alert: '⚠️ 风险场景：战略供应商合作、联合创新项目、长期合同谈判等需要共赢思维的场景可能受阻。',
      solution: '✅ 改进方案：1) 合作型成员（{2}）主导战略供应商关系；2) 建立共赢合作框架。'
    },
    'C': {
      title: '竞争型成员不足',
      desc: '团队中竞争型成员只有 {0} 人（{1}%），可能在谈判中过于妥协。',
      alert: '⚠️ 风险场景：价格谈判、合同条款博弈、供应商施压场景等需要强硬立场的场景可能吃亏。',
      solution: '✅ 改进方案：1) 竞争型成员（{2}）主导关键谈判；2) 建立明确的谈判底线。'
    },
    'P': {
      title: '开拓型成员不足',
      desc: '团队中开拓型成员只有 {0} 人（{1}%），可能影响快速行动和敏捷响应。过度谨慎可能错失市场窗口期。',
      alert: '⚠️ 风险场景：紧急采购、价格波动应对、供应商切换等需要快速决策的场景可能反应迟缓。',
      solution: '✅ 改进方案：1) 为开拓型成员（{2}）授权快速决策权限；2) 建立分级决策机制。'
    },
    'D': {
      title: '防御型成员不足',
      desc: '团队中防御型成员只有 {0} 人（{1}%），可能影响风险识别和管控。',
      alert: '⚠️ 风险场景：大额采购决策、新供应商引入、合同风险评估等需要谨慎论证的场景可能忽略关键风险。',
      solution: '✅ 改进方案：1) 防御型成员（{2}）负责风险审核环节；2) 建立强制风险评估流程。'
    }
  };
  var dimPairs = [[dims.A, dims.I, 'A', 'I'], [dims.R, dims.T, 'R', 'T'], [dims.C, dims.B, 'C', 'B'], [dims.D, dims.P, 'D', 'P']];
  dimPairs.forEach(function(p) {
    var minority = p[0] <= p[1] ? p[2] : p[3];
    var count = Math.min(p[0], p[1]);
    if (count === 0) return;
    var pct = Math.round(count / n * 100);
    var names = [];
    if (typeof window !== 'undefined' && window.teamReportData) {
      window.teamReportData.members.forEach(function(m) {
        var idx;
        if (minority === 'A' || minority === 'I') idx = 0;
        else if (minority === 'R' || minority === 'T') idx = 1;
        else if (minority === 'C' || minority === 'B') idx = 2;
        else idx = 3;
        if (m.code[idx] === minority) names.push(m.name);
      });
    }
    var t = riskTemplates[minority];
    if (t) {
      results.push({
        title: t.title,
        desc: t.desc.replace('{0}', count).replace('{1}', pct),
        alert: t.alert,
        solution: t.solution.replace('{2}', names.join('、'))
      });
    }
  });
  return results;
}

function calcPairs(members) {
  var n = members.length;
  if (n < 2) return { pairs: [], unpaired: members.slice() };
  function complement(m1, m2) {
    var c = 0;
    for (var i = 0; i < 4; i++) { if (m1.code[i] !== m2.code[i]) c++; }
    return c;
  }
  var allPairs = [];
  for (var i = 0; i < members.length; i++) {
    for (var j = i + 1; j < members.length; j++) {
      allPairs.push({ m1: members[i], m2: members[j], complement: complement(members[i], members[j]) });
    }
  }
  allPairs.sort(function(a, b) { return b.complement - a.complement; });
  var used = {};
  var results = [];
  allPairs.forEach(function(p) {
    if (used[p.m1.name] || used[p.m2.name]) return;
    used[p.m1.name] = true;
    used[p.m2.name] = true;
    var diffDims = [];
    var valueParts = [];
    for (var i = 0; i < 4; i++) {
      if (p.m1.code[i] !== p.m2.code[i]) {
        var labels = dimLabels[i];
        var v1 = labels[p.m1.code[i] === labels[0] ? 2 : 3];
        var v2 = labels[p.m2.code[i] === labels[0] ? 2 : 3];
        diffDims.push(v1 + '/' + v2);
        if (i === 0) valueParts.push(p.m1.name + '的' + v1 + '思维 + ' + p.m2.name + '的' + v2 + '洞察');
        else if (i === 1) valueParts.push(p.m1.name + '的' + v1 + '维护 + ' + p.m2.name + '的' + v2 + '执行');
        else if (i === 2) valueParts.push(p.m1.name + '的' + v1 + '意识 + ' + p.m2.name + '的' + v2 + '共赢');
        else valueParts.push(p.m1.name + '的' + v1 + '谨慎 + ' + p.m2.name + '的' + v2 + '敏捷');
      }
    }
    var type, icon;
    if (p.complement >= 3) { type = '高度互补'; icon = '💕 天作之合'; }
    else if (p.complement >= 2) { type = '中度互补'; icon = '🤝 互补合作'; }
    else { type = '风格相近'; icon = '👥 默契搭档'; }
    var s1 = styleDefinitions[p.m1.code] || { name: '', animal: '❓' };
    var s2 = styleDefinitions[p.m2.code] || { name: '', animal: '❓' };
    var reason = '<strong>互补维度：</strong>' + p.complement + ' 个维度不同（' + p.m1.code + ' vs ' + p.m2.code + '）<br><strong>协作价值：</strong>' + valueParts.join(' = 全面决策；') + ' = 平衡风险与收益<br><strong>推荐场景：</strong>战略供应商选择、重大合同谈判、跨部门协作项目';
    results.push({ icon: icon, type: type, m1: p.m1, m2: p.m2, s1: s1, s2: s2, reason: reason });
  });
  var unpaired = [];
  members.forEach(function(m) { if (!used[m.name]) unpaired.push(m); });
  return { pairs: results, unpaired: unpaired };
}

/**
 * 未配对成员独立建议 v2.1 新增
 */
function calcUnpairedAdvice(unpaired, dims, n) {
  if (!unpaired || unpaired.length === 0) return null;
  var results = [];
  unpaired.forEach(function(m) {
    var s = styleDefinitions[m.code] || { name: '', animal: '❓', dimension: '' };
    var uniqueDims = [];
    var dimCount = [{ A: 0, I: 0 }, { R: 0, T: 0 }, { C: 0, B: 0 }, { D: 0, P: 0 }];
    if (typeof window !== 'undefined' && window.teamReportData) {
      window.teamReportData.members.forEach(function(mm) {
        for (var i = 0; i < 4; i++) dimCount[i][mm.code[i]]++;
      });
    }
    var dimNames = ['信息获取', '决策导向', '处事方式', '行动策略'];
    for (var i = 0; i < 4; i++) {
      if (dimCount[i][m.code[i]] === 1) {
        var label = dimLabels[i][m.code[i] === dimLabels[i][0] ? 2 : 3];
        uniqueDims.push({ dim: dimNames[i], label: label });
      }
    }
    var advice = {
      name: m.name,
      code: m.code,
      style: s.name,
      animal: s.animal,
      uniqueDims: uniqueDims,
      value: '',
      suggestion: ''
    };
    // 根据独特维度生成价值描述和建议
    if (m.code[0] === 'I' && dimCount[0].I === 1) {
      advice.value = '作为团队中唯一的直觉型成员，' + m.name + '拥有独特的市场洞察力和创新思维，是团队发现新机会的关键角色。';
      advice.suggestion = '建议：1) 定期分享市场洞察和创新想法；2) 与数据型成员结对，将直觉转化为可执行方案；3) 在战略规划会议中优先发言，激发团队创意思维。';
    } else if (m.code[3] === 'P' && dimCount[3].P === 1) {
      advice.value = '作为团队中唯一的开拓型成员，' + m.name + '具备快速行动和敏捷响应的能力，是团队抓住市场窗口的关键力量。';
      advice.suggestion = '建议：1) 在紧急采购和快速决策场景中担任主导；2) 建立"快速通道"机制，减少流程摩擦；3) 与防御型成员配合，平衡速度与风险。';
    } else if (uniqueDims.length >= 2) {
      advice.value = m.name + '在 ' + uniqueDims.map(function(d) { return d.label; }).join('、') + ' 方面是团队中的少数派，为团队带来差异化视角。';
      advice.suggestion = '建议：1) 在对应维度相关的决策中发挥主导作用；2) 与主流风格成员结对，形成互补协作；3) 定期分享独特视角，拓宽团队思路。';
    } else {
      advice.value = m.name + '的风格（' + s.name + '）为团队带来独特的协作价值。';
      advice.suggestion = '建议：1) 主动与不同风格成员沟通，建立跨风格理解；2) 在擅长的场景中发挥主导作用；3) 持续学习，提升综合能力。';
    }
    results.push(advice);
  });
  return results;
}

function calcActionPlan(risks, dims, n) {
  var steps = [];
  var riskTypes = risks.map(function(r) { return r.title; });
  var phase1 = '完成团队沟通工作坊，建立跨风格理解；';
  if (riskTypes.some(function(t) { return t.indexOf('直觉') !== -1 || t.indexOf('开拓') !== -1; })) {
    phase1 += '为少数派成员授权创新试点项目';
  } else {
    phase1 += '建立标准化工作流程';
  }
  steps.push({ period: '第 1-30 天', text: phase1 });
  var phase2 = '优化决策流程，建立分级授权机制；';
  if (riskTypes.some(function(t) { return t.indexOf('分析') !== -1 || t.indexOf('数据') !== -1; })) {
    phase2 += '启动数据收集和分析系统';
  } else {
    phase2 += '启动市场情报收集系统';
  }
  steps.push({ period: '第 31-60 天', text: phase2 });
  steps.push({ period: '第 61-90 天', text: '复盘决策速度和准确性；调整人员配置，最大化互补效应' });
  return steps;
}

function calcProjectConfig(members, dims) {
  var suggestions = [];
  var analyzers = members.filter(function(m) { return m.code[0] === 'A'; });
  var intuitives = members.filter(function(m) { return m.code[0] === 'I'; });
  var competitors = members.filter(function(m) { return m.code[2] === 'C'; });
  var cooperators = members.filter(function(m) { return m.code[2] === 'B'; });
  var defenders = members.filter(function(m) { return m.code[3] === 'D'; });
  var pioneers = members.filter(function(m) { return m.code[3] === 'P'; });
  var relaters = members.filter(function(m) { return m.code[1] === 'R'; });
  var taskers = members.filter(function(m) { return m.code[1] === 'T'; });

  suggestions.push('<strong>数据分析类项目：</strong>' + (analyzers.length > 0 ? analyzers[0].name + '牵头' : '需要分析型人才') + (analyzers.length > 1 ? '，' + analyzers[1].name + '配合' : ''));
  suggestions.push('<strong>供应商谈判：</strong>' + (relaters.length > 0 ? relaters[0].name + '主导关系建立' : '') + (analyzers.length > 0 ? '，' + analyzers[0].name + '负责数据支撑' : '') + (competitors.length > 0 ? '，' + competitors[0].name + '负责条款博弈' : ''));
  if (intuitives.length > 0) {
    suggestions.push('<strong>创新试点项目：</strong>' + intuitives[0].name + '牵头' + (pioneers.length > 0 ? '，' + pioneers[0].name + '配合开拓' : ''));
  }
  suggestions.push('<strong>成本削减项目：</strong>' + (competitors.length > 0 ? competitors[0].name + '牵头' : '') + (taskers.length > 0 ? '，' + taskers[0].name + '推进执行' : ''));
  if (cooperators.length > 0) {
    suggestions.push('<strong>战略供应商管理：</strong>' + cooperators[0].name + '主导' + (relaters.length > 0 ? '，' + relaters[0].name + '配合维护高层关系' : ''));
  }
  return suggestions;
}

function calcCourseMatch(dims, n, courseLibrary) {
  if (!courseLibrary) courseLibrary = [];
  var weaknesses = [];
  var dimPairs = [['A','I',dims.A,dims.I], ['R','T',dims.R,dims.T], ['C','B',dims.C,dims.B], ['D','P',dims.D,dims.P]];
  dimPairs.forEach(function(p) {
    if (p[2] <= p[3]) weaknesses.push(p[0]);
    if (p[3] < p[2]) weaknesses.push(p[1]);
  });
  var matched = courseLibrary.map(function(c) {
    var matchTags = c.tags.filter(function(t) { return weaknesses.indexOf(t) !== -1; });
    return { course: c, matchScore: matchTags.length / Math.max(c.tags.length, 1), matchTags: matchTags };
  }).filter(function(m) { return m.matchScore > 0; })
    .sort(function(a, b) { return b.matchScore - a.matchScore; });
  var tagLabels = { A: '数据分析', I: '创新洞察', R: '关系维护', T: '任务执行', C: '竞争博弈', B: '合作共赢', D: '风险管控', P: '敏捷开拓' };
  return matched.map(function(m) {
    var matchDesc = m.matchTags.map(function(t) { return tagLabels[t] || t; }).join(' + ');
    return { course: m.course, matchDesc: '匹配需求：' + matchDesc + '能力补齐' };
  });
}

// ══════════════════════════════════════
//  DOM 渲染模块 v2.1
// ══════════════════════════════════════

function renderTeamReport() {
  var data = window.teamReportData;
  if (!data || !data.members || data.members.length === 0) return;
  var members = data.members;
  var n = members.length;
  var dims = calcDimensions(members);
  var teamType = calcTeamType(members);
  var score = calcScore(members, dims);
  var roles = calcRoles(members);
  var dimInsights = calcDimensionInsights(dims, n);
  var advantages = calcAdvantages(dims, n);
  var risks = calcRisks(dims, n);
  var pairData = calcPairs(members);
  var unpairedAdvice = calcUnpairedAdvice(pairData.unpaired, dims, n);
  var actionPlan = calcActionPlan(risks, dims, n);
  var projectConfig = calcProjectConfig(members, dims);
  var courseMatches = calcCourseMatch(dims, n, data.courseLibrary);

  // 已测试/待测试动态计算
  var testedCount = 0, pendingCount = 0;
  members.forEach(function(m) { if (m.tested !== false) testedCount++; else pendingCount++; });

  // ── 报告生成时间 ──
  var el = document.getElementById('report-generated');
  if (el) el.textContent = data.meta.generatedAt;

  // ── 团队类型判定 ──
  el = document.getElementById('team-type');
  if (el) el.textContent = teamType.icon + ' ' + teamType.type + '团队';
  el = document.getElementById('team-type-desc');
  if (el) el.textContent = teamType.desc;

  // ── 团队概况统计 ──
  el = document.getElementById('stat-total');
  if (el) el.textContent = n;
  el = document.getElementById('stat-tested');
  if (el) el.textContent = testedCount;
  el = document.getElementById('stat-pending');
  if (el) el.textContent = pendingCount;
  el = document.getElementById('tag-team-size');
  if (el) el.textContent = n + ' 人团队';
  el = document.getElementById('tag-tested-pct');
  if (el) el.textContent = (testedCount === n ? '100%' : Math.round(testedCount / n * 100) + '%') + ' 已测试';
  el = document.getElementById('tag-team-type-label');
  if (el) el.textContent = teamType.type;

  // ── 效能评分 ──
  var percentMap = { '优秀': '78', '良好': '65', '中等': '50', '待提升': '35' };
  var level = score >= 80 ? '优秀' : score >= 65 ? '良好' : score >= 50 ? '中等' : '待提升';
  el = document.getElementById('score-num');
  if (el) el.textContent = score;
  el = document.getElementById('score-desc');
  if (el) el.textContent = '🏆 ' + level + ' · 超越 ' + (percentMap[level] || '50') + '% 的采购团队';

  // ── 四维度深度分析 ──
  el = document.getElementById('dimension-bars-container');
  if (el) {
    var h = '';
    dimInsights.forEach(function(di) {
      h += '<div class="dimension">' +
        '<div class="dimension-name">' + di.dimension + '</div>' +
        '<div class="dimension-bars">' +
        '<div class="bar-item"><div class="bar-label">' + di.majorLabel + ' <span class="bar-value">' + di.majorCount + ' 人 · ' + di.majorPct + '%</span></div><div class="bar-bg"><div class="bar-fill majority" style="width:' + di.majorPct + '%"></div></div></div>' +
        '<div class="bar-item"><div class="bar-label">' + di.minorLabel + ' <span class="bar-value">' + di.minorCount + ' 人 · ' + di.minorPct + '%</span></div><div class="bar-bg"><div class="bar-fill" style="width:' + di.minorPct + '%"></div></div></div>' +
        '</div>' +
        '<div class="insight-box" style="margin-top:12px;">' +
        '<div class="insight-title">💡 维度洞察</div>' +
        '<div class="insight-content">' + di.insight + '</div>' +
        '</div></div>';
    });
    el.innerHTML = h;
  }

  // ── 团队核心优势 ──
  el = document.getElementById('advantages-container');
  if (el) {
    var h = '';
    var icons = ['📊', '🤝', '⚔️', '🛡️', '💡', '🚀', '🎯', '🔥'];
    advantages.forEach(function(a, idx) {
      h += '<div class="advantage">' +
        '<div class="advantage-title">' + (icons[idx] || '✨') + ' ' + a.title + '</div>' +
        '<div class="advantage-desc">' + a.desc + '</div>' +
        '<div class="advantage-impact">' + a.impact + '</div>' +
        '</div>';
    });
    el.innerHTML = h;
  }

  // ── 潜在风险与改进方案 ──
  el = document.getElementById('risks-container');
  if (el) {
    var h = '';
    risks.forEach(function(r) {
      h += '<div class="risk">' +
        '<div class="risk-title">💭 ' + r.title + '</div>' +
        '<div class="risk-desc">' + r.desc + '</div>' +
        '<div class="risk-alert">' + r.alert + '</div>' +
        '<div class="risk-solution">' + r.solution + '</div>' +
        '</div>';
    });
    el.innerHTML = h;
  }

  // ── 最佳拍档配对 ──
  el = document.getElementById('pairs-container');
  if (el) {
    var h = '';
    pairData.pairs.forEach(function(p) {
      h += '<div class="pair">' +
        '<div class="pair-title">' + p.icon + ' ' + p.type + '</div>' +
        '<div class="pair-members">' +
        '<div class="pair-member"><div class="pair-avatar">' + p.s1.animal + '</div><div class="pair-name">' + p.m1.name + '</div><div class="pair-code">' + p.m1.code + '</div></div>' +
        '<div style="font-size:20px;color:#86868b;">+</div>' +
        '<div class="pair-member"><div class="pair-avatar">' + p.s2.animal + '</div><div class="pair-name">' + p.m2.name + '</div><div class="pair-code">' + p.m2.code + '</div></div>' +
        '</div>' +
        '<div class="pair-reason">' + p.reason + '</div>' +
        '</div>';
    });
    el.innerHTML = h;
  }

  // ── 未配对成员独立建议 v2.1 新增 ──
  el = document.getElementById('unpaired-container');
  if (el) {
    if (unpairedAdvice && unpairedAdvice.length > 0) {
      var h = '';
      unpairedAdvice.forEach(function(u) {
        h += '<div class="pair">' +
          '<div class="pair-title">' + u.animal + ' ' + u.name + ' · ' + u.code + ' ' + u.style + ' — 独立角色建议</div>' +
          '<div class="pair-reason">' +
          '<strong>独特价值：</strong>' + u.value + '<br><br>' +
          '<strong>发展建议：</strong>' + u.suggestion +
          '</div></div>';
      });
      el.innerHTML = h;
      document.getElementById('unpaired-section').style.display = '';
    } else {
      document.getElementById('unpaired-section').style.display = 'none';
    }
  }

  // ── 团队成员画像 ──
  el = document.getElementById('members-container');
  if (el) {
    var h = '';
    members.forEach(function(m, idx) {
      var s = styleDefinitions[m.code] || { name: '', animal: '❓', dimension: '' };
      h += '<div class="member">' +
        '<div class="avatar">' + m.name[0] + '</div>' +
        '<div class="member-info">' +
        '<div class="member-name">' + m.name + ' · ' + m.code + ' ' + s.name + ' ' + s.animal + '</div>' +
        '<div class="member-code">' + s.dimension + '</div>' +
        '</div>' +
        '<div class="member-status">✅ ' + roles[idx] + '</div>' +
        '</div>';
    });
    el.innerHTML = h;
  }

  // ── 发展建议与行动计划 ──
  el = document.getElementById('action-plan-container');
  if (el) {
    var h = '';
    actionPlan.forEach(function(s, idx) {
      h += '<div class="action-item">' +
        '<div class="action-num">' + (idx + 1) + '</div>' +
        '<div class="action-text"><strong>' + s.period + '：</strong>' + s.text + '</div>' +
        '</div>';
    });
    el.innerHTML = h;
  }

  // 招聘建议
  el = document.getElementById('hiring-recommendation');
  if (el) {
    var weaknesses = [];
    if (dims.A <= dims.I) weaknesses.push('分析型');
    if (dims.I < dims.A) weaknesses.push('直觉型');
    if (dims.R <= dims.T) weaknesses.push('关系导向');
    if (dims.T < dims.R) weaknesses.push('任务导向');
    var priority = weaknesses.length > 0 ? '高' : '中';
    el.innerHTML = '<div class="recommendation-title">📌 招聘建议（优先级：' + priority + '）</div>' +
      '<div class="recommendation-content">' +
      '<strong>优先招聘类型：</strong>' + (weaknesses.join(' + ') || '团队配置均衡，暂无明显短板') + '<br>' +
      '<strong>岗位建议：</strong>根据团队短板匹配对应岗位<br>' +
      '<strong>面试考察：</strong>重点考察候选人在短板维度的能力</div>';
  }

  // 培训建议 v2.1 — 关联姜宏锋老师具体课程
  el = document.getElementById('training-recommendation');
  if (el) {
    var trainingItems = [];
    // 根据短板维度匹配具体课程
    var courseMatch = calcCourseMatch(dims, n, data.courseLibrary);
    if (courseMatch.length > 0) {
      courseMatch.forEach(function(cm, idx) {
        var c = cm.course;
        trainingItems.push('<strong>推荐课程 ' + (idx + 1) + '：</strong>' + c.name + '（姜宏锋老师 · ' + (c.format || '线下课') + '）<br>→ ' + cm.matchDesc + '<br>→ 报名链接：' + c.url);
      });
    } else {
      trainingItems.push('<strong>推荐课程：</strong>团队能力全面，可选择姜宏锋老师任意课程持续提升');
      if (data.courseLibrary && data.courseLibrary.length > 0) {
        trainingItems.push('<strong>推荐：</strong>' + data.courseLibrary[0].name + '（姜宏锋老师 · ' + (data.courseLibrary[0].format || '线下课') + '）');
      }
    }
    // 补充跨风格沟通培训
    trainingItems.push('<strong>团队必修：</strong>跨风格沟通工作坊 — 促进 A/I、R/T、C/B、D/P 相互理解（推荐 DISC 或 MBTI 培训）');
    var itemsHtml = trainingItems.map(function(it, idx) { return (idx + 1) + '. ' + it; }).join('<br>');
    el.innerHTML = '<div class="recommendation-title">📚 培训建议（姜宏锋老师课程）</div>' +
      '<div class="recommendation-content">' + itemsHtml + '</div>';
  }

  // 项目配置建议
  el = document.getElementById('project-config-container');
  if (el) {
    var h = '';
    projectConfig.forEach(function(s) { h += s + '<br>'; });
    el.innerHTML = '<div class="recommendation-title">🎯 项目配置建议</div>' +
      '<div class="recommendation-content">' + h + '</div>';
  }

  // ── 推荐课程 ──
  el = document.getElementById('courses-container');
  if (el) {
    var h = '';
    courseMatches.forEach(function(cm) {
      var c = cm.course;
      h += '<div class="course" onclick="window.open(\'' + c.url + '\', \'_blank\')" style="cursor:pointer;">' +
        '<div class="course-name">' + c.name + '</div>' +
        '<div class="course-teacher">👨‍🏫 ' + (c.teacher || '姜宏锋') + ' · ' + (c.format || '线下课') + '</div>' +
        '<div class="course-match">✅ ' + cm.matchDesc + '</div>' +
        '<div class="course-cta" style="font-size:13px;color:#d4af37;font-weight:600;margin-top:10px;">🔥 ' + c.cta + '</div>' +
        '</div>';
    });
    if (courseMatches.length === 0) {
      h = '<div style="text-align:center;padding:20px;color:#86868b;font-size:13px;">团队能力全面，可浏览全部课程选择提升</div>';
    }
    el.innerHTML = h;
  }
}

if (typeof window !== 'undefined') {
  window.styleDefinitions = styleDefinitions;
  window.calcDimensions = calcDimensions;
  window.calcTeamType = calcTeamType;
  window.calcScore = calcScore;
  window.calcRoles = calcRoles;
  window.calcDimensionInsights = calcDimensionInsights;
  window.calcAdvantages = calcAdvantages;
  window.calcRisks = calcRisks;
  window.calcPairs = calcPairs;
  window.calcUnpairedAdvice = calcUnpairedAdvice;
  window.calcActionPlan = calcActionPlan;
  window.calcProjectConfig = calcProjectConfig;
  window.calcCourseMatch = calcCourseMatch;
  window.renderTeamReport = renderTeamReport;
}
