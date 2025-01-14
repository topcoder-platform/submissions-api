#!/bin/bash
set -eo pipefail
#ENV=$1
#AWS_ACCOUNT_ID=$(eval "echo \$${ENV}_AWS_ACCOUNT_ID")
#AWS_REGION=$(eval "echo \$${ENV}_AWS_REGION")
#AWS_REPOSITORY=$(eval "echo \$${ENV}_AWS_REPOSITORY")

# Builds Docker image of the app.
#TAG=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$AWS_REPOSITORY:$CIRCLE_BUILD_NUM
#sed -i='' "s|submissions-api:latest|$TAG|" docker/docker-compose.yml
echo "" > docker/api.env
docker-compose -f docker/docker-compose.yml build submissions-api
#docker images
docker create --name app submissions-api:latest
if [ -d node_modules ]
then
  mv package-lock.json old-package-lock.json
  docker cp app:/submissions-api/package-lock.json package-lock.json
  set +eo pipefail
  UPDATE_CACHE=$(cmp package-lock.json old-package-lock.json)
  set -eo pipefail
else
  UPDATE_CACHE=1
fi

if [ "$UPDATE_CACHE" == 1 ]
then
  docker cp app:/submissions-api/node_modules .
fi
