/**
 * team-report-data.js v2.1 — 团队报告原始数据源
 *
 * 职责：
 * - 团队成员（核心数据源：每人 4 字母谈判风格代码）
 * - 课程库（算法根据短板维度自动匹配）
 * - 成员 tested 状态用于动态计算已测试/待测试比例
 *
 * 所有结论内容（团队类型、角色定位、优势/风险、90 天行动计划、
 * 项目配置）均由算法动态推导，不在此硬编码。
 */

var teamReportData = {
  // ── 报告元信息 ──
  meta: {
    title: '团队配置报告',
    subtitle: '采购谈判基因 · 深度分析版',
    badge: '专业版报告',
    generatedAt: '2026-03-28'
  },

  // ── 团队成员（唯一核心数据源）──
  members: [
    { name: '张三', code: 'ARCD', tested: true },
    { name: '李四', code: 'ITCP', tested: true },
    { name: '王五', code: 'ARBP', tested: true },
    { name: '赵六', code: 'ATCD', tested: true },
    { name: '钱七', code: 'IRCD', tested: true }
  ],

  // ── 课程库（算法根据短板维度自动匹配）──
  courseLibrary: [
    { id: 5,  name: '《采购降本和双赢谈判+AI 应用》', teacher: '姜宏锋', format: '线下课', tags: ['A','C'], cta: '立即报名，提升谈判力 ›',     url: 'https://www.ailianruyi.com/#/product/detail?id=5' },
    { id: 4,  name: '《决胜供应链》',                   teacher: '姜宏锋', format: '线下课', tags: ['C','T'], cta: '立即报名，掌握谈判主动权 ›',   url: 'https://www.ailianruyi.com/#/product/detail?id=4' },
    { id: 8,  name: '《供应商管理》',                    teacher: '姜宏锋', format: '线下课', tags: ['R','B'], cta: '立即报名，构建供应商体系 ›',   url: 'https://www.ailianruyi.com/#/product/detail?id=8' },
    { id: 12, name: '《品类管理》',                      teacher: '姜宏锋', format: '线下课', tags: ['A','D'], cta: '立即报名，掌握品类策略 ›',     url: 'https://www.ailianruyi.com/#/product/detail?id=12' }
  ]
};

if (typeof window !== 'undefined') {
  window.teamReportData = teamReportData;
}
