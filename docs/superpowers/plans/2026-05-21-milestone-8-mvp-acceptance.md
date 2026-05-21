# Milestone 8 MVP 闭环验收 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 验证并补齐酒店预订平台 MVP 主链路，确保商户录入、管理员审核发布、用户查询详情与基础预订在当前代码线上可完整运行。

**Architecture:** Milestone 8 不引入文档范围外的新功能，重点是基于现有 `apps/api`、`apps/mobile`、`apps/web` 代码做闭环串联、缺口修正和回归验证。实现优先顺序以“后端接口可靠、角色边界正确、前端主流程可走通、根级质量门禁通过”为主。

**Tech Stack:** Nest.js, Prisma, PostgreSQL, React 18, TypeScript, Tailwind CSS, pnpm workspace.

---

## Scope Notes

- 只实现 `docs/MILESTONES.md` 中 Milestone 8 的闭环验收范围。
- 不提前扩展支付、取消订单、退款、库存锁定、评价、收藏等非 MVP 功能。
- 用户端继续只展示已发布酒店。
- 商户只能管理自己创建的酒店。
- 管理员接口必须继续严格校验 `ADMIN` 角色。
- 前端 UI 如需调整，执行阶段需读取项目内 `.agents/skills/ele-ui`。

## File Structure

- Modify if backend acceptance gaps appear: `apps/api/src/**/*.ts`
- Modify if backend regression tests need补强: `apps/api/test/auth.e2e-spec.ts`
- Modify if backend regression tests need补强: `apps/api/test/merchant-management.e2e-spec.ts`
- Modify if backend regression tests need补强: `apps/api/test/admin-audit.e2e-spec.ts`
- Modify if backend regression tests need补强: `apps/api/test/public-hotels.e2e-spec.ts`
- Modify if backend regression tests need补强: `apps/api/test/bookings.e2e-spec.ts`
- Modify if mobile booking chain needs补齐: `apps/mobile/src/App.tsx`
- Modify if mobile booking chain needs补齐: `apps/mobile/src/components/MobileHotelSearch.tsx`
- Modify if mobile booking chain needs补齐: `apps/mobile/src/components/MobileHotelList.tsx`
- Modify if mobile booking chain needs补齐: `apps/mobile/src/components/MobileHotelDetail.tsx`
- Modify if mobile booking chain needs补齐: `apps/mobile/src/components/MobileBookingPanel.tsx`
- Modify if mobile auth chain needs补齐: `apps/mobile/src/components/MobileUserAuth.tsx`
- Modify if portal role boundary or入口提示 needs补齐: `apps/web/src/App.tsx`
- Modify if portal shell regression coverage needs补齐: `apps/web/src/App.spec.tsx`
- Verify-only references: `docs/SPEC.md`, `docs/MILESTONES.md`, `docs/API.md`, `AGENTS.md`

---

### Task 1: 锁定 Milestone 8 验收边界

**Files:**
- Read during execution: `docs/SPEC.md`
- Read during execution: `docs/MILESTONES.md`
- Read during execution: `docs/API.md`
- Read during execution: `AGENTS.md`

- [ ] 以文档为准确认 Milestone 8 是验收闭环，不是新增独立业务模块。
- [ ] 从已更新的本地 `dev` 创建专用 Milestone 8 分支后再开始实际代码修改。
- [ ] 列出必须走通的 7 条链路：商户创建酒店、商户维护房型、管理员审核通过、管理员发布、用户查询列表、用户查看详情、普通用户创建预订。
- [ ] 列出必须继续拦截的 4 类越权链路：游客不可预订、商户不可预订、管理员不可预订、非管理员不可调用审核接口。

### Task 2: 后端主链路回归与缺口补齐

**Files:**
- Modify if needed: `apps/api/src/**/*.ts`
- Modify if needed: `apps/api/test/merchant-management.e2e-spec.ts`
- Modify if needed: `apps/api/test/admin-audit.e2e-spec.ts`
- Modify if needed: `apps/api/test/public-hotels.e2e-spec.ts`
- Modify if needed: `apps/api/test/bookings.e2e-spec.ts`

