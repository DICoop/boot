#!/bin/bash

# Останавливаем контейнер, если он существует
docker start node > /dev/null 2>&1

echo "Контейнер node запущен."

