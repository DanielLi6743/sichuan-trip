# 川西家庭旅行 App — 功能规格说明书

> **用途**：供 AI 从零重新搭建整个网页。  
> **约束**：本文档只描述功能和逻辑，**绝不包含任何 UI/设计/色彩/字体/间距/动效内容**。  
> **目标文件**：`website/index.html`（单文件，零外部依赖，Tailwind CSS CDN 允许）。

---

## 1. 项目概述

一家四口（Daniel Li + 家人）的 12 天川西环线旅行计划。手机浏览器打开 → 添加到主屏幕 → 像原生 App 使用。

- 12 天行程（2026年7月8日–7月19日），D0 从重庆开始，D11 从成都返回
- 6 站路线：重庆 → 成都 → 丹巴 → 八美 → 康定 → 成都
- 5 条旅行原则：慢、早、水、松、家
- 26 个好去处/景点

### 技术约束
- 单文件 `index.html`：HTML + `<style>` + `<script>`
- 依赖：Tailwind CSS CDN（`<script src="https://cdn.tailwindcss.com">`）
- 零框架、零构建、零 npm
- 可直接双击在浏览器打开，也可部署到 GitHub Pages
- 所有图标使用内联 SVG（Feather 风格，24x24 viewBox，stroke-width 1.8，round cap/join）
- **禁止使用 emoji**，全部用 SVG 替代
- 本地图片优先，加载失败时 fallback 到 Unsplash

---

## 2. 文件结构

```
website/
├── index.html          ← 唯一的代码文件
├── sw.js               ← Service Worker（网络优先，零缓存）
├── images/
│   ├── icon-180.png    ← PWA 图标
│   ├── day00-chongqing.jpg  ← D0 照片
│   ├── day01-chongqing.jpg  ← D1 照片
│   ├── ...（共 12 张 dayXX-*.jpg，对应 D0-D11）
│   ├── hongyadong.jpg       ← 发现页景点照片
│   ├── ciqikou.jpg
│   ├── ...（共 26 张景点照片，与 PLACES 数据一一对应）
└── .gitignore
```

---

## 3. 数据模型

### 3.1 `IMG(localPath, unsplashId)` — 照片工具工厂

返回一个对象 `{src, fallback, toHTML(alt, cls)}`。

```
参数:
  localPath:    string  如 'images/day00-chongqing.jpg'
  unsplashId:  string  如 'photo-1514924013411-cbf25faa35bb'（Unsplash photo ID）
                       如果已经是完整 HTTPS URL（以 'http' 开头），直接用作 fallback

toHTML(alt, cls):
  返回 <img> 标签字符串，src 指向本地文件，onerror 时自动切换到 fallback
  fallback URL 格式：https://images.unsplash.com/{unsplashId}?w=1200&q=85
```

### 3.2 `DIMG[12]` — 12 天行程照片数组

按天索引（D0–D11），每个元素是 `IMG()` 返回值。索引顺序与日期严格对应：

| 索引 | 本地文件 | Unsplash fallback |
|------|---------|-------------------|
| 0 | `images/day00-chongqing.jpg` | `photo-1514924013411-cbf25faa35bb` |
| 1 | `images/day01-chongqing.jpg` | `photo-1494522855154-9297ac14b55f` |
| 2 | `images/day02-chongqing.jpg` | `photo-1477959858617-67f85cf85f82` |
| 3 | `images/day03-transfer.jpg` | `photo-1449824913935-59a10b8d2000` |
| 4 | `images/day04-sanxingdui.jpg` | `photo-1464366400600-7168b8af9bc3` |
| 5 | `images/day05-chengdu.jpg` | `photo-1547981609-4b6bfe67ca0b` |
| 6 | `images/day06-danba.jpg` | `photo-1486870591958-9b9d0d1dda99` |
| 7 | `images/day07-danba.jpg` | `photo-1518837695005-2083093ee35b` |
| 8 | `images/day08-bamei.jpg` | `photo-1504198453319-5ce911bafcde` |
| 9 | `images/day09-tagong.jpg` | `photo-1500530855693-0b41a1ad3b18` |
| 10 | `images/day10-kangding.jpg` | `photo-1470071459604-3b5ec3a7fe05` |
| 11 | `images/day11-return.jpg` | `photo-1441974231531-c6227db76b6e` |

### 3.3 `PIMG[26]` — 发现页景点照片数组

与 `PLACES` 数组一一对应（同索引）。每个元素是 `IMG()` 返回值。照片列表：

