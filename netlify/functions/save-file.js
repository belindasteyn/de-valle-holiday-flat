const REPO = "belindasteyn/de-valle-holiday-flat";
const BRANCH = "main";
const ALLOWED_PATHS = new Set(["pricing-rates.txt", "booked-dates.txt"]);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return { statusCode: 400, body: "Invalid JSON body" };
  }

  const { password, path, content } = payload;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: "Incorrect password" };
  }

  if (!ALLOWED_PATHS.has(path)) {
    return { statusCode: 400, body: "That file cannot be edited from this tool" };
  }

  if (typeof content !== "string" || !content.trim()) {
    return { statusCode: 400, body: "Missing file content" };
  }

  const token = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
  };

  try {
    const currentFileResponse = await fetch(`${apiUrl}?ref=${BRANCH}`, { headers });
    if (!currentFileResponse.ok) {
      const errorText = await currentFileResponse.text();
      return { statusCode: 502, body: `Could not read current file from GitHub: ${errorText}` };
    }
    const currentFile = await currentFileResponse.json();

    const putResponse = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Update ${path} via admin page`,
        content: Buffer.from(content, "utf-8").toString("base64"),
        sha: currentFile.sha,
        branch: BRANCH
      })
    });

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      return { statusCode: 502, body: `GitHub rejected the update: ${errorText}` };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    return { statusCode: 500, body: `Unexpected error: ${error.message}` };
  }
};
