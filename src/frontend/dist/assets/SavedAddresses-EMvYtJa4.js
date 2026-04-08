import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, P as Plus, X, B as BookMarked, M as MapPin, T as Trash2, S as Star } from "./index-Bd54l7xR.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "1d0kgt"
    }
  ]
];
const House = createLucideIcon("house", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
];
const Pencil = createLucideIcon("pencil", __iconNode);
const STORAGE_KEY = "shoapzy_saved_addresses";
function loadAddresses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveAddresses(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
  }
}
const LABEL_OPTIONS = [
  { value: "home", label: "Home", icon: House },
  { value: "office", label: "Office", icon: BookMarked },
  { value: "other", label: "Other", icon: MapPin }
];
const EMPTY_FORM = {
  label: "home",
  name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: ""
};
function SavedAddresses() {
  const [addresses, setAddresses] = reactExports.useState(loadAddresses);
  const [showForm, setShowForm] = reactExports.useState(false);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  reactExports.useEffect(() => {
    saveAddresses(addresses);
  }, [addresses]);
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };
  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode
    });
    setShowForm(true);
  };
  const handleDelete = (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setAddresses(
        (prev) => prev.map((a) => a.id === editingId ? { ...form, id: editingId } : a)
      );
    } else {
      setAddresses((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setShowForm(false);
  };
  const labelConfig = {
    home: { color: "#2874f0", bg: "#e3f2fd" },
    office: { color: "#388e3c", bg: "#e8f5e9" },
    other: { color: "#f57c00", bg: "#fff3e0" }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#f1f3f6" }, className: "min-h-screen py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-foreground", children: "Saved Addresses" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Manage your delivery addresses for faster checkout" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: openAdd,
          style: { background: "#2874f0" },
          className: "flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-sm text-sm hover:opacity-90 transition-opacity",
          "data-ocid": "saved-addr-add-btn",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
            "Add New"
          ]
        }
      )
    ] }),
    showForm && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card rounded-sm shadow-sm border border-blue-100 mb-5 overflow-hidden",
        "data-ocid": "saved-addr-form",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center justify-between px-5 py-3.5 border-b border-border",
              style: { background: "#e8f0fe" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold", style: { color: "#2874f0" }, children: editingId ? "Edit Address" : "Add New Address" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowForm(false),
                    className: "text-muted-foreground hover:text-foreground",
                    "aria-label": "Close",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "px-5 py-5 space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Address Type *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3", children: LABEL_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setForm((p) => ({ ...p, label: opt.value })),
                  className: "flex items-center gap-1.5 px-3 py-2 rounded-sm border text-xs font-semibold transition-all",
                  style: form.label === opt.value ? {
                    background: labelConfig[opt.value].bg,
                    border: `1.5px solid ${labelConfig[opt.value].color}`,
                    color: labelConfig[opt.value].color
                  } : { border: "1.5px solid #e0e0e0", color: "#888" },
                  "data-ocid": `saved-addr-label-${opt.value}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(opt.icon, { className: "w-3.5 h-3.5" }),
                    opt.label
                  ]
                },
                opt.value
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
              {
                key: "name",
                label: "Full Name",
                placeholder: "Rahul Sharma"
              },
              {
                key: "phone",
                label: "Phone",
                placeholder: "9876543210",
                type: "tel"
              },
              {
                key: "pincode",
                label: "Pincode",
                placeholder: "560034",
                maxLength: 6
              },
              { key: "city", label: "City", placeholder: "Bengaluru" },
              { key: "state", label: "State", placeholder: "Karnataka" },
              {
                key: "street",
                label: "Street / Area / House No.",
                placeholder: "123, MG Road",
                span: true
              }
            ].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: f.span ? "sm:col-span-2" : "", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  className: "block text-xs font-medium text-muted-foreground mb-1",
                  htmlFor: `saved-${f.key}`,
                  children: [
                    f.label,
                    " *"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: `saved-${f.key}`,
                  type: f.type ?? "text",
                  maxLength: f.maxLength,
                  value: form[f.key],
                  onChange: (e) => setForm((p) => ({ ...p, [f.key]: e.target.value })),
                  placeholder: f.placeholder,
                  required: true,
                  className: "w-full border border-input rounded-sm px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors",
                  "data-ocid": `saved-addr-field-${f.key}`
                }
              )
            ] }, f.key)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3 pt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowForm(false),
                  className: "px-5 py-2 text-sm border border-border rounded-sm text-foreground hover:bg-muted transition-colors",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "submit",
                  style: { background: "#fb641b" },
                  className: "px-8 py-2 text-sm text-white font-semibold rounded-sm hover:opacity-90 transition-opacity",
                  "data-ocid": "saved-addr-save-btn",
                  children: editingId ? "Save Changes" : "Save Address"
                }
              )
            ] })
          ] })
        ]
      }
    ),
    addresses.length === 0 && !showForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card rounded-sm shadow-sm p-12 text-center",
        "data-ocid": "saved-addr-empty",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              style: { background: "#e3f2fd" },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-8 h-8", style: { color: "#2874f0" } })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-foreground mb-1", children: "No saved addresses yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-5", children: "Add your home, office, or other delivery addresses for faster checkout." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: openAdd,
              style: { background: "#2874f0" },
              className: "text-white font-semibold px-6 py-2.5 rounded-sm text-sm hover:opacity-90 transition-opacity",
              "data-ocid": "saved-addr-empty-add-btn",
              children: "Add First Address"
            }
          )
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: addresses.map((addr) => {
      var _a;
      const cfg = labelConfig[addr.label];
      const LabelIcon = ((_a = LABEL_OPTIONS.find((o) => o.value === addr.label)) == null ? void 0 : _a.icon) ?? MapPin;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "card-address",
          "data-ocid": "saved-addr-card",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  style: { background: cfg.bg },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    LabelIcon,
                    {
                      className: "w-4 h-4",
                      style: { color: cfg.color }
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded",
                      style: {
                        background: cfg.bg,
                        color: cfg.color
                      },
                      children: addr.label
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-sm text-foreground", children: addr.name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/80", children: addr.street }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
                  addr.city,
                  ", ",
                  addr.state,
                  " — ",
                  addr.pincode
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                  "📞 ",
                  addr.phone
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => openEdit(addr),
                  className: "p-2 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-blue-600",
                  "aria-label": "Edit address",
                  "data-ocid": "saved-addr-edit-btn",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleDelete(addr.id),
                  className: "p-2 rounded-sm hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600",
                  "aria-label": "Delete address",
                  "data-ocid": "saved-addr-delete-btn",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
                }
              )
            ] })
          ] })
        },
        addr.id
      );
    }) }),
    addresses.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "mt-4 rounded-sm p-4 flex items-start gap-3 text-sm",
        style: {
          background: "#fffbea",
          border: "1px solid #fde68a"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Star,
            {
              className: "w-4 h-4 mt-0.5 flex-shrink-0 fill-amber-400",
              style: { color: "#d97706" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "#92400e" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Tip:" }),
            " At checkout, select a saved address to fill in your delivery details instantly."
          ] })
        ]
      }
    )
  ] }) });
}
export {
  SavedAddresses as default
};
