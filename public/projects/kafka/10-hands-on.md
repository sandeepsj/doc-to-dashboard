# Produce & Consume Messages

*After this page, you'll have created a topic, sent messages into it, and read them back — all from the command line.*

## Create a Topic

With your Docker cluster running from the previous lesson:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --topic my-first-topic \
  --partitions 3 \
  --replication-factor 1
```

Expected output:

```
Created topic my-first-topic.
```

Verify it exists:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic my-first-topic
```

## Produce Messages

Open a terminal and start the console producer:

```bash
docker exec -it kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic my-first-topic
```

Type some messages, pressing Enter after each:

```
hello kafka
this is my second message
event-driven systems are cool
```

Press `Ctrl+C` to exit.

## Consume Messages

In another terminal, start a consumer from the beginning:

```bash
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic my-first-topic \
  --from-beginning
```

Expected output:

```
hello kafka
this is my second message
event-driven systems are cool
```

> [!note]
> The `--from-beginning` flag sets the starting offset to `earliest`. Without it, you'd only see new messages produced after the consumer starts.

## What Just Happened

1. You **created** a topic with 3 partitions
2. You **produced** messages — they were distributed across partitions
3. You **consumed** all messages from the beginning

> [!tip]
> You've just completed the core Kafka workflow: create a topic, produce messages, consume messages. Everything else in Kafka builds on this loop.
