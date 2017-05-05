#! /bin/bash
# 删除原有容器
docker rm -f codesixaccounts

# 启动并自动重启
docker run \
 --name codesixaccounts \
 --link myredis:myredis \
 --link mymongo:mymongo \
 --expose 80 \
 --expose 443 \
 -v ~/gitcode/code-six-accounts:/webapp \
 -v ~/ssl-key:/ssl-key \
 -w /webapp/server-node \
 -d node node index
