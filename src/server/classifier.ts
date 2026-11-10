import { createHash } from "crypto";
import type { ConditionId, Prediction } from "@/lib/types";
import { MODEL_CLASSES } from "@/lib/catalog";

export interface ClassifierResult {
  model: string;
  predictions: Prediction[];
}

export interface Classifier {
  classify(images: Buffer[]): Promise<ClassifierResult>;
}

/**
 * HTTP classifier: POSTs each photo to an image-classification service trained on
 * NAFHA's labelled citrus photos (e.g. a TFLite / PyTorch model behind FastAPI).
 *
 * Request:  POST $CLASSIFIER_URL   Content-Type: image/jpeg   body = JPEG bytes
 * Response: { "model": "citrus-v1", "predictions": [{ "label": "citrus_greening", "confidence": 0.91 }, ...] }
 * Labels must be ConditionId values from src/lib/catalog.ts.
 */
class HttpClassifier implements Classifier {
  constructor(
    private url: string,
    private token?: string,
  ) {}

  async classify(images: Buffer[]): Promise<ClassifierResult> {
    const results = await Promise.all(
      images.map(async (img) => {
        const res = await fetch(this.url, {
          method: "POST",
          headers: {
            "Content-Type": "image/jpeg",
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
          body: new Uint8Array(img),
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) throw new Error(`Classifier returned HTTP ${res.status}`);
        return (await res.json()) as {
          model?: string;
          predictions: { label: string; confidence: number }[];
        };
      }),
    );
    const sums = new Map<ConditionId, number>();
    for (const r of results) {
      for (const p of r.predictions) {
        if (!MODEL_CLASSES.includes(p.label as ConditionId)) continue;
        sums.set(p.label as ConditionId, (sums.get(p.label as ConditionId) ?? 0) + p.confidence);
      }
    }
    return {
      model: results[0]?.model ?? "remote",
      predictions: [...sums.entries()].map(([condition, s]) => ({
        condition,
        confidence: s / results.length,
      })),
    };
  }
}

/**
 * DEMO classifier. Not a real model: it derives a stable pseudo-prediction from the
 * image bytes so the full workflow (expert review, accuracy tracking, nursery
 * trace-back) can be exercised before a trained model is available.
 */
class DemoClassifier implements Classifier {
  async classify(images: Buffer[]): Promise<ClassifierResult> {
    const h = createHash("sha256");
    images.forEach((i) => h.update(i));
    const bytes = h.digest();
    const raw = MODEL_CLASSES.map((_, i) => 1 + bytes[i] / 32);
    // Make one class clearly dominant most of the time, like a real softmax output.
    const lead = bytes[10] % MODEL_CLASSES.length;
    raw[lead] += 4 + (bytes[11] / 255) * 10;
    const total = raw.reduce((a, b) => a + b, 0);
    return {
      model: "demo-classifier-v0",
      predictions: MODEL_CLASSES.map((condition, i) => ({ condition, confidence: raw[i] / total })),
    };
  }
}

export function getClassifier(): Classifier {
  const url = process.env.CLASSIFIER_URL;
  return url ? new HttpClassifier(url, process.env.CLASSIFIER_TOKEN) : new DemoClassifier();
}

export function topPredictions(preds: Prediction[], n = 3): Prediction[] {
  return [...preds].sort((a, b) => b.confidence - a.confidence).slice(0, n);
}
