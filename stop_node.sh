#!/bin/bash

# Останавливаем контейнер, если он существует
docker stop node > /dev/null 2>&1

echo "Контейнер node остановлен."

