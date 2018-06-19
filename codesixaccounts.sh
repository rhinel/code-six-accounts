#! /bin/bash
# 删除原有容器
docker rm -f codesixaccounts

# 启动并自动重启
docker run \
 --restart always \
 --name codesixaccounts \
 --link myredis:myredis \
 --link mysql:mysql \
 --expose 80 \
 --expose 443 \
 -v /etc/localtime:/etc/localtime \
 -v ~/gitcode/code-six-accounts:/webapp \
 -w /webapp/server-node \
 -d node node index
