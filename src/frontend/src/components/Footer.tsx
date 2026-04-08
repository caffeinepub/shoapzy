import {
  Facebook,
  Instagram,
  Lock,
  RotateCcw,
  Shield,
  Twitter,
  Youtube,
} from "lucide-react";

const footerColumns = [
  {
    heading: "ABOUT",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Corporate Information", href: "#" },
    ],
  },
  {
    heading: "HELP",
    links: [
      { label: "Payments", href: "#" },
      { label: "Shipping", href: "#" },
      { label: "Cancellation & Returns", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Report Infringement", href: "#" },
    ],
  },
  {
    heading: "POLICY",
    links: [
      { label: "Return Policy", href: "#" },
      { label: "Terms of Use", href: "#" },
      { label: "Security", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Sitemap", href: "#" },
    ],
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1D8kyLCA7r/",
    Icon: Facebook,
  },
  { label: "Twitter", href: "#", Icon: Twitter },
  {
    label: "Instagram",
    href: "https://www.instagram.com/dhirendra7572?igsh=MXdpcW4yMWVzYTdwaQ==",
    Icon: Instagram,
  },
  { label: "YouTube", href: "#", Icon: Youtube },
];

const trustBadges = [
  { label: "100% Secure Payments", Icon: Lock },
  { label: "Easy Returns", Icon: RotateCcw },
  { label: "Seller Protection", Icon: Shield },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{ backgroundColor: "#212121" }}
      className="text-white mt-auto"
    >
      {/* Trust badges row */}
      <div style={{ borderBottom: "1px solid #383838" }} className="py-5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
            {trustBadges.map(({ label, Icon }, i) => (
              <span
                key={label}
                className="flex items-center gap-2 text-xs font-semibold"
                style={{ color: "#9e9e9e" }}
              >
                {i > 0 && (
                  <span
                    className="hidden sm:inline-block w-px h-5 mr-4"
                    style={{ backgroundColor: "#4a4a4a" }}
                  />
                )}
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ backgroundColor: "#2874f0" }}
                >
                  <Icon size={14} className="text-white" />
                </span>
                <span className="uppercase tracking-wide">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h3
                className="text-xs font-bold tracking-widest mb-4"
                style={{ color: "#878787" }}
              >
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-150 hover:text-white"
                      style={{ color: "#9e9e9e" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social column */}
          <div>
            <h3
              className="text-xs font-bold tracking-widest mb-4"
              style={{ color: "#878787" }}
            >
              SOCIAL
            </h3>
            <ul className="space-y-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="flex items-center gap-2 text-sm transition-colors duration-150 hover:text-white"
                    style={{ color: "#9e9e9e" }}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #383838" }} className="py-4">
        <div
          className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          style={{ color: "#878787" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-base tracking-tight">
              Shoapzy
            </span>
            <span>© {year} Shoapzy. All Rights Reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
