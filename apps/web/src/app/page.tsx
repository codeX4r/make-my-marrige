"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import * as THREE from "three";

type Petal = { x: number; y: number; v: number; z: number; a: number; f: number; ph: number; rx: number; ry: number; sp: number };

function FallingPetals() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return; // no WebGL: page works without petals
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 400);
    cam.position.z = 100;
    scene.add(new THREE.AmbientLight(0xffe6c8, 0.85));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.2);
    sun.position.set(-1, 1, 2);
    scene.add(sun);

    const N = window.innerWidth < 768 ? 22 : 42;
    const geo = new THREE.SphereGeometry(1, 12, 8);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05, emissive: 0x2a1200 });
    const mesh = new THREE.InstancedMesh(geo, mat, N);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const palette = [0xf08a1c, 0xf5b53a, 0xe0702a, 0xf08a1c, 0xe0457b].map((c) => new THREE.Color(c));
    const petals: Petal[] = [];
    for (let i = 0; i < N; i++) {
      const z = 0.5 + Math.random() * 0.9;
      petals.push({
        x: Math.random(), y: Math.random(), v: 20 + z * 28, z,
        a: 14 + Math.random() * 34, f: 0.4 + Math.random() * 0.7, ph: Math.random() * 6.28,
        rx: 0.5 + Math.random() * 1.5, ry: 0.4 + Math.random() * 1.2, sp: 0.15 + z * 0.25,
      });
      mesh.setColorAt(i, palette[i % palette.length]!);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    let vw = 0;
    let vh = 0;
    const size = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      renderer.setSize(vw, vh, false);
      cam.left = 0; cam.right = vw; cam.top = 0; cam.bottom = -vh;
      cam.updateProjectionMatrix();
    };
    size();
    window.addEventListener("resize", size);

    const dm = new THREE.Object3D();
    const clock = new THREE.Clock();
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const t = reduceMotion ? 0 : clock.getElapsedTime();
      const sy = reduceMotion ? 0 : window.scrollY;
      const H = vh + 120;
      for (let i = 0; i < N; i++) {
        const p = petals[i]!;
        const yy = (((p.y * H + t * p.v + sy * p.sp) % H) + H) % H - 60;
        dm.position.set(p.x * vw + Math.sin(t * p.f + p.ph) * p.a, -yy, p.z * 20);
        dm.rotation.set(t * p.rx + p.ph, t * p.ry, p.ph + Math.sin(t * p.f) * 0.6);
        dm.scale.set(9 * p.z, 5 * p.z, 1.6 * p.z);
        dm.updateMatrix();
        mesh.setMatrixAt(i, dm.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, cam);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      mesh.dispose();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 40 }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers and content                            */
/* ------------------------------------------------------------------ */
const Words = ({ text }: { text: string }) => (
  <>
    {text.split(" ").map((word, i) => (
      <Fragment key={i}>
        <span className="wd"><span>{word}</span></span>{" "}
      </Fragment>
    ))}
  </>
);

const Card = ({ icon, title, children }: { icon: string; title: string; children: ReactNode }) => (
  <div className="card tilt" data-r>
    <div className="ic"><span className="ms">{icon}</span></div>
    <h3>{title}</h3>
    <p>{children}</p>
  </div>
);

const Metric = ({ label, pct, note, noteColor, children }: { label: string; pct: number; note: string; noteColor: string; children: ReactNode }) => (
  <div className="met">
    <small>{label}</small>
    <div className="n">{children}</div>
    <div className="bar"><i data-w={pct} /></div>
    <small style={{ color: noteColor, textTransform: "none" }}>{note}</small>
  </div>
);

const unit = { textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--mute)" } as const;

