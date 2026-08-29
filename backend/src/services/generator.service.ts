import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuid } from "uuid";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";

/**
 * Produces the 30-second narrated clip + shareable webpage slug from the
 * raw voice note + clip/photo + milestone text. Runs in the background —
 * the controller has already responded 201 with status: "generating"
 * before this is called.
 *
 * English-caption/TTS work (FR-19 stretch) is a separate, isolated
 * function (see generateCaptions below) so it never blocks the core
 * clip assembly.
 */

const LOCAL_DIR = process.env.STORAGE_LOCAL_DIR || "./uploads";
const MIN_VOICE_SECONDS = 3;

async function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration ?? 0);
    });
  });
}

async function assembleClip(voicePath: string, clipPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(clipPath)
      .input(voicePath)
      .outputOptions(["-map 0:v:0", "-map 1:a:0", "-shortest", "-t 30"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

async function runGenerationOnce(storyMediaId: string) {
  const storyMedia = await prisma.storyMedia.findUnique({ where: { id: storyMediaId } });
  if (!storyMedia) {
    throw new ApiError(404, "Story media not found");
  }

  const voicePath = path.join(LOCAL_DIR, path.basename(storyMedia.voiceUrl));
  const clipPath = path.join(LOCAL_DIR, path.basename(storyMedia.clipUrl));

  // Fail early on unreadable/too-short input rather than producing a
  // broken 30-second clip.
  let voiceDuration: number;
  try {
    voiceDuration = await probeDuration(voicePath);
  } catch {
    throw new ApiError(500, "Artifact generation failed: voice note unreadable");
  }
  if (voiceDuration < MIN_VOICE_SECONDS) {
    throw new ApiError(500, "Artifact generation failed: voice note too short");
  }

  const outputKey = `${uuid()}.mp4`;
  const outputPath = path.join(LOCAL_DIR, outputKey);

  try {
    await assembleClip(voicePath, clipPath, outputPath);
  } catch {
    throw new ApiError(500, "Artifact generation failed");
  }

  const generatedPageSlug = uuid();

  await prisma.storyMedia.update({
    where: { id: storyMediaId },
    data: {
      generatedClipUrl: `/uploads/${outputKey}`,
      generatedPageSlug,
    },
  });

  return {
    generatedClipUrl: `/uploads/${outputKey}`,
    generatedPageSlug,
  };
}

export async function generateArtifacts(
  storyMediaId: string
): Promise<{ generatedClipUrl: string; generatedPageSlug: string }> {
  try {
    return await runGenerationOnce(storyMediaId);
  } catch (err) {
    // Retry once on any failure, since this is a background job with no
    // user waiting synchronously.
    try {
      return await runGenerationOnce(storyMediaId);
    } catch (retryErr) {
      throw new ApiError(500, "Artifact generation failed");
    }
  }
}

/**
 * Isolated, optional step for the FR-19 stretch (Amharic voice input +
 * auto-generated English captions). Deliberately not called from
 * generateArtifacts above so a captioning/TTS outage never blocks the
 * core clip.
 */
export async function generateCaptions(_storyMediaId: string): Promise<string | null> {
  // SCOPE QUESTION: no captioning/TTS provider is wired in yet — this is
  // a stub for the "Should" priority FR-19 stretch goal, intentionally
  // left unimplemented for the hackathon-scope build.
  return null;
}
