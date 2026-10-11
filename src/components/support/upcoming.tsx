import { Plus } from "lucide-react";
import { MaskLine, Reveal } from "@/components/home/motion-primitives";
import { CommunityPartners } from "./community-partners";
import { SponsorLogo } from "./sponsor-logo";
import { CURRENT_SPONSORS, FORGE, type Backer } from "./support-data";

/** How many of the three columns the "your logo here" slot takes, so it fills out the last row whatever the number of sponsors. */
const SLOT_SPAN = { 1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3" } as const;
const slotSpan = SLOT_SPAN[(3 - (CURRENT_SPONSORS.length % 3)) as 1 | 2 | 3];
/** The same on a phone, where the cards sit two to a row. */
const SLOT_SPAN_PHONE = { 1: "col-span-1", 2: "col-span-2" } as const;
const slotSpanPhone = SLOT_SPAN_PHONE[(2 - (CURRENT_SPONSORS.length % 2)) as 1 | 2];

/** On a row of its own the slot is a slim banner. Beside other cards it matches their height. */
const slotHeight = slotSpan === SLOT_SPAN[3] ? "sm:min-h-[9rem]" : "sm:min-h-[14rem]";

/** The height that keeps a logo at most `maxWidth` wide, so a long wordmark shrinks to fit its card instead of overflowing it. */
const fit = (b: Backer, height: number, maxWidth: number) => {
  // A badge with its name beside it is as wide as the badge plus the letters, which grow with the badge.
  const widthPerHeight = b.mark ? b.w / b.h + 0.32 * b.name.length : b.w / b.h;
  return Math.min(height, Math.floor(maxWidth / widthPerHeight));
};

/** The sponsors of FOSS Forge 2.0, given the room they deserve, with an empty place beside them. */
export function Upcoming() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 lg:pb-20 lg:pt-24">
        <Reveal>
          <p className="eyebrow mb-5">§ 01 · backing {FORGE.name} right now</p>
        </Reveal>
        <h2 className="max-w-4xl text-[clamp(2rem,3.8vw,3.4rem)] leading-[1.02]">
          <MaskLine inView>
            Our sponsors for <span className="serif">this year.</span>
          </MaskLine>
        </h2>

        <ul className="mt-9 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
          {CURRENT_SPONSORS.map((s, i) => (
            <li key={s.name}>
              <Reveal delay={i * 0.08} className="h-full">
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.name}, opens their website`}
                  style={{ background: s.tile ?? "var(--cream)" }}
                  className="grid h-full min-h-[7rem] place-items-center rounded-2xl border-[2.5px] border-[var(--ink)]! p-3 shadow-[4px_4px_0_var(--ink)] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--ink)] sm:shadow-[7px_7px_0_var(--ink)] sm:hover:shadow-[10px_10px_0_var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] sm:min-h-[14rem] sm:p-8"
                >
                  <SponsorLogo b={s} height={fit(s, 92, 250)} phoneHeight={fit(s, 52, 118)} link={false} />
                </a>
              </Reveal>
            </li>
          ))}
          <li className={`${slotSpanPhone} ${slotSpan}`}>
            <Reveal delay={0.16} className="h-full">
              <a
                href="#contact"
                className={`group grid h-full min-h-[7rem] place-items-center rounded-2xl border-[2.5px] border-dashed border-[var(--ink)]! p-4 ${slotHeight} text-center transition-colors hover:bg-[var(--butter)] sm:p-8`}
              >
                <span>
                  <span className="mx-auto grid size-12 place-items-center rounded-full border-2 border-[var(--ink)]! bg-[var(--cream)]">
                    <Plus size={22} strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="mt-4 block text-[1.5rem] font-extrabold leading-tight tracking-[-0.02em]">Your logo here</span>
                  <span className="mt-1 block font-semibold text-[var(--ink)]/70">Join them. Details and tiers below.</span>
                </span>
              </a>
            </Reveal>
          </li>
        </ul>

        <CommunityPartners />
      </div>
    </>
  );
}
