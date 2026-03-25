# What's Next

*A recap of everything you've learned and where to go from here.*

## What You Now Know

Over 11 lessons, you've built a solid mental model of Kafka:

| Concept | One-Line Summary |
|---------|-----------------|
| Events | Immutable facts — "this happened" |
| Topics | Named, append-only streams of events |
| Partitions | Parallel sub-logs within a topic |
| Brokers | Servers that store and serve partitions |
| Replication | Copies across brokers for fault tolerance |
| Producers | Write messages with keys, acks, and batching |
| Consumers | Read messages by tracking offsets |
| Consumer Groups | Share partition workload across consumers |
| KRaft | Built-in consensus replacing ZooKeeper |

You also set up a running cluster and produced/consumed your first messages.

## Topics to Explore Next

**Kafka Streams** — a library for building stream processing applications directly on Kafka. Filter, transform, aggregate, and join streams in real time.

**Schema Registry** — enforce data contracts on your topics using Avro, Protobuf, or JSON Schema. Prevents producers from breaking consumers with schema changes.

**Kafka Connect** — pre-built connectors to move data between Kafka and external systems (databases, S3, Elasticsearch) without writing code.

**Security** — authentication (SASL), authorization (ACLs), and encryption (TLS) for production deployments.

## Recommended Resources

- **Official docs** — kafka.apache.org/documentation
- **Confluent Developer** — developer.confluent.io (free courses, tutorials)
- **Book** — *Kafka: The Definitive Guide* (O'Reilly, 2nd Edition)
- **Practice** — Build a small event-driven project: an order system, a chat app, or a real-time dashboard

> [!tip]
> You have the foundations. The best way to solidify this knowledge is to build something. Pick a small project, wire it up with Kafka, and watch the concepts click into place.
