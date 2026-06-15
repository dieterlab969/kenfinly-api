# FEATURE SPECIFICATION DOCUMENT: USECASE006
## MODERN PWA DASHBOARD INTERFACE TRANSFORMATION

| Attribute | Specification Value |
| :--- | :--- |
| **Feature Code** | usecase006_modern_dashboard_interface |
| **Project** | KenFinly Personal Financial Management System |
| **Applied Version** | Production V2 (Upgraded from original design blueprint) |
| **Default Language** | Vietnamese (Strict Localized App Interface) |
| **Last Updated** | June 15, 2026 |

---

## 1. USER STORY

* **As a:** Registered user of the KenFinly financial system (e.g., Jessica).
* **I want to:** Automatically land on a modern PWA Dashboard screen immediately after a successful login, which inherits the Premium Indigo visual style of the PayFast template while preserving 100% of my production ledger data and structural widget hierarchy.
* **So that I can:** Instantly evaluate my net asset status, compare income-to-expense distribution ratios between the current and previous months via intuitive semi-circle arc charts, and monitor cash flow trends without disrupting my established operational workflows in the production environment.

---

## 2. ACCEPTANCE CRITERIA

### Scenario 1: Information Hierarchy Rendering at Screen 1 (Top Part / Fold 1)
* **AC 1.1:** The top Header bar must strictly retain the template's original layout structure: small KenFinly logo on the far left, 'Dashboard' title string in the center, and the Notification Bell icon alongside the Hamburger Menu icon on the far right. No other foreign scripts should be rendered except technical English labels inherent to the template framework.
* **AC 1.2:** A personalized Vietnamese welcome text must be rendered immediately below the Header bar displaying the user's active profile name: `Chào Jessica,`.
* **AC 1.3:** The net asset balance must be displayed in a large, prominent, bold font against the Indigo background canvas: `-1.048.546.322 đ`. Directly beneath this figure, an explicit identifier label must state: `TỔNG SỐ TIỀN SỞ HỮU`.
* **AC 1.4:** The `Sơ lược` (Month Overview) widget must be rendered as a single large rounded Card container, divided internally into two parallel comparison columns mapping the two most recent consecutive months:
  * **Current Month Column ("Tháng Này - Tháng 06, 2026"):** Instantiate a dynamic semi-circle arc chart (half-donut layout). Render localized color distributions: red representing Expense categories (occupying the absolute majority of the arc arc area, approx. 87%) and green representing Income streams (approx. 13%). Accompany this with detailed monetary data text: `Thu nhập: 15.993k đ`, `Chi phí: -308.825k đ`, and `Tổng cộng: -292.832k đ` (font coloring must dynamically map the positive/negative traits of the cash ledger streams).
  * **Previous Month Column ("Tháng Trước - Tháng 05, 2026"):** Emulate an empty or un-synchronized data state. The semi-circle arc chart must display as a solid, flat grey arc (0% color state). Accompany this with muted grey placeholder labels: `Thu nhập: 0 đ`, `Chi phí: 0 đ`, and `Tổng cộng: 0 đ`.
* **AC 1.5:** The `Chi tiêu - 7 ngày qua` (Weekly Spending) chart widget must sit right below the main month summary card. It must render a vertical bar layout mapping Monday through Sunday. Crucially, the column corresponding to Friday must be colored in deep alert-red to flag spending spikes and map a steady active tooltip popup showing the absolute value: `Số tiền: 6.342.324 đ`.

### Scenario 2: Data Stream Rendering on Scroll to Screen 2 (Bottom Part / Fold 2)
* **AC 2.1:** The `Số dư lịch sử` (Historical Balance) widget must render an ongoing Line Chart mapping the historical asset trends across long-term evaluation points (T12/2025, T02/2026, T04/2026, T06/2026). The graph line must map a permanently pinned active tooltip pointing to January 2026 reading: `Số dư: -1.044.880.843 đ`.
* **AC 2.2:** The `Giao dịch gần đây` (Recent Transactions) transaction ledger ledger must fit right beneath the historical line trend graph, cleanly listing recent daily flows explicitly localized in Vietnamese (e.g., `Cà phê sáng - Ẩm thực: -45.000đ`; `Lương tháng 06 - Thu nhập: +22.000.000đ`; `Điện lực HCM - Hóa đơn: -1.250.000đ`...).
* **AC 2.3:** The fixed Bottom Navigation Bar must layer securely at the very bottom edge of the PWA viewport, locking its navigational label bindings 100% into Vietnamese: `Trang chủ` \| `Phân tích` \| `THÊM NHANH` \| `Mục tiêu` \| `Báo cáo`.
* **AC 2.4:** The central prominent black circle button on the navigation frame acts as the primary FAB (+). When tapped, the system triggers Menu State 1: projecting two smaller floating circular action tokens immediately above it. These tokens consist of a Green Button (labeled `+VND` to register incoming revenue flows) and a Red Button (labeled `-VND` to capture immediate expenses). Tapping the Red Button must call a dedicated, separate modal overlay displaying the distinct Expense Intake Form.

---

## 3. MAIN FLOW OF EVENTS

1. The user logs into the KenFinly PWA application successfully using secure credentials.
2. The core application context initializes and maps the routing sequence to load the primary `DashboardScreen.tsx` component while querying the Laravel API endpoint.
3. The viewport builds the initial fold (Screen 1): The user sees the top header frame, user welcome string, net assets display, the consolidated "Sơ lược" MoM card containing the parallel arc charts (active color distributions on the left, grey state on the right), and the weekly bar chart.
4. The user scrolls downward or swipes upward on a mobile touch screen element (Scroll Down action).
5. The UI view shifts fluidly, exposing the continuous Historical Balance line chart, followed by the localized transaction ledger at the base, while keeping the main Bottom Nav frame statically locked to the screen edge.
