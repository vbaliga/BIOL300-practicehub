import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { seed, description, testType } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }

  const issueBody =
    `**Seed:** \`${seed}\`\n` +
    `**Test type:** ${testType ?? "unknown"}\n\n` +
    `**Student description:**\n${description.trim()}`;

  const res = await fetch("https://api.github.com/repos/danielsobat1/biol300/issues", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      title: `Student report: seed ${seed} (${testType ?? "unknown"})`,
      body: issueBody,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("GitHub API error:", err);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
