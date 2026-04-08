import Link from "next/link";
import type { PolicyDocumentRender, PolicyLocale } from "@/lib/project-types";

interface PolicyDocumentPageProps {
  appName: string;
  document: PolicyDocumentRender;
  locale: PolicyLocale;
  privacyHref: string;
  termsHref: string;
  currentType: "privacy" | "terms";
}

export function PolicyDocumentPage({
  appName,
  document,
  locale,
  privacyHref,
  termsHref,
  currentType,
}: PolicyDocumentPageProps) {
  const localizedPrivacyHref = appendLang(privacyHref, locale);
  const localizedTermsHref = appendLang(termsHref, locale);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-gray-500">
              {appName}
            </p>
            <h1 className="mt-2 text-3xl font-display font-bold uppercase tracking-wide">
              {document.title}
            </h1>
          </div>
          <div className="text-right text-xs font-mono uppercase tracking-[0.18em] text-gray-500">
            <div className="mb-2">
              <Link
                href={appendLang(currentType === "privacy" ? privacyHref : termsHref, "en")}
                className={locale === "en" ? "text-black" : "hover:text-black"}
              >
                English
              </Link>
              <span className="px-2 text-gray-300">|</span>
              <Link
                href={appendLang(currentType === "privacy" ? privacyHref : termsHref, "zh")}
                className={locale === "zh" ? "text-black" : "hover:text-black"}
              >
                中文
              </Link>
            </div>
            <p>
              {document.effectiveDateLabel}: {document.effectiveDateValue}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <article className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {document.intro ? (
            <p className="mb-8 text-base leading-7 text-gray-700">{document.intro}</p>
          ) : null}

          <div className="space-y-8">
            {document.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-display font-bold uppercase tracking-wide">
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-gray-700 md:text-[15px]">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={`${section.heading}-${index}`}>{paragraph}</p>
                  ))}
                  {section.bullets.length > 0 ? (
                    <ul className="list-disc space-y-2 pl-6">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>{appName}</p>
          <div className="flex items-center gap-4">
            <Link
              href={localizedPrivacyHref}
              className={currentType === "privacy" ? "font-semibold text-black" : "hover:text-black"}
            >
              Privacy Policy
            </Link>
            <Link
              href={localizedTermsHref}
              className={currentType === "terms" ? "font-semibold text-black" : "hover:text-black"}
            >
              Terms of Service
            </Link>
            {document.contactEmail ? (
              <a href={`mailto:${document.contactEmail}`} className="hover:text-black">
                {document.contactEmail}
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}

function appendLang(path: string, locale: PolicyLocale): string {
  return `${path}?lang=${locale}`;
}
