# E-Commerce Order Engine Hackathon

A full-stack e-commerce order engine built with **Java Spring Boot**, **AngularJS**, and **MySQL**, implementing all 20 tasks from the hackathon problem statement.

## Project Overview

This application simulates a real-world e-commerce backend with product management, multi-user cart system, order processing, payment simulation, concurrency handling, fraud detection, and comprehensive audit logging. It demonstrates real backend behaviors including locks, events, transactions, and rollback mechanisms.

## Tech Stack

| Layer      | Technology               |
|------------|--------------------------|
| Backend    | Java 17, Spring Boot 3.2 |
| Frontend   | AngularJS 1.8, Bootstrap 5 |
| Database   | MySQL 8.0                |
| Build Tool | Apache Maven             |
| ORM        | Spring Data JPA / Hibernate |

## Features Implemented

### Task 1: Product Management
- Add new products with unique Product IDs (duplicate prevention)
- Update stock levels (stock cannot be negative)
- View all products with real-time stock status

### Task 2: Multi-User Cart System
- Separate cart per user (5 users: USER_1 to USER_5)
- Add/remove items, update quantity
- Cart syncs with inventory - cannot add more than available stock

### Task 3: Real-Time Stock Reservation
- Adding item to cart reserves stock immediately
- Removing from cart releases reserved stock
- Prevents overselling through pessimistic locking

### Task 4: Concurrency Simulation
- Simulates multiple users adding same product concurrently
- Uses `@Lock(LockModeType.PESSIMISTIC_WRITE)` for database-level locking
- Only users within available stock succeed; others fail gracefully

### Task 5: Order Placement Engine
- Converts cart to order through atomic 5-step process:
  1. Validate cart → 2. Calculate total → 3. Lock & deduct stock → 4. Process payment → 5. Clear cart

### Task 6: Payment Simulation
- Simulates payment with ~80% success rate
- Failure mode toggle for testing (100% failure)
- Failed payments trigger automatic rollback

### Task 7: Transaction Rollback System
- If any step fails, all previous steps are undone
- Stock is restored, order marked FAILED
- Uses Spring `@Transactional` for atomicity

### Task 8: Order State Machine
- Valid states: CREATED → PENDING_PAYMENT → PAID → SHIPPED → DELIVERED
- Branch states: FAILED, CANCELLED
- Invalid transitions are blocked with clear error messages

### Task 9: Discount & Coupon Engine
- Total > Rs.1000 → 10% discount
- Quantity > 3 (same product) → extra 5% bulk discount
- Coupon codes: `SAVE10` (10% off), `FLAT200` (Rs.200 off)
- Prevents invalid discount combinations

### Task 10: Inventory Alert System
- Shows products below low-stock threshold
- Prevents purchase when stock = 0
- Real-time alert dashboard in Admin panel

### Task 11: Order Management
- View all orders with search by Order ID
- Filter by status (PAID, SHIPPED, CANCELLED, etc.)
- Filter by user

### Task 12: Order Cancellation Engine
- Cancel orders with automatic stock restoration
- Cannot cancel already cancelled orders (edge case handled)
- Cannot cancel delivered orders

### Task 13: Return & Refund System
- Partial returns supported (return N of M items)
- Stock automatically restored on return
- Order total recalculated after refund

### Task 14: Event-Driven System
- Event queue: ORDER_CREATED, PAYMENT_SUCCESS, PAYMENT_FAILED, INVENTORY_UPDATED, etc.
- Events execute in order; failure stops subsequent events
- Manual event processing from Admin panel

### Task 15: Inventory Reservation Expiry
- Reserved stock expires after 15 minutes
- Scheduled task runs every 60 seconds to release expired reservations
- Automatically frees stock back to available pool

### Task 16: Audit Logging System
- Immutable audit trail for all operations
- Format: [Timestamp] USER action ENTITY details
- Filterable by user and entity type

### Task 17: Fraud Detection System
- Rule 1: 3+ orders in 1 minute → flag user
- Rule 2: Order total > Rs.50,000 → suspicious
- Flagged orders are automatically blocked

### Task 18: Failure Injection System
- Toggle payment failure mode from Admin panel
- When enabled, ALL payments fail to test rollback
- System recovers safely with stock restoration

