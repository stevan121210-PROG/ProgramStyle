const { createHash } = require("node:crypto");
const { getDatabase } = require("./mongo");

let rateLimitIndexPromise;

async function checkRateLimit(scope, request, maxRequests, windowSeconds) {
  const clientIp = request.headers["cf-connecting-ip"] ||
    request.headers["x-real-ip"] ||
    request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    "unknown";
  const identifier = createHash("sha256").update(clientIp).digest("hex");
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowSeconds * 1000);
  const collection = (await getDatabase()).collection("api_rate_limits");
  if (!rateLimitIndexPromise) {
    rateLimitIndexPromise = collection
      .createIndex({ windowStartedAt: 1 }, { expireAfterSeconds: 172800 })
      .catch((error) => {
        rateLimitIndexPromise = undefined;
        throw error;
      });
  }
  await rateLimitIndexPromise;
  const result = await collection.findOneAndUpdate(
    { _id: `${scope}:${identifier}` },
    [{
      $set: {
        scope: { $literal: scope },
        windowStartedAt: {
          $cond: [
            { $lte: [{ $ifNull: ["$windowStartedAt", new Date(0)] }, cutoff] },
            now,
            "$windowStartedAt"
          ]
        },
        requestCount: {
          $cond: [
            { $lte: [{ $ifNull: ["$windowStartedAt", new Date(0)] }, cutoff] },
            1,
            { $add: ["$requestCount", 1] }
          ]
        }
      }
    }],
    { upsert: true, returnDocument: "after" }
  );
  return result.requestCount <= maxRequests;
}

module.exports = { checkRateLimit };