const FEATURES = [
  ["hub", "One shared workspace", "Bring the bride's and groom's sides into one calm place, instead of scattered chats and unverified sheets."],
  ["assignment_ind", "Clear responsibilities", "Assign ceremonies and logistics so Chacha ji, Mausi ji and siblings know exactly what they lead. Gentle WhatsApp reminders do the rest."],
  ["family_restroom", "Households & guest lists", "Track RSVPs by family, travel dates, hotel rooms and diets such as Satvik and Jain."],
  ["festival", "Function-wise planning", "Plan Mehendi, Haldi, Sangeet, Phere and Reception on their own timelines with run-of-show cues."],
  ["account_balance_wallet", "Expenses & digital Shagun", "Track vendor milestones and keep Shagun records organised alongside the wedding budget."],
  ["diversity_1", "Coordinated family decisions", "Involve elders and relatives with permission-controlled views that suit their comfort. Run polls on mithai, themes and safas."],
] as const;

const CEREMONIES = [
  ["18 Nov", "Mehendi & Sangeet", 92, "Sound check, dhol entry, 24 live counters"],
  ["19 Nov", "Haldi ceremony", 100, "Marigold décor and family seating set"],
  ["20 Nov", "Shaadi & Phere", 84, "Samagri list, muhurat and hawan prep"],
  ["21 Nov", "Reception banquet", 68, "Menu, stage and guest arrivals"],
] as const;

const STEPS = [
  ["Create your workspace", "Set your dates, host cities and ceremony days in two minutes. No app to download."],
  ["Invite key family", "Add your partner, parents and siblings with permissions that fit their role."],
  ["Organise the details", "Build run-of-shows, import WhatsApp contacts into households and set budgets."],
  ["Celebrate in calm", "Follow live cue cards, greet guests with ease and enjoy every moment until the Vidai."],
] as const;

const ROLES = [
  ["favorite", "Bride & Groom", "Workspace owners. Full control over ceremonies, budgets, contracts, invites and delegation."],
  ["groups", "Parents & Siblings", "Family organisers. Manage guest follow-ups, rooms and checklists, with financial views protected."],
  ["receipt_long", "Treasurer / Chacha ji", "Tracks vendor invoices, payment milestones, cash reserves and automatic Shagun receipts."],
  ["celebration", "Honoured Atithi", "Guests get a clean web itinerary, dress code, map, RSVP and Shagun QR. No account needed."],
] as const;

const FAQS = [
  ["Can both families plan in the same workspace?", "Yes. Share joint lists such as Sangeet and Reception guests and vendor contracts, and keep private tabs for things like trousseau budgets or family gifts."],
  ["Is it easy for elders who use WhatsApp?", "Yes. Elders need no app or password. Send them WhatsApp summaries, and guests can confirm RSVPs with one tap."],
  ["How does Digital Shagun work? Are there fees?", "The workspace can keep Shagun instructions and contribution records organised for the family. Payment handling and any applicable provider charges should be confirmed before launch."],
  ["How private is our guest and budget data?", "Workspace access is designed around membership and permissions, so organisers can limit who sees guest details, budgets and other sensitive information."],
] as const;

const STRIP = ["Mehendi", "Haldi", "Sangeet", "Phere", "Vidai", "Reception", "Shagun", "Atithi Satkar"];

