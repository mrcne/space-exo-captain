import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type Metadata = {
  created_at?: string;
  sklearn_version?: string;
  target?: string;
  notes?: string;
  classes?: string[];
};

type TestMetrics = {
  accuracy?: number;
  balanced_accuracy?: number;
  f1_macro?: number;
};

export type ModelInfo = {
  id: string; // `${family}/${runId}`
  family: string; // rf, extra_trees
  runId: string; //20251006_005702
  name: string;
  accuracy: number | null;
  createdAt?: string;
  notes?: string;
};

const artifactsDir = path.resolve(process.cwd(), "data", "pipeline", "artifacts");

function safeReadJson<T = unknown>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toModelName(family: string, runId: string, meta: Metadata | null, metrics: TestMetrics | null): string {
  const acc = metrics?.accuracy;
  const accStr = typeof acc === "number" ? `acc ${(acc * 100).toFixed(1)}%` : undefined;
  const base = meta?.notes?.trim() || family.toUpperCase();
  const created = meta?.created_at ? ` • ${meta.created_at}` : '';
  return [base, accStr].filter(Boolean).join(" — ") + created;
}

export async function GET() {
  try {
    const result: ModelInfo[] = [];

    if (!fs.existsSync(artifactsDir)) {
      return NextResponse.json(result);
    }

    const families = fs.readdirSync(artifactsDir).filter((d) => {
      const p = path.join(artifactsDir, d);
      return fs.statSync(p).isDirectory();
    });

    for (const family of families) {
      const familyDir = path.join(artifactsDir, family);
      let runs: string[] = [];
      try {
        runs = fs.readdirSync(familyDir).filter((d) => {
          const p = path.join(familyDir, d);
          return fs.statSync(p).isDirectory();
        });
      } catch {
        // skip
      }

      for (const runId of runs) {
        const runDir = path.join(familyDir, runId);
        const metaPath = path.join(runDir, "metadata.json");
        const metricsPath = path.join(runDir, "test_metrics.json");

        const meta = safeReadJson<Metadata>(metaPath);
        const metrics = safeReadJson<TestMetrics>(metricsPath);

        const id = `${family}/${runId}`;
        const name = toModelName(family, runId, meta, metrics);
        const accuracy = typeof metrics?.accuracy === "number" ? metrics!.accuracy : null;

        result.push({
          id,
          family,
          runId,
          name,
          accuracy,
          createdAt: meta?.created_at,
          notes: meta?.notes,
        });
      }
    }

    // most recent
    result.sort((a, b) => b.runId.localeCompare(a.runId) || a.family.localeCompare(b.family));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