### Task 19: Idempotency Handling
- Auto-generated UUID idempotency key per order
- Duplicate "Place Order" clicks return existing order
- Prevents duplicate order creation

### Task 20: Microservice Simulation
- Modular service architecture (loosely coupled):
  - ProductService, CartService, OrderService, PaymentService
  - DiscountService, FraudDetectionService, EventService, AuditLogService
- Clean separation of concerns

## Design Approach

- **Pessimistic Locking**: Used `@Lock(PESSIMISTIC_WRITE)` on product queries during stock operations to prevent race conditions
- **Optimistic Locking**: `@Version` field on Product entity for additional concurrency safety
- **Transactional Integrity**: Spring `@Transactional` ensures atomic order placement with automatic rollback
- **Event Sourcing**: All state changes publish events to an event log table
- **Scheduled Tasks**: `@Scheduled` for reservation expiry cleanup
- **State Machine**: Enum-based state transitions with validation map
- **RESTful API**: Clean REST endpoints following resource-based URL patterns

## Assumptions

1. User authentication is simplified (5 pre-defined users selected from UI dropdown)
2. Payment is simulated (random 80% success, or 100% failure in failure mode)
3. Currency is Indian Rupees (Rs.)
4. Reservation expiry is set to 15 minutes
5. Fraud threshold: 3 orders/minute or Rs.50,000+ order value
6. Low stock threshold defaults to 5 units (configurable per product)

## How to Run the Project

### Prerequisites
- Java 17+
- Apache Maven 3.8+
- MySQL 8.0+
- Any modern web browser

### Step 1: Set Up MySQL Database
```sql
CREATE DATABASE IF NOT EXISTS ecommerce_order_engine;
```

### Step 2: Configure Database (if needed)
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ecommerce_order_engine?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=1234
```

### Step 3: Build and Run Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
Backend starts on: http://localhost:8080

### Step 4: Run Frontend
Open `frontend/index.html` in a browser, or serve it:
```bash
cd frontend
# Using Python
python -m http.server 8081
# OR using Node.js
npx http-server -p 8081
```
Frontend runs on: http://localhost:8081

### Step 5: Use the Application
1. **Products Tab**: Add products with unique IDs and stock
2. **Cart Tab**: Select user from navbar dropdown, add items to cart
3. **Cart Tab**: Apply coupons (SAVE10 / FLAT200), preview discounts, place order
4. **Orders Tab**: View, filter, cancel orders, process returns
5. **Logs Tab**: View immutable audit trail and event queue
6. **Admin Tab**: Toggle failure mode, run concurrency simulation, process events

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/products | Add product |
| GET    | /api/products | List all products |
| PUT    | /api/products/{id}/stock | Update stock |
| GET    | /api/products/low-stock | Low stock alerts |
| POST   | /api/cart/{userId}/add | Add to cart |
| GET    | /api/cart/{userId} | View cart |
| DELETE | /api/cart/{userId}/remove/{productId} | Remove from cart |
| POST   | /api/orders/place | Place order |
| GET    | /api/orders | List all orders |
| POST   | /api/orders/{id}/cancel | Cancel order |
| POST   | /api/orders/{id}/return | Return items |
| PUT    | /api/orders/{id}/status | Update status |
| GET    | /api/logs | View audit logs |
| GET    | /api/admin/events | View events |
| POST   | /api/admin/simulate-concurrency | Run concurrency test |
| POST   | /api/admin/failure-mode | Toggle failure injection |

## Project Structure
```
engine/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/ecommerce/engine/
│       ├── EcommerceEngineApplication.java
│       ├── config/CorsConfig.java
│       ├── entity/          (Product, CartItem, Order, OrderItem, AuditLog, EventLog)
│       ├── enums/           (OrderStatus, EventType)
│       ├── repository/      (JPA repositories with custom queries)
│       ├── service/         (Business logic - 10 services)
│       ├── controller/      (REST controllers - 5 controllers)
│       └── exception/       (Global exception handling)
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── css/style.css
│   ├── services/apiService.js
│   ├── controllers/         (5 AngularJS controllers)
│   └── views/               (5 HTML view templates)
└── README.md
```
