"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles, Star, X } from "lucide-react";
import { createProjectCheckoutSession, type PlanCode } from "@/lib/api-projects";

interface PaywallModalProps {
  open: boolean;
  projectId: string;
  currentPlan: PlanCode;
  targetPlan: Exclude<PlanCode, "free">;
  featureName: string;
  onClose: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const PLAN_COPY = {
  base: {
    badge: "Most teams start here",
    title: "Everything you need to launch",
    subtitle: "Unlock the clean exports and policy publishing flow that make a project ship-ready.",
    cta: "Unlock Base",
    gradient: "from-[#ffd54a] via-[#ffb300] to-[#ff7a18]",
    comparison: {
      currentLabel: "Free right now",
      upgradeLabel: "Base after upgrade",
    },
    benefits: [
      "HD screenshots with no watermark",
      "Unlimited exports for the current version",
      "Publish and host privacy and terms pages",
      "100 AI runs for this project",
    ],
  },
  pro: {
    badge: "Built for growth",
    title: "Perfect your app, in every language",
    subtitle: "Unlock the advanced export and localization tools that help a project scale after launch.",
    cta: "Upgrade to Pro",
    gradient: "from-[#111111] via-[#cc2f2f] to-[#ff7a18]",
    comparison: {
      currentLabel: "Current plan",
      upgradeLabel: "Pro after upgrade",
    },
    benefits: [
      "Unlimited AI runs for this project",
      "Multilingual screenshots and policy pages",
      "Multi-version exports for iteration and launch prep",
      "Everything in Base included",
    ],
  },
} as const;

export function PaywallModal({
  open,
  projectId,
  currentPlan,
  targetPlan,
  featureName,
  onClose,
  secondaryActionLabel,
  onSecondaryAction,
}: PaywallModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(() => PLAN_COPY[targetPlan], [targetPlan]);

  if (!open) {
    return null;
  }

  async function handleCheckout() {
    try {
      setSubmitting(true);
      setError(null);
      const session = await createProjectCheckoutSession(projectId, targetPlan);
      window.location.href = session.checkoutUrl;
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    }
  }

  function handleSecondaryAction() {
    onSecondaryAction?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 sm:px-6" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-6xl border-2 border-black bg-[#f4efe3] shadow-[10px_10px_0px_#111111]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-b-2 border-black bg-gradient-to-r ${copy.gradient} text-white`}>
          <div className="flex items-start justify-between gap-4 px-6 py-5 sm:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 border-2 border-white/80 bg-white/15 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.24em]">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.badge}
              </div>
              <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none sm:text-5xl">
                {copy.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">{copy.subtitle}</p>
              <div className="mt-4 inline-flex items-center gap-2 border-2 border-white bg-white px-3 py-2 text-sm font-bold uppercase text-black">
                <Star className="h-4 w-4" />
                You clicked: {featureName}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-white bg-white text-black transition-colors hover:bg-yellow-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.15fr,0.85fr]">
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border-2 border-black bg-white p-5">
                <p className="text-xs font-mono uppercase tracking-[0.22em] text-gray-500">
                  {copy.comparison.currentLabel}
                </p>
                <p className="mt-3 font-display text-3xl font-bold uppercase">{currentPlan}</p>
                <p className="mt-4 text-sm text-gray-600">
                  You can keep editing, but this action stays limited until the project is upgraded.
                </p>
              </div>

              <div className="border-2 border-black bg-yellow-300 p-5 shadow-[6px_6px_0px_#111111]">
                <p className="text-xs font-mono uppercase tracking-[0.22em] text-gray-700">
                  {copy.comparison.upgradeLabel}
                </p>
                <p className="mt-3 font-display text-3xl font-bold uppercase">{targetPlan}</p>
                <p className="mt-4 text-sm text-black">
                  Upgrade this one project and unlock the workflow users expect at the point of export or publish.
                </p>
              </div>
            </div>

            <div className="border-2 border-black bg-white p-6">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-gray-500">Why upgrade now</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {copy.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3 border-2 border-black bg-[#f8f3e8] p-3">
                    <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center border-2 border-black bg-black text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm font-medium text-black">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="border-2 border-black bg-black p-6 text-white">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-white/70">Upgrade this project</p>
              <p className="mt-3 font-display text-3xl font-bold uppercase leading-none">
                {targetPlan === "base" ? "Remove friction at launch" : "Unlock the full workflow"}
              </p>
              <p className="mt-4 text-sm text-white/85">
                Keep the user in the moment and turn this blocked action into a checkout instead of a dead end.
              </p>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 border-2 border-black bg-yellow-300 px-4 py-4 text-sm font-bold uppercase text-black transition-colors hover:bg-yellow-200 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {submitting ? "Redirecting to checkout..." : copy.cta}
              </button>

              {secondaryActionLabel && onSecondaryAction ? (
                <button
                  type="button"
                  onClick={handleSecondaryAction}
                  className="mt-3 inline-flex w-full items-center justify-center border-2 border-white bg-transparent px-4 py-3 text-sm font-bold uppercase text-white transition-colors hover:bg-white hover:text-black"
                >
                  {secondaryActionLabel}
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="border-2 border-red-600 bg-red-50 p-4 text-sm font-mono text-red-600">{error}</div>
            ) : null}

            <div className="border-2 border-black bg-white p-5">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-gray-500">What happens next</p>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p>Checkout opens in Stripe for this project only.</p>
                <p>Once payment succeeds, the blocked action is available immediately after refresh.</p>
                <p>Your existing screenshots, policy content, and project settings stay untouched.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
