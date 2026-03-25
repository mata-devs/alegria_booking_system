import { NextRequest } from "next/server";

function badRequest(message: string, status = 400) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function isAllowedFirebaseStorageUrl(rawUrl: string) {
    try {
        const url = new URL(rawUrl);
        return url.protocol === "https:" && url.hostname === "firebasestorage.googleapis.com";
    } catch {
        return false;
    }
}

export async function GET(req: NextRequest) {
    const urlParam = req.nextUrl.searchParams.get("url");
    const filenameParam = req.nextUrl.searchParams.get("filename");

    if (!urlParam) return badRequest("Missing url parameter.");
    if (!isAllowedFirebaseStorageUrl(urlParam)) return badRequest("URL not allowed.");

    const filename = (filenameParam && filenameParam.trim()) ? filenameParam.trim() : "payment-instructions";

    let upstream: Response;
    try {
        upstream = await fetch(urlParam, { cache: "no-store" });
    } catch {
        return badRequest("Failed to fetch upstream image.", 502);
    }

    if (!upstream.ok) {
        return badRequest("Upstream returned an error.", 502);
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const arrayBuffer = await upstream.arrayBuffer();

    return new Response(arrayBuffer, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${filename}"`,
            // Reasonable caching for the proxy response.
            "Cache-Control": "public, max-age=3600",
        },
    });
}