export default function LandingPage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const undo: Array<() => void> = [];
    const initialTriggers = new Set(ScrollTrigger.getAll());
    const qa = <E extends HTMLElement>(sel: string) => Array.from(document.querySelectorAll<E>(sel));
    const listen = (el: EventTarget, type: string, fn: EventListener) => {
      el.addEventListener(type, fn);
      undo.push(() => el.removeEventListener(type, fn));
    };

    document.documentElement.classList.add("js");

    const cleanup = () => {
      undo.forEach((fn) => fn());
      ScrollTrigger.getAll().forEach((t) => {
        if (!initialTriggers.has(t)) t.kill();
      });
      document.documentElement.classList.remove("js");
    };

    // Reduced motion: show final values, skip every animation.
    if (rm) {
      qa(".bar i").forEach((b) => (b.style.width = `${b.dataset.w ?? 0}%`));
      qa(".ct").forEach((c) => (c.textContent = Number(c.dataset.to ?? 0).toFixed(Number(c.dataset.d ?? 0))));
      qa("[data-r]").forEach((e) => { e.style.opacity = "1"; e.style.transform = "none"; });
      return cleanup;
    }

    // Smooth scroll, kept in sync with ScrollTrigger
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    undo.push(() => { gsap.ticker.remove(tick); lenis.destroy(); });

    qa<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
      listen(a, "click", ((e: MouseEvent) => {
        const href = a.getAttribute("href");
        if (href && href.length > 1 && document.querySelector(href)) {
          e.preventDefault();
          lenis.scrollTo(href, { offset: -72 });
        }
      }) as EventListener);
    });

    // Hero: headline words, then supporting content
    gsap.fromTo(
      "#h1 .wd > span",
      { yPercent: 110, rotate: 4 },
      { yPercent: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.2 },
    );
    gsap.set(".hero [data-r]", { y: 24 });
    gsap.to(".hero [data-r]", { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, delay: 0.6, ease: "power3.out" });

    // Scroll reveals
    qa("[data-r]").forEach((el) => {
      if (el.closest(".hero") && el.id !== "preview") return;
      gsap.set(el, { y: 36 });
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }),
      });
    });

    // Progress bars and counters
    qa(".bar i").forEach((bar) => {
      ScrollTrigger.create({
        trigger: bar, start: "top 92%", once: true,
        onEnter: () => gsap.to(bar, { width: `${bar.dataset.w ?? 0}%`, duration: 1.6, ease: "power3.out" }),
      });
    });
    qa(".ct").forEach((counter) => {
      const v = { n: 0 };
      const digits = Number(counter.dataset.d ?? 0);
      ScrollTrigger.create({
        trigger: counter, start: "top 92%", once: true,
        onEnter: () =>
          gsap.to(v, {
            n: Number(counter.dataset.to ?? 0), duration: 1.8, ease: "power2.out",
            onUpdate: () => { counter.textContent = v.n.toFixed(digits); },
          }),
      });
    });

    // Scroll-linked motion
    gsap.to("#ln", { scaleX: 1, ease: "none", scrollTrigger: { trigger: "#ceremonies", start: "top 60%", end: "bottom 80%", scrub: 0.6 } });
    gsap.to("#m1", { rotate: 90, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to("#m2", { rotate: -120, ease: "none", scrollTrigger: { trigger: "#cta", start: "top bottom", end: "bottom top", scrub: true } });

    // Pointer-only effects: magnetic buttons and card tilt
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      qa(".mag").forEach((el) => {
        const x = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
        const y = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
        listen(el, "mousemove", ((e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.18);
          y((e.clientY - r.top - r.height / 2) * 0.18);
        }) as EventListener);
        listen(el, "mouseleave", () => { x(0); y(0); });
      });
      qa(".tilt").forEach((el) => {
        const rx = gsap.quickTo(el, "rotationX", { duration: 0.5 });
        const ry = gsap.quickTo(el, "rotationY", { duration: 0.5 });
        el.style.perspective = "900px";
        listen(el, "mousemove", ((e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 6);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
        }) as EventListener);
        listen(el, "mouseleave", () => { rx(0); ry(0); });
      });
    }

    return cleanup;
  }, []);

  return (
    <div className="landing-page">
      <FallingPetals />
      <style jsx global>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300..600,0..1&display=swap');
:root{color-scheme:light;--bg:#fff8f4;--bg2:#faf2ed;--card:#fff;--ink:#1e1b18;--mute:#534245;--line:#e8e1dc;--pri:#5d172c;--pri2:#7a2e42;--gold:#795829;--gold2:#c9993f;--grn:#003a22;--onp:#fff;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
*{box-sizing:border-box;margin:0}html{scroll-padding-top:5rem}
body{background:var(--bg);color:var(--ink);font:400 15px/1.65 Inter,system-ui,sans-serif;overflow-x:hidden}
h1,h2,h3,.serif{font-family:'Playfair Display',Georgia,serif;font-weight:600;color:var(--pri);line-height:1.15}
.ms{font-family:'Material Symbols Outlined';font-weight:400;font-size:20px;line-height:1;vertical-align:middle;font-style:normal}
a{color:inherit;text-decoration:none}.w{max-width:1280px;margin:auto;padding:0 1.25rem}
@media(min-width:768px){.w{padding:0 3rem}}
header{position:fixed;inset:0 0 auto;z-index:50;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding-top:env(safe-area-inset-top,0px)}
header .w{display:flex;align-items:center;justify-content:space-between;height:72px}
.logo{display:flex;gap:.6rem;align-items:center}.logo b{display:block;font:600 20px 'Playfair Display',serif;color:var(--pri)}.logo small{font-size:10px;letter-spacing:.14em;color:var(--gold);text-transform:uppercase}
nav{display:none;gap:2rem;font-size:13px;font-weight:500;color:var(--mute)}nav a:hover{color:var(--pri)}@media(min-width:1024px){nav{display:flex}}
.btn{display:inline-flex;gap:.5rem;align-items:center;padding:.75rem 1.5rem;border-radius:4px;background:var(--pri2);color:#fff;font-weight:500;font-size:13px;border:0;cursor:pointer;transition:background .2s}.btn:hover{background:var(--pri);color:var(--bg)}
.btn.g{background:var(--bg2);color:var(--ink);border:1px solid var(--line)}.btn.g:hover{background:var(--line);color:var(--ink)}
.hero{position:relative;padding:130px 0 70px;overflow:hidden;min-height:100svh}
.hero .w{display:grid;gap:2rem;align-items:center;position:relative}
.hero h1{font-size:clamp(36px,6vw,64px);letter-spacing:-.02em}.hero h1 em{color:var(--gold)}.hero h1 .wd{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.12em}.hero h1 .wd>span{display:inline-block}
.pill{display:inline-flex;gap:.4rem;align-items:center;font-size:11px;font-weight:600;letter-spacing:.08em;color:var(--gold);background:var(--bg2);padding:.4rem .9rem;border-radius:99px;margin-bottom:1.2rem}
.lead{max-width:34rem;color:var(--mute);font-size:17px;margin:1.2rem 0 1.8rem}.row{display:flex;gap:.8rem;flex-wrap:wrap}
.mandala{position:absolute;right:-180px;top:-120px;width:620px;opacity:.16;pointer-events:none;color:var(--gold2)}
.strip{overflow:hidden;border-block:1px solid var(--line);background:var(--bg2);padding:.9rem 0;white-space:nowrap}
.strip div{display:inline-flex;gap:2.5rem;animation:mq 32s linear infinite;font:italic 500 20px 'Playfair Display',serif;color:var(--gold)}.strip span:nth-child(even){color:var(--pri2)}
@keyframes mq{to{transform:translateX(-50%)}}
.dash{background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:0 24px 60px -24px rgba(93,23,44,.35);margin-top:-1rem;position:relative}
.dash .top{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding:1rem 1.4rem;background:var(--bg2);border-radius:12px 12px 0 0;align-items:center}
.av{display:inline-flex;width:30px;height:30px;border-radius:50%;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;margin-left:-8px;border:2px solid var(--bg2)}
.mets{display:grid;gap:1rem;padding:1.2rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.met{border:1px solid var(--line);border-radius:8px;padding:1rem}.met small{font-size:11px;letter-spacing:.06em;color:var(--gold);text-transform:uppercase;font-weight:600}
.met .n{font:500 28px 'Playfair Display',serif}.bar{height:6px;background:var(--line);border-radius:9px;overflow:hidden;margin:.6rem 0 .3rem}.bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--pri2),var(--gold2));border-radius:9px}
.act{padding:0 1.2rem 1.2rem;display:grid;gap:.6rem}.act div{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;background:var(--bg2);padding:.7rem 1rem;border-radius:6px;font-size:13px}.tag{font-size:11px;font-weight:600;padding:.15rem .6rem;border-radius:4px;background:color-mix(in srgb,var(--gold2) 22%,transparent);color:var(--gold)}.tag.ok{background:color-mix(in srgb,var(--grn) 14%,transparent);color:var(--grn)}
section.s{padding:90px 0}.alt{background:var(--bg2)}.head{max-width:44rem;margin-bottom:3rem}.head h2{font-size:clamp(28px,4vw,40px);margin-bottom:.7rem}.head p{color:var(--mute);font-size:16px}
.grid{display:grid;gap:1.3rem;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1.6rem;transform-style:preserve-3d;transition:box-shadow .3s,border-color .3s;will-change:transform}.card:hover{box-shadow:0 18px 40px -20px rgba(93,23,44,.4);border-color:var(--gold2)}
.card .ic{width:46px;height:46px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--gold2) 20%,transparent);color:var(--gold);margin-bottom:1rem}.card h3{font-size:19px;color:var(--ink);margin-bottom:.4rem}.card p{color:var(--mute);font-size:14px}
.cer{display:grid;gap:1.3rem;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));position:relative}
.cer .card b{font:500 13px Inter;color:var(--gold)}.cer .card h3{margin:.3rem 0 1rem}.line{height:2px;background:var(--line);position:relative;margin-bottom:2rem}.line i{position:absolute;inset:0;background:linear-gradient(90deg,var(--pri2),var(--gold2));transform-origin:left;transform:scaleX(0)}
.sp{display:flex;gap:1.1rem}.sp .k{flex:none;width:42px;height:42px;border-radius:50%;background:var(--pri2);color:#fff;display:flex;align-items:center;justify-content:center;font:500 18px 'Playfair Display',serif}
.quote{margin:2rem auto 0;max-width:46rem;border-left:4px solid var(--gold);padding:1.2rem 1.5rem;background:var(--card);font:italic 500 21px/1.5 'Playfair Display',serif;color:var(--pri)}
.faq{max-width:46rem;margin:auto;display:grid;gap:.9rem}.faq details{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:1.1rem 1.4rem}.faq summary{cursor:pointer;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:1rem}.faq summary::-webkit-details-marker{display:none}.faq details[open] summary .ms{transform:rotate(180deg)}.faq summary .ms{color:var(--gold);transition:transform .25s}.faq p{margin-top:.8rem;color:var(--mute);font-size:14px}
.cta{position:relative;overflow:hidden;background:var(--pri2);color:#fff;border-radius:20px;padding:4rem 1.5rem;text-align:center}.cta h2{color:#fff;font-size:clamp(30px,5vw,52px);margin-bottom:1rem}.cta p{max-width:34rem;margin:0 auto 1.8rem;color:#ffd9df}.cta .btn{background:var(--bg);color:#5d172c}.cta .btn.g{background:transparent;color:#fff;border:1px solid #ffffff55}
.cta svg{position:absolute;left:50%;top:50%;width:720px;margin:-360px 0 0 -360px;opacity:.14;color:#ebbf86}.cta>*:not(svg){position:relative}
footer{border-top:1px solid var(--line);background:var(--bg2);padding:2.5rem 0 1.5rem;margin-top:90px;color:var(--mute);font-size:13px}footer .w{display:flex;flex-wrap:wrap;gap:1rem 2rem;justify-content:space-between}
.js [data-r]{opacity:0}
@media(prefers-reduced-motion:reduce){.strip div{animation:none}.js [data-r]{opacity:1}}
:focus-visible{outline:2px solid var(--gold2);outline-offset:3px}
`}</style>

      <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <g id="md" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle r="190" />
            <circle r="150" strokeDasharray="3 7" />
            <circle r="100" />
            <g id="pt"><path d="M0-190C26-160 26-120 0-90 -26-120 -26-160 0-190Z" /></g>
            {Array.from({ length: 11 }, (_, i) => (
              <use key={i} href="#pt" transform={`rotate(${(i + 1) * 30})`} />
            ))}
          </g>
        </defs>
      </svg>

      <header>
        <div className="w">
          <a className="logo" href="#top">
            <span className="ms" style={{ color: "var(--gold)", fontSize: 30 }}>temple_hindu</span>
            <span><b>MakeMyMarrige</b></span>
          </a>
          <nav>
            <a href="#features">Features</a>
            <a href="#ceremonies">Ceremonies</a>
            <a href="#how">How it works</a>
            <a href="#roles">For families</a>
            <a href="#faqs">FAQs</a>
          </nav>
          <div className="row" style={{ gap: "0.5rem" }}>
            <Link className="btn g" href="/auth?tab=login">Log in</Link>
            <Link className="btn mag" href="/auth/?tab=register">Get started</Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <svg className="mandala" id="m1" viewBox="-200 -200 400 400" aria-hidden="true"><use href="#md" /></svg>
          <div className="w">
            <div>
              <span className="pill" data-r>
                <span className="ms" style={{ fontSize: 15 }}>auto_awesome</span>
                Collaborative wedding workspace for Indian families
              </span>
              <h1 id="h1">
                <Words text="Your wedding. Your people." />
                <em><Words text="One beautiful plan." /></em>
              </h1>
              <p className="lead" data-r>
                Unite families across cities, coordinate every ceremony, track vendor payments and keep each ritual in its right place.
              </p>
              <div className="row" data-r>
                <Link className="btn mag" href="/auth/?tab=register">Start planning free <span className="ms">arrow_forward</span></Link>
                <a className="btn g mag" href="#features">
                  <span className="ms" style={{ color: "var(--gold)" }}>play_circle</span>See features
                </a>
              </div>
            </div>
          </div>

          <div className="w" style={{ marginTop: "3rem" }}>
            <div className="dash" id="preview" data-r>
              <div className="top">
                <div>
                  <div className="serif" style={{ fontSize: 19, color: "var(--ink)" }}>Sample Wedding Workspace</div>
                  <small style={{ color: "var(--mute)", display: "block" }}>Illustrative preview · sample figures</small>
                  <small style={{ color: "var(--mute)" }}>
                    <span className="ms" style={{ fontSize: 14, color: "var(--gold)" }}>calendar_month</span>{" "}
                    18–21 Nov 2026 · The Landmark Hotel, Kanpur
                  </small>
                </div>
                <div style={{ display: "flex", alignItems: "center", paddingLeft: 8 }}>
                  <span className="av" style={{ background: "#5d172c" }}>A</span>
                  <span className="av" style={{ background: "#795829" }}>K</span>
                  <span className="av" style={{ background: "#7a2e42" }}>RV</span>
                  <span className="av" style={{ background: "#005332" }}>M</span>
                </div>
              </div>

              <div className="mets">
                <Metric label="Guests & Parivar" pct={79} note="79% attending · 38 households" noteColor="var(--grn)">
                  <span className="ct" data-to="542">0</span> <small style={unit}>of 680 confirmed</small>
                </Metric>
                <Metric label="Budget & Shagun" pct={68} note="₹26.1L committed · 3 invoices pending" noteColor="var(--gold)">
                  ₹<span className="ct" data-to="38.4" data-d="1">0</span> <small style={unit}>allocated</small>
                </Metric>
                <Metric label="Ritual checklists" pct={78} note="6 urgent tasks" noteColor="var(--pri)">
                  <span className="ct" data-to="64">0</span> / 82 <small style={unit}>done</small>
                </Metric>
              </div>

              <div className="act">
                <div>
                  <span><span className="ms" style={{ color: "var(--grn)" }}>check_circle</span> Awadhi &amp; Mughlai menu finalised</span>
                  <span><span className="tag ok">Approved</span> Rajesh V. (Father)</span>
                </div>
                <div>
                  <span><span className="ms" style={{ color: "var(--gold)" }}>pending</span> Brass diyas &amp; floral toran procurement</span>
                  <span><span className="tag">In progress</span> Meera (Sister)</span>
                </div>
                <div>
                  <span><span className="ms" style={{ color: "var(--pri)" }}>priority_high</span> Guest pickups · Lucknow Airport &amp; Kanpur Central</span>
                  <span><span className="tag" style={{ color: "var(--pri)" }}>Needs attention</span> Kabir (Groom)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="strip" aria-hidden="true">
          <div>
            {[...STRIP, ...STRIP].map((word, i) => (<span key={i}>{word}</span>))}
          </div>
        </div>

        <section className="s" id="features">
          <div className="w">
            <div className="head" data-r>
              <h2>Everything your family needs to plan together.</h2>
              <p>An Indian wedding is a multi-day symphony of traditions. MakeMyMarrige brings ceremonial depth together with modern order.</p>
            </div>
            <div className="grid">
              {FEATURES.map(([icon, title, text]) => (<Card key={title} icon={icon} title={title}>{text}</Card>))}
            </div>
          </div>
        </section>

        <section className="s alt" id="ceremonies">
          <div className="w">
            <div className="head" data-r>
              <h2>Every ritual given the respect and precision it deserves.</h2>
              <p>Break each ceremony day into timed cues so pundit ji, performers and family anchors never miss a beat.</p>
            </div>
            <div className="line"><i id="ln" /></div>
            <div className="cer">
              {CEREMONIES.map(([date, title, pct, text]) => (
                <div className="card tilt" data-r key={title}>
                  <b>{date}</b>
                  <h3>{title}</h3>
                  <div className="bar"><i data-w={pct} /></div>
                  <p>{pct}% ready · {text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="s" id="how">
          <div className="w">
            <div className="head" data-r>
              <h2>From the first muhurat to the final celebration.</h2>
              <p>A stress-free roadmap that respects both tradition and busy schedules.</p>
            </div>
            <div className="grid">
              {STEPS.map(([title, text], i) => (
                <div className="sp" data-r key={title}>
                  <div className="k">{i + 1}</div>
                  <div>
                    <h3 style={{ fontSize: 19, color: "var(--ink)" }}>{title}</h3>
                    <p style={{ color: "var(--mute)", fontSize: 14 }}>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="s alt" id="roles">
          <div className="w">
            <div className="head" data-r>
              <h2>Collaborative by design. Private by permission.</h2>
              <p>Not everyone needs to see private vendor contracts. Tailored access keeps harmony across generations.</p>
            </div>
            <div className="grid">
              {ROLES.map(([icon, title, text]) => (<Card key={title} icon={icon} title={title}>{text}</Card>))}
            </div>
            <p className="quote" data-r>
              “We honour the depth, warmth and multi-day celebrations of Indian families without the clutter and chaos.”
            </p>
          </div>
        </section>

        <section className="s" id="faqs">
          <div className="w">
            <div className="head" style={{ marginInline: "auto", textAlign: "center" }} data-r>
              <h2>Common questions from planning families</h2>
            </div>
            <div className="faq" data-r>
              {FAQS.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}<span className="ms">expand_more</span></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="w" id="cta">
          <div className="cta" data-r>
            <svg id="m2" viewBox="-200 -200 400 400" aria-hidden="true"><use href="#md" /></svg>
            <h2>Make room for the moments that matter.</h2>
            <p>Bring your plans, people and celebrations into one calm place, and cherish every ritual.</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <Link className="btn mag" href="/auth?tab=register">Start planning free</Link>
              <a className="btn g mag" href="#how">How it works</a>
            </div>
            <p style={{ fontSize: 12, margin: "1.4rem 0 0", color: "#ffd9df99" }}>
              Bring both families into one shared planning workspace
            </p>
          </div>
        </section>
      </main>

      <footer>
        <div className="w">
          <div className="logo">
            <span className="ms" style={{ color: "var(--gold)" }}>temple_hindu</span>
            <b>MakeMyMarrige</b>
          </div>
          <span>Crafted with reverence for Indian celebrations · Kanpur &amp; pan-India</span>
          <span>© 2026 MakeMyMarrige</span>
        </div>
      </footer>
    </div>
  );
}