`hongyadong, ciqikou, yangtze-cableway, jiefangbei, liziba, shibati, panda-base, kuanzhai-alley, jinli, sanxingdui, renmin-park, wuhouci, erlang-tunnel, jiaju-village, suopo-towers, zhonglu-village, tagong-grassland, yala-snowmountain, muya-temple, tagong-temple, zheduo-pass, kangding-oldtown, gongga-snowmountain, hailuogou, siguniang-mountain, xinduqiao`

### 3.4 `DAYS[12]` — 12 天行程数据

每个对象字段：

```
{
  n:    number  天数编号（从 0 开始），必须与数组索引一致
  w:    string  周几（如 '周三'）
  date: string  日期（如 '7月8日'）
  title:string  当天标题（如 '抵达重庆'）
  desc: string  当天详细描述（2-3 句）
  hotel:string  住宿地点（如 '重庆酒店'）
  alt:  string  海拔（如 '300m' 或 '500m→1,800m'）
  moves:string[] 当天活动标签数组（如 ['晚抵重庆','入住休息','两江夜景']）
}
```

**严格要求**：`DAYS[0]` 的 `n`=0、`date`='7月8日'；`DAYS[1]` 的 `n`=1、`date`='7月9日'；以此类推直到 `DAYS[11]` 的 `n`=11、`date`='7月19日'。数组索引必须与 `n` 值和日期顺序一致。

完整数据（12条）：

```
DAYS[0]  = {n:0,  w:'周三', date:'7月8日',  title:'抵达重庆',         hotel:'重庆酒店', alt:'300m',          moves:['晚抵重庆','入住休息','两江夜景']}
DAYS[1]  = {n:1,  w:'周四', date:'7月9日',  title:'山城经典',         hotel:'重庆酒店', alt:'300m',          moves:['解放碑','洪崖洞','山城步道']}
DAYS[2]  = {n:2,  w:'周五', date:'7月10日', title:'重庆深度',         hotel:'重庆酒店', alt:'300m',          moves:['三峡博物馆','十八梯','长江索道']}
DAYS[3]  = {n:3,  w:'周六', date:'7月11日', title:'穿楼轻轨·转场成都', hotel:'成都酒店', alt:'300m→500m',     moves:['李子坝轻轨','鹅岭二厂','高铁赴蓉']}
DAYS[4]  = {n:4,  w:'周日', date:'7月12日', title:'三星堆探秘',       hotel:'成都酒店', alt:'500m',          moves:['三星堆博物馆','青铜神树','古蜀文明']}
DAYS[5]  = {n:5,  w:'周一', date:'7月13日', title:'蜀韵慢调',         hotel:'成都酒店', alt:'500m',          moves:['蜀锦体验','人民公园','川剧变脸']}
DAYS[6]  = {n:6,  w:'周二', date:'7月14日', title:'向高原出发',       hotel:'丹巴酒店', alt:'500m→1,800m',   moves:['318国道西行','二郎山隧道','甲居藏寨']}
DAYS[7]  = {n:7,  w:'周三', date:'7月15日', title:'丹巴秘境',         hotel:'丹巴酒店', alt:'1,800m',        moves:['梭坡古碉','中路藏寨','藏寨休整']}
DAYS[8]  = {n:8,  w:'周四', date:'7月16日', title:'驶向八美',         hotel:'八美酒店', alt:'1,800m→3,500m', moves:['高原草甸','雅拉雪山','高原日落']}
DAYS[9]  = {n:9,  w:'周五', date:'7月17日', title:'塔公深度',         hotel:'八美酒店', alt:'3,500m',        moves:['木雅大寺','塔公寺','草原放空']}
DAYS[10] = {n:10, w:'周六', date:'7月18日', title:'康定情歌',         hotel:'康定酒店', alt:'3,500m→2,600m', moves:['折多山垭口','康定古城','高原温泉']}
DAYS[11] = {n:11, w:'周日', date:'7月19日', title:'归程',             hotel:'回家',   alt:'2,600m→500m',   moves:['返回成都','飞回上海','慢慢回到自己']}
```

### 3.5 `RT[6]` — 6 站路线

```
[
  {n:'重庆', a:'300m'},
  {n:'成都', a:'500m'},
  {n:'丹巴', a:'1,800m'},
  {n:'八美', a:'3,500m'},
  {n:'康定', a:'2,600m'},
  {n:'成都', a:'500m'}
]
```

`n` = 站名，`a` = 海拔字符串（需 parse 数字部分用于山形图高度计算）。

