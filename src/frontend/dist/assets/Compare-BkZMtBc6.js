import { c as createLucideIcon, u as useCompare, j as jsxRuntimeExports, A as ArrowLeftRight, L as Link, T as Trash2, X, P as Plus, S as Star } from "./index-jdjdUxr_.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
];
const ExternalLink = createLucideIcon("external-link", __iconNode);
function getImageUrl(image) {
  if (!image) return "/placeholder.png";
  if (typeof image === "object" && "getDirectURL" in image && typeof image.getDirectURL === "function") {
    return image.getDirectURL();
  }
  return String(image);
}
const COMPARE_ATTRIBUTES = [
  { key: "price", label: "Selling Price" },
  { key: "mrp", label: "MRP" },
  { key: "discountPercent", label: "Discount" },
  { key: "category", label: "Category" },
  { key: "stock", label: "Stock" }
];
function Compare() {
  const { compareItems, removeFromCompare, clearCompare, maxCompare } = useCompare();
  if (compareItems.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: { background: "#f1f3f6" },
        className: "min-h-screen flex items-center justify-center",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "bg-card rounded-sm shadow-sm p-12 text-center max-w-md w-full mx-4",
            "data-ocid": "compare-empty",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                  style: { background: "#e3f2fd" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeftRight, { className: "w-8 h-8", style: { color: "#2874f0" } })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-foreground mb-2", children: "No products to compare" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-5", children: "Add up to 4 products from product pages to compare them side by side." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Link,
                {
                  to: "/",
                  style: { background: "#2874f0" },
                  className: "inline-block text-white font-semibold px-6 py-2.5 rounded-sm text-sm hover:opacity-90 transition-opacity",
                  "data-ocid": "compare-browse-btn",
                  children: "Browse Products"
                }
              )
            ]
          }
        )
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#f1f3f6" }, className: "min-h-screen py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-foreground", children: "Compare Products" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-0.5", children: [
          compareItems.length,
          " product",
          compareItems.length !== 1 ? "s" : "",
          " selected"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: clearCompare,
          className: "flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 px-3 py-1.5 rounded-sm hover:bg-red-50 transition-colors",
          "data-ocid": "compare-clear-btn",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
            "Clear All"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", "data-ocid": "compare-table", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "inline-grid gap-0 border border-border rounded-sm overflow-hidden bg-card shadow-sm",
        style: {
          gridTemplateColumns: `180px repeat(${maxCompare}, minmax(180px, 240px))`,
          minWidth: `${180 + maxCompare * 200}px`
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted/40 border-b border-r border-border" }),
          compareItems.map((product) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "border-b border-r border-border last:border-r-0 p-3 flex flex-col items-center text-center relative",
              "data-ocid": "compare-product-card",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => removeFromCompare(product.id),
                    className: "absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-red-500",
                    "aria-label": `Remove ${product.title}`,
                    "data-ocid": "compare-remove-product",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3.5 h-3.5" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-28 h-28 bg-muted rounded-sm overflow-hidden mb-2 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: getImageUrl(product.image),
                    alt: product.title,
                    className: "w-full h-full object-contain",
                    onError: (e) => {
                      e.target.src = "/placeholder.png";
                    }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-2 min-h-[2.5rem]", children: product.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Link,
                  {
                    to: `/product/${product.id}`,
                    className: "flex items-center gap-1 text-xs font-medium hover:underline",
                    style: { color: "#2874f0" },
                    "data-ocid": "compare-view-product",
                    children: [
                      "View ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" })
                    ]
                  }
                )
              ]
            },
            product.id
          )),
          Array.from({ length: maxCompare - compareItems.length }).map(
            (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "border-b border-r border-border last:border-r-0 p-3 flex flex-col items-center justify-center gap-3",
                children: i === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center",
                      style: { borderColor: "#2874f0" },
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-5 h-5 text-[#2874f0]" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Link,
                    {
                      to: "/",
                      className: "text-xs font-semibold text-[#2874f0] hover:underline text-center",
                      "data-ocid": "compare-add-more-btn",
                      children: "Add More Products"
                    }
                  )
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full border border-dashed border-border" })
              },
              `empty-slot-${i}`
            )
          ),
          COMPARE_ATTRIBUTES.map((attr) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "bg-muted/30 border-b border-r border-border px-4 py-3 flex items-center",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: attr.label })
              },
              `lbl-${attr.key}`
            ),
            compareItems.map((product) => {
              let value = "—";
              if (attr.key === "price") {
                value = `₹${(Number(product.price) / 100).toLocaleString()}`;
              } else if (attr.key === "mrp") {
                value = `₹${(Number(product.mrp) / 100).toLocaleString()}`;
              } else if (attr.key === "discountPercent") {
                value = `${Number(product.discountPercent)}% OFF`;
              } else if (attr.key === "category") {
                value = product.category ?? "—";
              } else if (attr.key === "stock") {
                const s = Number(product.stock);
                value = s > 0 ? `${s} in stock` : "Out of stock";
              }
              const isBest = attr.key === "price" || attr.key === "discountPercent" ? compareItems.every((p) => {
                if (attr.key === "price")
                  return Number(product.price) <= Number(p.price);
                return Number(product.discountPercent) >= Number(p.discountPercent);
              }) : false;
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "border-b border-r border-border last:border-r-0 px-4 py-3 flex items-center justify-center",
                  style: isBest ? { background: "#f0fdf4" } : {},
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      className: "text-sm font-medium",
                      style: {
                        color: isBest ? "#166534" : "inherit",
                        fontWeight: isBest ? 700 : void 0
                      },
                      children: [
                        isBest && /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "w-3 h-3 inline mr-1 fill-green-500 text-green-500" }),
                        value
                      ]
                    }
                  )
                },
                `${attr.key}-${product.id}`
              );
            }),
            Array.from({
              length: maxCompare - compareItems.length
            }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "border-b border-r border-border last:border-r-0 px-4 py-3"
              },
              `${attr.key}-empty-${i}`
            ))
          ] })),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted/30 border-r border-border px-4 py-3 flex items-start", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Description" }) }),
          compareItems.map((product) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "border-r border-border last:border-r-0 px-4 py-3",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-3 leading-relaxed", children: product.description || "—" })
            },
            `desc-${product.id}`
          )),
          Array.from({ length: maxCompare - compareItems.length }).map(
            (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "border-r border-border last:border-r-0 px-4 py-3"
              },
              `desc-empty-${i}`
            )
          )
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground text-center mt-4", children: "💡 Highlighted cells indicate the best value among compared products. Add more products from product pages (up to 4)." })
  ] }) });
}
export {
  Compare as default
};
