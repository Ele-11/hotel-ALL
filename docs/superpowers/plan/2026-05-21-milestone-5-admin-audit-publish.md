# Milestone 5 管理员审核发布 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现管理员审核、驳回、发布、下线和恢复发布酒店的最小闭环，并保证用户端只看到已发布酒店。

**Architecture:** 后端新增独立的管理员审核模块，复用现有认证、角色守卫和 Prisma 数据模型，所有状态流转都围绕 `HotelStatus` 与 `rejectReason` 处理。前端在现有管理端入口上补管理员审核工作区，商户端继续负责录入，管理员端只做审核和状态切换，不直接编辑酒店内容。

**Tech Stack:** Nest.js, TypeScript, Prisma, PostgreSQL, React 18, Tailwind CSS, Axios, Zustand.

---

## Scope Notes

- 只实现 `docs/MILESTONES.md` 中 Milestone 5。
- 只实现 `docs/API.md` 中管理员审核相关接口：`GET /audit/hotels`、`PATCH /audit/hotels/:id/approve`、`PATCH /audit/hotels/:id/reject`、`PATCH /audit/hotels/:id/publish`、`PATCH /audit/hotels/:id/offline`。
- 不提前实现用户端酒店列表、酒店详情、预订流程。
- 管理员只能审核和切换状态，不能修改商户提交的酒店字段。
- 前端管理员页面属于管理端 UI，执行阶段需要读取项目内 `.agents/skills/ele-ui`。

## File Structure

- Create: `apps/api/src/audit/dto/audit-hotel-query.dto.ts`
- Create: `apps/api/src/audit/dto/reject-hotel.dto.ts`
- Create: `apps/api/src/audit/audit.controller.ts`
- Create: `apps/api/src/audit/audit.service.ts`
- Create: `apps/api/src/audit/audit.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/test/admin-audit.e2e-spec.ts`
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/types/admin.ts`
- Create: `apps/web/src/components/AdminHotelAuditManager.tsx`
- Modify: `apps/web/src/App.tsx`
- Optional verify-only read touchpoints: `apps/api/prisma/schema.prisma`, `apps/web/src/types/merchant.ts`

---

### Task 1: 明确状态流转与接口边界

**Files:**
- Modify: `docs/superpowers/plan/2026-05-21-milestone-5-admin-audit-publish.md`（若执行前需要补充边界）
- Read during execution: `apps/api/prisma/schema.prisma`, `docs/API.md`, `docs/SPEC.md`

- [ ] 确认允许的状态流转：`PENDING_REVIEW -> APPROVED`、`PENDING_REVIEW/APPROVED -> REJECTED`、`APPROVED/OFFLINE -> PUBLISHED`、`PUBLISHED -> OFFLINE`。
- [ ] 明确驳回时必须写入 `rejectReason`，审核通过和发布时清空旧的 `rejectReason`。
- [ ] 明确列表默认优先关注待审核酒店，同时保留按状态筛选能力，不额外扩展未定义字段。

### Task 2: 后端管理员审核接口测试

**Files:**
- Create: `apps/api/test/admin-audit.e2e-spec.ts`

- [ ] 为管理员审核列表、审核通过、驳回、发布、下线、恢复发布编写 e2e 用例。
- [ ] 覆盖管理员权限校验，验证 `USER` 和 `MERCHANT` 无法访问审核接口。
- [ ] 覆盖非法状态流转，例如未审核直接发布、未发布直接下线、驳回缺少原因。
- [ ] 覆盖“下线不删除数据”和“审核通过但未发布时用户端仍不可见”的后端约束。

### Task 3: 后端审核模块实现

**Files:**
- Create: `apps/api/src/audit/dto/audit-hotel-query.dto.ts`
- Create: `apps/api/src/audit/dto/reject-hotel.dto.ts`
- Create: `apps/api/src/audit/audit.controller.ts`
- Create: `apps/api/src/audit/audit.service.ts`
- Create: `apps/api/src/audit/audit.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] 新建 `AuditModule`，接入 `AuthGuard`、`RolesGuard` 和 `ADMIN` 角色限制。
- [ ] 实现审核酒店列表查询，返回酒店基础信息、商户 ID、状态、驳回原因，并支持状态筛选与分页参数。
- [ ] 实现审核通过接口，只允许从待审核进入审核通过。
- [ ] 实现驳回接口，要求原因必填，并记录到 `rejectReason`。
- [ ] 实现发布接口，只允许从审核通过或已下线进入已发布，并清理不应保留的驳回原因。
- [ ] 实现下线接口，只允许从已发布进入已下线，不删除酒店与房型数据。
- [ ] 保持统一响应格式 `{ code, message, data }` 与现有错误处理风格一致。

### Task 4: 前端管理员审核工作区设计

**Files:**
- Create: `apps/web/src/types/admin.ts`
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/components/AdminHotelAuditManager.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] 在前端新增管理员审核数据类型与 API 封装，对接审核列表、通过、驳回、发布、下线。
- [ ] 在 `App.tsx` 中为 `ADMIN` 角色接入独立管理页面，而不是继续停留在占位入口。
- [ ] 新增管理员审核工作区，至少包含状态筛选、酒店列表、酒店详情摘要、驳回原因输入、通过/驳回/发布/下线操作。
- [ ] 页面上明确区分“审核通过”和“已发布”，避免把审核与发布合并成一步。
- [ ] 保持管理端 PC 风格与现有商户后台一致，不引入用户端页面能力。

### Task 5: 联调与回归验证

**Files:**
- All files changed in this milestone

- [ ] 先跑 `apps/api/test/admin-audit.e2e-spec.ts`，确认管理员审核主流程通过。
- [ ] 再跑 API 侧 `pnpm --filter @hotel/api test`、`typecheck`、`build`，确认新增模块没有破坏现有商户能力。
- [ ] 跑前端 `pnpm --filter @hotel/web typecheck`、`build`，确认管理员入口集成完成。
- [ ] 按 `AGENTS.md` 尽量执行根级 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- [ ] 手工验证至少四条链路：待审核酒店通过后可发布、驳回必须填原因、已发布酒店可下线、已下线酒店可恢复发布。

## Risks

- 现有仓库还未落地用户端酒店查询接口，计划中的“用户端只展示已发布酒店”目前主要通过后端状态约束和后续里程碑衔接保证，执行时不要误扩 Milestone 6。
- 管理员页面与商户页面共用当前单页入口，执行时需要避免让 `MERCHANT`/`ADMIN` 视图逻辑互相污染。
- 状态流转如果缺少集中校验，后续容易出现接口间规则不一致，执行时应把状态判断收敛在审核服务层。

## Self-Review

- Spec coverage: 已覆盖待审核列表、审核通过、驳回并记录原因、发布、下线、恢复发布，以及管理员权限限制。
- Scope control: 未扩展酒店删除、批量操作、真实通知、用户端检索和预订。
- File mapping: 计划中的新增文件与现有 `hotels` / `rooms` / `auth` 结构保持同层级，便于按模块落地。
- Placeholder scan: 已给出明确文件路径、任务边界和验证目标；按用户要求未在计划中写具体代码。
