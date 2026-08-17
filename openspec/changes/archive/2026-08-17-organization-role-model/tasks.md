## 1. 角色矩陣確認（Decision: 角色矩陣：合併 supastarter 的三層跟 realms 的講師語彙，不是照搬任一邊）

- [x] 1.1 把 design.md 的權限矩陣表（owner/admin/instructor/user 六項動作）交給老闆逐格確認，驗證方式：老闆明確回覆「對」
- [x] 1.2 驗證 Requirement「Organization membership roles are a fixed four-value set」與「Every organization has exactly one owner」的敘述跟老闆原本描述一致，驗證方式：老闆確認 owner 恰好一個、admin/instructor 無上限，跟現有 spec 一致
- [x] 1.3 驗證 Requirement「Every member can view their own purchased courses regardless of role」符合老闆預期，驗證方式：老闆明確回覆確認

## 2. Instructor 指派規則確認（Decision: instructor 指派規則）

- [x] 2.1 驗證 Requirement「Only owner or admin can assign or revoke the instructor role」的三個 Scenario 跟老闆的描述一致，驗證方式：老闆明確回覆確認
- [x] 2.2 驗證 Requirement「Instructor role grants course content permissions but not billing visibility」符合老闆對「講師」職責範圍的預期，驗證方式：老闆明確回覆確認

## 3. Open Questions 裁決（Decision: 角色矩陣：合併 supastarter 的三層跟 realms 的講師語彙，不是照搬任一邊）

- [x] 3.1 請老闆裁決「StartKiter 自己的網站真的使用多組織」，驗證方式：取得老闆明確回覆，已裁決：是，記錄於 design.md「StartKiter 自己的網站真的使用多組織（已裁決：是）」
- [x] 3.2 請老闆裁決「買家付費權益採雙模式並存」，驗證方式：取得老闆明確回覆，已裁決：B2B 掛組織、B2C 掛個人，兩種並存，記錄於 design.md「買家付費權益採雙模式並存（已裁決：兩種都要）」
- [x] 3.3 請老闆裁決「Invitation 通知機制（已裁決：Email）」，驗證方式：取得老闆明確回覆，已裁決：沿用 supastarter 既有 Email 機制，記錄於 design.md 對應段落

## 4. v1-scope-boundary 規則正式生效（Requirement: Forbidden extract targets）

- [x] 4.1 確認 Requirement「Forbidden extract targets」的 delta（移除 Organization/Member/Invitation 禁止項，改為要求支援）內容跟 design.md 的角色矩陣一致，驗證方式：`spectra validate organization-role-model` 通過且無 Critical/Warning

## 5. Review

- [x] 5.1 對 proposal.md、design.md、specs/organization-tenancy/spec.md、specs/v1-scope-boundary/spec.md 四份文件做一次內部一致性複查（角色命名、權限矩陣、Open Questions 三份文件互相對得上），驗證方式：`spectra analyze organization-role-model` 的 Coverage/Consistency/Ambiguity/Gaps 四個維度皆為 Clean 或僅剩 Suggestion 等級
