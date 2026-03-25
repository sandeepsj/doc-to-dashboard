# Partitions

*After this page, you'll understand how Kafka splits topics for parallelism and why partition count is one of the most important decisions you'll make.*

## Why Not Just One Big Log?

A single log on a single machine has limits — disk space, write speed, read throughput. Kafka solves this by splitting each topic into **partitions**: independent, ordered sub-logs spread across different servers.

```
Topic: order-events (3 partitions)

Partition 0:  [msg0] [msg3] [msg6] [msg9]  →
Partition 1:  [msg1] [msg4] [msg7] [msg10] →
Partition 2:  [msg2] [msg5] [msg8] [msg11] →
```

Each partition is a separate, ordered sequence. More partitions = more parallelism.

## How Messages Land in Partitions

When a producer sends a message, Kafka decides which partition it goes to:

| Scenario | Partition Assignment |
|----------|---------------------|
| Message has a **key** | `hash(key) % num_partitions` — same key always goes to the same partition |
| No key | Round-robin across partitions |
| Custom partitioner | Your code decides |

> [!warning]
> Messages are ordered **within a partition**, but there's **no ordering guarantee across partitions**. If order matters for a set of messages (like all events for one user), give them the same key.

## Offsets

Each message in a partition gets a sequential number called an **offset**. Offsets start at 0 and only increase.

```
Partition 0:  [offset 0] [offset 1] [offset 2] [offset 3]
```

Consumers track which offset they've read up to. This is how Kafka knows where you left off — more on this in the Consumers lesson.

## Choosing Partition Count

- More partitions → higher throughput (more parallel consumers)
- More partitions → more resources on brokers
- You **can** increase partitions later, but existing keyed messages won't redistribute

> [!tip]
> Start with the number of partitions equal to your expected max consumers. You can always add more later — but you can't reduce them.
