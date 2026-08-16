## 1. 角色矩陣確認（Decision: 角色矩陣：合併 supastarter 的三層跟 realms 的講師語彙，不是照搬任一邊）

- [ ] 1.1 把 design.md 的權限矩陣表（owner/admin/instructor/user 六項動作）交給老闆逐格確認，驗證方式：老闆針對表格內每一列明確回覆「對」或提出修正，回覆記錄在對話紀錄或本檔案補充區塊
- [ ] 1.2 驗證 Requirement「Organization membership roles are a fixed four-value set」與「Every organization has exactly one owner」的敘述跟老闆原本描述（組織/管理員/講師/買家用戶）一致，驗證方式：逐條唸出 spec 的 Requirement 文字給老闆確認用詞對應正確
- [ ] 1.3 驗證 Requirement「Every member can view their own purchased courses regardless of role」符合老闆對「買家/用戶不管是哪個角色都能看自己買的課」的預期，驗證方式：老闆明確回覆確認

## 2. Instructor 指派規則確認（Decision: instructor 指派規則）

- [ ] 2.1 驗證 Requirement「Only owner or admin can assign or revoke the instructor role」的三個 Scenario（admin 指派／instructor 不能自己或別人升級／user 不能自我升級）跟老闆的描述一致，驗證方式：老闆明確回覆這三個情境符合預期
- [ ] 2.2 驗證 Requirement「Instructor role grants course content permissions but not billing visibility」是否符合老闆對「講師」職責範圍的預期（只管內容不管金流/買家名單），驗證方式：老闆明確回覆確認或提出修正

## 3. Open Questions 裁決（Decision: 角色矩陣：合併 supastarter 的三層跟 realms 的講師語彙，不是照搬任一邊）

- [ ] 3.1 請老闆裁決「StartKiter 自己的網站要不要真的開放建立多個 Organization，還是永遠只用一個官方組織」，驗證方式：取得老闆明確回覆，記錄於本 change 的補充區塊或後續 change 的 proposal
- [ ] 3.2 請老闆裁決「買家付費權益（courseAccess／kitClaimEligible）掛在 Organization 層級還是 Member 層級」，驗證方式：取得老闆明確回覆
- [ ] 3.3 請老闆裁決「Invitation 通知機制沿用 supastarter 現有 email 機制，或改用 StartKiter 既有 LINE／email 客服模式」，驗證方式：取得老闆明確回覆

## 4. v1-scope-boundary 規則正式生效（Requirement: Forbidden extract targets）

- [ ] 4.1 確認 Requirement「Forbidden extract targets」的 delta（移除 Organization/Member/Invitation 禁止項，改為要求支援）內容跟 design.md 的角色矩陣一致，驗證方式：`spectra validate organization-role-model` 通過且無 Critical/Warning

## 5. Review

- [ ] 5.1 對 proposal.md、design.md、specs/organization-tenancy/spec.md、specs/v1-scope-boundary/spec.md 四份文件做一次內部一致性複查（角色命名、權限矩陣、Open Questions 三份文件互相對得上），驗證方式：`spectra analyze organization-role-model` 的 Coverage/Consistency/Ambiguity/Gaps 四個維度皆為 Clean 或僅剩 Suggestion 等級
