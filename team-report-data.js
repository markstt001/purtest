/**
 * team-report-data.js v2.1 — 团队报告原始数据
 * 
 * 数据来源说明：
 * - members: 每个成员完成个人谈判风格测试后得到的 4 字母代码（如 ARCD）
 * - courseLibrary: 课程库，算法根据团队短板维度自动匹配
 * - score 不再在此硬编码，由算法从成员代码自动计算
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
  // 每个成员来自个人测试结果的 4 字母代码
  members: [
    { name: '张三', code: 'ARCD' },
    { name: '李四', code: 'ITCP' },
    { name: '王五', code: 'ARBP' },
    { name: '赵六', code: 'ATCD' },
    { name: '钱七', code: 'IRCD' }
  ],

  // ── 课程库（算法根据团队短板维度自动匹配）──
  courseLibrary: [
    { id: 5,  name: '《采购降本和双赢谈判+AI 应用》', tags: ['A','C'], cta: '立即报名，提升谈判力 ›',     url: 'https://www.ailianruyi.com/#/product/detail?id=5' },
    { id: 4,  name: '《决胜供应链》',                   tags: ['C','T'], cta: '立即报名，掌握谈判主动权 ›',   url: 'https://www.ailianruyi.com/#/product/detail?id=4' },
    { id: 8,  name: '《供应商管理》',                    tags: ['R','B'], cta: '立即报名，构建供应商体系 ›',   url: 'https://www.ailianruyi.com/#/product/detail?id=8' },
    { id: 12, name: '《品类管理》',                      tags: ['A','D'], cta: '立即报名，掌握品类策略 ›',     url: 'https://www.ailianruyi.com/#/product/detail?id=12' }
  ]
};

if (typeof window !== 'undefined') {
  window.teamReportData = teamReportData;
}
