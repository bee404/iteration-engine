"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { StepHeader } from "@/components/step-header";
import { readImageDimensions } from "@/lib/image-dimensions";
import { preprocessScreenshot } from "@/lib/screenshot-preprocess";
import { useRoundImage } from "@/lib/stores/round-image";

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
  const beginTransition = useRoundImage((state) => state.beginTransition);
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
        // Strip browser/OS chrome and letterbox padding so the reference on /feedback is a clean UI.
        const processed = await preprocessScreenshot(rawDataUrl);
        const dataUrl = processed.dataUrl;
        const dimensions =
          processed.dimensions.width > 0 ? processed.dimensions : await readImageDimensions(dataUrl);
        if (cancelled) return;
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
  }, [file, beginTransition, router]);

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
            /* The Coquí lockup (Figma node 158:360, "Logo container"): Topo texture + two Dot
               grid vectors + the wordmark, composed as one full-color graphic. Unlike the retired
               frog illustration this is a fixed brand asset, not a themeable stencil — it renders
               identically in both themes, same as the header wordmark. */
            <Image
              className="upload-illustration"
              src="/brand/coqui-logo-lockup.svg"
              alt="Coquí"
              width={520}
              height={162}
              priority
            />
          )}

          <div className="upload-content">
            <h1 id="upload-title">
              {previewUrl ? "Screen ready to improve" : "Add the screen you want to improve"}
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
                    also you can drop your image or <kbd>⌘</kbd>
                    <kbd>V</kbd> to paste
                  </span>
                </button>
                {uploadError && (
                  <p className="upload-error" role="alert">
                    {uploadError}
                  </p>
                )}
              </>
            )}

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
