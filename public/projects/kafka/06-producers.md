# Producers

*After this page, you'll know how data gets into Kafka — how producers send messages, choose partitions, and guarantee delivery.*

## What a Producer Does

A producer is any application that writes messages to a Kafka topic. It connects to the cluster, picks a topic, and sends data. That's it.

```
Your App (Producer)
    │
    ├─ sends to → Topic: order-events, Partition 0
    ├─ sends to → Topic: order-events, Partition 1
    └─ sends to → Topic: order-events, Partition 2
```

The producer handles serialization (converting your object to bytes), partition selection, and batching internally.

## The Send Flow

1. **Serialize** — convert key and value to bytes (e.g., JSON → byte array)
2. **Partition** — choose which partition (by key hash or round-robin)
3. **Batch** — buffer messages and send them in batches for efficiency
4. **Send** — transmit the batch to the partition leader broker
5. **Ack** — wait for acknowledgment based on your `acks` setting

## Acknowledgment Levels

The `acks` setting controls durability guarantees:

| Setting | Behavior | Trade-off |
|---------|----------|-----------|
| `acks=0` | Don't wait for any confirmation | Fastest, but messages can be lost |
| `acks=1` | Wait for leader to write it | Balanced — lost only if leader dies before replication |
| `acks=all` | Wait for all in-sync replicas | Slowest, but no data loss |

> [!warning]
> `acks=0` is rarely appropriate. Use `acks=all` for anything you can't afford to lose (financial transactions, orders). Use `acks=1` for high-throughput, loss-tolerant data (clickstream, logs).

## Keys Drive Partition Placement

If you set a message key, all messages with that key go to the same partition. This guarantees ordering for that key.

```
key: "user-42"  →  hash("user-42") % 3  →  Partition 1
key: "user-42"  →  always Partition 1
key: "user-99"  →  hash("user-99") % 3  →  Partition 0
```

> [!tip]
> Producers batch, serialize, and route messages to partition leaders. Use `acks=all` for safety. Use message keys when you need ordering guarantees per entity.
