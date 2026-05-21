# Milestone 6 用户端酒店查询和详情 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现用户端酒店查询页、酒店列表页和酒店详情页，且只展示已发布酒店。

**Architecture:** 后端继续复用现有 `hotels` 模块，对外补齐公开查询与详情接口，并把“只允许已发布酒店可见”收敛到服务层。前端在当前单页入口内新增用户端查询、列表、详情工作流，查询条件在页面状态中传递，不提前实现真实预订创建。

**Tech Stack:** Nest.js, TypeScript, Prisma, PostgreSQL, React 18, Tailwind CSS, Axios, Zustand.

---

## Scope Notes

- 只实现 `docs/MILESTONES.md` 中 Milestone 6。
- 只实现 `docs/API.md` 中用户端公开查询相关接口：`GET /hotels`、`GET /hotels/:id`、`GET /hotels/:hotelId/rooms`。
- 不提前实现 `POST /bookings`，不接入支付，不扩展地图、筛选标签、收藏、评价等能力。
- 用户端任何列表、详情、房型查询都只能看到 `PUBLISHED` 酒店；`OFFLINE`、`APPROVED`、`PENDING_REVIEW`、`REJECTED` 均不可见。
- 执行前端 UI 时需要读取项目内 `.agents/skills/ele-ui`，因为该里程碑包含查询页、列表页、详情页。

## File Structure

- Create: `apps/api/src/hotels/dto/public-hotel-query.dto.ts`
- Create: `apps/api/test/public-hotels.e2e-spec.ts`
- Modify: `apps/api/src/hotels/hotels.controller.ts`
- Modify: `apps/api/src/hotels/hotels.service.ts`
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/types/hotel.ts`
- Create: `apps/web/src/components/UserHotelSearch.tsx`
- Create: `apps/web/src/components/UserHotelList.tsx`
- Create: `apps/web/src/components/UserHotelDetail.tsx`
- Modify: `apps/web/src/App.tsx`
- Optional verify-only read touchpoints: `apps/api/prisma/schema.prisma`, `apps/web/src/store/auth-store.ts`, `apps/web/src/components/AdminHotelAuditManager.tsx`

---

### Task 1: 锁定公开查询边界

**Files:**
- Read during execution: `docs/SPEC.md`, `docs/MILESTONES.md`, `docs/API.md`, `apps/api/prisma/schema.prisma`

- [ ] 明确用户端查询字段仅包含 `city`、`keyword`、`checkInDate`、`checkOutDate`、`page`、`pageSize`。
- [ ] 明确列表项只返回名称、地址、星级、最低价格、图片或默认占位图，不提前混入商户端字段。
- [ ] 明确详情页必须返回酒店基础信息、设施、日期、间夜数、按价格升序排列的房型。
- [ ] 明确 Milestone 6 只保留“选择房型后的后续入口”，不真正创建预订记录。

### Task 2: 后端公开酒店接口测试

**Files:**
- Create: `apps/api/test/public-hotels.e2e-spec.ts`

- [ ] 为 `GET /hotels` 编写 e2e 用例，覆盖公开访问、条件过滤、分页参数和“只返回已发布酒店”。
- [ ] 为 `GET /hotels/:id` 编写 e2e 用例，覆盖已发布酒店可见、未发布或已下线酒店不可见。
- [ ] 为 `GET /hotels/:hotelId/rooms` 编写 e2e 用例，覆盖房型按价格升序返回，且仅允许查询已发布酒店。
- [ ] 覆盖最低价格取值逻辑，确认列表页价格来自酒店下房型的最低价，而不是硬编码字段。

### Task 3: 后端公开查询实现

**Files:**
- Create: `apps/api/src/hotels/dto/public-hotel-query.dto.ts`
- Modify: `apps/api/src/hotels/hotels.controller.ts`
- Modify: `apps/api/src/hotels/hotels.service.ts`

- [ ] 在 `hotels` 模块中补公开查询 DTO，统一解析分页、日期和关键字参数。
- [ ] 调整控制器权限边界：商户专用接口继续保留鉴权，公开列表、详情、房型接口单独开放。
- [ ] 实现酒店公开列表查询，只筛选 `PUBLISHED`，并返回最低价格、图片占位信息和当前页数据。
- [ ] 实现酒店公开详情查询，只允许查看 `PUBLISHED` 酒店，并返回日期区间、间夜数和设施信息。
- [ ] 实现公开房型查询，只允许查看 `PUBLISHED` 酒店房型，结果按价格从低到高排序。
- [ ] 保持统一响应格式 `{ code, message, data }`，错误处理风格与现有模块一致。

### Task 4: 前端用户端查询、列表、详情工作流

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/types/hotel.ts`
- Create: `apps/web/src/components/UserHotelSearch.tsx`
- Create: `apps/web/src/components/UserHotelList.tsx`
- Create: `apps/web/src/components/UserHotelDetail.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] 在前端新增用户端酒店类型和 API 封装，对接酒店列表、酒店详情、房型查询。
- [ ] 在 `App.tsx` 中为游客和普通用户接入用户端页面流，而不是继续停留在占位卡片。
- [ ] 新增查询页，支持城市或地点、关键字、入住日期、离店日期，并将条件带入列表视图。
- [ ] 新增列表页，展示当前查询条件、分页或加载更多入口、酒店基础卡片，以及进入详情页的操作。
- [ ] 新增详情页，展示酒店信息、日期、间夜数、房型与价格排序结果，并为 Milestone 7 预留清晰但不可提交的后续入口。
- [ ] 保持用户端移动优先，同时不破坏现有商户端和管理员端入口切换。

### Task 5: 联调与回归验证

**Files:**
- All files changed in this milestone

- [ ] 先跑 `apps/api/test/public-hotels.e2e-spec.ts`，确认公开查询主链路成立。
- [ ] 再跑 API 侧 `pnpm --filter @hotel/api test`、`typecheck`、`build`，确认新增公开接口没有破坏商户与管理员能力。
- [ ] 跑前端 `pnpm --filter @hotel/web typecheck`、`build`，确认用户端入口接入完成。
- [ ] 按 `AGENTS.md` 尽量执行根级 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- [ ] 手工验证至少五条链路：游客可查询、普通用户可查询、查询条件可进入列表、列表可进入详情、下线酒店不会出现在列表和详情中。

## Risks

- 现有 `hotels` 控制器是商户接口优先结构，执行时如果直接在类级别复用守卫，容易误把公开接口也锁成登录必需。
- 酒店最低价格依赖房型数据；若查询实现把最低价格计算散落在多个位置，后续 Milestone 7 很容易出现价格口径不一致。
- 当前前端入口仍是单页条件渲染，执行时要避免用户端、商户端、管理员端状态逻辑互相污染。

## Self-Review

- Spec coverage: 已覆盖查询页、列表页、详情页、公开接口边界、仅显示已发布酒店、详情房型升序。
- Scope control: 未扩展预订创建、支付、复杂筛选、收藏、评价和地图能力。
- File mapping: 计划文件路径与现有 `hotels` 模块、`web` 组件结构一致，可直接按任务落地。
- Placeholder scan: 已给出明确文件路径、任务边界和验证目标；按用户要求未写代码。
