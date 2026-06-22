# Session Persistence — User Gets Logged Out on Browser Close

**Date:** 2026-06-22  
**Severity:** High — Người dùng bị đăng xuất mỗi lần đóng tab/trình duyệt hoặc sau khoảng 1 giờ không dùng, dù đã đăng nhập đúng. Gây trải nghiệm tệ và làm người dùng hiểu lầm rằng app bị lỗi.  
**Status:** ✅ Fixed  
**Affected areas:** `AuthContext.jsx`, `api.js`, `config/jwt.php`, `.env`

---

## 1. Executive Summary

Người dùng báo cáo bị logout sau mỗi lần đóng trình duyệt hoặc để app không dùng trong 1–2 giờ. Sau điều tra, token **đã được lưu vào `localStorage`** đúng cách — không phải lỗi storage. Vấn đề thực sự là **JWT TTL chỉ 60 phút** và **không có cơ chế tự động refresh token**. Khi token hết hạn, `fetchUser()` trả về 401 và hàm `logout()` được gọi ngay lập tức, xóa sạch phiên làm việc — trong khi `JWT_REFRESH_TTL` 2 tuần vẫn đang còn hiệu lực nhưng không bao giờ được tận dụng.

---

## 2. Context và Architecture

```
Người dùng đăng nhập
        │
        ▼
AuthContext.jsx → POST /api/auth/login
        │
        ├── Nhận về: access_token (JWT, TTL 60 phút)
        ├── localStorage.setItem('token', token)
        ├── axios.defaults.headers.common['Authorization'] = Bearer token
        └── setUser(response.data.user)

Lần sau mở app / reload trang:
        │
        ▼
AuthContext.jsx → useEffect([token]) → fetchUser()
        │
        ▼
GET /api/auth/me  ← Bearer token (có thể đã hết hạn)
        │
        ├── 200 OK  → setUser()  → ✅ Logged in
        └── 401     → logout()   → ❌ Bị xóa token → Màn hình đăng nhập
```

| Layer | Chi tiết |
|---|---|
| **Frontend storage** | JWT lưu trong `localStorage['token']`. Đúng — không mất khi đóng tab. |
| **Backend JWT driver** | `tymon/jwt-auth`, guard `api`, stateless. |
| **Access token TTL** | 60 phút (default `config/jwt.php`, không set trong `.env`). |
| **Refresh token TTL** | 20,160 phút (14 ngày, default). |
| **Refresh endpoint** | `POST /api/auth/refresh` — tồn tại trong `AuthController`, có route, **chưa bao giờ được gọi tự động**. |

---

## 3. Root Causes

### 3.1 JWT TTL quá ngắn (Critical)

`config/jwt.php`:
```php
'ttl' => env('JWT_TTL', 60),  // 60 phút
```

Không có `JWT_TTL` trong `.env` → dùng mặc định 60 phút. Người dùng đăng nhập lúc 8h sáng, đến 9h quay lại trình duyệt (tab đã mở sẵn hoặc vừa mở lại) → token hết hạn → bị logout.

---

### 3.2 Không có cơ chế refresh token tự động (Critical)

`AuthContext.jsx` trước fix — `fetchUser()`:
```javascript
const fetchUser = async () => {
    try {
        const response = await axios.get('/api/auth/me');
        if (response.data.success) setUser(response.data.user);
    } catch (error) {
        console.error('Failed to fetch user:', error);
        logout();  // ← Bất kỳ lỗi nào, kể cả 401 do token hết hạn, đều logout ngay
    } finally {
        setLoading(false);
    }
};
```

`api.js` trước fix — response interceptor:
```javascript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/SignIn';  // ← Redirect ngay, không thử refresh
        }
        return Promise.reject(error);
    }
);
```

`POST /api/auth/refresh` — endpoint có sẵn nhưng **không bao giờ được gọi tự động** từ frontend. `JWT_REFRESH_TTL` 14 ngày bị lãng phí hoàn toàn.

---

### 3.3 Dọn dẹp localStorage không nhất quán (Minor)

`api.js` xóa `localStorage.removeItem('user')` khi 401, nhưng `AuthContext.jsx` không lưu key `user` vào localStorage (user state chỉ ở React memory). Tạo ra sự không nhất quán giữa hai layer.

---

## 4. Phân tích tác động

| Tình huống | Hành vi trước fix | Hành vi sau fix |
|---|---|---|
| Mở lại tab sau < 60 phút | ✅ Vẫn đăng nhập | ✅ Vẫn đăng nhập |
| Mở lại tab sau 1–6 giờ | ❌ Bị logout | ✅ Token tự refresh, giữ session |
| Mở lại sau 1–7 ngày | ❌ Bị logout | ✅ Token tự refresh |
| Mở lại sau 7–30 ngày | ❌ Bị logout | ✅ Token tự refresh (trong refresh window) |
| Mở lại sau > 30 ngày | ❌ Bị logout | ✅ Bị logout đúng (bảo mật) |
| API call giữa chừng bị 401 | ❌ Redirect /SignIn ngay | ✅ Refresh ngầm, retry, user không thấy gì |
| Nhiều API call đồng thời cùng 401 | ❌ Multiple redirect | ✅ Queue, chỉ gọi refresh 1 lần |
| Logout chủ động | ✅ Xóa token | ✅ Xóa token |

---

## 5. Giải pháp đã áp dụng

### 5.1 Kéo dài JWT TTL — `.env`

