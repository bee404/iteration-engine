import assert from "node:assert/strict";
import { test } from "node:test";

import { GET as getProject } from "@/app/api/projects/[id]/route";
import { GET as listProjects } from "@/app/api/projects/route";
import { GET as getRound } from "@/app/api/rounds/[id]/route";
import { GET as listRounds } from "@/app/api/rounds/route";

const retiredReads = [
  ["projects", listProjects, "http://localhost/api/projects"],
  ["project by id", getProject, "http://localhost/api/projects/project-1"],
  ["rounds", listRounds, "http://localhost/api/rounds"],
  ["round by id", getRound, "http://localhost/api/rounds/round-1"],
] as const;

for (const [label, handler, url] of retiredReads) {
  test(`legacy ${label} reads are retired without opening persistence`, async () => {
    const response = await handler(new Request(url));
    assert.equal(response.status, 410);
    assert.deepEqual(await response.json(), {
      error: label.startsWith("project") || label === "projects"
        ? "Project persistence is retired from the V0 exploration flow"
        : "Round persistence is retired from the V0 exploration flow",
      code: "persistence_retired",
    });
  });
}
