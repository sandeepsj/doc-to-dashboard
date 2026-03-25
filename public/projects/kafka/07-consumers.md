# Consumers

*After this page, you'll understand how applications read data from Kafka — offsets, polling, and the "where did I leave off?" mechanism.*

## What a Consumer Does

A consumer is any application that reads messages from a Kafka topic. Unlike traditional queues where reading removes the message, Kafka consumers just **move a pointer** (the offset) forward.

```
Partition 0:  [0] [1] [2] [3] [4] [5] [6] [7]
                              ↑
                     Consumer's current offset = 3
                     (has read 0, 1, 2 — will read 3 next)
```

## The Poll Loop

Consumers work by repeatedly **polling** Kafka for new messages. A simplified flow:

```
while true:
    messages = consumer.poll(timeout=1000ms)
    for message in messages:
        process(message)
    consumer.commit_offsets()
```

1. **Poll** — ask Kafka for the next batch of messages
2. **Process** — do your business logic
3. **Commit** — tell Kafka you've successfully processed up to this offset

## Offsets and Committing

Kafka doesn't track what you've "read" — it tracks what you've **committed**. This is the consumer's way of saying "I'm done with everything up to offset N."

| Commit Strategy | Behavior |
|----------------|----------|
| **Auto-commit** | Kafka commits every 5 seconds automatically (default) |
| **Manual commit** | You explicitly call commit after processing |

> [!warning]
> Auto-commit can cause issues: if your app crashes after Kafka auto-commits but before you finish processing, those messages are skipped. For important workloads, use manual commit after successful processing.

## Starting Position

When a consumer starts for the first time (no committed offset), you choose where to begin:

- `earliest` — read from the very beginning of the topic
- `latest` — read only new messages from now on

> [!tip]
> Consumers poll for messages and track progress via offsets. Committing an offset means "I've processed everything up to here." Use manual commits for workloads where skipping a message would be a problem.
