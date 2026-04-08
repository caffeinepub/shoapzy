import {
  ArrowLeft,
  ArrowLeftRight,
  ExternalLink,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCompare } from "../hooks/useCompare";
import type { Product } from "../types";

function getImageUrl(image: Product["image"]): string {
  if (!image) return "/placeholder.png";
  if (
    typeof image === "object" &&
    "getDirectURL" in image &&
    typeof (image as { getDirectURL?: () => string }).getDirectURL ===
      "function"
  ) {
    return (image as { getDirectURL: () => string }).getDirectURL();
  }
  return String(image);
}

const COMPARE_ATTRIBUTES = [
  { key: "price", label: "Selling Price" },
  { key: "mrp", label: "MRP" },
  { key: "discountPercent", label: "Discount" },
  { key: "category", label: "Category" },
  { key: "stock", label: "Stock" },
];

export default function Compare() {
  const { compareItems, removeFromCompare, clearCompare, maxCompare } =
    useCompare();

  if (compareItems.length === 0) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center"
      >
        <div
          className="bg-card rounded-sm shadow-sm p-12 text-center max-w-md w-full mx-4"
          data-ocid="compare-empty"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#e3f2fd" }}
          >
            <ArrowLeftRight className="w-8 h-8" style={{ color: "#2874f0" }} />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">
            No products to compare
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Add up to 4 products from product pages to compare them side by
            side.
          </p>
          <Link
            to="/"
            style={{ background: "#2874f0" }}
            className="inline-block text-white font-semibold px-6 py-2.5 rounded-sm text-sm hover:opacity-90 transition-opacity"
            data-ocid="compare-browse-btn"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f1f3f6" }} className="min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Compare Products
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {compareItems.length} product
              {compareItems.length !== 1 ? "s" : ""} selected
            </p>
          </div>
          <button
            type="button"
            onClick={clearCompare}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 px-3 py-1.5 rounded-sm hover:bg-red-50 transition-colors"
            data-ocid="compare-clear-btn"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>

        {/* Product cards row */}
        <div className="overflow-x-auto" data-ocid="compare-table">
          <div
            className="inline-grid gap-0 border border-border rounded-sm overflow-hidden bg-card shadow-sm"
            style={{
              gridTemplateColumns: `180px repeat(${maxCompare}, minmax(180px, 240px))`,
              minWidth: `${180 + maxCompare * 200}px`,
            }}
          >
            {/* Header row: attribute labels + product cards */}
            {/* Top-left blank */}
            <div className="bg-muted/40 border-b border-r border-border" />

            {/* Product header cards */}
            {compareItems.map((product) => (
              <div
                key={product.id}
                className="border-b border-r border-border last:border-r-0 p-3 flex flex-col items-center text-center relative"
                data-ocid="compare-product-card"
              >
                <button
                  type="button"
                  onClick={() => removeFromCompare(product.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
                  aria-label={`Remove ${product.title}`}
                  data-ocid="compare-remove-product"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="w-28 h-28 bg-muted rounded-sm overflow-hidden mb-2 flex items-center justify-center">
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                </div>
                <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-2 min-h-[2.5rem]">
                  {product.title}
                </p>
                <Link
                  to={`/product/${product.id}`}
                  className="flex items-center gap-1 text-xs font-medium hover:underline"
                  style={{ color: "#2874f0" }}
                  data-ocid="compare-view-product"
                >
                  View <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}

            {/* Empty slots for remaining compare spots */}
            {Array.from({ length: maxCompare - compareItems.length }).map(
              (_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: placeholder slot
                  key={`empty-slot-${i}`}
                  className="border-b border-r border-border last:border-r-0 p-3 flex flex-col items-center justify-center gap-3"
                >
                  {i === 0 ? (
                    <>
                      <div
                        className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
                        style={{ borderColor: "#2874f0" }}
                      >
                        <Plus className="w-5 h-5 text-[#2874f0]" />
                      </div>
                      <Link
                        to="/"
                        className="text-xs font-semibold text-[#2874f0] hover:underline text-center"
                        data-ocid="compare-add-more-btn"
                      >
                        Add More Products
                      </Link>
                    </>
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-dashed border-border" />
                  )}
                </div>
              ),
            )}

            {/* Attribute rows */}
            {COMPARE_ATTRIBUTES.map((attr) => (
              <>
                {/* Attribute label cell */}
                <div
                  key={`lbl-${attr.key}`}
                  className="bg-muted/30 border-b border-r border-border px-4 py-3 flex items-center"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {attr.label}
                  </span>
                </div>

                {/* Product values */}
                {compareItems.map((product) => {
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

                  const isBest =
                    attr.key === "price" || attr.key === "discountPercent"
                      ? compareItems.every((p) => {
                          if (attr.key === "price")
                            return Number(product.price) <= Number(p.price);
                          return (
                            Number(product.discountPercent) >=
                            Number(p.discountPercent)
                          );
                        })
                      : false;

                  return (
                    <div
                      key={`${attr.key}-${product.id}`}
                      className="border-b border-r border-border last:border-r-0 px-4 py-3 flex items-center justify-center"
                      style={isBest ? { background: "#f0fdf4" } : {}}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: isBest ? "#166534" : "inherit",
                          fontWeight: isBest ? 700 : undefined,
                        }}
                      >
                        {isBest && (
                          <Star className="w-3 h-3 inline mr-1 fill-green-500 text-green-500" />
                        )}
                        {value}
                      </span>
                    </div>
                  );
                })}
                {/* Empty cells for unfilled slots */}
                {Array.from({
                  length: maxCompare - compareItems.length,
                }).map((_, i) => (
                  <div
                    key={`${attr.key}-empty-${i}`}
                    className="border-b border-r border-border last:border-r-0 px-4 py-3"
                  />
                ))}
              </>
            ))}

            {/* Description row */}
            <div className="bg-muted/30 border-r border-border px-4 py-3 flex items-start">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </span>
            </div>
            {compareItems.map((product) => (
              <div
                key={`desc-${product.id}`}
                className="border-r border-border last:border-r-0 px-4 py-3"
              >
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {product.description || "—"}
                </p>
              </div>
            ))}
            {Array.from({ length: maxCompare - compareItems.length }).map(
              (_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: empty desc cell
                  key={`desc-empty-${i}`}
                  className="border-r border-border last:border-r-0 px-4 py-3"
                />
              ),
            )}
          </div>
        </div>

        {/* Hint */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          💡 Highlighted cells indicate the best value among compared products.
          Add more products from product pages (up to 4).
        </p>
      </div>
    </div>
  );
}
