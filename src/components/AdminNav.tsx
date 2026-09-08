import Link from "next/link";

const ADMIN_LINKS = [
  { href: "/admin/episodes", label: "Episodes" },
  { href: "/admin/partners", label: "Partners" },
];

export function AdminNav({ active }: { active: "episodes" | "partners" }) {
  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-2">
      {ADMIN_LINKS.map((link) => {
        const isActive = link.href === `/admin/${active}`;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
              isActive ? "bg-ember-500/10 text-ember-300" : "text-mist-500 hover:bg-ink-800 hover:text-mist-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