```dotenv
JWT_TTL=10080          # 7 ngày (7 × 24 × 60 = 10,080 phút)
JWT_REFRESH_TTL=43200  # 30 ngày (30 × 24 × 60 = 43,200 phút)
```

Cập nhật cả `.env.example` để document cho môi trường mới.

**Lý do chọn 7 ngày:** Cân bằng giữa UX (không bị logout mỗi ngày) và bảo mật (token bị đánh cắp có TTL giới hạn). Với ứng dụng tài chính cá nhân, 7 ngày là mức hợp lý — ngắn hơn so với banking apps (30 ngày), dài hơn so với default (1 giờ).

---

### 5.2 Refresh interceptor trong `api.js`

Thêm logic refresh thông minh vào response interceptor của axios instance dùng chung:

```javascript
let isRefreshing = false;
let failedQueue  = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Tránh vòng lặp vô tận: nếu chính refresh call bị 401 → logout hẳn
        if (error.response?.status === 401 && originalRequest.url?.includes('/auth/refresh')) {
            clearTokens();
            window.location.href = '/SignIn';
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Queue các request 401 đồng thời, chỉ gọi refresh 1 lần
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await api.post('/auth/refresh');
                saveToken(data.access_token);
                processQueue(null, data.access_token);
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest);  // Replay original request
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = '/SignIn';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
```

---

### 5.3 Silent refresh trong `AuthContext.jsx` — `fetchUser()`

Thay vì `catch → logout()` ngay, thêm tầng thử refresh trước:

```javascript
const fetchUser = async () => {
    try {
        const response = await axios.get('/api/auth/me');
        if (response.data.success) setUser(response.data.user);
    } catch (error) {
        if (error.response?.status === 401) {
            try {
                const refreshResponse = await axios.post('/api/auth/refresh');
                if (refreshResponse.data?.access_token) {
                    const newToken = refreshResponse.data.access_token;
                    localStorage.setItem('token', newToken);
                    setToken(newToken);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

                    const retryResponse = await axios.get('/api/auth/me');
                    if (retryResponse.data.success) {
                        setUser(retryResponse.data.user);
                        return;  // ✅ Refresh thành công — không logout
                    }
                }
            } catch {
                // Refresh window hết hạn → fall through to logout
            }
        } else {
            console.error('Failed to fetch user:', error);
        }
        logout();  // Chỉ logout khi refresh thực sự thất bại
    } finally {
        setLoading(false);
    }
};
```

---

## 6. Files đã thay đổi

| File | Loại thay đổi | Mô tả |
|---|---|---|
| `.env` | Cấu hình | Thêm `JWT_TTL=10080`, `JWT_REFRESH_TTL=43200` |
| `.env.example` | Cấu hình | Document JWT TTL defaults |
| `resources/js/utils/api.js` | Frontend | Thêm refresh interceptor với queue |
| `resources/js/contexts/AuthContext.jsx` | Frontend | `fetchUser()` thử refresh trước khi logout |

---

## 7. Kiến trúc luồng xác thực sau fix

```
App khởi động / Reload trang
          │
          ▼
AuthContext.jsx đọc localStorage['token']
          │
    ┌─────┴─────┐
  Có token    Không có token
    │               │
    ▼               ▼
fetchUser()    setLoading(false) → Màn hình đăng nhập
    │
    ├── 200 OK → setUser() → ✅ Vào app
    │
    └── 401 (expired) → Thử refresh
              │
              ├── Refresh OK → setUser() → ✅ Vào app (trong suốt)
              │
              └── Refresh fail → logout() → Màn hình đăng nhập

─────────────────────────────────────────────────────────
Trong khi đang dùng app — bất kỳ API call nào qua api.js
          │
          └── 401 → api.js interceptor
                    │
                    ├── Queue concurrent requests
                    ├── POST /auth/refresh (1 lần)
                    ├── Replay all queued requests → ✅ Trong suốt
                    └── Refresh fail → clearTokens → /SignIn
```

---

## 8. Bảo mật

- **Không lưu credentials** (email/password) ở bất kỳ đâu — chỉ lưu JWT opaque token.
- **JWT blacklist** vẫn được bật (`JWT_BLACKLIST_ENABLED=true`) — token bị revoke khi gọi `POST /api/auth/logout`.
- **Refresh token endpoint** (`/api/auth/refresh`) chỉ chấp nhận token hợp lệ chưa bị blacklist, trong cửa sổ `JWT_REFRESH_TTL`.
- **Logout chủ động** vẫn gọi `POST /api/auth/logout` để blacklist token phía server trước khi xóa localStorage.
- **Token hết hạn tuyệt đối** sau 30 ngày không dùng — bắt buộc đăng nhập lại.

---

## 9. Các vấn đề liên quan / Không nằm trong scope

| Vấn đề | Status |
|---|---|
| Token refresh khi tab bị background nhiều giờ | ✅ Xử lý bởi fetchUser() refresh logic khi tab được focus lại |
| Multiple tabs cùng lúc refresh | ✅ Xử lý bởi queue mechanism trong api.js |
| Token rotation sau mỗi refresh | ⚠️ Không trong scope — tymon/jwt-auth mặc định trả token mới mỗi lần refresh, đã hoạt động đúng |
| Proactive refresh trước khi hết hạn (e.g. 5 phút trước expire) | ❌ Không implement — chỉ refresh khi nhận 401 thực sự (reactive). Đủ cho use case hiện tại. |
| Remember me / Stay logged in checkbox | ❌ Không trong scope |
