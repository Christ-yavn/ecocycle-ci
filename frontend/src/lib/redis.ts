import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Client Redis wrapper.
 * Si les variables d'environnement ne sont pas définies, il retourne un client mock 
 * qui ne fait rien et permet à l'application de bypasser le cache sans crasher.
 */
class RedisClient {
  private client: Redis | null = null;

  constructor() {
    if (redisUrl && redisToken) {
      try {
        this.client = new Redis({
          url: redisUrl,
          token: redisToken,
        });
      } catch (err) {
        console.warn("Erreur d'initialisation de Redis:", err);
      }
    } else {
      console.warn(
        "⚠️ Redis n'est pas configuré (UPSTASH_REDIS_REST_URL manquant). Le cache sera ignoré."
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      return await this.client.get<T>(key);
    } catch (err) {
      console.error(`Redis GET erreur sur la clé ${key}:`, err);
      return null;
    }
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    if (!this.client) return;
    try {
      if (options?.ex) {
        await this.client.set(key, value, { ex: options.ex });
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      console.error(`Redis SET erreur sur la clé ${key}:`, err);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`Redis DEL erreur sur la clé ${key}:`, err);
    }
  }
}

export const redis = new RedisClient();
