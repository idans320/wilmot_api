#!/bin/bash
echo $NODE_ENV
if [ ! -z "$NODE_ENV" ] && [ $NODE_ENV = "test" ]
then
	yarn test
else
	yarn start
fi