### 3.6 `PR[5]` — 5 条旅行原则

```
[
  {n:1, t:'慢', d:'宁愿少去一个地方，也不要多赶一次路。每天开车不超过4小时。'},
  {n:2, t:'早', d:'高原的清晨最美。每天7点前出发，中午最热时休息。'},
  {n:3, t:'水', d:'高原补水是关键。每人每天至少1.5L，车上常备保温杯。'},
  {n:4, t:'松', d:'不设定严格时间表。遇到喜欢的地方就停下来，让旅途自由呼吸。'},
  {n:5, t:'家', d:'这是一次家庭旅行，不是打卡。尊重每个人的节奏，享受在一起的时光。'}
]
```

`n` = 编号，`t` = 单字标题（用作石子展示文字），`d` = 详细描述。

### 3.7 `PLACES[26]` — 26 个好去处

```
[
  {title:'洪崖洞夜景',   loc:'重庆 · 渝中区',    tag:'经典',     h:240, desc:'...'},
  {title:'磁器口古镇',   loc:'重庆 · 沙坪坝',    tag:'古镇',     h:180, desc:'...'},
  {title:'长江索道',     loc:'重庆 · 渝中',      tag:'体验',     h:200, desc:'...'},
  {title:'解放碑',       loc:'重庆 · 渝中区',    tag:'地标',     h:210, desc:'...'},
  {title:'李子坝轻轨穿楼',loc:'重庆 · 渝中',      tag:'奇观',     h:220, desc:'...'},
  {title:'十八梯老街',   loc:'重庆 · 渝中',      tag:'老街',     h:195, desc:'...'},
  {title:'大熊猫繁育基地',loc:'成都 · 成华区',    tag:'经典',     h:250, desc:'...'},
  {title:'宽窄巷子',     loc:'成都 · 青羊区',    tag:'慢生活',   h:210, desc:'...'},
  {title:'锦里古街',     loc:'成都 · 武侯区',    tag:'夜游',     h:190, desc:'...'},
  {title:'三星堆博物馆', loc:'广汉 · 三星堆',    tag:'文明',     h:230, desc:'...'},
  {title:'人民公园',     loc:'成都 · 青羊区',    tag:'慢生活',   h:200, desc:'...'},
  {title:'武侯祠',       loc:'成都 · 武侯区',    tag:'三国',     h:205, desc:'...'},
  {title:'二郎山隧道',   loc:'318国道 · 川藏线', tag:'自驾',     h:195, desc:'...'},
  {title:'甲居藏寨',     loc:'丹巴 · 甘孜州',    tag:'最美乡村', h:260, desc:'...'},
  {title:'梭坡古碉群',   loc:'丹巴 · 甘孜州',    tag:'历史',     h:215, desc:'...'},
  {title:'中路藏寨',     loc:'丹巴 · 甘孜州',    tag:'藏寨',     h:245, desc:'...'},
  {title:'塔公草原',     loc:'八美 · 甘孜州',    tag:'草原',     h:250, desc:'...'},
  {title:'雅拉雪山',     loc:'八美 · 甘孜州',    tag:'雪山',     h:220, desc:'...'},
  {title:'木雅大寺',     loc:'八美 · 甘孜州',    tag:'寺庙',     h:200, desc:'...'},
  {title:'塔公寺',       loc:'八美 · 甘孜州',    tag:'寺庙',     h:185, desc:'...'},
  {title:'折多山垭口',   loc:'康定 · 甘孜州',    tag:'自驾',     h:230, desc:'...'},
  {title:'康定古城',     loc:'康定 · 甘孜州',    tag:'古城',     h:210, desc:'...'},
  {title:'贡嘎雪山',     loc:'甘孜州 · 蜀山之王',tag:'雪山',     h:240, desc:'...'},
  {title:'海螺沟冰川',   loc:'泸定 · 甘孜州',    tag:'自然',     h:240, desc:'...'},
  {title:'四姑娘山',     loc:'阿坝 · 小金',      tag:'雪山',     h:235, desc:'...'},
  {title:'新都桥',       loc:'康定 · 甘孜州',    tag:'摄影天堂', h:225, desc:'...'}
]
```

每个 `desc` 字段包含 3-4 句详细描述文字。`h` 字段是图片展示高度的参考值（px）。

---

## 4. HTML DOM 结构

以下用 ID 选择器标记的元素**必须存在且 ID 不变**：

