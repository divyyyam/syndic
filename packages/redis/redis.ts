import Redis from "ioredis";

 
const redisSA = new Redis({
  port: 6379,
  host: "127.0.0.1"
});

 
const redisSC = new Redis({
  port: 6380,
  host: "127.0.0.1"
});

export { redisSA, redisSC };