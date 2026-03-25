# Consumer Groups

*After this page, you'll understand how Kafka lets multiple consumers share the work of reading a topic — and what happens when consumers join or leave.*

## The Scaling Problem

One consumer reading a topic with 6 partitions is a bottleneck. You want parallelism — but you also don't want two consumers processing the same message.

Kafka's answer: **consumer groups**.

## How It Works

A consumer group is a set of consumers sharing a `group.id`. Kafka assigns each partition to exactly one consumer in the group. No two consumers in the same group read the same partition.

```
Topic: orders (4 partitions)
Consumer Group: "order-processor"

Consumer A  ←  Partition 0, Partition 1
Consumer B  ←  Partition 2
Consumer C  ←  Partition 3
```

Each consumer handles its assigned partitions independently. Together, the group processes the entire topic in parallel.

## The Assignment Rules

| Consumers | Partitions | What Happens |
|-----------|-----------|--------------|
| 2 consumers | 4 partitions | Each gets 2 partitions |
| 4 consumers | 4 partitions | Each gets 1 partition (ideal) |
| 6 consumers | 4 partitions | 4 active, 2 idle (wasted) |

> [!warning]
> Adding more consumers than partitions doesn't help — the extras sit idle. Scale partitions first, then consumers.

## Rebalancing

When a consumer joins or leaves the group, Kafka **rebalances** — reassigns partitions across the remaining consumers. This happens automatically.

Triggers for rebalancing:
- A new consumer joins the group
- An existing consumer crashes or disconnects
- Topic partitions are added

During rebalancing, there's a brief pause in consumption. Modern Kafka uses **cooperative rebalancing** to minimize disruption — only the affected partitions pause.

## Multiple Groups, Same Topic

Different consumer groups read the same topic **independently**. Each group maintains its own offsets.

```
Topic: orders
├── Group "payment-service"   ← reads all messages, own offsets
├── Group "analytics"         ← reads all messages, own offsets
└── Group "fraud-detection"   ← reads all messages, own offsets
```

> [!tip]
> A consumer group divides partitions among its members for parallel processing. Different groups read the same data independently. Never exceed partitions with consumers — the extras go idle.
