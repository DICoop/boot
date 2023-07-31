#!/bin/bash

# Останавливаем и удаляем контейнер, если он существует
docker stop node > /dev/null 2>&1 && docker rm node > /dev/null 2>&1

# Получаем текущую директорию
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Очищаем папку с данными блокчейна
rm -rf $dir/blockchain/data/*

echo "Очистка завершена."

