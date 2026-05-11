#!/bin/sh
set -e

echo "Waiting for primary MySQL to become available..."
until mysqladmin ping -h db -uroot -p"${MYSQL_ROOT_PASSWORD}" --silent; do
  sleep 2
done

echo "Waiting for replication user to be ready..."
until mysql -h db -u"${MYSQL_REPLICATION_USER}" -p"${MYSQL_REPLICATION_PASSWORD}" -e "SELECT 1" >/dev/null 2>&1; do
  sleep 2
done
echo "Waiting for primary to have schema table '${MYSQL_DATABASE}.User'..."
until mysql -h db -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "USE ${MYSQL_DATABASE}; SHOW TABLES LIKE 'User';" | grep -q User; do
  sleep 2
done

echo "Primary has schema; capturing master status..."
MASTER_STATUS=$(mysql -h db -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "SHOW MASTER STATUS\G")
SOURCE_LOG_FILE=$(echo "$MASTER_STATUS" | awk '/File:/{print $2}')
SOURCE_LOG_POS=$(echo "$MASTER_STATUS" | awk '/Position:/{print $2}')

echo "Exporting initial snapshot from primary..."
mysqldump -h db -uroot -p"${MYSQL_ROOT_PASSWORD}" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --databases "${MYSQL_DATABASE}" \
  > /tmp/safecampus.sql

echo "Importing snapshot into replica..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" < /tmp/safecampus.sql

echo "Configuring replication from ${SOURCE_LOG_FILE}:${SOURCE_LOG_POS}..."
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST='db',
  SOURCE_USER='${MYSQL_REPLICATION_USER}',
  SOURCE_PASSWORD='${MYSQL_REPLICATION_PASSWORD}',
  SOURCE_LOG_FILE='${SOURCE_LOG_FILE}',
  SOURCE_LOG_POS=${SOURCE_LOG_POS};
START REPLICA;
SET PERSIST read_only = ON;
SET PERSIST super_read_only = ON;
SQL

echo "Replica bootstrapped successfully."
