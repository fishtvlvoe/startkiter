# Course Studio API contract

Course Studio 的 REST route 與 oRPC `course.updateLesson` 共用同一個 server-side lesson update service。兩條路徑都先驗證 MDX，再寫入資料庫。

## 權限

Course Studio 只接受 session user email（不分大小寫、會去除前後空白）等於 `ADMIN_EMAIL` 的 operator。未登入回 `401`，已登入但不是 operator 回 `403`。

## `update_lesson`

REST：`POST /api/course/studio`

```json
{
  "action": "update_lesson",
  "payload": {
    "id": "lesson-01",
    "content": "# 課程內容"
  }
}
```

成功回 `200`：

```json
{ "success": true, "lesson": {} }
```

MDX 不符合 registry 或安全規則時，兩條路徑都不得寫入資料庫：

```json
{
  "error": "INVALID_MDX_CONTENT",
  "details": "講義內容含有未授權元件：EvilWidget"
}
```

REST 回 `400`。oRPC 回 `BAD_REQUEST`，並在 error data 保留相同的 `code` 與 `details`。錯誤碼由 `COURSE_STUDIO_ERROR_CODES.INVALID_MDX_CONTENT` 提供，client 不應自行重複字串。

## 排序

Chapter 與 Lesson 的資料庫 `order` 都是 0-based：第一項是 `0`，最後一項是同章節項目數減一。使用者介面顯示時才加一。既有資料由 `20260823150000_normalize_course_order_zero_based` migration 依目前排序重新編成連續的 0-based 值。
