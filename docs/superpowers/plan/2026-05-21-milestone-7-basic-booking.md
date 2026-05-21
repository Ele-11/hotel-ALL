# Milestone 7 基础预订记录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让普通用户在移动端登录后，基于已发布酒店的房型创建基础预订记录。

**Architecture:** 后端新增独立 `bookings` 模块承接 `POST /bookings`，把“只允许 USER 创建自己的预订”“只允许预订已发布酒店房型”“总价由服务端计算”收敛到服务层。前端继续以 `apps/mobile` 作为用户端唯一入口，在现有搜索/列表/详情流上补普通用户登录与预订提交，不把预订能力回灌到 `apps/web` 后台。

**Tech Stack:** Nest.js, TypeScript, Prisma, PostgreSQL, React 18, Tailwind CSS, Axios.

---

## Scope Notes

- 只实现 `docs/MILESTONES.md` 中 Milestone 7。
- 只新增 `docs/API.md` 中 `POST /bookings`，不扩展订单列表、取消、退款、支付状态、库存锁定。
- 用户端预订入口只放在 `apps/mobile`；`apps/web` 继续作为商户/管理员后台。
- 不新增依赖；移动端登录态和预订表单使用现有 React + Axios 能力完成。
- 前端 UI 执行阶段需要读取项目内 `.agents/skills/ele-ui`，因为该里程碑包含移动端登录/预订界面。

## File Structure

- Create: `apps/api/src/bookings/bookings.module.ts`
- Create: `apps/api/src/bookings/bookings.controller.ts`
- Create: `apps/api/src/bookings/bookings.service.ts`
- Create: `apps/api/src/bookings/dto/create-booking.dto.ts`
- Create: `apps/api/test/bookings.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/mobile/src/lib/api.ts`
- Create: `apps/mobile/src/types/auth.ts`
- Create: `apps/mobile/src/types/booking.ts`
- Create: `apps/mobile/src/components/MobileUserAuth.tsx`
- Create: `apps/mobile/src/components/MobileBookingPanel.tsx`
- Modify: `apps/mobile/src/components/MobileHotelDetail.tsx`
- Modify: `apps/mobile/src/App.tsx`
- Verify-only read touchpoints: `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`, `apps/web/src/store/auth-store.ts`, `docs/superpowers/plan/2026-05-21-milestone-6-user-hotel-search-detail.md`

---

### Task 1: 锁定预订边界

**Files:**
- Read during execution: `docs/SPEC.md`, `docs/MILESTONES.md`, `docs/API.md`, `apps/api/prisma/schema.prisma`

- [ ] 明确预订记录只保存 `userId`、`hotelId`、`roomTypeId`、`checkInDate`、`checkOutDate`、`guestCount`、`totalPrice`，不新增支付或订单状态字段。
- [ ] 明确只有 `USER` 可调用 `POST /bookings`；游客、商户、管理员都不能创建预订。
- [ ] 明确总价只能由后端按房型价格和间夜数计算，前端只展示预估值，不作为可信写入来源。
- [ ] 明确只能预订 `PUBLISHED` 酒店下且确实属于该酒店的房型。

### Task 2: 后端预订接口测试与实现

**Files:**
- Create: `apps/api/src/bookings/bookings.module.ts`
- Create: `apps/api/src/bookings/bookings.controller.ts`
- Create: `apps/api/src/bookings/bookings.service.ts`
- Create: `apps/api/src/bookings/dto/create-booking.dto.ts`
- Create: `apps/api/test/bookings.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] 先补 `POST /bookings` e2e 用例，覆盖未登录拒绝、`USER` 可创建、`MERCHANT`/`ADMIN` 拒绝、总价计算正确。
- [ ] 覆盖关键校验：酒店未发布时报错、房型不属于酒店时报错、离店日期早于或等于入住日期时报错、入住人数非法时报错。
- [ ] 新增 `bookings` 模块并接入 `AppModule`，保持统一响应格式 `{ code, message, data }`。
- [ ] 在服务层完成预订创建：从 token 取当前用户，查询已发布酒店和对应房型，计算间夜数与总价，再落库返回结果。

### Task 3: 移动端普通用户登录入口

**Files:**
- Modify: `apps/mobile/src/lib/api.ts`
- Create: `apps/mobile/src/types/auth.ts`
- Create: `apps/mobile/src/components/MobileUserAuth.tsx`
- Modify: `apps/mobile/src/App.tsx`

- [ ] 在移动端补齐普通用户注册、登录、获取当前用户的 API 封装，并复用现有 token 存储约定，避免和后台鉴权口径分叉。
- [ ] 在 `App.tsx` 增加轻量用户会话状态与恢复逻辑，不引入 `zustand` 等新依赖。
- [ ] 新增仅面向 `USER` 的移动端认证入口；未登录用户仍可搜索和查看详情，但进入预订前必须先登录或注册普通用户账号。
- [ ] 保持商户和管理员不从移动端进入预订流，避免角色边界被打穿。

### Task 4: 移动端预订提交流

**Files:**
- Create: `apps/mobile/src/types/booking.ts`
- Create: `apps/mobile/src/components/MobileBookingPanel.tsx`
- Modify: `apps/mobile/src/components/MobileHotelDetail.tsx`
- Modify: `apps/mobile/src/App.tsx`

- [ ] 在酒店详情页把当前“Milestone 7 开放预订”占位按钮替换为真实入口，但仅对已登录普通用户开放提交。
- [ ] 新增预订面板，承接房型选择、入住人数输入、日期确认、间夜数与总价展示。
- [ ] 预订提交时调用 `POST /bookings`，成功后展示明确成功反馈；失败时展示接口错误，不伪造成功态。
- [ ] 未选择有效日期时禁止提交，避免前端放行不完整预订数据。

### Task 5: 回归验证

**Files:**
- All files changed in this milestone

- [ ] 跑 `pnpm --filter @hotel/api test -- bookings` 或等效 e2e 命令，先确认预订接口主链路成立。
- [ ] 跑 `pnpm --filter @hotel/api typecheck`、`build`，确认新增模块未破坏现有鉴权、酒店、审核流程。
- [ ] 跑 `pnpm --filter @hotel/mobile typecheck`、`build`，确认移动端登录与预订流可编译。
- [ ] 按 `AGENTS.md` 尽量执行根级 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- [ ] 手工验证至少六条链路：游客可浏览不可预订、普通用户可注册登录、普通用户可创建预订、商户不能创建预订、管理员不能创建预订、下线或未发布酒店不能被预订。

## Risks

- 当前移动端没有现成登录态管理；执行时如果直接照搬后台实现，容易把后台角色入口和用户端入口重新耦合在一起。
- `Booking` 表已存在，但当前没有真正的业务校验；如果服务层不统一校验酒店状态、房型归属和日期区间，很容易写入脏数据。
- `apps/api/prisma/seed.ts` 里已有示例预订数据；执行时如果测试依赖固定主键，需要避免和现有 seed 假设冲突。

## Self-Review

- Spec coverage: 已覆盖登录用户创建预订、记录字段、总价计算、仅 USER 可创建、MVP 不接支付。
- Scope control: 未扩展订单列表、取消退款、库存、支付、后台订单管理。
- File mapping: 计划锚定到现有 `apps/api` 与 `apps/mobile` 结构，没有把 `apps/web` 后台误纳入用户预订实现。
- Placeholder scan: 已给出明确文件路径、任务边界和验证目标；按用户要求未写代码。