```
#app                           ← 应用根容器
  #splash                      ← 启动屏（显示 1.8s 后自动隐藏）
    h1                          ← 启动屏文字
    .s-bar                      ← 进度条
  #welcome                     ← 欢迎屏（首次访问显示）
    #wPanel                     ← 欢迎面板
      #enterBtn                 ← "开始旅程"按钮
  #tabBar                       ← 导航栏（移动端浮动 pill，桌面端固定侧边栏）
    #tabPill                    ← 选中指示器（仅移动端）
    .sidebar-brand              ← 侧边栏品牌区（仅桌面端）
      .sb-logo                  ← Logo 容器
      .sb-title                 ← 品牌标题
      .sb-sub                   ← 品牌副标题
    .sidebar-footer             ← 侧边栏底部版本号（仅桌面端）
    button.tab-item[data-tab="home"]      ← 概览 Tab
    button.tab-item[data-tab="trip"]      ← 行程 Tab
    button.tab-item[data-tab="check"]     ← 发现 Tab
    button.tab-item[data-tab="settings"]  ← 设置 Tab
  #mainContent                  ← 主内容区（可滚动）
    #page-home                  ← 概览页容器
    #page-trip                  ← 行程页容器
    #page-check                 ← 发现页容器
    #page-settings              ← 设置页容器
    #toast                      ← Snackbar 提示
  #appNotice                    ← 每次启动弹出的提示弹窗
    .pn-card                    ← 提示卡片
      #pnDismiss                ← "知道了"按钮
  #sheetOverlay                 ← 底部弹出层遮罩
    .sheet-wrap
      #sheetContent             ← 弹出层内容容器
  #pwaForce                     ← PWA 强制添加到主屏幕的遮罩（动态创建，仅移动端浏览器）
```

---

## 5. 工具函数

### 5.1 `$(s)` 和 `$$(s)`
- `$('#foo')` → `document.querySelector('#foo')`
- `$$('.bar')` → `document.querySelectorAll('.bar')`

### 5.2 `store(key, value?)`
封装 `localStorage`，自动 JSON 序列化/反序列化。
- `store('key', val)` → 写入
- `store('key')` → 读取，不存在返回 `null`
- 内部 try-catch 静默失败

### 5.3 `esc(s)`
HTML 转义：`&` `"` `<` `>` 替换为对应实体。用于将用户数据安全插入 HTML。

### 5.4 `toast(msg)`
显示 Snackbar 提示。操作 `#toast` 元素：设文字 → 加 `.show` 类 → 1.8s 后自动移除 `.show`。

### 5.5 `stagger(container)`
触发容器内 `.fade-up:not(.in)` 元素的交错入场动画。每个元素延迟递增 28ms，添加 `.in` 类。

### 5.6 `isDesktop()`
返回 `window.matchMedia('(min-width:768px)').matches`。

### 5.7 `getTodayIndex()`
计算当日对应的行程天数索引（0-11）。基准：2026年7月8日 = D0。
```
const j8 = new Date(2026, 6, 8);  // 月份 0-indexed，6 = 7月
const diff = Math.floor((now - j8) / 86400000);
return Math.max(0, Math.min(11, diff));
```

### 5.8 `getGreeting()`
根据当前小时返回问候语：
- 5-11: '早上好'
- 12-13: '中午好'
- 14-17: '下午好'
- 其他: '晚上好'

---

## 6. SVG 生成：`makeMountainSVG()`

根据 `RT`（6 站路线数据）生成山形折线图 SVG 字符串。

### 算法
```
const W = 600, H = 210, PAD = 30;
const baseY = H - 36;
```

1. **海拔点**：将 `RT[i].a` 中的海拔字符串 parse 为数字（去掉逗号），最高海拔设为 3800m 作为 Y 轴参考
2. **X 坐标**：6 个站点均匀分布（PAD 到 W-PAD）
3. **Y 坐标**：`baseY - (海拔/3800) * (baseY - 18)` — 海拔越高越靠上
4. **贝塞尔曲线**：用平滑三次贝塞尔连接各点，control point 偏移量为 `(xDiff*0.4/-0.15)` 和 `(xDiff*0.6/1.15)`
5. **SVG 元素**：
   - 填充区域（areaD + 底部闭合）
   - 山脊线（lineD）
   - 6 个站点圆点（r=3.5，填充色为强调色）
   - 6 个海拔文字标注（圆点上方 12px）
   - 6 个站名文字（底部，H-8 处）

