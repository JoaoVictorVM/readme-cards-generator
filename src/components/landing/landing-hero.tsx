"use client";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { ExampleCard } from "@/components/landing/example-card";
import {
  FINE_POINTER,
  gsap,
  MOTION,
  SplitText,
  useGSAP,
} from "@/components/landing/motion/gsap";
import type { Dictionary } from "@/i18n/types";

type LandingHeroProps = {
  dictionary: Dictionary;
  ctaHref: string;
  cardUrl: string;
};

export function LandingHero({
  dictionary,
  ctaHref,
  cardUrl,
}: LandingHeroProps) {
  const { landing } = dictionary;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION, () => {
        gsap.set(q("[data-hero-intro]"), { opacity: 1 });
        SplitText.create(q("[data-hero-title]"), {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.3,
              stagger: 0.09,
              ease: "expo.out",
            }),
        });
        gsap
          .timeline({ defaults: { ease: "expo.out" }, delay: 0.35 })
          .from(q("[data-hero-fade]"), {
            y: 18,
            opacity: 0,
            duration: 1,
            stagger: 0.08,
          })
          .from(
            q("code[data-hero-intro]"),
            { y: 18, opacity: 0, duration: 0.9 },
            "-=0.8",
          )
          .from(
            q("[data-hero-connector]"),
            { scaleY: 0, duration: 0.5, ease: "power2.out" },
            "-=0.5",
          )
          .from(
            q("[data-tilt]"),
            { y: 48, rotationX: -28, opacity: 0, duration: 1.4 },
            "-=0.2",
          )
          .from(
            q("figure p[data-hero-intro]"),
            { opacity: 0, duration: 0.6 },
            "-=1",
          );
      });

      mm.add(`${MOTION} and ${FINE_POINTER}`, () => {
        const section = root.current!;
        const spotlight = q("[data-spotlight]")[0] as HTMLElement;
        const card = q("[data-tilt]")[0] as HTMLElement;
        const glare = q("[data-glare]")[0] as HTMLElement;
        const cta = q("[data-magnetic]")[0] as HTMLElement;

        const rx = gsap.quickTo(card, "rotationX", {
          duration: 0.7,
          ease: "power3",
        });
        const ry = gsap.quickTo(card, "rotationY", {
          duration: 0.7,
          ease: "power3",
        });
        const mx = gsap.quickTo(cta, "x", { duration: 0.5, ease: "power3" });
        const my = gsap.quickTo(cta, "y", { duration: 0.5, ease: "power3" });

        const onSection = (event: PointerEvent) => {
          const box = spotlight.getBoundingClientRect();
          gsap.to(spotlight, {
            "--sx": `${event.clientX - box.left}px`,
            "--sy": `${event.clientY - box.top}px`,
            duration: 0.6,
            ease: "power3",
            overwrite: "auto",
          });
        };
        const onCard = (event: PointerEvent) => {
          const box = card.getBoundingClientRect();
          const px = (event.clientX - box.left) / box.width;
          const py = (event.clientY - box.top) / box.height;
          ry((px - 0.5) * 16);
          rx((0.5 - py) * 16);
          gsap.to(glare, {
            "--gx": `${px * 100}%`,
            "--gy": `${py * 100}%`,
            duration: 0.4,
            ease: "power3",
            overwrite: "auto",
          });
        };
        const onCardEnter = () => gsap.to(glare, { opacity: 1, duration: 0.4 });
        const onCardLeave = () => {
          rx(0);
          ry(0);
          gsap.to(glare, { opacity: 0, duration: 0.6 });
        };
        const onCta = (event: PointerEvent) => {
          const box = cta.getBoundingClientRect();
          mx((event.clientX - (box.left + box.width / 2)) * 0.35);
          my((event.clientY - (box.top + box.height / 2)) * 0.35);
        };
        const onCtaLeave = () =>
          gsap.to(cta, {
            x: 0,
            y: 0,
            duration: 0.9,
            ease: "elastic.out(1, 0.4)",
          });

        section.addEventListener("pointermove", onSection);
        card.addEventListener("pointermove", onCard);
        card.addEventListener("pointerenter", onCardEnter);
        card.addEventListener("pointerleave", onCardLeave);
        cta.addEventListener("pointermove", onCta);
        cta.addEventListener("pointerleave", onCtaLeave);
        return () => {
          section.removeEventListener("pointermove", onSection);
          card.removeEventListener("pointermove", onCard);
          card.removeEventListener("pointerenter", onCardEnter);
          card.removeEventListener("pointerleave", onCardLeave);
          cta.removeEventListener("pointermove", onCta);
          cta.removeEventListener("pointerleave", onCtaLeave);
        };
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate grid gap-12 py-8 lg:min-h-[calc(100dvh-10rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:py-16"
    >
      <div
        data-spotlight
        aria-hidden="true"
        className="full-bleed pointer-events-none absolute inset-y-0 -z-10 [background-image:linear-gradient(to_right,#1c1c1c_1px,transparent_1px),linear-gradient(to_bottom,#1c1c1c_1px,transparent_1px)] [mask-image:radial-gradient(440px_circle_at_var(--sx)_var(--sy),black,transparent)] [background-size:56px_56px] [--sx:70%] [--sy:40%]"
      />
      <div className="flex flex-col items-start gap-6">
        <p
          data-hero-intro
          data-hero-fade
          className="font-mono text-xs tracking-wide text-muted uppercase"
        >
          {landing.heroEyebrow}
        </p>
        <h1
          data-hero-intro
          data-hero-title
          className="max-w-[14ch] text-5xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[5.25rem]"
        >
          {landing.title}
        </h1>
        <p
          data-hero-intro
          data-hero-fade
          className="max-w-xl text-lg leading-relaxed text-muted"
        >
          {landing.subtitle}
        </p>
        <div
          data-hero-intro
          data-hero-fade
          className="flex flex-wrap items-center gap-x-6 gap-y-3"
        >
          <Link
            href={ctaHref}
            data-magnetic
            className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            {landing.ctaGenerate}
          </Link>
          <a
            href="#parameters"
            className="group inline-flex h-12 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {landing.ctaParameters}
            <ArrowDown
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
            />
          </a>
        </div>
      </div>
      <ExampleCard dictionary={dictionary} markdown={cardUrl} />
    </section>
  );
}
