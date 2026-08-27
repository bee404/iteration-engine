"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { StepHeader } from "@/components/step-header";
import { LockedViewportNotice } from "@/components/viewport-box-field";
import { readImageDimensions } from "@/lib/image-dimensions";
import { preprocessScreenshot } from "@/lib/screenshot-preprocess";
import { useRoundStore } from "@/lib/stores/round";
import { useRoundViewport } from "@/lib/stores/round-viewport";

type ImageUploadScreenProps = {
  onImageSelected?: (file: File) => void;
};

/** Reads a File into a data URL so the preview survives the client-side hop to /feedback. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

/** The first Coquí screen: one quiet place to bring a reference into a round. */
export function ImageUploadScreen({ onImageSelected }: ImageUploadScreenProps) {
  const router = useRouter();
  const beginTransition = useRoundStore((state) => state.beginTransition);
  const inferBox = useRoundViewport((state) => state.inferBox);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  // Guards the auto-advance effect against re-running for a file it has already sent onward.
  const startedFileRef = useRef<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const acceptFile = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;
      setUploadError(null);
      setFile(file);
      setPreviewUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return URL.createObjectURL(file);
      });
      setFileName(file.name);
      onImageSelected?.(file);
    },
    [onImageSelected],
  );

  // No confirmation step: once a screenshot lands, a successful upload goes straight to /feedback
  // with no click required. Runs after the preview commits so `previewRef` has a real rect for the
  // shared-element morph into the reference container on the next screen.
  useEffect(() => {
    if (!file || startedFileRef.current === file) return;
    startedFileRef.current = file;
    setIsProceeding(true);
    let cancelled = false;

    (async () => {
      try {
        const rawDataUrl = await readAsDataUrl(file);
        // The viewport box is the capture's own size, read off the file before anything touches
        // it. It must not be read off the cropped copy below: trimming chrome shrinks the raster
        // but not the viewport it was captured at, and every other surface in the app captions
        // this file at its natural size.
        const capturedBox = await readImageDimensions(rawDataUrl);
        // Strip browser/OS chrome and letterbox padding so the reference on /feedback is a clean UI.
        const processed = await preprocessScreenshot(rawDataUrl);
        const dataUrl = processed.dataUrl;
        // What the reference container actually displays, which is the cropped raster when
        // trimming happened — a different measurement from the viewport box above.
        const dimensions = processed.dimensions.width > 0 ? processed.dimensions : capturedBox;
        if (cancelled) return;
        // A locked exploration ignores this because generation has already started against its
        // fixed comparison box.
        inferBox(capturedBox);
        const rect = previewRef.current?.getBoundingClientRect();
        const origin = rect
          ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          : { top: 0, left: 0, width: 0, height: 0 };
        beginTransition({ dataUrl, fileName: file.name, dimensions }, origin);
        router.push("/feedback");
      } catch {
        if (cancelled) return;
        // Couldn't process this image: drop back to the empty dropzone so the user can retry
        // rather than stranding them with a preview that will never advance.
        startedFileRef.current = null;
        setIsProceeding(false);
        setFile(null);
        setFileName(null);
        setPreviewUrl((previousUrl) => {
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          return null;
        });
        setUploadError("Couldn't process that image — try another.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, beginTransition, inferBox, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const pastedFile = Array.from(event.clipboardData?.files ?? []).find((file) =>
        file.type.startsWith("image/"),
      );
      if (pastedFile) acceptFile(pastedFile);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [acceptFile]);

  return (
    <main className="upload-page">
      <div className="upload-page-atmosphere" aria-hidden="true" />
      <StepHeader />

      {/* Figma node 57:293 — one centered card (57:316 "Background+Shadow") holding the
          illustration, heading, and dropzone stacked and centered. The "Aside - the brief"
          layer name is a reused component label here, NOT a two-column split. */}
      <section className="upload-stage" aria-labelledby="upload-title">
        <div className={`upload-card ${isDragging ? "is-dragging" : ""}`}>
          {previewUrl ? (
            <div className="upload-preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img
                ref={previewRef}
                className="upload-preview"
                src={previewUrl}
                alt={`Selected ${fileName ?? "screen"}`}
              />
            </div>
          ) : (
            /* `upload-hero` (Figma node 184:557): Topo texture + dot-grid vectors + the Coquí
               wordmark, exported from Figma as one flattened raster rather than recomposed as
               separate layers here. Previously this was two theme-specific SVG lockups toggled by
               [data-theme]; the 184:505 frame specifies a single banner that spans the card's full
               content width, so one asset serves every theme and the per-theme swap is gone. */
            <Image
              className="upload-hero"
              src="/brand/upload-hero.png"
              alt="Coquí"
              width={1040}
              height={324}
              priority
            />
          )}

          <div className="upload-content">
            <h1 id="upload-title">
              {previewUrl ? "Screen ready to improve" : "Upload the screen you want to improve"}
            </h1>

            {previewUrl ? (
              // No confirmation step here: a successful upload advances on its own, so this is a
              // status readout, not an interactive control.
              <div className="upload-status" role="status" aria-live="polite">
                <span className="feedback-spinner" aria-hidden="true" />
                <span>{isProceeding ? "Opening feedback\u2026" : "Screen ready\u2026"}</span>
              </div>
            ) : (
              <>
                <button
                  className="upload-dropzone"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    acceptFile(event.dataTransfer.files[0]);
                  }}
                  aria-label="Select image to upload"
                >
                  <span className="upload-dropzone-action">Select image to upload</span>
                  <span className="upload-dropzone-hint">
                    also you can drop your image or{" "}
                    <span className="upload-paste-keys">
                      <kbd>⌘</kbd>
                      <kbd>V</kbd>
                    </span>{" "}
                    to paste
                  </span>
                </button>
                {uploadError && (
                  <p className="upload-error" role="alert">
                    {uploadError}
                  </p>
                )}
              </>
            )}

            {/* A chain that already locked its box says so before the next screenshot lands:
                whatever is uploaded here will be compared inside that box, not its own. */}
            <LockedViewportNotice />

            <input
              ref={inputRef}
              className="upload-file-input"
              type="file"
              accept="image/*"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
