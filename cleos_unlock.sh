#!/bin/bash

# Переходим в директорию скрипта
cd "$(dirname "$0")"

# Проверяем наличие папки для хранения данных о кошельке
if [ ! -d "./blockchain/wallet" ]; then
    mkdir ./blockchain/wallet
fi

# Проверяем наличие файла с паролем
if [ ! -f "./blockchain/wallet/password" ]; then
    echo "Создание нового кошелька..."
    # Создаем новый кошелек и сохраняем пароль в файл внутри контейнера
    docker exec -it node /usr/bin/cleos wallet create --file password.txt
    if [ $? -eq 0 ]; then
        # Копируем пароль из файла контейнера в локальный файл
        docker cp node:/workdir/password.txt ./blockchain/wallet/password
        # Удаляем временный файл из контейнера
        docker exec -it node rm /workdir/password.txt
        echo "Пароль от кошелька сохранён в файле $(pwd)/blockchain/wallet/password"
        # Импортируем ключ в кошелек
        docker exec -it node /usr/bin/cleos wallet import --private-key 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3
    else
        echo "Не удалось создать кошелек"
        exit 1
    fi
else
    echo "Использование существующего кошелька..."
    # Разблокировка кошелька
    docker exec -it node /usr/bin/cleos wallet unlock --password $(cat ./blockchain/wallet/password) > /dev/null 2>&1
fi

