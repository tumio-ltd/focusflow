# 销售网络拓扑与佣金结算体系 · FocusFlow Interactive Showcase

本工程基于 `temp/sales_fee` 原始业务截图制作，采用 FocusFlow **全景画板流（Unified Storyboard Canvas）** 方案，将 PC 管理端 5 大核心功能与移动端 3 大裂变触点排布在 5K 高清交互大画板中。

## 业务链路概览

1. **B端 · 销售网络组织架构 (Hierarchy)**：团队长/代理商/分销层级树
2. **B端 · 归属关系调整 (Relation Binding)**：防作弊与归属锁定机制
3. **B端 · 分佣政策管理 (Policy Matrix)**：多维度阶梯政策配置
4. **B端 · 规则引擎弹窗 (Rule Engine)**：分润比例、核销账期与封顶控制
5. **C端 · 推客奖励中心 (Reward Center)**：推客移动端钱包与收益数据
6. **C端 · 社交裂变邀请 (Invite Sheet)**：微信生态多渠道一键触达
7. **C端 · 专属裂变海报 (Referral Poster)**：带参二维码与扫码锁粉
8. **B端 · 费用与佣金结算 (Fee & Settlement)**：订单发生、佣金计算与对账流水
9. **闭环监控 (Telemetry)**：18,500 TPS 实时分账与全链路运营监控

## 运行与导出

```bash
# 本地预览 (Vite)
pnpm dev

# 一键导出 Standalone 单文件 HTML (0 依赖，离线秒开)
node scripts/build-standalone.js examples/sales-fee dist/sales-fee-standalone.html
```
