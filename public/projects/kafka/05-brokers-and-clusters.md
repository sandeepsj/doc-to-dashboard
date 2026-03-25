# Brokers & Clusters

*After this page, you'll understand how Kafka runs across multiple servers and survives machine failures without losing data.*

## What's a Broker?

A **broker** is a single Kafka server. It stores partitions on disk, handles read/write requests from producers and consumers, and coordinates with other brokers.

A **cluster** is a group of brokers working together. In production, you'd typically run 3 or more brokers.

```
Kafka Cluster
├── Broker 0  (stores partitions A-0, B-1, C-2)
├── Broker 1  (stores partitions A-1, B-2, C-0)
└── Broker 2  (stores partitions A-2, B-0, C-1)
```

## Replication: Surviving Failures

Every partition has one **leader** and zero or more **follower replicas** on different brokers. All reads and writes go through the leader. Followers continuously copy data from the leader.

| Term | Meaning |
|------|---------|
| **Replication factor** | How many copies of each partition exist (typically 3) |
| **Leader** | The broker that handles all reads/writes for a partition |
| **Follower** | A broker that keeps a copy, ready to take over |
| **ISR** | In-Sync Replicas — followers that are fully caught up |

If a leader broker crashes, one of the in-sync followers is promoted to leader. Clients automatically reconnect to the new leader. No data is lost.

> [!warning]
> A replication factor of 1 means no copies — if that broker dies, the data is gone. Always use a replication factor of at least 3 in production.

## KRaft: No More ZooKeeper

Older Kafka versions required Apache ZooKeeper for cluster coordination. Since Kafka 3.3 (and default in Kafka 4.0), Kafka uses **KRaft** — a built-in consensus protocol. One fewer system to manage.

> [!tip]
> A Kafka cluster is a group of brokers. Data is replicated across brokers so that no single machine failure causes data loss. KRaft handles leader election and cluster coordination internally.
