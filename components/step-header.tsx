import Image from "next/image";
import Link from "next/link";

/** Shared Coquí step-screen header: wordmark, "Need help?" link, and the muted sound toggle. */
export function StepHeader() {
  return (
    <header className="upload-header">
      <Link className="upload-wordmark" href="/upload" aria-label="Coquí home">
        <Image src="/brand/coqui-wordmark.svg" alt="Coquí" width={56} height={26} priority />
      </Link>
      <div className="upload-header-actions">
        <a className="upload-help-link" href="mailto:bryan@bryanlew.is">
          Need help? <span className="upload-help-link-cta">Get in touch</span>
        </a>
        <button className="upload-sound-button" type="button" aria-label="Sound is muted" disabled>
          <Image src="/brand/icon-volume-cross.svg" alt="" width={20} height={20} />
        </button>
      </div>
    </header>
  );
}

