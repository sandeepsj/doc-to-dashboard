# Thinking in Events

*After this page, you'll understand the mental shift from "do this now" to "this happened" — the foundation of everything Kafka does.*

## Two Ways to Build Systems

Most systems you've built use **request/response**: "Hey payment service, charge this card and tell me if it worked." The caller waits. The receiver must be available right now.

Kafka uses a different model: **event-driven**. Instead of telling services what to do, you announce what happened. "An order was placed." Any service that cares can react to it — now or later.

## What's an Event?

An event is a record of something that happened. It has:

| Field | Example |
|-------|---------|
| **Key** | `user-123` |
| **Value** | `{"action": "order_placed", "amount": 59.99}` |
| **Timestamp** | `2026-03-25T10:30:00Z` |
| **Headers** | `source: checkout-service` |

Events are **facts**. They're immutable — once something happened, it happened. You don't update an event; you create a new one.

## Why This Matters

With request/response, the sender decides who needs the data. With events, the **receivers** decide if they care.

- Payments service sees "order placed" → charges the card
- Inventory service sees "order placed" → reserves stock
- Analytics service sees "order placed" → updates dashboards
- Fraud service sees "order placed" → runs risk checks

The checkout service didn't need to know about any of them. It just announced what happened.

> [!important]
> The core mental shift: stop thinking "tell service X to do Y" and start thinking "announce that Z happened." This decoupling is why Kafka scales so well.

> [!note]
> **Self-check:** If a new "loyalty points" service needs to award points on every order, what changes in the checkout service? (Answer: nothing — the new service just subscribes to the same events.)