- [ ] 先执行现有 API e2e，用现有测试确认商户、审核、公开酒店、预订四段主链路是否已联通。
- [ ] 如出现断点，只修 Milestone 8 验收所需缺口，不重做已有模块设计。
- [ ] 确认酒店状态流转仍然只允许文档定义的合法路径，尤其是 `PENDING_REVIEW -> APPROVED -> PUBLISHED -> OFFLINE -> PUBLISHED`。
- [ ] 确认公开接口始终只返回已发布酒店，未发布或已下线酒店不能出现在列表、详情、房型和预订入口。
- [ ] 确认预订写入仍由服务端计算总价，且只能由 `USER` 对已发布酒店下属于该酒店的房型创建。

### Task 3: 移动端用户预订闭环验收

**Files:**
- Modify if needed: `apps/mobile/src/App.tsx`
- Modify if needed: `apps/mobile/src/components/MobileHotelSearch.tsx`
- Modify if needed: `apps/mobile/src/components/MobileHotelList.tsx`
- Modify if needed: `apps/mobile/src/components/MobileHotelDetail.tsx`
- Modify if needed: `apps/mobile/src/components/MobileBookingPanel.tsx`
- Modify if needed: `apps/mobile/src/components/MobileUserAuth.tsx`

- [ ] 验证游客可以搜索、查看列表和详情，但不能直接提交预订。
- [ ] 验证普通用户注册、登录、恢复登录态、退出登录后，仍可继续走搜索到预订的完整流程。
- [ ] 验证详情页展示的日期、间夜数、房型与价格和后端返回一致。
- [ ] 验证预订成功、失败、参数不完整、酒店状态变化后的前端反馈明确且不伪造成功态。
- [ ] 如存在 UI 或状态断层，仅补齐当前闭环所需交互，不额外扩展账户中心、订单列表等后续功能。

### Task 4: PC 端角色边界与后台闭环验收

**Files:**
- Modify if needed: `apps/web/src/App.tsx`
- Modify if needed: `apps/web/src/App.spec.tsx`

- [ ] 验证商户登录后只进入酒店与房型管理后台，不混入用户搜索预订入口。
- [ ] 验证管理员登录后只进入审核发布后台，不混入商户录入能力。
- [ ] 验证普通用户在 PC 端只得到正确的移动端引导，不重新承载用户端页面。
- [ ] 如后台入口文案、跳转或角色壳层和当前代码不一致，只做边界修正和回归测试补强。

### Task 5: 根级质量门禁与人工验收

**Files:**
- All files changed in this milestone

- [ ] 尽量按 `AGENTS.md` 执行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- [ ] 至少分别执行一次 API、mobile、web 的定向验证，定位失败时优先修复 Milestone 8 主链路相关问题。
- [ ] 进行人工闭环验收：商户录入并提交酒店，管理员审核发布，用户查询并查看详情，普通用户完成基础预订。
- [ ] 进行人工反向验收：下线酒店不再出现在用户端，越权角色无法访问无权限接口或流程。
- [ ] 汇总剩余风险时只记录真实遗留问题，不把非 MVP 功能列为本里程碑待做项。

## Risks

- 当前仓库的里程碑计划目录同时存在 `docs/superpowers/plan` 与 `docs/superpowers/plans`，执行时需要保持新增产物路径一致，避免继续分叉。
- Milestone 8 依赖前 3 段主链路都已可用，任何一段接口边界漂移都会导致闭环失败。
- 根级 `pnpm test` 会覆盖前后端全部测试，若历史测试不稳定，需要先区分“存量问题”与“本里程碑回归”。

## Self-Review

- Spec coverage: 已覆盖商户录入、管理员审核发布、用户查询详情、普通用户预订、下线不可见、角色权限控制。
- Scope control: 未扩展支付、订单管理、收藏评价、库存等非 MVP 能力。
- File mapping: 计划锚定到现有 `apps/api`、`apps/mobile`、`apps/web` 和现有 e2e / shell 测试文件。
- Placeholder scan: 已给出执行边界、文件范围和验收任务；按要求未写具体代码。
