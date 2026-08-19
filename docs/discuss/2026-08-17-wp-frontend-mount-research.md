# WP 前台區塊掛載機制研究（給 SR2 design.md 用）

來源：本機 `Local Sites/buygo/app/public/wp-content/plugins/fluent-cart`（唯讀查看,沒有改動）+ WordPress 官方文件。FluentCart 是一個成熟的電商外掛,同時用了三種機制,適合當範例。

## 一句話

WP 讓外掛把東西塞進前台,不是一種辦法,是三種,分別對應「使用者要不要手動放」「要不要視覺化編輯」「要不要跟特定內容綁定自動出現」三個維度。StartKiter 的 Core 應該三種掛載點都提供,manifest 裡讓 Plugin 自己宣告要用哪一種。

## 機制一：Shortcode（手動放置,最舊但還在用）

`add_shortcode('fluent_cart_products', $callback)`,使用者在頁面內容裡打 `[fluent_cart_products]`,渲染時被替換成 callback 回傳的 HTML。

實測（`app/Hooks/Handlers/ShortCodes/ShopAppHandler.php`）：

```php
const SHORT_CODE = 'fluent_cart_products';

public function register()
{
    add_shortcode(static::SHORT_CODE, function ($shortcodeAttributes, $content, $block) {
        return $this->handelShortcodeCall($shortcodeAttributes);
    });
}
```

關鍵細節：FluentCart 用 `has_shortcode(get_the_content(), static::SHORT_CODE) || has_block('fluent-cart/products')` 判斷「這頁有沒有用到我」,才決定要不要載入 CSS/JS——避免沒用到的頁面也載入一堆資源。

## 機制二：Gutenberg Block（視覺化編輯,現代做法）

`register_block_type()` 搭配 `block.json` 宣告 metadata（name、attributes、editorScript）,前台渲染走 `render_callback`（PHP function）或 `render`（PHP 模板檔路徑,WP 6.1 起支援）。使用者在區塊編輯器裡用視覺化介面拖進頁面,不用背語法。

官方文件：[register_block_type()](https://developer.wordpress.org/reference/functions/register_block_type/)、[block.json metadata](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/)

FluentCart 自己包了一層抽象類別（`app/Hooks/Handlers/BlockEditors/BlockEditor.php`）,每個 block 繼承它、實作 `abstract public function render(array $shortCodeAttribute, $block = null)`,在 `init` hook 時註冊：

```php
abstract class BlockEditor {
    abstract public function render(array $shortCodeAttribute, $block = null);
    public static function register() {
        add_action('init', [static::make(), 'init']);
    }
}
```

值得注意：FluentCart 讓同一個功能同時開放 shortcode 跟 block 兩種放置方式（`fluent_cart_products` shortcode 對應 `fluent-cart/products` block）,不是二選一,是給使用者兩種放置習慣都能用。

## 機制三：Template Hook / Filter（自動注入,不用使用者手動放）

跟特定內容類型綁定,渲染到該內容時自動觸發,使用者完全不用手動放置任何東西。

實測（`app/Modules/Templating/TemplateActions.php`）：

```php
add_filter('the_content', function ($content) {
    if (!is_singular('fluent-products')) {
        return $content;   // 不是商品頁,不動內容
    }
    global $post;
    if (!$post || $post->post_type !== FluentProducts::CPT_NAME) {
        return $content;
    }
    ob_start();
    do_action('fluent_cart/product/after_product_content', $post->ID);
    $extra = ob_get_clean();
    return $content . $extra;
}, 999);
```

兩層值得抄的設計：
1. **guard 條件**（`is_singular` + post type 檢查）——filter 掛的是全站通用的 `the_content`,但外掛自己判斷「只有我的內容類型才動手」,不會誤傷其他頁面
2. **二次掛載點**（`do_action('fluent_cart/product/after_product_content', ...)`）——外掛自己開放了一個更細的 hook,讓其他程式碼（甚至第三方）可以在「商品內容之後」再插一段,不用重新 hook `the_content`

## 三種機制怎麼選

| 機制 | 使用者要不要手動放 | 適合情境 |
|---|---|---|
| Shortcode | 要,手動打 `[xxx]` | 舊站、寫作習慣用純文字內容的使用者 |
| Gutenberg Block | 要,但用視覺化拖拉 | 現代編輯體驗,需要即時預覽、可調參數 |
| Template Hook/Filter | 不用,綁定內容類型自動出現 | 跟某種資料類型（商品、課程章節）強綁,不希望使用者忘記放或放錯位置 |

## 對應到 StartKiter：Core 的「前台區塊掛載 API」該長什麼樣

Plugin 的 manifest 裡,前台區塊掛載點應該長這樣（示意,非最終格式）：

```json
{
  "frontendMounts": [
    {
      "id": "course-progress-widget",
      "kind": "block",              // "block" | "shortcode" | "auto"
      "label": "課程進度卡片",
      "renderRoute": "/api/plugins/course/blocks/progress",
      "placement": "manual"          // 使用者自己拖進去放
    },
    {
      "id": "course-completion-banner",
      "kind": "auto",
      "boundTo": { "contentType": "course-lesson" },   // 對應 WP 的 is_singular 判斷
      "hookPoint": "after-content",                     // 對應 WP 的 the_content 附加時機
      "renderRoute": "/api/plugins/course/blocks/completion-banner"
    }
  ]
}
```

三個關鍵欄位,直接對應 WP 這三種機制解決的三個問題：

1. `kind`：手動放置（block/shortcode 概念合併,因為 Next.js 世界不需要區分編輯器語法,只需要區分「要不要視覺化選取」）還是自動注入（`auto`）
2. `boundTo` + `hookPoint`：如果是自動注入,綁定哪種內容類型、注入在哪個時機點——對應 WP 的 `is_singular()` guard 條件 + `the_content` 這類固定時機點
3. Core 提供的固定 `hookPoint` 清單（例如 `before-content`／`after-content`／`page-footer`）就是 StartKiter 自己版本的 `wp_footer`／`the_content`——這些是 Core 要預先定義好、Plugin 只能從清單裡選,不能自己發明新時機點（不然就變回 WP 那種各家外掛互不相容的亂象)

## 待補（不影響現在動工,寫 design.md 時再細化）

- `renderRoute` 實際怎麼在 Next.js Server Component 裡被 Theme 呼叫、資料怎麼傳（WP 是同進程 PHP function call,StartKiter 是不同 Plugin 可能是不同進程,這裡需要另外設計,不是照抄 WP 就好）
- FluentCart 的「二次掛載點」模式（`do_action('fluent_cart/product/after_product_content', ...)`）要不要讓 StartKiter 的 Plugin 之間也能互相 hook,這會讓 Plugin A 依賴 Plugin B 存不存在,是額外的複雜度,建議 v1 先不做
