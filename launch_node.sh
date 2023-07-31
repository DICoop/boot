#!/bin/bash

# Получаем текущую директорию
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Запускаем контейнер Docker с нужными параметрами
docker run --name node -d -p 8888:8888 -p 9876:9876 \
-v $dir/blockchain/data:/mnt/dev/data \
-v $dir/blockchain/config:/mnt/dev/config \
-v $dir/blockchain/wallet:/root/eosio-wallet \
-v $dir/../contracts:/mnt/dev/contracts \
dacomfoundation/leap_v4.0.4 \
/bin/bash -c '/usr/bin/nodeos -d /mnt/dev/data -p eosio --config-dir /mnt/dev/config --disable-replay-opts'

echo "Контейнер node установлен - блокчейн запущен."
