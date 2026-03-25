# Your First Cluster

*After this page, you'll have a running Kafka cluster on your machine — using Docker and KRaft mode (no ZooKeeper needed).*

## What You Need

- Docker and Docker Compose installed
- A terminal
- ~5 minutes

## The Docker Compose File

Create a file called `docker-compose.yml`:

```yaml
services:
  kafka:
    image: apache/kafka:4.0.0
    container_name: kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_LOG_DIRS: /tmp/kraft-logs
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qg
```

> [!note]
> This uses KRaft mode — the `KAFKA_PROCESS_ROLES` includes both `broker` and `controller` in one node. No separate ZooKeeper container needed.

## Start It Up

```bash
docker compose up -d
```

Verify it's running:

```bash
docker compose logs kafka | grep "started"
```

You should see a line like: `Kafka Server started`.

## Quick Sanity Check

List available topics (there won't be any yet — that's fine):

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

If this returns without error, your cluster is ready.

## Shutting Down

```bash
docker compose down
```

> [!tip]
> You now have a single-node Kafka cluster running in KRaft mode. Keep it running — you'll use it in the next lesson to produce and consume your first messages.
