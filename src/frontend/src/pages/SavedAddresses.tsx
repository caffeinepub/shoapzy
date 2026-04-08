import {
  BookMarked,
  Home,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { SavedAddress, SavedAddressLabel } from "../types";

const STORAGE_KEY = "shoapzy_saved_addresses";

function loadAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedAddress[]) : [];
  } catch {
    return [];
  }
}

function saveAddresses(list: SavedAddress[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

const LABEL_OPTIONS: {
  value: SavedAddressLabel;
  label: string;
  icon: typeof Home;
}[] = [
  { value: "home", label: "Home", icon: Home },
  { value: "office", label: "Office", icon: BookMarked },
  { value: "other", label: "Other", icon: MapPin },
];

const EMPTY_FORM: Omit<SavedAddress, "id"> = {
  label: "home",
  name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

export default function SavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>(loadAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    saveAddresses(addresses);
  }, [addresses]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingId ? { ...form, id: editingId } : a)),
      );
    } else {
      setAddresses((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setShowForm(false);
  };

  const labelConfig: Record<SavedAddressLabel, { color: string; bg: string }> =
    {
      home: { color: "#2874f0", bg: "#e3f2fd" },
      office: { color: "#388e3c", bg: "#e8f5e9" },
      other: { color: "#f57c00", bg: "#fff3e0" },
    };

  return (
    <div style={{ background: "#f1f3f6" }} className="min-h-screen py-6">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Saved Addresses
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your delivery addresses for faster checkout
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            style={{ background: "#2874f0" }}
            className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-sm text-sm hover:opacity-90 transition-opacity"
            data-ocid="saved-addr-add-btn"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div
            className="bg-card rounded-sm shadow-sm border border-blue-100 mb-5 overflow-hidden"
            data-ocid="saved-addr-form"
          >
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b border-border"
              style={{ background: "#e8f0fe" }}
            >
              <h2 className="text-sm font-bold" style={{ color: "#2874f0" }}>
                {editingId ? "Edit Address" : "Add New Address"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {/* Label selector */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Address Type *
                </p>
                <div className="flex gap-3">
                  {LABEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, label: opt.value }))
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-sm border text-xs font-semibold transition-all"
                      style={
                        form.label === opt.value
                          ? {
                              background: labelConfig[opt.value].bg,
                              border: `1.5px solid ${labelConfig[opt.value].color}`,
                              color: labelConfig[opt.value].color,
                            }
                          : { border: "1.5px solid #e0e0e0", color: "#888" }
                      }
                      data-ocid={`saved-addr-label-${opt.value}`}
                    >
                      <opt.icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    {
                      key: "name",
                      label: "Full Name",
                      placeholder: "Rahul Sharma",
                    },
                    {
                      key: "phone",
                      label: "Phone",
                      placeholder: "9876543210",
                      type: "tel",
                    },
                    {
                      key: "pincode",
                      label: "Pincode",
                      placeholder: "560034",
                      maxLength: 6,
                    },
                    { key: "city", label: "City", placeholder: "Bengaluru" },
                    { key: "state", label: "State", placeholder: "Karnataka" },
                    {
                      key: "street",
                      label: "Street / Area / House No.",
                      placeholder: "123, MG Road",
                      span: true,
                    },
                  ] as {
                    key: keyof typeof form;
                    label: string;
                    placeholder: string;
                    type?: string;
                    maxLength?: number;
                    span?: boolean;
                  }[]
                ).map((f) => (
                  <div key={f.key} className={f.span ? "sm:col-span-2" : ""}>
                    <label
                      className="block text-xs font-medium text-muted-foreground mb-1"
                      htmlFor={`saved-${f.key}`}
                    >
                      {f.label} *
                    </label>
                    <input
                      id={`saved-${f.key}`}
                      type={f.type ?? "text"}
                      maxLength={f.maxLength}
                      value={form[f.key as keyof typeof form] as string}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      required
                      className="w-full border border-input rounded-sm px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      data-ocid={`saved-addr-field-${f.key}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 text-sm border border-border rounded-sm text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: "#fb641b" }}
                  className="px-8 py-2 text-sm text-white font-semibold rounded-sm hover:opacity-90 transition-opacity"
                  data-ocid="saved-addr-save-btn"
                >
                  {editingId ? "Save Changes" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address list */}
        {addresses.length === 0 && !showForm ? (
          <div
            className="bg-card rounded-sm shadow-sm p-12 text-center"
            data-ocid="saved-addr-empty"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#e3f2fd" }}
            >
              <MapPin className="w-8 h-8" style={{ color: "#2874f0" }} />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              No saved addresses yet
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Add your home, office, or other delivery addresses for faster
              checkout.
            </p>
            <button
              type="button"
              onClick={openAdd}
              style={{ background: "#2874f0" }}
              className="text-white font-semibold px-6 py-2.5 rounded-sm text-sm hover:opacity-90 transition-opacity"
              data-ocid="saved-addr-empty-add-btn"
            >
              Add First Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => {
              const cfg = labelConfig[addr.label];
              const LabelIcon =
                LABEL_OPTIONS.find((o) => o.value === addr.label)?.icon ??
                MapPin;
              return (
                <div
                  key={addr.id}
                  className="card-address"
                  data-ocid="saved-addr-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}
                      >
                        <LabelIcon
                          className="w-4 h-4"
                          style={{ color: cfg.color }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                            style={{
                              background: cfg.bg,
                              color: cfg.color,
                            }}
                          >
                            {addr.label}
                          </span>
                          <span className="font-semibold text-sm text-foreground">
                            {addr.name}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80">
                          {addr.street}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          📞 {addr.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(addr)}
                        className="p-2 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-blue-600"
                        aria-label="Edit address"
                        data-ocid="saved-addr-edit-btn"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        className="p-2 rounded-sm hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                        aria-label="Delete address"
                        data-ocid="saved-addr-delete-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tip card */}
        {addresses.length > 0 && (
          <div
            className="mt-4 rounded-sm p-4 flex items-start gap-3 text-sm"
            style={{
              background: "#fffbea",
              border: "1px solid #fde68a",
            }}
          >
            <Star
              className="w-4 h-4 mt-0.5 flex-shrink-0 fill-amber-400"
              style={{ color: "#d97706" }}
            />
            <p style={{ color: "#92400e" }}>
              <strong>Tip:</strong> At checkout, select a saved address to fill
              in your delivery details instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
