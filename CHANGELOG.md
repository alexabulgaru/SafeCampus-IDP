# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Unit Testing Suite (Alexandru):** Established a comprehensive unit testing framework for the backend microservices to ensure system reliability. *(This represents Alexandru's primary code contribution, alongside his extensive research and architectural planning for the data access, Kafka, and alert systems).*
- **Event-Driven Architecture (Alexandra):** Integrated Kafka message broker to handle asynchronous background tasks and alert generation. *(Code implementation by Alexandra; system research and architectural design by Alexandru).*
- **Read Replica Infrastructure (Alexandra):** Configured a native dual-Prisma setup (`PrismaService` for writes, `PrismaReplicaService` for reads) to route heavy report queries to the MySQL read replica, protecting the master database. *(Code implementation by Alexandra; database replication research by Alexandru).*
- **Adminer Integration (Alexandra):** Added Adminer to the Docker stack on an isolated database network for secure, direct GUI access to the MySQL clusters.
- **Profile Caching (Alexandra):** Implemented Redis caching for user profiles to prevent redundant database queries on repeated API calls and speed up response times.
- **Identity & Access Management (Alexandra):** Integrated Keycloak authentication with role-based access control (Student, Operator, Maintenance, Admin).

### Changed
- **Incident Creation Flow (Alexandra):** Refactored the Incident Management Service to act as a Kafka Producer. It now instantly returns a 200 OK to the frontend and publishes an `incident-created` event instead of blocking the HTTP request.
- **Notification Processing (Alexandra):** Transformed `NotificationService` into a Kafka Consumer. It now handles the heavy lifting of calculating Haversine distances and writing database notifications entirely in the background. *(Code implementation by Alexandra; logic and workflow research by Alexandru).*
- **Redis Optimization (Alexandra):** Replaced the dangerous, server-blocking `KEYS *` command in the cache service with a safe, non-blocking `SCAN` loop for pattern invalidation.
- **Adminer Networking (Alexandra):** Updated Adminer Docker configuration to use direct port mapping, bypassing the Swarm routing mesh for reliable local connection.

### Fixed
- **Keycloak Authentication (Alexandra):** Resolved a persistent 401 Unauthorized error by properly aligning the backend `KEYCLOAK_AUTH_URL` with the Kong Gateway issuer token (`http://localhost:8000/auth`), enabling successful offline token validation.
- **Redis Type Strictness (Alexandra):** Fixed TypeScript `RedisArgument` compilation errors by updating cursor types to strings and modernizing the `setEx` caching method.

[unreleased]: https://github.com/alexabulgaru/SafeCampus-IDP