### 返回格式
```html
<svg viewBox="0 0 600 210" preserveAspectRatio="xMidYMid meet">
  <path d="..." class="mtn-fill"/>     ← 山体填充
  <path d="..." class="mtn-line"/>     ← 山脊线
  <circle .../> × 6                    ← 站点圆点
  <text class="mtn-alt">...</text> × 6 ← 海拔标注
  <text class="mtn-label">...</text> × 6 ← 站名
</svg>
```

---

## 7. 页面渲染函数（返回 HTML 字符串）

### 7.1 `renderHome()` — 概览页

**逻辑**：
1. `ti = getTodayIndex()` — 当天行程索引
2. `today = DAYS[ti]`
3. `greeting = getGreeting()`
4. 将 body 背景图设为 `DIMG[ti]` 的 fallback 或 src
5. 计算 5 颗石子的圆形排列位置（`R=5, orbR=38`）：
   ```
   每个石子的角度 = (i/5) * 2π - π/2
   left = 50 + orbR * cos(angle)  (%)
   top  = 50 + orbR * sin(angle)  (%)
   ```
  每个石子生成为 `<div class="orbit-stone" data-pi="i" style="left:l%;top:t%">单字</div>`

**返回 HTML 结构**：
```
.home-hero
  .hh-greeting        ← 问候语（早上好/中午好/下午好/晚上好）
  .hh-location        ← 当天 title（如"重庆深度"）
  .hh-capsule         ← 日期 + 周几（如"7月10日 · 周五"）
.quick-stats-card     ← 三列统计
  .quick-stat × 3
    .qs-val           ← 数字（12 / 3,500m / 5）
    .qs-label         ← 标签（天旅程 / 最高海拔 / 次住宿）
.orbit-card           ← 旅行原则卡片
  .ow-header          ← 标题 + 说明
  .orbit-stage#orbitStage
    .orbit-guide      ← 圆形虚线参考圈
    .orbit-track#orbitTrack  ← 旋转轨道（内含 5 颗 .orbit-stone）
    .orbit-desc       ← 中央描述区
      .od-text#odText
        .od-word      ← 当前选中原则单字
        .od-detail    ← 当前选中原则描述
.route-card           ← 路线卡片
  .rx-header          ← 标题"路线·海拔一览"
  .mtn-chart-wrap     ← makeMountainSVG() 输出
```

### 7.2 `renderTrip()` — 行程页

**逻辑**：
- `july1Dow = 2`（2026年7月1日是周三，DOW 数组索引 2）
- `tripStart = 8, tripEnd = 19`（行程涉及7月8日-19日）
- 生成 7 列日历网格：
  - 第一行：7 个 `DOW` 标题（一二三四五六日）
  - 7月1日之前的空白格子：`july1Dow` 个（即 2 个，对应周一和周二）
  - 7月1日-7日：隐藏格子（不在行程内）
  - 7月8日-19日：行程日期方块（`cal-day`），包含：
    - `.cd-num`：日期数字
    - `.cd-wd`：周几
    - `.cd-photo`：当天照片（隐藏，展开时才显示）
    - `.cd-detail`：详情区（隐藏，展开时才显示）包含标题、moves 标签、住宿海拔、收起按钮
  - 7月20日-31日：隐藏格子

**每个日期方块数据结构**：`data-day="dayIndex"` — `dayIndex` 是 0-11 的行程天数索引。例如 7月8日 → dayIndex=0；7月19日 → dayIndex=11。

**展开态**（点击后激活）：方块 `grid-column: 1/-1` 占满整行，显示照片（左）+ 详情（右）。

### 7.3 `renderDiscover()` — 发现页

**逻辑**：
1. 复制 `PLACES` 数组，用 `sort(() => Math.random() - 0.5)` 随机打乱
2. 遍历打乱后的数组，生成 `.masonry-item` 卡片
3. 每个卡片通过 `PLACES.indexOf(p)` 找回原始索引，用 `PIMG[realIdx]` 获取对应照片
4. 卡片内容：照片 + `.mi-title`（标题）+ `.mi-desc`（描述，3 行截断）+ `.mi-tag`（标签）

**返回 HTML 结构**：
```
.disc-head            ← 标题 + 副标题（显示总数）
.masonry              ← CSS columns 瀑布流容器
  .masonry-item[data-pi="原始索引"] × 26
    img               ← PIMG[idx].toHTML()
    .mi-info
      .mi-title       ← PLACES[idx].title
      .mi-desc        ← PLACES[idx].desc（3行截断）
      .mi-tag         ← PLACES[idx].tag
```

