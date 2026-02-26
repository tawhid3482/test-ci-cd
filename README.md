# Code-Base Backend Documentation (Frontend Ready)

## 1. Project Overview
- Stack: `Node.js`, `Express`, `TypeScript`, `Prisma`, `MongoDB`
- Base API prefix: `/api/v1`
- Auth style: `HttpOnly Cookie` (`accessToken`, `refreshToken`)
- Main response format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "meta": null,
  "data": {}
}
```

## 2. Run Backend

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

Production:

```bash
npm run build
npm start
```

## 3. Required Environment Variables
Create `.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_mongodb_url

JWT_ACCESS_SECRET=your_access_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRED=30d
BCRYPT_SALT_ROUND=12

EMAIL_SENDER_SMTP_USER=your_email
EMAIL_SENDER_SMTP_PASS=your_email_app_password
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com

FRONTEND_URL=http://localhost:3000

# Optional (for super admin seed)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=strong_password
SUPER_ADMIN_PHONE=0123456789
SUPER_ADMIN_NAME=Super Admin
```

## 4. Frontend Integration Rules
- Always send requests with credentials.
- Axios config must include `withCredentials: true`.
- Use JSON body.

Example frontend client:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
```

## 5. Auth Flow (Recommended for Frontend)
1. `POST /auth/login`
2. Backend sets `accessToken` + `refreshToken` cookie
3. Protected API call with same axios client (`withCredentials: true`)
4. If access token expires, call `POST /auth/refresh-token`
5. On app load, call `GET /auth/session`
6. On logout, call `POST /auth/logout`

## 6. API Endpoints
Base URL example: `http://localhost:5000/api/v1`

### 6.1 Auth
- `POST /auth/send-otp`
- `POST /auth/resend-otp`
- `POST /auth/verify-otp`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `POST /auth/change-password` (auth required)
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/session`

#### Login
`POST /auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Change Password
`POST /auth/change-password`

```json
{
  "oldPassword": "old_password",
  "newPassword": "new_password_123"
}
```

#### Forgot Password
`POST /auth/forgot-password`

```json
{
  "email": "user@example.com"
}
```

#### Reset Password
`POST /auth/reset-password`

```json
{
  "token": "token_from_reset_link",
  "newPassword": "new_password_123"
}
```

#### OTP APIs
`POST /auth/send-otp`

```json
{
  "email": "newuser@example.com",
  "name": "New User"
}
```

`POST /auth/verify-otp`

```json
{
  "email": "newuser@example.com",
  "otp": "123456"
}
```

### 6.2 User
- `POST /user/signup`
- `GET /user/allUsers` (ADMIN, SUPER_ADMIN)
- `GET /user/me` (authenticated)

#### Signup
`POST /user/signup`

```json
{
  "name": "John",
  "email": "john@example.com",
  "phone": "01700000000",
  "password": "password123",
  "gender": "Male",
  "avatar": "https://example.com/avatar.png",
  "acceptTerms": true
}
```

### 6.3 Categories
- `POST /categories/create` (ADMIN, SUPER_ADMIN)
- `GET /categories/`
- `PATCH /categories/update/:categoryId` (ADMIN, SUPER_ADMIN)
- `DELETE /categories/delete/:categoryId` (ADMIN, SUPER_ADMIN)

Create/Update body:

```json
{
  "name": "Electronics",
  "image": "https://example.com/cat.png"
}
```

### 6.4 Products
- `POST /products/create` (ADMIN, SUPER_ADMIN)
- `GET /products/`
- `GET /products/:productId`
- `PATCH /products/update/:productId` (ADMIN, SUPER_ADMIN)
- `DELETE /products/delete/:productId` (ADMIN, SUPER_ADMIN)

Create body:

```json
{
  "name": "Laptop",
  "description": "Powerful laptop with 16GB RAM",
  "price": 1200,
  "stock": 20,
  "images": ["https://example.com/p1.png"],
  "categoryId": "mongodb_object_id"
}
```

Update body: same fields optional.

### 6.5 Contact
- `POST /contact/create-contact`
- `GET /contact/` (ADMIN, SUPER_ADMIN)

Create body:

```json
{
  "title": "Need help",
  "message": "I need support with payment",
  "email": "user@example.com",
  "priority": "Normal"
}
```

### 6.6 Web Settings
- `POST /settings/create-web-setting` (ADMIN, SUPER_ADMIN)
- `GET /settings/`

Body fields (all optional):
- `primaryColor`, `secondaryColor`, `accentColor`
- `textColor`, `textSecondary`
- `background`, `cardBg`, `borderColor`
- `hoverPrimary`, `hoverSecondary`, `hoverAccent`
- `btnBg`, `btnHover`, `btnActive`, `btnText`
- `fb_pixel`, `google_tag_manager`

### 6.7 Notification
- `POST /notification/save-token` (authenticated)
- `POST /notification/send` (ADMIN, SUPER_ADMIN)
- `POST /notification/test/:userId` (ADMIN, SUPER_ADMIN)
- `GET /notification/user` (authenticated)
- `PUT /notification/read/:userNotificationId` (authenticated)
- `POST /notification/sync` (authenticated)

Save token body:

```json
{
  "token": "device_fcm_token",
  "platform": "web"
}
```

Send notification body:

```json
{
  "title": "Offer",
  "message": "New discount available",
  "type": "info",
  "target_audience": "All"
}
```

## 7. Frontend Command Examples

### Login
```ts
await api.post("/auth/login", {
  email: "user@example.com",
  password: "password123",
});
```

### Get Current User Session
```ts
const { data } = await api.get("/auth/session");
```

### Refresh Access Token
```ts
await api.post("/auth/refresh-token");
```

### Create Product (Admin)
```ts
await api.post("/products/create", {
  name: "Laptop",
  description: "Powerful laptop with 16GB RAM",
  price: 1200,
  stock: 20,
  images: ["https://example.com/p1.png"],
  categoryId: "mongodb_object_id",
});
```

### Global Axios 401 Retry (optional)
```ts
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await api.post("/auth/refresh-token");
        return api.request(error.config);
      } catch {
        // redirect to login
      }
    }
    return Promise.reject(error);
  },
);
```

## 8. Role Access Summary
- `USER`: profile, auth, own notifications
- `MANAGER`: user-level + manager allowed notification endpoints
- `ADMIN`: all management endpoints
- `SUPER_ADMIN`: full access

## 9. Notes for Frontend Team
- If browser blocks cookie, verify:
  - frontend request has `withCredentials: true`
  - backend CORS origin matches frontend URL
  - in production, HTTPS is enabled (`secure cookie`)
- For reset password UI, frontend should read `token` from query string and call `/auth/reset-password`.
- API has rate limiting on auth routes and globally.

