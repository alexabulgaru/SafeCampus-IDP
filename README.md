### How to run docker
1. Build backend: ``docker build --no-cache -t safecampus_backend:latest ./backend``
2. Deploy: ``docker stack deploy -c stack.yml safecampus``
3. Check status: ``docker stack ps safecampus``

(Putina mila dupa ce porneste, sa fie lasat macar 1 minut sa-si traga sufletul ca dupa face treaba tank)