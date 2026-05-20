---
name: ele-ui
description: Use when building or polishing the EasyStay hotel booking UI in React 18, TypeScript, and Tailwind CSS, including mobile user pages and desktop admin pages.
---

# Ele UI

为“易宿酒店预订平台”实现简洁、清爽、可用优先的前端页面。

## Before Coding

- 先读 `docs/SPEC.md`、`docs/MILESTONES.md`、`docs/API.md`，确认当前 Milestone。
- 判断页面类型：用户端移动页，或管理端 PC 后台页。
- 不改后端逻辑、Prisma schema 或 API 设计，除非用户明确要求。

## Style

- 用户端：移动优先，服务酒店查询、列表、详情、预订流程。
- 管理端：桌面后台，服务酒店录入、编辑、审核、发布、下线。
- 视觉：浅色背景、白色卡片、细边框、轻阴影、`8px` 内圆角。
- 主色：绿色、青绿色或蓝绿色；价格、状态、主按钮要突出。
- 避免紫蓝/粉蓝 AI 渐变、装饰光球、复杂玻璃拟态、大量 emoji、超大圆角。

## Implementation

- 使用 Tailwind CSS，除非项目已有其他 UI 系统；不新增 UI 库，除非用户同意。
- 重复出现再抽组件，优先：`Button`、`Input`、`Select`、`Tag`、`StatusBadge`、`HotelCard`、`RoomCard`、`PageHeader`、`EmptyState`、`FormSection`、`AdminTable`。
- 酒店卡片展示图片、名称、地址、星级/标签、起始价格；房型卡片展示房型、床型、人数、价格、预订按钮。
- 重要页面覆盖 `loading`、`empty`、`error`、`disabled`、提交中状态。
- 完成前检查：移动端无横向滚动，按钮易点击，后台表单/表格高效，风格统一。

## Final Report

- 说明改了哪些文件、页面/组件、状态覆盖和验证命令。
- 如有范围限制或后续优化，简短列出。
