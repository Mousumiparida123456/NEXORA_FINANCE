import { createClient } from "redis";

export interface VelocityMetrics {
  velocity1m: number; // Customer transactions in past 60s
  velocity1h: number; // Customer transactions in past 3600s
  ipVelocity1m: number; // IP transactions in past 60s
  deviceVelocity1m: number; // Device transactions in past 60s
  storageEngine: "redis" | "in-memory-sliding-window";
  summaryText: string;
}

export class VelocityService {
  private static redisClient: any = null;
  private static isRedisConnected: boolean = false;

  // In-memory sliding window fallback store (key -> array of timestamps in ms)
  private static inMemoryStore: Map<string, number[]> = new Map();

  /**
   * Initializes Redis client connection asynchronously.
   */
  public static async initRedis() {
    if (this.redisClient) return;

    try {
      const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
      this.redisClient = createClient({ url: redisUrl, socket: { connectTimeout: 1000 } });

      this.redisClient.on("error", (err: any) => {
        if (this.isRedisConnected) {
          console.warn("⚠️ [REDIS VELOCITY COUNTER]: Connection error, switching to resilient sliding window fallback.");
        }
        this.isRedisConnected = false;
      });

      this.redisClient.on("connect", () => {
        console.log("⚡ [REDIS VELOCITY COUNTER]: Connected to Redis server.");
        this.isRedisConnected = true;
      });

      await this.redisClient.connect().catch(() => {
        this.isRedisConnected = false;
      });
    } catch (err) {
      this.isRedisConnected = false;
    }
  }

  /**
   * STEP 1J — Record transaction event and fetch real-time atomic velocity counters.
   */
  public static async recordAndGetVelocity(
    customerId: string = "CUST-DEFAULT",
    ipAddress: string = "127.0.0.1",
    deviceId: string = "DEV-DEFAULT"
  ): Promise<VelocityMetrics> {
    const now = Date.now();

    // 1. Try Redis Atomic Counters first if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        const cust1mKey = `sentinel:vel:cust:${customerId}:1m`;
        const cust1hKey = `sentinel:vel:cust:${customerId}:1h`;
        const ip1mKey = `sentinel:vel:ip:${ipAddress}:1m`;
        const dev1mKey = `sentinel:vel:dev:${deviceId}:1m`;

        const multi = this.redisClient.multi();
        multi.incr(cust1mKey);
        multi.expire(cust1mKey, 60);
        multi.incr(cust1hKey);
        multi.expire(cust1hKey, 3600);
        multi.incr(ip1mKey);
        multi.expire(ip1mKey, 60);
        multi.incr(dev1mKey);
        multi.expire(dev1mKey, 60);

        const results = await multi.exec();

        const velocity1m = typeof results[0] === "number" ? results[0] : parseInt(results[0], 10) || 1;
        const velocity1h = typeof results[2] === "number" ? results[2] : parseInt(results[2], 10) || 1;
        const ipVelocity1m = typeof results[4] === "number" ? results[4] : parseInt(results[4], 10) || 1;
        const deviceVelocity1m = typeof results[6] === "number" ? results[6] : parseInt(results[6], 10) || 1;

        return {
          velocity1m,
          velocity1h,
          ipVelocity1m,
          deviceVelocity1m,
          storageEngine: "redis",
          summaryText: `${velocity1m} transactions in 60s (${velocity1h} in 1h)`,
        };
      } catch (err) {
        this.isRedisConnected = false;
      }
    }

    // 2. Resilient Sliding Window In-Memory Fallback
    const recordInMemory = (key: string, windowMs: number): number => {
      const timestamps = this.inMemoryStore.get(key) || [];
      // Filter timestamps within window
      const validTimestamps = timestamps.filter((ts) => now - ts <= windowMs);
      validTimestamps.push(now);
      this.inMemoryStore.set(key, validTimestamps);
      return validTimestamps.length;
    };

    const velocity1m = recordInMemory(`cust:${customerId}:1m`, 60000);
    const velocity1h = recordInMemory(`cust:${customerId}:1h`, 3600000);
    const ipVelocity1m = recordInMemory(`ip:${ipAddress}:1m`, 60000);
    const deviceVelocity1m = recordInMemory(`dev:${deviceId}:1m`, 60000);

    return {
      velocity1m,
      velocity1h,
      ipVelocity1m,
      deviceVelocity1m,
      storageEngine: "in-memory-sliding-window",
      summaryText: `${velocity1m} transactions in 60s (${velocity1h} in 1h)`,
    };
  }

  /**
   * Retrieves velocity metrics without recording a new attempt (read-only query).
   */
  public static async getVelocityOnly(
    customerId: string = "CUST-DEFAULT",
    ipAddress: string = "127.0.0.1"
  ): Promise<Partial<VelocityMetrics>> {
    const now = Date.now();

    if (this.isRedisConnected && this.redisClient) {
      try {
        const cust1mKey = `sentinel:vel:cust:${customerId}:1m`;
        const cust1hKey = `sentinel:vel:cust:${customerId}:1h`;

        const val1m = await this.redisClient.get(cust1mKey);
        const val1h = await this.redisClient.get(cust1hKey);

        return {
          velocity1m: val1m ? parseInt(val1m, 10) : 0,
          velocity1h: val1h ? parseInt(val1h, 10) : 0,
          storageEngine: "redis",
        };
      } catch (err) {
        // ignore
      }
    }

    const getInMemoryCount = (key: string, windowMs: number): number => {
      const timestamps = this.inMemoryStore.get(key) || [];
      return timestamps.filter((ts) => now - ts <= windowMs).length;
    };

    return {
      velocity1m: getInMemoryCount(`cust:${customerId}:1m`, 60000),
      velocity1h: getInMemoryCount(`cust:${customerId}:1h`, 3600000),
      storageEngine: "in-memory-sliding-window",
    };
  }
}
