### How to run docker
1. Build backend: ``docker build --no-cache -t safecampus_backend:latest ./backend``
2. Build frontend: ``docker build --no-cache -t safecampus_frontend:latest ./frontend``
3. Portainer: ``docker stack deploy -c portainer-agent-stack.yml portainer``
4. Deploy: ``docker stack deploy -c stack.yml safecampus``
5. Check status: ``docker stack ps safecampus``

URL Portainer: http://127.0.0.1:9000

### Prometheus Queries

Prometheus queries:
- `rate(http_requests_total[1m])` - HTTP request rate per second
- `incidents_created_total` - Total incidents created
- `notifications_created_total` - Total notifications created  
- `kafka_messages_published_total` - Kafka messages published
- `rate(kafka_errors_total[5m])` - Kafka error rate
- `cache_hits_total / (cache_hits_total + cache_misses_total)` - Cache hit ratio
- `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` - Request latency p95

(Putina mila dupa ce porneste, sa fie lasat macar 1 minut sa-si traga sufletul ca dupa face treaba tank)