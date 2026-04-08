import { c as createLucideIcon, a as useInternetIdentity, b as useActor, r as reactExports, d as useQuery, j as jsxRuntimeExports, G as Gift, S as Star, C as CircleCheck, U as Users, e as LoaderCircle } from "./index-jdjdUxr_.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "18", cy: "5", r: "3", key: "gq8acd" }],
  ["circle", { cx: "6", cy: "12", r: "3", key: "w7nqdw" }],
  ["circle", { cx: "18", cy: "19", r: "3", key: "1xt0gg" }],
  ["line", { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49", key: "47mynk" }],
  ["line", { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49", key: "1n3mei" }]
];
const Share2 = createLucideIcon("share-2", __iconNode);
const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Share2,
    title: "Share Your Code",
    desc: "Share your unique referral code or link with friends and family.",
    color: "#2874f0",
    bg: "#e3f2fd"
  },
  {
    step: 2,
    icon: Users,
    title: "Friend Registers",
    desc: "Your friend signs up on Shoapzy using your referral code.",
    color: "#388e3c",
    bg: "#e8f5e9"
  },
  {
    step: 3,
    icon: Star,
    title: "Both Earn Points",
    desc: "You earn 200 bonus loyalty points when they make their first order.",
    color: "#f57c00",
    bg: "#fff3e0"
  }
];
function Referral() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const [copied, setCopied] = reactExports.useState(false);
  const [copiedLink, setCopiedLink] = reactExports.useState(false);
  const [applyCode, setApplyCode] = reactExports.useState("");
  const [applying, setApplying] = reactExports.useState(false);
  const [applyResult, setApplyResult] = reactExports.useState(null);
  const principal = (identity == null ? void 0 : identity.getPrincipal().toString()) ?? "";
  const referralCode = principal ? `SHZ-${principal.slice(0, 5).toUpperCase()}` : "SHZ-XXXXX";
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const { data: loyaltyPoints = BigInt(0) } = useQuery({
    queryKey: ["loyaltyPoints", principal],
    queryFn: () => actor.getLoyaltyPoints(),
    enabled: !!actor && !!identity
  });
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2e3);
  };
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join Shoapzy!",
        text: `Use my referral code ${referralCode} and get bonus points on your first order!`,
        url: referralLink
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
      const actorAny = actor;
      if (typeof actorAny.applyReferralCode === "function") {
        const result = await actorAny.applyReferralCode(applyCode.trim());
        if ("ok" in result) {
          setApplyResult({
            ok: true,
            msg: "Code applied! Bonus points credited to your account."
          });
          setApplyCode("");
        } else {
          setApplyResult({
            ok: false,
            msg: result.err ?? "Invalid or already used code."
          });
        }
      } else {
        setApplyResult({
          ok: true,
          msg: "Code applied successfully! (Demo mode)"
        });
        setApplyCode("");
      }
    } catch {
      setApplyResult({
        ok: false,
        msg: "Failed to apply code. Please try again."
      });
    } finally {
      setApplying(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#f1f3f6" }, className: "min-h-screen py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "rounded-sm overflow-hidden mb-6 relative text-white",
        style: {
          background: "linear-gradient(135deg, #2874f0 0%, #1a5fd9 60%, #3b5fe2 100%)"
        },
        "data-ocid": "referral-hero",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-8 py-10 relative z-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "w-10 h-10 rounded-full flex items-center justify-center",
                  style: { background: "rgba(255,255,255,0.2)" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "w-5 h-5 text-white" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold opacity-90 uppercase tracking-wide", children: "Refer & Earn" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold mb-1", children: "Invite friends. Earn points." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-blue-100 text-sm", children: [
              "Share your code and earn",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-yellow-300", children: "200 bonus points" }),
              " ",
              "for every friend who makes their first purchase."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute right-6 top-1/2 -translate-y-1/2 opacity-10",
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "w-32 h-32 text-white" })
            }
          )
        ]
      }
    ),
    Number(loyaltyPoints) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "rounded-sm p-4 mb-5 flex items-center gap-3",
        style: {
          background: "linear-gradient(135deg, #fffbea 0%, #fef3c7 100%)",
          border: "1.5px solid #f59e0b"
        },
        "data-ocid": "referral-points-balance",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Star,
            {
              className: "w-5 h-5 fill-amber-400 flex-shrink-0",
              style: { color: "#d97706" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700 font-semibold uppercase tracking-wide", children: "Your Loyalty Balance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                className: "text-lg font-extrabold",
                style: { color: "#d97706" },
                children: [
                  Number(loyaltyPoints),
                  " pts",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-normal text-amber-600 ml-2", children: [
                    "= ₹",
                    Number(loyaltyPoints)
                  ] })
                ]
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card rounded-sm shadow-sm border border-border p-6 mb-5",
        "data-ocid": "referral-code-card",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: "Your Referral Code" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "code-box flex-1 text-center text-lg tracking-[0.3em] select-all",
                "data-ocid": "referral-code-display",
                children: referralCode
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleCopyCode,
                className: "flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold transition-all",
                style: copied ? {
                  background: "#e8f5e9",
                  color: "#388e3c",
                  border: "1.5px solid #a5d6a7"
                } : { background: "#2874f0", color: "#fff" },
                "data-ocid": "referral-copy-code-btn",
                children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-4 h-4" }),
                  " Copied!"
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" }),
                  " Copy"
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2", children: "Or Share Your Link" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  readOnly: true,
                  value: referralLink,
                  className: "flex-1 border border-input rounded-sm px-3 py-2 text-xs text-muted-foreground bg-muted/30 select-all",
                  "data-ocid": "referral-link-input",
                  onClick: (e) => e.target.select()
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: handleShare,
                  className: "flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold text-white transition-opacity hover:opacity-90",
                  style: { background: "#fb641b" },
                  "data-ocid": "referral-share-btn",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "w-4 h-4" }),
                    copiedLink ? "Copied!" : "Share"
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card rounded-sm shadow-sm border border-border p-6 mb-5",
        "data-ocid": "referral-how-it-works",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold text-foreground mb-4 uppercase tracking-wide", children: "How it works" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4", children: HOW_IT_WORKS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                style: { background: item.bg },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  item.icon,
                  {
                    className: "w-5 h-5",
                    style: { color: item.color }
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-foreground", children: [
                item.step,
                ". ",
                item.title
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: item.desc })
            ] })
          ] }, item.step)) })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card rounded-sm shadow-sm border border-border p-6 mb-5",
        "data-ocid": "apply-referral-section",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold text-foreground mb-1 uppercase tracking-wide", children: "Apply a Friend's Code" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3", children: "Have a referral code from a friend? Enter it to earn bonus points on your first order." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: applyCode,
                onChange: (e) => {
                  setApplyCode(e.target.value.toUpperCase());
                  setApplyResult(null);
                },
                placeholder: "Enter referral code (e.g. SHZ-AB1C2)",
                maxLength: 20,
                className: "flex-1 border border-input rounded-sm px-3 py-2 text-sm font-mono uppercase tracking-widest text-foreground bg-background focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors",
                "data-ocid": "apply-code-input"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: handleApplyCode,
                disabled: !applyCode.trim() || applying,
                className: "flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-sm transition-opacity disabled:opacity-50 hover:opacity-90",
                style: { background: "#fb641b" },
                "data-ocid": "apply-code-btn",
                children: [
                  applying && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }),
                  applying ? "Applying…" : "Apply"
                ]
              }
            )
          ] }),
          applyResult && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              className: "text-xs font-medium mt-2",
              style: { color: applyResult.ok ? "#2e7d32" : "#c62828" },
              children: [
                applyResult.ok ? "✓ " : "✗ ",
                applyResult.msg
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground text-center leading-relaxed", children: "Points are credited after your referred friend completes their first order. Referral rewards are subject to Shoapzy's terms and conditions. Self-referrals are not eligible." })
  ] }) });
}
export {
  Referral as default
};
