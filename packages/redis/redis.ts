import Redis from "ioredis";

 
const antonRedis = new Redis({
  port: 6379,
  host: "127.0.0.1"
});

 
const clientRedis = new Redis({
  port: 6380,
  host: "127.0.0.1"
});

export { antonRedis, clientRedis };