# Topics & Messages

*After this page, you'll know how Kafka organizes data into topics and what a message actually looks like on the wire.*

## Topics Are Named Streams

A **topic** is just a named category for a stream of events. You pick the name. It's like a folder for related events.

```
user-signups       ← every new user registration
order-events       ← every order placed, shipped, returned
page-views         ← every page a user visits
```

Topics are **append-only logs**. New messages are always added to the end. You can't insert or update a message in the middle — this is what makes Kafka fast.

## Anatomy of a Message

Every message (also called a **record**) in Kafka has these parts:

| Part | Required | Purpose |
|------|----------|---------|
| **Key** | Optional | Routes message to a specific partition |
| **Value** | Yes | The actual data (JSON, Avro, Protobuf, plain text) |
| **Timestamp** | Auto | When the message was produced |
| **Headers** | Optional | Metadata key-value pairs |
| **Offset** | Auto | Sequential ID assigned by Kafka |

The **value** is where your data lives. Kafka treats it as opaque bytes — it doesn't care about format. Most teams use JSON for simplicity or Avro for schema enforcement.

## Retention: Messages Don't Disappear After Reading

Unlike traditional message queues, Kafka **keeps messages after they're consumed**. For how long? You decide:

- **Time-based**: keep for 7 days (default)
- **Size-based**: keep up to 1 GB per partition
- **Compact**: keep only the latest value per key

This means multiple consumers can read the same data, and new consumers can start from the beginning.

> [!tip]
> A topic is an append-only log of messages. Messages persist based on your retention policy — not based on whether someone read them. This is a key difference from traditional queues.
