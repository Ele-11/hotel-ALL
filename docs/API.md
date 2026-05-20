# 易宿酒店预订平台 MVP API 设计

本文档只保留 `docs/SPEC.md` 和 `docs/MILESTONES.md` 中 MVP 必需接口。

---

## 1. API 设计原则

- 后端提供 RESTful API，前端通过 HTTP 调用。
- 接口统一返回 JSON。
- 用户端酒店接口只返回已发布酒店。
- 商户只能操作自己创建的酒店和房型。
- 管理员接口必须校验 ADMIN 权限。
- 普通注册只能创建 USER 或 MERCHANT，ADMIN 账号通过系统预置。
- MVP 只创建预订记录，不接入支付、退款、库存锁定。

---

## 2. 通用返回格式

成功：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

失败：

```json
{
  "code": 400,
  "message": "error message",
  "data": null
}
```

---

## 3. auth

### 3.1 注册

`POST /auth/register`

权限：公开

请求字段：

- `username`：用户名
- `password`：密码
- `role`：角色，只允许 `USER` 或 `MERCHANT`

返回：

- 用户 ID
- 用户名
- 角色

说明：

- 不允许通过注册接口创建 `ADMIN`。

### 3.2 登录

`POST /auth/login`

权限：公开

请求字段：

- `username`：用户名
- `password`：密码

返回：

- token
- 用户 ID
- 用户名
- 角色

### 3.3 获取当前登录用户

`GET /auth/me`

权限：已登录用户

返回：

- 用户 ID
- 用户名
- 角色

---

## 4. hotels

### 4.1 用户端酒店列表

`GET /hotels`

权限：公开

查询参数：

- `city`：城市或地点
- `keyword`：关键字
- `checkInDate`：入住日期
- `checkOutDate`：离店日期
- `page`：页码
- `pageSize`：每页数量

返回：

- 酒店 ID
- 酒店名称
- 酒店地址
- 酒店星级
- 酒店最低价格
- 酒店图片或默认占位图

说明：

- 只返回 `已发布` 酒店。

### 4.2 用户端酒店详情

`GET /hotels/:id`

权限：公开

查询参数：

- `checkInDate`：入住日期
- `checkOutDate`：离店日期

返回：

- 酒店 ID
- 酒店名称
- 酒店地址
- 酒店星级
- 酒店开业时间
- 酒店图片或默认占位图
- 酒店设施
- 房型列表
- 入住日期、离店日期、间夜数

说明：

- 只允许查看 `已发布` 酒店。
- 房型按价格从低到高返回。

### 4.3 商户酒店列表

`GET /hotels/my`

权限：MERCHANT

返回：

- 商户自己创建的酒店列表
- 酒店状态
- 驳回原因

说明：

- 用于商户查看自己酒店的审核状态。

### 4.4 创建酒店

`POST /hotels`

权限：MERCHANT

请求字段：

- `nameCn`：酒店中文名
- `nameEn`：酒店英文名
- `address`：酒店地址
- `starRating`：酒店星级
- `openedAt`：酒店开业时间
- `imageUrl`：酒店图片，可选
- `facilities`：酒店设施，可选

返回：

- 酒店 ID
- 酒店状态

说明：

- 创建后酒店状态为 `待审核`。

### 4.5 编辑酒店

`PATCH /hotels/:id`

权限：MERCHANT

请求字段：

- `nameCn`：酒店中文名
- `nameEn`：酒店英文名
- `address`：酒店地址
- `starRating`：酒店星级
- `openedAt`：酒店开业时间
- `imageUrl`：酒店图片，可选
- `facilities`：酒店设施，可选

返回：

- 酒店 ID
- 酒店状态

说明：

- 商户只能编辑自己创建的酒店。
- 编辑后酒店重新进入 `待审核`。

---

## 5. rooms

### 5.1 获取酒店房型

`GET /hotels/:hotelId/rooms`

权限：公开

返回：

- 房型 ID
- 房型名称
- 价格

说明：

- 用户端只允许获取 `已发布` 酒店的房型。
- 房型按价格从低到高返回。

### 5.2 创建房型

`POST /rooms`

权限：MERCHANT

请求字段：

- `hotelId`：酒店 ID
- `name`：房型名称
- `price`：房型价格

返回：

- 房型 ID
- 酒店 ID
- 房型名称
- 价格

说明：

- 商户只能给自己创建的酒店添加房型。

### 5.3 编辑房型

`PATCH /rooms/:id`

权限：MERCHANT

请求字段：

- `name`：房型名称
- `price`：房型价格

返回：

- 房型 ID
- 酒店 ID
- 房型名称
- 价格

说明：

- 商户只能编辑自己酒店下的房型。

---

## 6. audit

### 6.1 获取审核酒店列表

`GET /audit/hotels`

权限：ADMIN

查询参数：

- `status`：酒店状态，可选
- `page`：页码
- `pageSize`：每页数量

返回：

- 酒店 ID
- 酒店名称
- 商户 ID
- 酒店状态
- 驳回原因

### 6.2 审核通过

`PATCH /audit/hotels/:id/approve`

权限：ADMIN

返回：

- 酒店 ID
- 酒店状态：`审核通过`

说明：

- 审核通过不等于发布，发布需要单独调用发布接口。

### 6.3 审核驳回

`PATCH /audit/hotels/:id/reject`

权限：ADMIN

请求字段：

- `reason`：驳回原因

返回：

- 酒店 ID
- 酒店状态：`审核不通过`
- 驳回原因

说明：

- 驳回原因必填。

### 6.4 发布酒店

`PATCH /audit/hotels/:id/publish`

权限：ADMIN

返回：

- 酒店 ID
- 酒店状态：`已发布`

说明：

- 可用于发布 `审核通过` 酒店。
- 可用于恢复发布 `已下线` 酒店。

### 6.5 下线酒店

`PATCH /audit/hotels/:id/offline`

权限：ADMIN

返回：

- 酒店 ID
- 酒店状态：`已下线`

说明：

- 下线不是删除数据。
- 下线后用户端不可见。

---

## 7. bookings

### 7.1 创建预订记录

`POST /bookings`

权限：USER

请求字段：

- `hotelId`：酒店 ID
- `roomId`：房型 ID
- `checkInDate`：入住日期
- `checkOutDate`：离店日期
- `guestCount`：入住人数

返回：

- 预订 ID
- 用户 ID
- 酒店 ID
- 房型 ID
- 入住日期
- 离店日期
- 入住人数
- 总价

说明：

- 只能预订 `已发布` 酒店下的房型。
- 总价由后端根据房型价格和间夜数计算。
- MVP 不接入真实支付。

---

## 8. MVP 接口优先级

1. `POST /auth/register`
2. `POST /auth/login`
3. `GET /auth/me`
4. `POST /hotels`
5. `PATCH /hotels/:id`
6. `GET /hotels/my`
7. `POST /rooms`
8. `PATCH /rooms/:id`
9. `GET /audit/hotels`
10. `PATCH /audit/hotels/:id/approve`
11. `PATCH /audit/hotels/:id/reject`
12. `PATCH /audit/hotels/:id/publish`
13. `PATCH /audit/hotels/:id/offline`
14. `GET /hotels`
15. `GET /hotels/:id`
16. `GET /hotels/:hotelId/rooms`
17. `POST /bookings`
