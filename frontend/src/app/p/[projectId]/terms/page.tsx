import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyDocumentPage } from "@/components/policy/PolicyDocumentPage";
import { getPublicPolicyData } from "@/lib/api-projects";
import { getPolicyDocument, resolvePolicyLocale } from "@/lib/policy-public";

interface PageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const { lang } = await searchParams;

  try {
    const publicData = await getPublicPolicyData(projectId);
    const locale = resolvePolicyLocale(lang, publicData.localeDefault);
    const document = getPolicyDocument(publicData, "terms", locale);
    return {
      title: `${publicData.appName} ${document.title}`,
      description: `${publicData.appName} ${document.title}`,
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: "Terms of Service",
      robots: { index: false, follow: false },
    };
  }
}

export default async function PublicTermsPage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const { lang } = await searchParams;

  try {
    const publicData = await getPublicPolicyData(projectId);
    const locale = resolvePolicyLocale(lang, publicData.localeDefault);
    const document = getPolicyDocument(publicData, "terms", locale);

    return (
      <PolicyDocumentPage
        appName={publicData.appName}
        document={document}
        locale={locale}
        privacyHref={publicData.privacyUrl}
        termsHref={publicData.termsUrl}
        currentType="terms"
      />
    );
  } catch {
    notFound();
  }
}
