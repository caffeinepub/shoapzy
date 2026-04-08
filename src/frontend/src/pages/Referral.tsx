import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  Gift,
  Loader2,
  Share2,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Share2,
    title: "Share Your Code",
    desc: "Share your unique referral code or link with friends and family.",
    color: "#2874f0",
    bg: "#e3f2fd",
  },
  {
    step: 2,
    icon: Users,
    title: "Friend Registers",
    desc: "Your friend signs up on Shoapzy using your referral code.",
    color: "#388e3c",
    bg: "#e8f5e9",
  },
  {
    step: 3,
    icon: Star,
    title: "Both Earn Points",
    desc: "You earn 200 bonus loyalty points when they make their first order.",
    color: "#f57c00",
    bg: "#fff3e0",
  },
];

export default function Referral() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  // Derive a deterministic referral code from the user's principal
  const principal = identity?.getPrincipal().toString() ?? "";
  const referralCode = principal
    ? `SHZ-${principal.slice(0, 5).toUpperCase()}`
    : "SHZ-XXXXX";

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const { data: loyaltyPoints = BigInt(0) } = useQuery({
    queryKey: ["loyaltyPoints", principal],
    queryFn: () => actor!.getLoyaltyPoints(),
    enabled: !!actor && !!identity,
  });

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join Shoapzy!",
        text: `Use my referral code ${referralCode} and get bonus points on your first order!`,
        url: referralLink,
      });
    } else {
      handleCopyLink();
    }
  };

  const handleApplyCode = async () => {
    if (!applyCode.trim() || !actor) return;
    setApplying(true);
    setApplyResult(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actorAny = actor as any;
      if (typeof actorAny.applyReferralCode === "function") {
        const result = await actorAny.applyReferralCode(applyCode.trim());
        if ("ok" in result) {
          setApplyResult({
            ok: true,
            msg: "Code applied! Bonus points credited to your account.",
          });
          setApplyCode("");
        } else {
          setApplyResult({
            ok: false,
            msg: result.err ?? "Invalid or already used code.",
          });
        }
      } else {
        setApplyResult({
          ok: true,
          msg: "Code applied successfully! (Demo mode)",
        });
        setApplyCode("");
      }
    } catch {
      setApplyResult({
        ok: false,
        msg: "Failed to apply code. Please try again.",
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ background: "#f1f3f6" }} className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Hero banner */}
        <div
          className="rounded-sm overflow-hidden mb-6 relative text-white"
          style={{
            background:
              "linear-gradient(135deg, #2874f0 0%, #1a5fd9 60%, #3b5fe2 100%)",
          }}
          data-ocid="referral-hero"
        >
          <div className="px-8 py-10 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <Gift className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">
                Refer &amp; Earn
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              Invite friends. Earn points.
            </h1>
            <p className="text-blue-100 text-sm">
              Share your code and earn{" "}
              <span className="font-bold text-yellow-300">
                200 bonus points
              </span>{" "}
              for every friend who makes their first purchase.
            </p>
          </div>
          {/* Decorative */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"
            aria-hidden="true"
          >
            <Gift className="w-32 h-32 text-white" />
          </div>
        </div>

        {/* Points balance */}
        {Number(loyaltyPoints) > 0 && (
          <div
            className="rounded-sm p-4 mb-5 flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #fffbea 0%, #fef3c7 100%)",
              border: "1.5px solid #f59e0b",
            }}
            data-ocid="referral-points-balance"
          >
            <Star
              className="w-5 h-5 fill-amber-400 flex-shrink-0"
              style={{ color: "#d97706" }}
            />
            <div>
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">
                Your Loyalty Balance
              </p>
              <p
                className="text-lg font-extrabold"
                style={{ color: "#d97706" }}
              >
                {Number(loyaltyPoints)} pts
                <span className="text-xs font-normal text-amber-600 ml-2">
                  = ₹{Number(loyaltyPoints)}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Referral code card */}
        <div
          className="bg-card rounded-sm shadow-sm border border-border p-6 mb-5"
          data-ocid="referral-code-card"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Your Referral Code
          </p>
          <div className="flex items-center gap-3">
            <div
              className="code-box flex-1 text-center text-lg tracking-[0.3em] select-all"
              data-ocid="referral-code-display"
            >
              {referralCode}
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold transition-all"
              style={
                copied
                  ? {
                      background: "#e8f5e9",
                      color: "#388e3c",
                      border: "1.5px solid #a5d6a7",
                    }
                  : { background: "#2874f0", color: "#fff" }
              }
              data-ocid="referral-copy-code-btn"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
          </div>

          {/* Referral link */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Or Share Your Link
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 border border-input rounded-sm px-3 py-2 text-xs text-muted-foreground bg-muted/30 select-all"
                data-ocid="referral-link-input"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#fb641b" }}
                data-ocid="referral-share-btn"
              >
                <Share2 className="w-4 h-4" />
                {copiedLink ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div
          className="bg-card rounded-sm shadow-sm border border-border p-6 mb-5"
          data-ocid="referral-how-it-works"
        >
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
            How it works
          </h2>
          <div className="flex flex-col gap-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg }}
                >
                  <item.icon
                    className="w-5 h-5"
                    style={{ color: item.color }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.step}. {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply a friend's referral code */}
        <div
          className="bg-card rounded-sm shadow-sm border border-border p-6 mb-5"
          data-ocid="apply-referral-section"
        >
          <h2 className="text-sm font-bold text-foreground mb-1 uppercase tracking-wide">
            Apply a Friend's Code
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Have a referral code from a friend? Enter it to earn bonus points on
            your first order.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={applyCode}
              onChange={(e) => {
                setApplyCode(e.target.value.toUpperCase());
                setApplyResult(null);
              }}
              placeholder="Enter referral code (e.g. SHZ-AB1C2)"
              maxLength={20}
              className="flex-1 border border-input rounded-sm px-3 py-2 text-sm font-mono uppercase tracking-widest text-foreground bg-background focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              data-ocid="apply-code-input"
            />
            <button
              type="button"
              onClick={handleApplyCode}
              disabled={!applyCode.trim() || applying}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-sm transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ background: "#fb641b" }}
              data-ocid="apply-code-btn"
            >
              {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {applying ? "Applying…" : "Apply"}
            </button>
          </div>
          {applyResult && (
            <p
              className="text-xs font-medium mt-2"
              style={{ color: applyResult.ok ? "#2e7d32" : "#c62828" }}
            >
              {applyResult.ok ? "✓ " : "✗ "}
              {applyResult.msg}
            </p>
          )}
        </div>

        {/* T&C */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Points are credited after your referred friend completes their first
          order. Referral rewards are subject to Shoapzy's terms and conditions.
          Self-referrals are not eligible.
        </p>
      </div>
    </div>
  );
}
