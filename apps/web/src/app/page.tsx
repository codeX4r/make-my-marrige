"use client";

import { useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import * as THREE from "three";

export default function LandingPage() {
  useEffect(() => {
    // Register the plugin once before creating any ScrollTrigger instances.
    gsap.registerPlugin(ScrollTrigger);
    const dispose = initializeAnimations();

    return () => {
      dispose();
    };
  }, []);

  const initializeAnimations = (): (() => void) => {
    if (typeof window === "undefined") return () => undefined;

    // Use the locally bundled modules; no runtime CDN script injection.
    const w = { gsap, ScrollTrigger, Lenis, THREE };
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const disposers: Array<() => void> = [];
    let rafId = 0;
    let renderer: any;
    let observer: IntersectionObserver | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let lenis: any;
    const initialTriggers = new Set(w.ScrollTrigger?.getAll?.() ?? []);

    const addListener = (target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions) => {
      target.addEventListener(type, handler, options);
      disposers.push(() => target.removeEventListener(type, handler, options));
    };

    const showStaticValues = () => {
      document.querySelectorAll<HTMLElement>(".bar i").forEach((bar) => {
        bar.style.width = `${bar.dataset.w ?? 0}%`;
      });
      document.querySelectorAll<HTMLElement>(".ct").forEach((counter) => {
        counter.textContent = Number(counter.dataset.to ?? 0).toFixed(Number(counter.dataset.d ?? 0));
      });
      document.querySelectorAll<HTMLElement>("[data-r]").forEach((element) => {
        element.style.opacity = "1";
        element.style.transform = "none";
      });
    };

    if (!w.gsap || !w.ScrollTrigger) {
      showStaticValues();
      return () => undefined;
    }

    w.gsap.registerPlugin(w.ScrollTrigger);
    document.documentElement.classList.add("js");

    if (w.Lenis && !rm) {
      lenis = new w.Lenis({ lerp: 0.09 });
      lenis.on("scroll", w.ScrollTrigger.update);
      const ticker = (time: number) => lenis?.raf(time * 1000);
      w.gsap.ticker.add(ticker);
      w.gsap.ticker.lagSmoothing(0);
      disposers.push(() => {
        w.gsap.ticker.remove(ticker);
        lenis?.destroy?.();
        lenis = undefined;
      });

      document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
        const click = (event: MouseEvent) => {
          const href = anchor.getAttribute("href");
          if (href && href.length > 1 && document.querySelector(href)) {
            event.preventDefault();
            lenis?.scrollTo(href, { offset: -72 });
          }
        };
        addListener(anchor, "click", click as EventListener);
      });
    }

    if (!rm) {
      const heading = document.getElementById("h1");
      if (heading) {
        const words = heading.querySelectorAll(".wd > span");
        if (words.length) {
          w.gsap.from(words, {
            yPercent: 110, rotate: 4, duration: 1.1,
            ease: "expo.out", stagger: 0.08, delay: 0.2,
          });
        }
      }

      w.gsap.set(".hero [data-r]", { y: 24 });
      w.gsap.to(".hero [data-r]", {
        opacity: 1, y: 0, duration: 0.9, stagger: 0.12, delay: 0.2, ease: "power3.out",
      });

      document.querySelectorAll<HTMLElement>("[data-r]").forEach((element) => {
        if (element.closest(".hero") && element.id !== "preview") return;
        w.gsap.set(element, { y: 36 });
        w.ScrollTrigger.create({
          trigger: element, start: "top 88%", once: true,
          onEnter: () => w.gsap.to(element, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }),
        });
      });

      document.querySelectorAll<HTMLElement>(".bar i").forEach((bar) => {
        w.ScrollTrigger.create({
          trigger: bar, start: "top 92%", once: true,
          onEnter: () => w.gsap.to(bar, { width: `${bar.dataset.w ?? 0}%`, duration: 1.6, ease: "power3.out" }),
        });
      });

      document.querySelectorAll<HTMLElement>(".ct").forEach((counter) => {
        const value = { current: 0 };
        const precision = Number(counter.dataset.d ?? 0);
        w.ScrollTrigger.create({
          trigger: counter, start: "top 92%", once: true,
          onEnter: () => w.gsap.to(value, {
            current: Number(counter.dataset.to ?? 0), duration: 1.8, ease: "power2.out",
            onUpdate: () => { counter.textContent = value.current.toFixed(precision); },
          }),
        });
      });

      w.gsap.to("#ln", {
        scaleX: 1, ease: "none", scrollTrigger: {
          trigger: "#ceremonies", start: "top 60%", end: "bottom 80%", scrub: 0.6,
        }
      });
      w.gsap.to("#m1", {
        rotate: 90, ease: "none", scrollTrigger: {
          trigger: ".hero", start: "top top", end: "bottom top", scrub: true,
        }
      });
      w.gsap.to("#m2", {
        rotate: -120, ease: "none", scrollTrigger: {
          trigger: "#cta", start: "top bottom", end: "bottom top", scrub: true,
        }
      });

      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        document.querySelectorAll<HTMLElement>(".mag").forEach((element) => {
          const x = w.gsap.quickTo(element, "x", { duration: 0.4, ease: "power3" });
          const y = w.gsap.quickTo(element, "y", { duration: 0.4, ease: "power3" });
          const move = (event: Event) => {
            const pointer = event as MouseEvent;
            const rect = element.getBoundingClientRect();
            x((pointer.clientX - rect.left - rect.width / 2) * 0.18);
            y((pointer.clientY - rect.top - rect.height / 2) * 0.18);
          };
          const reset = () => { x(0); y(0); };
          addListener(element, "mousemove", move);
          addListener(element, "mouseleave", reset);
        });

        document.querySelectorAll<HTMLElement>(".tilt").forEach((element) => {
          const rx = w.gsap.quickTo(element, "rotationX", { duration: 0.5 });
          const ry = w.gsap.quickTo(element, "rotationY", { duration: 0.5 });
          element.style.perspective = "900px";
          const move = (event: Event) => {
            const pointer = event as MouseEvent;
            const rect = element.getBoundingClientRect();
            ry(((pointer.clientX - rect.left) / rect.width - 0.5) * 6);
            rx(-((pointer.clientY - rect.top) / rect.height - 0.5) * 6);
          };
          const reset = () => { rx(0); ry(0); };
          addListener(element, "mousemove", move);
          addListener(element, "mouseleave", reset);
        });
      }
    }

    const initialHost = document.getElementById("stage");
    const stageTwo = document.getElementById("stage2");
    if (!w.THREE || !initialHost || !stageTwo) {
      showStaticValues();
      return () => {
        disposers.forEach((dispose) => dispose());
        w.ScrollTrigger?.getAll?.().forEach((trigger: any) => {
          if (!initialTriggers.has(trigger)) trigger.kill();
        });
        document.documentElement.classList.remove("js");
      };
    }

    let host: HTMLElement = initialHost;
    const T = w.THREE;
    const sc = new w.THREE.Scene();
    const cam = new w.THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.set(0, 0, 9);

    let rd: any;
    try {
      rd = new w.THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (error) {
      console.warn("WebGL is unavailable; using the static landing page:", error);
      showStaticValues();
      return () => {
        disposers.forEach((dispose) => dispose());
        w.ScrollTrigger?.getAll?.().forEach((trigger: any) => {
          if (!initialTriggers.has(trigger)) trigger.kill();
        });
        document.documentElement.classList.remove("js");
      };
    }

    renderer = rd;
    rd.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(rd.domElement);

    sc.add(new w.THREE.AmbientLight(0xffe6c8, 0.7));
    const l1 = new w.THREE.PointLight(0xffc26b, 2.2, 40);
    l1.position.set(4, 4, 6);
    sc.add(l1);
    const l2 = new w.THREE.PointLight(0xff7a9a, 1.3, 40);
    l2.position.set(-5, -2, 4);
    sc.add(l2);

    const gold = new w.THREE.MeshStandardMaterial({
      color: 0xd9a441,
      metalness: 0.75,
      roughness: 0.28,
      emissive: 0x3a2300,
    });
    const g = new w.THREE.Group();
    sc.add(g);

    const r1 = new w.THREE.Mesh(
      new w.THREE.TorusGeometry(1.5, 0.17, 32, 96),
      gold,
    );
    r1.position.x = -0.8;
    r1.rotation.y = 0.9;
    const r2 = new w.THREE.Mesh(
      new w.THREE.TorusGeometry(1.5, 0.17, 32, 96),
      gold,
    );
    r2.position.x = 0.8;
    r2.rotation.x = Math.PI / 2;
    r2.rotation.y = -0.3;
    const gem = new w.THREE.Mesh(
      new w.THREE.OctahedronGeometry(0.28),
      new w.THREE.MeshStandardMaterial({
        color: 0xff9aaf,
        emissive: 0x7a2e42,
        metalness: 0.3,
        roughness: 0.15,
      }),
    );
    gem.position.set(0, 1.6, 0);

    const rg = new w.THREE.Group();
    rg.add(r1, r2, gem);
    rg.scale.setScalar(0.36);
    rg.position.y = 0.15;
    sc.add(rg);

    // lotus below
    const lot = new w.THREE.Group();
    const pm = new w.THREE.MeshStandardMaterial({
      color: 0xc4506b,
      emissive: 0x3f0016,
      roughness: 0.5,
    });
    for (let i = 0; i < 8; i++) {
      const p = new w.THREE.Mesh(
        new w.THREE.SphereGeometry(0.5, 24, 16),
        pm,
      );
      p.scale.set(0.32, 0.9, 0.12);
      const a = (i / 8) * Math.PI * 2;
      p.position.set(Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5);
      p.rotation.set(Math.cos(a) * -0.7, a, 0);
      p.rotation.order = "YXZ";
      lot.add(p);
    }
    lot.position.y = -1.72;
    lot.scale.setScalar(0.55);
    g.add(lot);

    // Mandap: platform, four pillars, pyramid roof, kalash, garlands, sacred flame
    const mar = new w.THREE.MeshStandardMaterial({
      color: 0x7a2e42,
      emissive: 0x2a0810,
      roughness: 0.55,
    });
    const M = new w.THREE.Group();
    sc.add(M);

    const pf = new w.THREE.Mesh(
      new w.THREE.BoxGeometry(3.8, 0.22, 3.8),
      mar,
    );
    pf.position.y = -1.95;
    M.add(pf);

    const pf2 = new w.THREE.Mesh(
      new w.THREE.BoxGeometry(3.4, 0.14, 3.4),
      gold,
    );
    pf2.position.y = -1.77;
    M.add(pf2);

    const cs: Array<[number, number]> = [
      [1.5, 1.5],
      [-1.5, 1.5],
      [-1.5, -1.5],
      [1.5, -1.5],
    ];
    cs.forEach((c) => {
      const p = new w.THREE.Mesh(
        new w.THREE.CylinderGeometry(0.1, 0.13, 2.8, 20),
        gold,
      );
      p.position.set(c[0], -0.4, c[1]);
      M.add(p);
      const cap = new w.THREE.Mesh(
        new w.THREE.SphereGeometry(0.16, 16, 12),
        gold,
      );
      cap.position.set(c[0], 1.05, c[1]);
      M.add(cap);
    });

    const roof = new w.THREE.Mesh(
      new w.THREE.ConeGeometry(2.55, 1.15, 4),
      mar,
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.6;
    M.add(roof);

    const trim = new w.THREE.Mesh(
      new w.THREE.TorusGeometry(1.8, 0.05, 8, 4),
      gold,
    );
    trim.rotation.set(Math.PI / 2, 0, Math.PI / 4);
    trim.position.y = 1.1;
    trim.scale.setScalar(1.18);
    M.add(trim);

    const kb = new w.THREE.Mesh(
      new w.THREE.SphereGeometry(0.2, 20, 14),
      gold,
    );
    kb.position.y = 2.32;
    const kc = new w.THREE.Mesh(
      new w.THREE.ConeGeometry(0.08, 0.35, 12),
      gold,
    );
    kc.position.y = 2.65;
    M.add(kb, kc);

    const bg1 = new w.THREE.SphereGeometry(0.09, 10, 8);
    const bm1 = new w.THREE.MeshStandardMaterial({
      color: 0xf08a1c,
      emissive: 0x5a2a00,
    });
    const bm2 = new w.THREE.MeshStandardMaterial({
      color: 0xe0457b,
      emissive: 0x4a0f22,
    });
    for (let s = 0; s < 4; s++) {
      const A = cs[s]!;
      const B = cs[(s + 1) % 4]!;
      for (let k = 1; k < 12; k++) {
        const u = k / 12;
        const b = new w.THREE.Mesh(bg1, k % 2 ? bm1 : bm2);
        b.position.set(
          A[0] + (B[0] - A[0]) * u,
          1.0 - Math.sin(Math.PI * u) * 0.5,
          A[1] + (B[1] - A[1]) * u,
        );
        M.add(b);
      }
    }

    const fl = new w.THREE.Mesh(
      new w.THREE.ConeGeometry(0.13, 0.45, 12),
      new w.THREE.MeshStandardMaterial({
        color: 0xffb03a,
        emissive: 0xff7a00,
        emissiveIntensity: 1.6,
      }),
    );
    fl.position.y = -1.4;
    g.add(fl);

    const fire = new w.THREE.PointLight(0xff9a3a, 1.6, 6);
    fire.position.y = -1.3;
    g.add(fire);

    // marigold petals
    const N = 90;
    const pet = new w.THREE.InstancedMesh(
      new w.THREE.SphereGeometry(0.09, 10, 8),
      new w.THREE.MeshStandardMaterial({
        color: 0xf08a1c,
        emissive: 0x5a2a00,
        roughness: 0.6,
      }),
      N,
    );
    const dm = new w.THREE.Object3D();
    const d: Array<{ r: number; a: number; y: number; s: number; k: number; z: number }> = [];
    for (let i = 0; i < N; i++) {
      d.push({
        r: 2.4 + Math.random() * 2.2,
        a: Math.random() * 6.28,
        y: (Math.random() - 0.5) * 6,
        s: 0.2 + Math.random() * 0.5,
        k: 0.2 + Math.random() * 0.5,
        z: 0.7 + Math.random() * 0.9,
      });
    }

    function size() {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      rd.setSize(width, height, false);
      cam.aspect = width / height;
      cam.position.z = width < 500 ? 11 : 9;
      cam.updateProjectionMatrix();
    }
    size();
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(size);
      resizeObserver.observe(host);
      resizeObserver.observe(stageTwo);
    } else {
      addListener(window, "resize", size as EventListener);
    }

    sc.add(pet);
    let mx = 0,
      my = 0,
      sy = 0,
      vis = true;

    const S = { h: 0, rain: 0, fl: 1, burst: 0, lan: 0.45, z: 9, ry: 0, jn: 0 };
    const Tg = { h: 0, rain: 0, fl: 1, burst: 0, lan: 0.45, z: 9, ry: 0 };
    const sceneKeys = ["h", "rain", "fl", "burst", "lan", "z", "ry"] as const;

    const h1s = document.getElementById("stage");
    const h2s = document.getElementById("stage2");

    function mount(h: HTMLElement) {
      if (!h || host === h) return;
      host = h;
      h.insertBefore(rd.domElement, h.firstChild);
      size();
    }

    const fa: any[] = [];
    const fm = new w.THREE.MeshBasicMaterial({ color: 0xffe3a0 });
    const fg = new w.THREE.SphereGeometry(0.05, 8, 6);
    for (let s = 0; s < 4; s++) {
      const A = cs[s]!;
      const B = cs[(s + 1) % 4]!;
      for (let k = 0; k < 8; k++) {
        const u = k / 8;
        const f = new w.THREE.Mesh(fg, fm);
        f.position.set(
          (A[0] + (B[0] - A[0]) * u) * 1.2,
          1.08,
          (A[1] + (B[1] - A[1]) * u) * 1.2,
        );
        M.add(f);
        fa.push(f);
      }
    }

    const dy: any[] = [];
    const dgb = new w.THREE.SphereGeometry(0.13, 14, 8);
    const dfg = new w.THREE.ConeGeometry(0.045, 0.17, 8);
    const dfm = new w.THREE.MeshStandardMaterial({
      color: 0xffc04a,
      emissive: 0xff8a00,
      emissiveIntensity: 1.5,
    });
    for (let i = 0; i < 6; i++) {
      const an = i / 6 * 6.283;
      const db = new w.THREE.Mesh(dgb, gold);
      db.scale.y = 0.45;
      db.position.set(Math.cos(an) * 1.15, -1.64, Math.sin(an) * 1.15);
      const df = new w.THREE.Mesh(dfg, dfm);
      df.position.set(db.position.x, -1.5, db.position.z);
      M.add(db, df);
      dy.push(df);
    }

    const H = new w.THREE.Group();
    const hm = new w.THREE.MeshStandardMaterial({
      color: 0xb9561f,
      emissive: 0x6a2a08,
      roughness: 0.6,
    });
    H.position.y = -2.04;
    g.add(H);

    [2.7, 2.2, 1.7].forEach((r) => {
      const m = new w.THREE.Mesh(
        new w.THREE.TorusGeometry(r, 0.025, 6, 64),
        hm,
      );
      m.rotation.x = Math.PI / 2;
      H.add(m);
    });

    for (let i = 0; i < 24; i++) {
      const dd = new w.THREE.Mesh(fg, hm);
      dd.position.set(
        Math.cos((i / 24) * 6.283) * 2.45,
        0,
        Math.sin((i / 24) * 6.283) * 2.45,
      );
      H.add(dd);
    }

    const LN: any[] = [];
    const lg = new w.THREE.CylinderGeometry(0.14, 0.1, 0.3, 10);
    const lm = new w.THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff8a1c,
      emissiveIntensity: 1.2,
    });
    for (let i = 0; i < 16; i++) {
      const lp = new w.THREE.Mesh(lg, lm);
      lp.userData = {
        x: (Math.random() - 0.5) * 11,
        z: -2 - Math.random() * 3,
        o: Math.random() * 8,
        v: 0.2 + Math.random() * 0.25,
      };
      sc.add(lp);
      LN.push(lp);
    }

    const BN = 140;
    const bu = new w.THREE.InstancedMesh(
      new w.THREE.SphereGeometry(0.06, 6, 6),
      new w.THREE.MeshBasicMaterial({ color: 0xf2c96b }),
      BN,
    );
    const bd: any[] = [];
    for (let i = 0; i < BN; i++) {
      bd.push(
        new w.THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).normalize()
      );
    }
    sc.add(bu);

    const pv = new w.THREE.Vector3();
    const chips = [
      ["Guests", "542 confirmed"],
      ["Budget", "₹38.4L planned"],
      ["Tasks", "64 of 82 done"],
      ["Shagun", "₹4,81,101"],
    ].map((c) => {
      const e = document.createElement("div");
      e.className = "chip";
      e.innerHTML = "<small>" + c[0] + "</small><b>" + c[1] + "</b>";
      document.getElementById("h1")?.parentElement?.appendChild(e);
      return e;
    });

    function step() {
      for (const k of sceneKeys) S[k] += (Tg[k] - S[k]) * 0.06;
      const kk = host.clientWidth < 500 ? 1.22 : 1;
      cam.position.z += ((S.jn ? S.z : 9) * kk - cam.position.z) * 0.05;
    }

    function extras(t: number) {
      fa.forEach((f, j) => {
        f.scale.setScalar(0.7 + 0.5 * Math.sin(t * 3 + j));
      });
      dy.forEach((f, j) => {
        f.scale.set(1, 1 + Math.sin(t * 10 + j * 2) * 0.2, 1);
      });
      fl.scale.x = S.fl;
      fl.scale.y = (1 + Math.sin(performance.now() / 1000 * 9) * 0.15) * S.fl;
      fire.intensity = (1.5 + Math.sin(performance.now() / 1000 * 11) * 0.3) * S.fl;
      H.scale.setScalar(Math.max(0.001, S.h));
      H.rotation.y = t * 0.15;
      LN.forEach((l) => {
        const d = l.userData;
        l.position.set(
          d.x,
          ((d.o + t * d.v * (0.4 + S.lan * 2.2)) % 8 + 8) % 8 - 3.8,
          d.z
        );
        l.scale.setScalar(0.2 + S.lan * 1.1);
      });
      bu.visible = S.burst > 0.03;
      if (bu.visible) {
        for (let i = 0; i < BN; i++) {
          const ph = (t * 0.55 + (i % 2) * 0.5) % 1;
          const R = 3.1 * ph;
          const cx = i % 2 ? 2.1 : -2.1;
          dm.position.set(cx + bd[i].x * R, 2 + bd[i].y * R - ph * ph * 0.8, -1 + bd[i].z * R);
          dm.rotation.set(0, 0, 0);
          dm.scale.setScalar(Math.max(0.001, (1 - ph) * S.burst));
          dm.updateMatrix();
          bu.setMatrixAt(i, dm.matrix);
        }
        bu.instanceMatrix.needsUpdate = true;
      }

      const on = host === document.getElementById("stage");
      const w = document.getElementById("stage")?.clientWidth || 0;
      const hh = document.getElementById("stage")?.clientHeight || 0;
      const chips = document.querySelectorAll<HTMLElement>(".chip");
      chips.forEach((e, j) => {
        if (!on) {
          e.style.opacity = "0";
          return;
        }
        const a = t * 0.45 + j * 1.5708;
        const z = Math.sin(a);
        pv.set(
          Math.cos(a) * (w < 500 ? 2.4 : 3.4),
          0.2 + Math.sin(t * 0.8 + j) * 0.5,
          z * 2.4
        ).project(cam);
        e.style.opacity = String(0.5 + 0.5 * (z * 0.5 + 0.5));
        e.style.zIndex = String(z > 0 ? 3 : 1);
        e.style.transform =
          "translate(" +
          (pv.x * 0.5 + 0.5) * w +
          "px," +
          (-pv.y * 0.5 + 0.5) * hh +
          "px) translate(-50%,-50%) scale(" +
          (0.85 + 0.15 * z) +
          ")";
      });
    }

    addListener(window, "pointermove", ((e: MouseEvent) => {
      mx = e.clientX / Math.max(window.innerWidth, 1) - 0.5;
      my = e.clientY / Math.max(window.innerHeight, 1) - 0.5;
    }) as EventListener);

    addListener(window, "scroll", (() => {
      sy = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.5);
    }) as EventListener, { passive: true });

    const vs: Record<string, boolean> = {};
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          vs[e.target.id] = e.isIntersecting;
        });
        vis = !!(vs.stage || vs.stage2);
      });
      const stageOne = document.getElementById("stage");
      if (stageOne) io.observe(stageOne);
      io.observe(stageTwo);
      observer = io;
    }

    function loop() {
      rafId = window.requestAnimationFrame(loop);
      if (!vis) return;
      const t = performance.now() / 1000;
      step();
      g.rotation.y +=
        ((S.jn ? S.ry + mx * 0.4 : mx * 0.8 + t * 0.25 + sy * 2.2) -
          g.rotation.y) *
        0.06;
      g.rotation.x += ((0.2 + my * 0.3) - g.rotation.x) * 0.06;
      g.position.y = Math.sin(t * 0.9) * 0.15 - (S.jn ? 0 : sy) * 0.8;

      r1.rotation.x = t * 0.4;
      r2.rotation.y = -0.3 + t * 0.35;
      gem.rotation.y = t;
      lot.rotation.y = -t * 0.3;
      fl.scale.y = (1 + Math.sin(t * 9) * 0.15) * S.fl;
      fire.intensity = (1.5 + Math.sin(t * 11) * 0.3) * S.fl;

      for (let i = 0; i < N; i++) {
        const q = d[i];
        const a = q.a + t * q.k * 0.4;
        const y0 = q.y + Math.sin(t * q.s + i) * 0.4;
        const yr = ((q.y + 3 - t * (0.8 + q.k * 1.5)) % 6 + 6) % 6 - 3;
        dm.position.set(
          Math.cos(a) * q.r,
          y0 + (yr - y0) * S.rain,
          Math.sin(a) * q.r * q.z
        );
        dm.rotation.set(t * q.s, t * q.k, 0);
        dm.scale.set(1.5, 0.5, 1);
        dm.updateMatrix();
        pet.setMatrixAt(i, dm.matrix);
      }

      pet.instanceMatrix.needsUpdate = true;
      extras(performance.now() / 1000);
      rd.render(sc, cam);
    }

    if (rm) {
      step();
      extras(0);
      rd.render(sc, cam);
    } else {
      loop();
    }

    if (!rm && w.ScrollTrigger && w.gsap && document.documentElement.classList.contains("js")) {
      const jn = document.getElementById("journey");
      const pn = document.getElementById("jc");
      const ds = Array.from(document.querySelectorAll("#jd i"));
      let cur = -1;
      const ST = [
        { h: 1, rain: 0, fl: 1, burst: 0, lan: 0.45, z: 8, ry: 0.6 },
        { h: 0, rain: 1, fl: 1, burst: 0, lan: 0.45, z: 8.6, ry: 1.7 },
        { h: 0, rain: 0, fl: 2.4, burst: 0, lan: 0.45, z: 6.4, ry: 3.14 },
        { h: 0, rain: 0, fl: 1.4, burst: 1, lan: 0.45, z: 9.6, ry: 4.3 },
        { h: 0, rain: 0, fl: 1, burst: 0, lan: 1, z: 10, ry: 5.3 },
      ];
      const TX = [
        [
          "Mehendi · 18 Nov",
          "Artists, slots and menus, all in one place",
          "Henna patterns bloom while you track every mehendi artist, time slot and dinner menu for each family.",
        ],
        [
          "Haldi · 19 Nov",
          "Marigolds, music and a clear run-of-show",
          "Assign décor, seating and photographers so the family can simply enjoy the shower of petals.",
        ],
        [
          "Phere · 20 Nov",
          "The sacred flame, never missing a muhurat",
          "Samagri lists, pundit ji's timings and hawan preparation, checked off together.",
        ],
        [
          "Reception · 21 Nov",
          "Fireworks, banquet and every guest greeted",
          "Live cue cards for stage, food counters and arrivals, with Shagun logged as it comes in.",
        ],
        [
          "Vidai · 21 Nov",
          "Lanterns rise. The planning is already done.",
          "Thank-you messages, vendor settlements and photo albums reach every household.",
        ],
      ] as const;

      function show(n: number) {
        const tx = TX[n];
        if (n === cur || !tx) return;
        cur = n;
        Object.assign(Tg, ST[n]);
        document.querySelectorAll("#jd i").forEach((d, j) =>
          d.classList.toggle("on", j === n)
        );
        w.gsap.to(document.getElementById("jc")!, {
          opacity: 0,
          y: -10,
          duration: 0.18,
          onComplete: () => {
            const key = document.getElementById("jk");
            const heading = document.getElementById("jh");
            const paragraph = document.getElementById("jp");
            if (key) key.textContent = tx[0];
            if (heading) heading.textContent = tx[1];
            if (paragraph) paragraph.textContent = tx[2];
            w.gsap.fromTo(document.getElementById("jc")!, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 });
          },
        });
      }

      w.ScrollTrigger.create({
        trigger: document.getElementById("journey"),
        start: "top 85%",
        end: "bottom 15%",
        onToggle: (s: { isActive: boolean }) => {
          mount(s.isActive ? document.getElementById("stage2")! : document.getElementById("stage")!);
        },
      });

      w.ScrollTrigger.create({
        trigger: document.getElementById("journey"),
        start: "top top",
        end: "bottom bottom",
        onToggle: (s: { isActive: boolean }) => {
          const isActive = s.isActive;
          S.jn = isActive ? 1 : 0;
          if (!isActive) {
            Object.assign(Tg, {
              h: 0,
              rain: 0,
              fl: 1,
              burst: 0,
              lan: 0.45,
              z: 9,
              ry: 0,
            });
            cur = -1;
          }
        },
        onUpdate: (s: { progress: number }) => {
          show(Math.min(4, Math.floor(s.progress * 5)));
        },
      });
    }

    if (rm) showStaticValues();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      resizeObserver?.disconnect();
      disposers.forEach((dispose) => dispose());
      w.ScrollTrigger?.getAll?.().forEach((trigger: any) => {
        if (!initialTriggers.has(trigger)) trigger.kill();
      });
      document.querySelectorAll(".chip").forEach((chip) => chip.remove());
      renderer?.dispose?.();
      renderer?.domElement?.remove?.();
      document.documentElement.classList.remove("js");
    };
  };

  return (
    <div className="landing-page">
      <style jsx global>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300..600,0,1&display=swap');
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
@media(min-width:1024px){.hero .w{grid-template-columns:1.1fr .9fr}}
#stage{height:420px;width:100%;position:relative}#stage canvas{width:100%!important;height:100%!important;display:block}
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
.jr{display:none;background:var(--bg2);border-block:1px solid var(--line);position:relative}.js .jr{display:block;height:440vh}
.jst{position:sticky;top:0;height:100svh;display:flex;align-items:center;padding-top:72px}
.jg{display:grid;gap:1rem;align-items:center;width:100%}@media(min-width:1024px){.jg{grid-template-columns:.8fr 1.2fr;gap:2rem}}
#stage2{height:min(58svh,560px);position:relative}#stage2 canvas{width:100%!important;height:100%!important;display:block}
#jc h2{font-size:clamp(26px,3.6vw,40px);margin:.4rem 0 .8rem}#jc p{color:var(--mute);max-width:30rem}
.dots{display:flex;gap:.5rem;margin-top:1.4rem}.dots i{width:28px;height:4px;border-radius:9px;background:var(--line);transition:background .3s,width .3s}.dots i.on{background:var(--gold2);width:48px}
.chip{position:absolute;left:0;top:0;opacity:0;pointer-events:none;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.45rem .8rem;font-size:11px;color:var(--gold);box-shadow:0 10px 24px -12px rgba(93,23,44,.45);white-space:nowrap;will-change:transform}.chip b{display:block;font:500 15px 'Playfair Display',serif;color:var(--pri)}
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
            <g id="pt">
              <path d="M0-190C26-160 26-120 0-90 -26-120 -26-160 0-190Z" />
            </g>
            {Array.from({ length: 11 }, (_, index) => (
              <use key={index} href="#pt" transform={`rotate(${(index + 1) * 30})`} />
            ))}
          </g>
        </defs>
      </svg>
      <header>
        <div className="w">
          <a className="logo" href="#top">
            <span className="ms" style={{ color: "var(--gold)", fontSize: 30 }}>
              temple_hindu
            </span>
            <span>
              <b>MakeMyMarrige</b>
              <small>Parivar Sahayog</small>
            </span>
          </a>
          <nav>
            <a href="#features">Features</a>
            <a href="#ceremonies">Ceremonies</a>
            <a href="#how">How it works</a>
            <a href="#roles">For families</a>
            <a href="#faqs">FAQs</a>
          </nav>
          <div className="row" style={{ gap: "0.5rem" }}>
            <Link className="btn g" href="/login">Log in</Link>
            <Link className="btn mag" href="/register">Get started</Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <svg className="mandala" id="m1" viewBox="-200 -200 400 400">
            <use href="#md" />
          </svg>
          <div className="w">
            <div>
              <span className="pill" data-r>
                <span className="ms" style={{ fontSize: 15 }}>auto_awesome</span>
                Collaborative wedding workspace for Indian families
              </span>
              <h1 id="h1">
                Your wedding. Your people. <em>One beautiful plan.</em>
              </h1>
              <p className="lead" data-r>
                Unite families across cities, coordinate every ceremony, track vendor payments and keep each ritual in its right place.
              </p>
              <div className="row" data-r>
                <Link className="btn mag" href="/register">
                  Start planning free <span className="ms">arrow_forward</span>
                </Link>
                <a className="btn g mag" href="#features">
                  <span className="ms" style={{ color: "var(--gold)" }}>play_circle</span>
                  See features
                </a>
              </div>
            </div>
            <div id="stage" aria-label="A 3D Indian wedding mandap with garlands, a sacred flame and golden rings, surrounded by floating marigold petals"></div>
          </div>
          <div className="w" style={{ marginTop: "3rem" }}>
            <div className="dash" id="preview" data-r>
              <div className="top">
                <div>
                  <div className="serif" style={{ fontSize: 19, color: "var(--ink)" }}>
                    Sample Wedding Workspace
                  </div>
                  <small style={{ color: "var(--mute)" }}>Illustrative preview · sample figures</small>
                  <small style={{ color: "var(--mute)" }}>
                    <span className="ms" style={{ fontSize: 14, color: "var(--gold)" }}>
                      calendar_month
                    </span>{" "}
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
                <div className="met">
                  <small>Guests & Parivar</small>
                  <div className="n">
                    <span className="ct" data-to="542">0</span>{" "}
                    <small
                      style={{
                        textTransform: "none",
                        letterSpacing: 0,
                        fontWeight: 400,
                        color: "var(--mute)",
                      }}
                    >
                      of 680 confirmed
                    </small>
                  </div>
                  <div className="bar"><i data-w="79" /></div>
                  <small style={{ color: "var(--grn)", textTransform: "none" }}>
                    79% attending · 38 households
                  </small>
                </div>
                <div className="met">
                  <small>Budget & Shagun</small>
                  <div className="n">
                    ₹<span className="ct" data-to="38.4" data-d="1">0</span>{" "}
                    <small
                      style={{
                        textTransform: "none",
                        letterSpacing: 0,
                        fontWeight: 400,
                        color: "var(--mute)",
                      }}
                    >
                      allocated
                    </small>
                  </div>
                  <div className="bar"><i data-w="68" /></div>
                  <small
                    style={{
                      color: "var(--gold)",
                      textTransform: "none",
                    }}
                  >
                    ₹26.1L committed · 3 invoices pending
                  </small>
                </div>
                <div className="met">
                  <small>Ritual checklists</small>
                  <div className="n">
                    <span className="ct" data-to="64">0</span> / 82{" "}
                    <small
                      style={{
                        textTransform: "none",
                        letterSpacing: 0,
                        fontWeight: 400,
                        color: "var(--mute)",
                      }}
                    >
                      done
                    </small>
                  </div>
                  <div className="bar"><i data-w="78" /></div>
                  <small
                    style={{
                      color: "var(--pri)",
                      textTransform: "none",
                    }}
                  >
                    6 urgent tasks
                  </small>
                </div>
              </div>
              <div className="act">
                <div>
                  <span>
                    <span className="ms" style={{ color: "var(--grn)" }}>
                      check_circle
                    </span>{" "}
                    Awadhi & Mughlai menu finalised
                  </span>
                  <span>
                    <span className="tag ok">Approved</span> Rajesh V. (Father)
                  </span>
                </div>
                <div>
                  <span>
                    <span className="ms" style={{ color: "var(--gold)" }}>
                      pending
                    </span>{" "}
                    Brass diyas & floral toran procurement
                  </span>
                  <span>
                    <span className="tag">In progress</span> Meera (Sister)
                  </span>
                </div>
                <div>
                  <span>
                    <span className="ms" style={{ color: "var(--pri)" }}>
                      priority_high
                    </span>{" "}
                    Guest pickups · Lucknow Airport & Kanpur Central
                  </span>
                  <span>
                    <span className="tag" style={{ color: "var(--pri)" }}>
                      Needs attention
                    </span> Kabir (Groom)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="strip" aria-hidden="true">
            <div>
              <span>Mehendi</span>
              <span>Haldi</span>
              <span>Sangeet</span>
              <span>Phere</span>
              <span>Vidai</span>
              <span>Reception</span>
              <span>Shagun</span>
              <span>Atithi Satkar</span>
              <span>Mehendi</span>
              <span>Haldi</span>
              <span>Sangeet</span>
              <span>Phere</span>
              <span>Vidai</span>
              <span>Reception</span>
              <span>Shagun</span>
              <span>Atithi Satkar</span>
            </div>
          </div>
        </section>

        <section className="jr" id="journey">
          <div className="jst">
            <div className="w jg">
              <div>
                <div id="jc">
                  <div className="serif" id="jk" style={{ color: "var(--gold)", fontSize: 16 }}>
                    Mehendi · 18 Nov
                  </div>
                  <h2 id="jh">Artists, slots and menus, all in one place</h2>
                  <p id="jp">
                    Henna patterns bloom while you track every mehendi artist, time slot and dinner menu for each family.
                  </p>
                </div>
                <div className="dots" id="jd">
                  <i className="on" />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div id="stage2"></div>
            </div>
          </div>
        </section>

        <section className="s" id="features">
          <div className="w">
            <div className="head" data-r>
              <h2>Everything your family needs to plan together.</h2>
              <p>
                An Indian wedding is a multi-day symphony of traditions. MakeMyMarrige brings ceremonial depth together with modern order.
              </p>
            </div>
            <div className="grid">
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">hub</span>
                </div>
                <h3>One shared workspace</h3>
                <p>
                  Bring the bride's and groom's sides into one calm place, instead of scattered chats and unverified sheets.
                </p>
              </div>
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">assignment_ind</span>
                </div>
                <h3>Clear responsibilities</h3>
                <p>
                  Assign ceremonies and logistics so Chacha ji, Mausi ji and siblings know exactly what they lead. Gentle WhatsApp reminders do the rest.
                </p>
              </div>
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">family_restroom</span>
                </div>
                <h3>Households & guest lists</h3>
                <p>
                  Track RSVPs by family, travel dates, hotel rooms and diets such as Satvik and Jain.
                </p>
              </div>
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">festival</span>
                </div>
                <h3>Function-wise planning</h3>
                <p>
                  Plan Mehendi, Haldi, Sangeet, Phere and Reception on their own timelines with run-of-show cues.
                </p>
              </div>
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">account_balance_wallet</span>
                </div>
                <h3>Expenses & digital Shagun</h3>
                <p>
                  Track vendor milestones and keep Shagun records organised alongside the wedding budget.
                </p>
              </div>
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">diversity_1</span>
                </div>
                <h3>Coordinated family decisions</h3>
                <p>
                  Involve elders and relatives with permission-controlled views that suit their comfort. Run polls on mithai, themes and safas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="s alt" id="ceremonies">
          <div className="w">
            <div className="head" data-r>
              <h2>Every ritual given the respect and precision it deserves.</h2>
              <p>
                Break each ceremony day into timed cues so pundit ji, performers and family anchors never miss a beat.
              </p>
            </div>
            <div className="line"><i id="ln" /></div>
            <div className="cer">
              <div className="card tilt" data-r>
                <b>18 Nov</b>
                <h3>Mehendi & Sangeet</h3>
                <div className="bar"><i data-w="92" /></div>
                <p>92% ready · Sound check, dhol entry, 24 live counters</p>
              </div>
              <div className="card tilt" data-r>
                <b>19 Nov</b>
                <h3>Haldi ceremony</h3>
                <div className="bar"><i data-w="100" /></div>
                <p>100% ready · Marigold décor and family seating set</p>
              </div>
              <div className="card tilt" data-r>
                <b>20 Nov</b>
                <h3>Shaadi & Phere</h3>
                <div className="bar"><i data-w="84" /></div>
                <p>84% ready · Samagri list, muhurat and hawan prep</p>
              </div>
              <div className="card tilt" data-r>
                <b>21 Nov</b>
                <h3>Reception banquet</h3>
                <div className="bar"><i data-w="68" /></div>
                <p>68% ready · Menu, stage and guest arrivals</p>
              </div>
            </div>
          </div>
        </section>

        <section className="s" id="how">
          <div className="w">
            <div className="head" data-r>
              <h2>From the first muhurat to the final celebration.</h2>
              <p>
                A stress-free roadmap that respects both tradition and busy schedules.
              </p>
            </div>
            <div className="grid">
              <div className="sp" data-r>
                <div className="k">1</div>
                <div>
                  <h3 style={{ fontSize: 19, color: "var(--ink)" }}>Create your workspace</h3>
                  <p style={{ color: "var(--mute)", fontSize: 14 }}>
                    Set your dates, host cities and ceremony days in two minutes. No app to download.
                  </p>
                </div>
              </div>
              <div className="sp" data-r>
                <div className="k">2</div>
                <div>
                  <h3 style={{ fontSize: 19, color: "var(--ink)" }}>
                    Invite key family
                  </h3>
                  <p style={{ color: "var(--mute)", fontSize: 14 }}>
                    Add your partner, parents and siblings with permissions that fit their role.
                  </p>
                </div>
              </div>
              <div className="sp" data-r>
                <div className="k">3</div>
                <div>
                  <h3 style={{ fontSize: 19, color: "var(--ink)" }}>
                    Organise the details
                  </h3>
                  <p style={{ color: "var(--mute)", fontSize: 14 }}>
                    Build run-of-shows, import WhatsApp contacts into households and set budgets.
                  </p>
                </div>
              </div>
              <div className="sp" data-r>
                <div className="k">4</div>
                <div>
                  <h3 style={{ fontSize: 19, color: "var(--ink)" }}>
                    Celebrate in calm
                  </h3>
                  <p style={{ color: "var(--mute)", fontSize: 14 }}>
                    Follow live cue cards, greet guests with ease and enjoy every moment until the Vidai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="s alt" id="roles">
          <div className="w">
            <div className="head" data-r>
              <h2>Collaborative by design. Private by permission.</h2>
              <p>
                Not everyone needs to see private vendor contracts. Tailored access keeps harmony across generations.
              </p>
            </div>
            <div className="grid">
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">favorite</span>
                </div>
                <h3>Bride & Groom</h3>
                <p>
                  Workspace owners. Full control over ceremonies, budgets, contracts, invites and delegation.
                </p>
              </div>
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">groups</span>
                </div>
                <h3>Parents & Siblings</h3>
                <p>
                  Family organisers. Manage guest follow-ups, rooms and checklists, with financial views protected.
                </p>
              </div>
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">receipt_long</span>
                </div>
                <h3>Treasurer / Chacha ji</h3>
                <p>
                  Tracks vendor invoices, payment milestones, cash reserves and automatic Shagun receipts.
                </p>
              </div>
              <div className="card tilt" data-r>
                <div className="ic">
                  <span className="ms">celebration</span>
                </div>
                <h3>Honoured Atithi</h3>
                <p>
                  Guests get a clean web itinerary, dress code, map, RSVP and Shagun QR. No account needed.
                </p>
              </div>
            </div>
            <p className="quote" data-r>
              "We honour the depth, warmth and multi-day celebrations of Indian families without the clutter and chaos."
            </p>
          </div>
        </section>

        <section className="s" id="faqs">
          <div className="w">
            <div className="head" style={{ marginInline: "auto", textAlign: "center" }} data-r>
              <h2>Common questions from planning families</h2>
            </div>
            <div className="faq" data-r>
              <details>
                <summary>
                  Can both families plan in the same workspace?<span className="ms">expand_more</span>
                </summary>
                <p>
                  Yes. Share joint lists such as Sangeet and Reception guests and vendor contracts, and keep private tabs for things like trousseau budgets or family gifts.
                </p>
              </details>
              <details>
                <summary>
                  Is it easy for elders who use WhatsApp?<span className="ms">expand_more</span>
                </summary>
                <p>
                  Yes. Elders need no app or password. Send them WhatsApp summaries, and guests can confirm RSVPs with one tap.
                </p>
              </details>
              <details>
                <summary>
                  How does Digital Shagun work? Are there fees?<span className="ms">expand_more</span>
                </summary>
                <p>
                  The workspace can keep Shagun instructions and contribution records organised for the family. Payment handling and any applicable provider charges should be confirmed before launch.
                </p>
              </details>
              <details>
                <summary>
                  How private is our guest and budget data?<span className="ms">expand_more</span>
                </summary>
                <p>
                  Workspace access is designed around membership and permissions, so organisers can limit who sees guest details, budgets and other sensitive information.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="w" id="cta">
          <div className="cta" data-r>
            <svg id="m2" viewBox="-200 -200 400 400">
              <use href="#md" />
            </svg>
            <h2>Make room for the moments that matter.</h2>
            <p>Bring your plans, people and celebrations into one calm place, and cherish every ritual.</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <Link className="btn mag" href="/register">
                Start planning free
              </Link>
              <a className="btn g mag" href="#how">
                How it works
              </a>
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
            <span className="ms" style={{ color: "var(--gold)" }}>
              temple_hindu
            </span>
            <b>MakeMyMarrige</b>
          </div>
          <span>Crafted with reverence for Indian celebrations · Kanpur & pan-India</span>
          <span>© 2026 MakeMyMarrige</span>
        </div>
      </footer>
    </div>
  );
}