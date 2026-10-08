import https from "https";
import http from "http";
import { NextResponse } from "next/server";

const checkoutBase = process.env.NEXT_CHECKOUT_BASE_URL || "https://prolix.wobcart.com";

function doProxy(targetUrl, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const reqHeaders = { ...headers };
    delete reqHeaders.host;
    delete reqHeaders.connection;
    delete reqHeaders["content-length"];
    reqHeaders["accept-encoding"] = "identity";

    if (body && body.length > 0) {
      reqHeaders["content-length"] = Buffer.byteLength(body);
    }

    const req = client.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers: reqHeaders,
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 200,
            headers: res.headers,
            data: Buffer.concat(chunks),
          });
        });
      }
    );

    req.on("error", reject);

    if (body && body.length > 0) {
      req.write(body);
    }
    req.end();
  });
}

async function handle(request, context) {
  try {
    const params = await context.params;
    const pathSegments = params?.path || [];
    const subpath = pathSegments.join("/");
    const url = new URL(request.url);
    const targetUrl = `${checkoutBase.replace(/\/$/, "")}/api/${subpath}${url.search}`;

    const headers = {};
    request.headers.forEach((val, key) => {
      headers[key] = val;
    });

    let bodyBuffer = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const arrayBuffer = await request.arrayBuffer();
      bodyBuffer = Buffer.from(arrayBuffer);
    }

    const result = await doProxy(targetUrl, request.method, headers, bodyBuffer);

    const responseHeaders = new Headers();
    Object.entries(result.headers).forEach(([k, v]) => {
      if (v && !["content-encoding", "transfer-encoding"].includes(k.toLowerCase())) {
        if (Array.isArray(v)) {
          v.forEach((item) => responseHeaders.append(k, item));
        } else {
          responseHeaders.set(k, String(v));
        }
      }
    });

    return new NextResponse(result.data, {
      status: result.statusCode,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Proxy route handler error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
export const HEAD = handle;
export const OPTIONS = handle;
