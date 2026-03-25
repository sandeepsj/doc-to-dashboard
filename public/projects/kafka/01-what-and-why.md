# What Is Kafka & Why It Exists

*After this page, you'll understand the core problem Kafka solves and why it became the backbone of modern data infrastructure.*

## The Problem

Imagine you work at a company with 10 services. The orders service needs to talk to payments, inventory, email notifications, analytics, and fraud detection. Each connection is a custom integration.

Now multiply that by every service. You get a tangled web of point-to-point connections — brittle, hard to maintain, and impossible to scale.

| Without Kafka | With Kafka |
|--------------|------------|
| Each service connects directly to every other | All services connect to one central system |
| 10 services = up to 90 connections | 10 services = 10 connections |
| Adding a new service means updating many others | Adding a new service means connecting it to Kafka |
| If one service is slow, it slows the sender | Producers and consumers run independently |

## What Kafka Actually Is

Apache Kafka is a **distributed event streaming platform**. In plain English: it's a system that lets services send and receive streams of data reliably, at massive scale, in real time.

Think of it like a **high-speed post office**. Senders drop messages into named mailboxes (topics). Receivers pick up messages from the mailboxes they care about. The post office stores everything reliably and delivers at scale.

## Why It Took Over

Kafka was created at LinkedIn in 2011 to handle their massive data pipeline needs. It went open-source, and today it's used by over 80% of Fortune 100 companies.

Three things made it win:

- **Fast** — handles millions of messages per second
- **Durable** — messages are stored on disk and replicated
- **Decoupled** — producers and consumers don't know about each other

> [!tip]
> Kafka is a central nervous system for data. Services publish events to it and subscribe to the events they care about — without knowing or depending on each other.
