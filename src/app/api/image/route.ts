import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;
const branch = process.env.GITHUB_BRANCH!;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const path = searchParams.get("path");

    if (!path) {
      return new Response("Missing path", { status: 400 });
    }

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    const data: any = response.data;

    if (Array.isArray(data) || data.type !== "file") {
      return new Response("Invalid image path", { status: 404 });
    }

    // Convert base64 GitHub file into binary
    const buffer = Buffer.from(data.content, "base64");

    // Determine content type
    let contentType = "application/octet-stream";

    if (path.endsWith(".png")) contentType = "image/png";
    else if (path.endsWith(".jpg") || path.endsWith(".jpeg"))
      contentType = "image/jpeg";
    else if (path.endsWith(".webp")) contentType = "image/webp";
    else if (path.endsWith(".gif")) contentType = "image/gif";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    console.error(err);

    return new Response("Failed to load image", {
      status: 500,
    });
  }
}