### 7.4 `renderSettings()` — 设置页

**返回 HTML 结构**：
```
.set-wrap
  h2                  ← "设置"
  .set-block          ← 行程摘要
    .sb-label
    .set-card
      .trip-summary   ← 四列统计（12天 / 6座城市 / 3,500m / 5次住宿）
  .set-block          ← 数据
    .sb-label
    .set-card
      .set-row#exportData  ← 导出行程数据（JSON）
      .set-row#resetData   ← 重置所有数据（danger 样式）
  .set-block          ← 关于
    .sb-label
    .set-card
      .set-row        ← "川西家庭旅行 · 2026年7月"
      .set-row        ← 版本号（Beta XX）
  .end-quote          ← "慢慢进入高原 慢慢回到自己"
```

---

## 8. Tab 导航系统

### 8.1 全局状态
- `currentTab`：当前激活的 tab 名称（'home' | 'trip' | 'check' | 'settings'），初始为 `null`
- `expandedDay`：当前展开的日历方块索引，初始为 `null`

### 8.2 `switchTab(name)`
1. 隐藏旧 `.page.on`，显示 `#page-{name}`
2. 更新 `.tab-item` 的 `.active` 类
3. 调用 `movePill(name)` 移动指示器（仅移动端）
4. 滚动 `#mainContent` 到顶部
5. **背景处理**：如果切换到 `home`，设 `document.body.style.setProperty('--bg-img', url(DIMG[ti]))`，给 body 加 `.ken-burns` 类；其他 tab 移除 `--bg-img` 和 `.ken-burns` 类
6. 更新 `currentTab`，存入 `localStorage('sctab3', name)`
7. `requestAnimationFrame(() => stagger(新页面容器))`

### 8.3 `movePill(name)`
仅移动端（`!isDesktop()` 时）执行。计算对应 `.tab-item` 的 `offsetLeft` 和 `offsetWidth`，设置 `#tabPill` 的 `left` 和 `width`。

### 8.4 `renderTab(name)`
1. 将对应 `#page-{name}` 的 `innerHTML` 设为对应渲染函数的返回值
2. 特殊处理：
   - `home`：调用 `setupOrbit()` 启动石子旋转；`requestAnimationFrame × 2` 后调用 `animateStats()` 数字滚动
   - `trip`：无额外操作
   - `check`：`requestAnimationFrame` 后调用 `setupDiscoverReveal()` 设置 IntersectionObserver
   - `settings`：调用 `bindSettings()` 绑定导出和重置按钮
3. 调用 `switchTab(name)`

---

## 9. 石子轨道系统（Orbit）

### 9.1 全局变量
- `_orbitT`：当前旋转角度（度），初始 0，持续累加
- `_orbitRAF`：`requestAnimationFrame` ID
- `_orbitDragging`：是否正在拖拽，初始 `false`
- `_orbitLastAngle`：上次拖拽时的指针角度

### 9.2 `setupOrbit()`
每次调用时先 `cancelAnimationFrame` 旧的 RAF，启动新的动画循环。

**tick 循环**：
1. `_orbitT += 0.35`（约 21°/s 顺时针旋转）
2. 设 `#orbitTrack` 的 `transform: rotate(_orbitT deg)`
3. 所有 `.orbit-stone` 反设 `transform: rotate(-_orbitT deg)` 保持文字正立

**拖拽交互**（pointer 事件，同时支持鼠标和触屏）：
- `pointerdown`：记录起始角度，给 `#orbitTrack` 加 `.paused` 类
- `pointermove`：计算角度增量，更新 `_orbitT`，同步更新 track 和 stones
- `pointerup/leave/cancel`：移除 `.paused` 类

**角度计算**：`pointerToAngle(e)` — 获取 stage 的 bounding rect，计算指针相对圆心的角度 = `atan2(py, px) * 180/π`。触屏事件通过 `e.touches?.[0]` 取坐标。

### 9.3 石子点击交互（在全局 click 委托中处理）
1. 点击 `.orbit-stone` → 获取 `data-pi` 索引
2. 移除所有石子的 `.active` 和 `.pop` 类
3. 给被点击石子加 `.active` 和 `.pop` 类
4. `animationend` 后移除 `.pop` 类（`{once:true}`）
5. 显示中央 `.od-text`：填入 `PR[pi].t`（单字）和 `PR[pi].d`（描述）
6. 点击轨道以外区域 → 所有石子去 `.active`，隐藏中央描述

---

## 10. 日历展开/折叠

