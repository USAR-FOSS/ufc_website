import Image from "next/image";
import { ArrowUpRight, Globe } from "lucide-react";
import { MaskLine, Reveal } from "@/components/home/motion-primitives";
import { COMMUNITY_PARTNERS, FORGE } from "./support-data";

/** Instagram's glyph, drawn here because the icon set has no brand logos. */
function InstagramGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** The communities partnering with us, under the sponsors. Each card goes to their Instagram, or their website. */
export function CommunityPartners() {
  return (
    <div className="mt-16 lg:mt-20">
      <Reveal>
        <p className="eyebrow mb-5">§ 01 · community partners</p>
      </Reveal>
      <h3 className="max-w-4xl text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.05]">
        <MaskLine inView>
          Our community <span className="serif">partners.</span>
        </MaskLine>
      </h3>
      <Reveal delay={0.08}>
        <p className="mt-4 max-w-2xl text-[1.1rem] leading-[1.6] text-[var(--ink)]/80">
          The communities standing with us for {FORGE.name}.
        </p>
      </Reveal>

      <ul className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-3">
        {COMMUNITY_PARTNERS.map((p, i) => (
          <li key={p.name}>
            <Reveal delay={i * 0.08} className="h-full">
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${p.name}, opens their ${p.kind === "instagram" ? "Instagram" : "website"}`}
                className="group flex h-full items-center gap-4 rounded-2xl border-[2.5px] border-[var(--ink)]! bg-[var(--cream)] p-4 shadow-[4px_4px_0_var(--ink)] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] sm:gap-5 sm:p-5 sm:shadow-[7px_7px_0_var(--ink)] sm:hover:shadow-[10px_10px_0_var(--ink)]"
              >
                {/* Their own pictures are square and carry their own background, so they are shown as they are, just rounded. The name beside
                    it says who it is, which is why the picture has no description of its own. */}
                <Image
                  src={p.src}
                  alt=""
                  width={96}
                  height={96}
                  sizes="(min-width: 640px) 96px, 72px"
                  className="size-[4.5rem] shrink-0 rounded-xl border-2 border-[var(--ink)]! object-cover sm:size-24"
                  draggable={false}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.35rem] font-extrabold leading-tight tracking-[-0.02em]">{p.name}</span>
                  <span className="code mt-1.5 flex items-center gap-1.5 text-[0.8rem] font-bold text-[var(--ink)]/70">
                    {p.kind === "instagram" ? <InstagramGlyph size={15} /> : <Globe size={15} strokeWidth={2.4} aria-hidden="true" />}
                    <span className="truncate">{p.label}</span>
                  </span>
                </span>
                <ArrowUpRight
                  size={22}
                  strokeWidth={2.6}
                  aria-hidden="true"
                  className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
