const test = require("node:test");
const assert = require("node:assert/strict");

function createResponse() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    end() {
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

async function invoke(handler, request) {
  const response = createResponse();
  await handler({ headers: {}, ...request }, response);
  return response;
}

test("health endpoint checks MongoDB and rejects unsupported methods", async () => {
  const handler = require("../api/health");
  const unsupported = await invoke(handler, { method: "POST" });
  assert.equal(unsupported.statusCode, 405);
  assert.equal(unsupported.headers.Allow, "GET");

  const previousUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    const health = await invoke(handler, { method: "GET" });
    assert.equal(health.statusCode, 503);
    assert.match(health.body.error, /MONGODB_URI/);
  } finally {
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});

test("contact API rejects unsupported methods, invalid input, and foreign origins before database access", async () => {
  const handler = require("../api/contact-request");
  const unsupported = await invoke(handler, { method: "GET" });
  assert.equal(unsupported.statusCode, 405);

  const invalidBody = await invoke(handler, { method: "POST", body: { name: "", email: "bad", message: "" } });
  assert.equal(invalidBody.statusCode, 400);

  const foreignOrigin = await invoke(handler, {
    method: "POST",
    headers: { origin: "https://attacker.example", host: "programstyle.vercel.app" },
    body: { name: "Visitor", email: "visitor@example.com", message: "Hello" }
  });
  assert.equal(foreignOrigin.statusCode, 403);
});

test("API CORS preflight allows only explicitly configured origins", async () => {
  const handler = require("../api/contact-request");
  const previousOrigins = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = "https://public-site.example,http://localhost:5173";
  try {
    const allowed = await invoke(handler, {
      method: "OPTIONS",
      headers: {
        origin: "https://public-site.example",
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization,content-type"
      }
    });
    assert.equal(allowed.statusCode, 204);
    assert.equal(allowed.headers["Access-Control-Allow-Origin"], "https://public-site.example");
    assert.match(allowed.headers["Access-Control-Allow-Methods"], /POST/);

    const blocked = await invoke(handler, {
      method: "OPTIONS",
      headers: { origin: "https://not-allowed.example" }
    });
    assert.equal(blocked.statusCode, 403);
    assert.equal(blocked.headers["Access-Control-Allow-Origin"], undefined);
  } finally {
    if (previousOrigins === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = previousOrigins;
  }
});

test("API accepts requests from its own Vercel deployment origin", async () => {
  const handler = require("../api/contact-request");
  const previousUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    const response = await invoke(handler, {
      method: "POST",
      headers: {
        origin: "https://programstyle.vercel.app",
        host: "programstyle.vercel.app",
        "x-forwarded-proto": "https"
      },
      body: { name: "", email: "bad", message: "" }
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.headers["Access-Control-Allow-Origin"], undefined);
  } finally {
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});

test("Mongo-backed public content reports missing server configuration explicitly", async () => {
  const previousUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    const handler = require("../api/site-content");
    const response = await invoke(handler, { method: "GET" });
    assert.equal(response.statusCode, 503);
    assert.match(response.body.error, /MONGODB_URI/);
  } finally {
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});

test("legacy saved contact email is normalized to the new address", () => {
  const { updateContactEmail } = require("../api/_lib/content");
  const content = {
    home: { title: "Home" },
    services: { email: "Stevan121210@gmail.com", phone: "+57 300 000 0000" }
  };
  const updated = updateContactEmail(content);
  assert.equal(updated.services.email, "programstyle1212@gmail.com");
  assert.equal(updated.services.phone, content.services.phone);
  assert.equal(content.services.email, "Stevan121210@gmail.com");
});

test("admin APIs reject unauthenticated requests before database access", async () => {
  const requestsHandler = require("../api/contact-requests");
  const adminsHandler = require("../api/admins");
  const requestsResponse = await invoke(requestsHandler, { method: "GET" });
  const adminsResponse = await invoke(adminsHandler, { method: "GET" });
  assert.equal(requestsResponse.statusCode, 401);
  assert.equal(adminsResponse.statusCode, 401);
});

test("AI API rejects unsupported methods and malformed requests before database access", async () => {
  const handler = require("../api/ai-chat");
  const unsupported = await invoke(handler, { method: "GET" });
  assert.equal(unsupported.statusCode, 405);

  const invalidBody = await invoke(handler, { method: "POST", body: { message: "", audience: "public" } });
  assert.equal(invalidBody.statusCode, 400);
});