### 10.1 `expandCalDay(dayIndex)`
1. 如果 `expandedDay === dayIndex`，调用 `collapseCalDay()` 并返回（切换）
2. 先 `collapseCalDay()` 收起上一个
3. 找到 `[data-day="dayIndex"]` 的 `.cal-day` 元素
4. 添加 `.expanded` 和 `.active` 类
5. 给收起按钮绑定 click 事件（`{once:true}`，阻止冒泡，调用 `collapseCalDay()`）
6. 设 `expandedDay = dayIndex`

### 10.2 `collapseCalDay()`
1. 如果 `expandedDay === null`，直接返回
2. 找到对应元素，加 `.collapsing` 类，移除 `.active`
3. 监听 `transitionend`（`{once:true}`），移除 `.expanded` 和 `.collapsing`
4. 触发重排后移除 `.expanded`（启动过渡动画）
5. 设 `expandedDay = null`

### 10.3 过渡机制
`.cd-photo` 和 `.cd-detail` 默认 `max-height:0; opacity:0`。展开时 `max-height:200px; opacity:1`。收起时加 `.collapsing` → `max-height:0; opacity:0`。过渡时间：opacity 0.2s，max-height 0.3s。

---

## 11. 弹窗系统（Bento Sheet）

### 11.1 `openDaySheet(dayIndex)`
1. 取 `DAYS[dayIndex]`
2. 构建 sheet HTML：关闭按钮（`CLOSE_ICON` SVG）+ 拖拽手柄 + 照片 + 正文（天数、日期、标题、描述、moves 标签、住宿、海拔）
3. 设 `#sheetContent.innerHTML`
4. 给关闭按钮绑 click → `closeSheet()`
5. 设 `#sheetOverlay.style.display = 'block'`，清除旧动画

### 11.2 `openPostDetail(idx)`
1. 取 `PLACES[idx]`
2. 构建 sheet HTML：关闭按钮 + 照片 + 正文（标签、位置、标题、描述）
3. 同上流程

### 11.3 `closeSheet()`
1. 设 `#sheetOverlay` 的动画为 `soOut`（淡出）
2. `animationend` 后设 `display:none` 并清动画（`{once:true}`）

---

## 12. 全局事件委托

在 `setup()` 中注册 `document.addEventListener('click', ...)`：

| 点击目标 | 处理 |
|---------|------|
| `.cal-day[data-day]`（非 `.cd-collapse` 内） | `expandCalDay(dayIndex)` |
| `.masonry-item[data-pi]` | `openPostDetail(idx)` |
| `.orbit-stone[data-pi]` | 选中石子，显示原则描述 |
| 非石子、非轨道区域 | 取消石子选中 |

---

## 13. 启动流程

### 13.1 缓存破坏器
页面顶部 IIFE：检查 `location.search` 是否含 `_nc=`。如果没有，用 `location.href` 重定向到 `pathname + '?_nc=' + Date.now()`。如果有，`history.replaceState` 清除参数。

### 13.2 `init()`（DOMContentLoaded 触发）
```
1. 注册 Service Worker: navigator.serviceWorker.register('./sw.js?v=XX')
2. 预渲染四个页面:
   $('#page-home').innerHTML = renderHome(); setupOrbit()
   $('#page-trip').innerHTML = renderTrip()
   $('#page-check').innerHTML = renderDiscover()
   $('#page-settings').innerHTML = renderSettings()
3. setup(); setupOrbit()
4. 检查 store('scwelcomed3') — 是否首次访问
   是 → 隐藏 welcome，#tabBar、#mainContent 显示；切换到上次 tab 或 'home'
   否 → 不做（等用户点 enterBtn）
5. setTimeout 1800ms 后:
   - #splash 加 .hide（opacity 0）
   - 500ms 后再设 display:none
   - 首次访问 → #wPanel 加 .visible 触发入场动画
   - 触发可见 .fade-up 元素的动画
   - forcePWA() 检测是否需要添加到主屏幕
```

### 13.3 `enterApp()`
1. 隐藏 `#welcome`
2. 显示 `#tabBar`、`#mainContent`
3. `store('scwelcomed3', '1')`
4. `renderTab('home')`
5. 800ms 后 `showAppNotice()`

### 13.4 `showAppNotice()`
设 `#appNotice.style.display = 'flex'`。`#pnDismiss` 按钮点击后隐藏。**不做 localStorage 持久化跳过**，每次启动都显示。

