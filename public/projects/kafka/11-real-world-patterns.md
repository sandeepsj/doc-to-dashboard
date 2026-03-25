# Real-World Use Cases

*After this page, you'll recognize the common patterns where Kafka shines in production systems.*

## 1. Microservice Communication

Instead of services calling each other directly via HTTP, they communicate through Kafka topics. When the order service creates an order, it publishes an event. Payment, inventory, and notification services each consume it independently.

**Why it works:** Services can be deployed, scaled, and updated independently. If one goes down, messages wait in Kafka until it recovers.

## 2. Event Sourcing

Instead of storing the current state of an object, you store every event that happened to it. A bank account isn't "balance: $500" — it's a sequence of deposits and withdrawals.

```
account-events (key: account-123)
├── offset 0: AccountOpened { initial: 0 }
├── offset 1: Deposited { amount: 1000 }
├── offset 2: Withdrawn { amount: 300 }
└── offset 3: Deposited { amount: 200 }
```

Replay the events to reconstruct the current state at any point in time.

## 3. Change Data Capture (CDC)

Capture every change in your database and stream it to Kafka. Tools like Debezium read the database transaction log and produce events for every INSERT, UPDATE, and DELETE.

| Database Change | Kafka Event |
|----------------|-------------|
| New row in `users` table | `user-created` event |
| Updated email address | `user-updated` event |
| Deleted account | `user-deleted` event |

**Why it works:** Downstream systems (search indexes, caches, data warehouses) stay in sync without polling the database.

## 4. Real-Time Analytics

Stream clickstream data, IoT sensor readings, or application metrics through Kafka into analytics systems. Process and aggregate in real time instead of waiting for nightly batch jobs.

## 5. Log Aggregation

Collect logs from hundreds of services into Kafka topics, then route them to Elasticsearch, S3, or a monitoring tool. Kafka acts as a buffer that absorbs traffic spikes.

> [!tip]
> Kafka's most common patterns are: decoupling microservices, event sourcing, change data capture from databases, real-time analytics pipelines, and centralized log collection.
