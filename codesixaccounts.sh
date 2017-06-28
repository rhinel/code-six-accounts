#! /bin/bash
# 删除原有容器
docker rm -f codesixaccounts

# 启动并自动重启
docker run \
 --name codesixaccounts \
 --link myredis:myredis \
 --link mysql:mysql \
 --expose 80 \
 --expose 443 \
 -v /etc/localtime:/etc/localtime \
 -v ~/gitcode/code-six-accounts:/webapp \
 -v ~/ssl-key:/ssl-key \
 -w /webapp/server-node \
 -d node node index
