# 🔗 SwiftLink — High-Performance URL Shortener & Analytics Platform

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-Caching-DC382D.svg?style=for-the-badge&logo=redis)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-Async%20Worker-37814A.svg?style=for-the-badge)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=for-the-badge&logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**Enterprise-grade URL redirection engine and real-time clickstream analytics platform capable of handling high-concurrency traffic with microsecond latency.**

</div>

---

## 📌 Architecture

```text
[ Client Request ] ──► [ Nginx / Reverse Proxy ]
                              │
                              ▼
                     [ FastAPI Router ]
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
[ Redis Memory Cache ]                      [ Celery Worker ]
 (Sub-millisecond redirect)                  (Async click metrics)
                                                   │
                                                   ▼
                                         [ ClickHouse / Postgres ]
                                          (Deep OLAP Analytics)
```

---

## ⚡ Features

- **⚡ Sub-Millisecond Redirects**: In-memory caching via Redis ensures instant link resolution.
- **📊 Real-Time Click Analytics**: Tracks geographic country, referrers, device types, and browser agents.
- **🏷️ Custom Slugs & QR Codes**: Allows users to customize link aliases and generate QR codes.
- **🐳 Multi-Container Orchestration**: Fully reproducible via `docker-compose.yml`.

---

## 🚀 Quick Start (Docker)

```bash
docker-compose up --build
```
The application will be live at `http://localhost:8000`.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