### 13.5 `forcePWA()`
仅在非独立模式（非 PWA）且非桌面端时显示。动态创建 `#pwaForce` 遮罩，指引用户添加到主屏幕。用户可点"继续在浏览器中查看"跳过。

---

## 14. 发现页 IntersectionObserver

### `setupDiscoverReveal()`
创建 `IntersectionObserver`（threshold 0.15），监听 `.masonry-item:not(.reveal)`。元素进入视口时加 `.reveal` 类并停止观察。

---

## 15. 统计数字动画

### `animateStats()`
遍历 `.qs-val` 元素：提取数字部分（正则 `/^([\d,]+)/`），parse 为整数。设 `data-target` 属性，文本清零，调用 `countUp(el, target, 1200)` 在 1200ms 内从 0 滚动到目标值。

### `countUp(el, target, duration)`
用 `performance.now()` 计时，`requestAnimationFrame` 逐帧更新文本。进度 `p = min((now-start)/duration, 1)`，当前值 `floor(p * target)`。完成后给父元素加 `.counted` 类。

---

## 16. 设置页功能

### `bindSettings()`
- `#exportData`：将 `{days:DAYS, route:RT, principles:PR, places:PLACES}` 导出为 JSON 文件下载（Blob + `<a>` click）
- `#resetData`：确认后清除 `localStorage` 中的 `scwelcomed3`、`sctab3`、`sctheme` 三个 key

---

## 17. localStorage 使用

| Key | 用途 | 值 |
|-----|------|---|
| `scwelcomed3` | 是否完成过欢迎流程 | `'1'` 或 `null` |
| `sctab3` | 上次打开的 tab | `'home'`/`'trip'`/`'check'`/`'settings'` |
| `sctheme` | 已废弃，保留 key 名供重置 |

---

## 18. Service Worker（`sw.js`）

网络优先策略，零缓存：
```javascript
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request, {cache: 'no-store'}));
});
```

---

## 19. CLOSE_ICON 常量

必须定义为全局字符串常量：
```javascript
const CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
```
两条交叉斜线构成 X 图标。用于所有弹窗关闭按钮。

---

## 20. 关键行为约束

1. **Tab 切换**：切换时重新渲染目标页面（innerHTML 替换），不是简单的显示/隐藏
2. **石子轨道**：每次 `renderHome()` 后必须调用 `setupOrbit()`，否则石子不动
3. **日历展开**：同时只能有一个日期块展开。展开新的前必须先收起旧的
4. **弹窗关闭**：点击遮罩空白处或关闭按钮都能关闭
5. **App Notice**：每次 init 都弹出，不做 localStorage 跳过（用户明确要求）
6. **深色模式**：仅通过 `@media (prefers-color-scheme: dark)` 跟随系统，**绝对不提供手动切换开关**
7. **响应式**：768px 以下底部浮动 pill 导航，768px 以上固定左侧 sidebar
8. **安全区**：使用 `env(safe-area-inset-top)` 和 `env(safe-area-inset-bottom)` 适配刘海屏
9. **版本号**：在 sidebar footer 和设置页各显示一处，必须一致
10. **SVG 图标**：全部使用内联 SVG，Feather 风格，24x24 viewBox，stroke-width 1.8，round cap/join
11. **禁止 emoji**：任何图标或符号全部用 SVG 替代
12. **单文件**：所有 HTML/CSS/JS 在一个 `index.html` 中

---

## 21. 照片加载策略

- 所有 `<img>` 标签优先使用 `src` 指向本地 `images/` 目录
- 每张图带 `onerror` 处理器：`this.src = '{unsplash_fallback_url}'`
- Unsplash URL 格式：`https://images.unsplash.com/{photo_id}?w=1200&q=85`
- `IMG.toHTML(alt, cls)` 生成带 `loading="lazy"` 的 `<img>` 标签

---

## 22. 全局 CSS 变量（必须由 UI 设计师定义）

本文档不涉及具体色值，但以下语义变量名必须在 CSS 中定义以便 JS 引用：

```
--bg          页面背景色
--bg-img      背景图片（JS 动态设置）
--safe-t      顶部安全区
--safe-b      底部安全区
```

所有响应式断点的 CSS 逻辑由设计师自行决定，只需保证 JS 中 `isDesktop()` 的 768px 断点与 CSS 一致。

---

## 23. Tailwind CSS CDN

文件头部包含：
```html
<script src="https://cdn.tailwindcss.com"></script>
```
项目可使用 Tailwind 工具类，但不强依赖。所有自定义样式写在 `<style>` 标签中。
