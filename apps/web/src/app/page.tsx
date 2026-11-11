"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Don't redirect - landing page is public
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    // Load external scripts
    const scripts = [
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
      "https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    ];

    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

    Promise.all(scripts.map(loadScript)).then(() => {
      initializeAnimations();
    }).catch(console.error);

    return () => {
      // Cleanup
      if (window.gsap) {
        window.gsap.killTweensOf("*");
        if (window.ScrollTrigger) {
          window.ScrollTrigger.getAll().forEach((st) => st.kill());
        }
      }
    };
  }, []);

  const initializeAnimations = () => {
    if (typeof window === "undefined") return;

    const rm = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const $ = (s: string, c: Element | Document = document) =>
      [].slice.call((c || document).querySelectorAll(s));

    const h1 = document.getElementById("h1");

    function bars() {
      document.querySelectorAll(".bar i").forEach((b) => {
        b.style.width = b.dataset.w + "%";
      });
      document.querySelectorAll(".ct").forEach((c) => {
        const d = +c.dataset.d || 0;
        c.textContent = (+c.dataset.to).toFixed(d);
      });
    }

    if (rm || !window.gsap || !window.ScrollTrigger) {
      bars();
      return;
    }

    document.documentElement.classList.add("js");
    window.gsap.registerPlugin(window.ScrollTrigger);

    // Lenis smooth scroll
    let ls: any;
    if (window.Lenis) {
      const lsInstance = new window.Lenis({ lerp: 0.09 });
      lsInstance.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lsInstance.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);

      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const t = a.getAttribute("href");
          if (t.length > 1 && document.querySelector(t)) {
            e.preventDefault();
            lsInstance.scrollTo(t, { offset: -72 });
          }
        });
      });
      ls = lsInstance;
    }

    // Headline word reveal
    const h1 = document.getElementById("h1");
    if (h1) {
      const nodes = [].slice.call(h1.childNodes);
      let out = "";
      nodes.forEach((n) => {
        const em = n.nodeName === "EM";
        const t = n.textContent?.trim().split(/\s+/);
        out += t?.map((w) => {
          const s = '<span class="wd"><span>' + w + '</span></span> ';
          return em ? "<em>" + s + "</em>" : s;
        }).join("") || "";
      });
      h1.innerHTML = out;

      window.gsap.from("#h1 .wd>span", {
        yPercent: 110,
        rotate: 4,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.08,
        delay: 0.2,
      });
    }

    window.gsap.to(".hero [data-r]", {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.12,
      delay: 0.9,
      ease: "power3.out",
    });
    window.gsap.set(".hero [data-r]", { y: 24 });

    // Scroll reveals
    document.querySelectorAll('[data-r]').forEach((e) => {
      if (!e.closest(".hero") || e.id === "preview") {
        window.gsap.set(e, { y: 36 });
        window.ScrollTrigger.create({
          trigger: e,
          start: "top 88%",
          once: true,
          onEnter: () =>
            window.gsap.to(e, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
            }),
        });
      }
    });

    document.querySelectorAll(".bar i").forEach((b) => {
      window.ScrollTrigger.create({
        trigger: b,
        start: "top 92%",
        once: true,
        onEnter: () =>
          window.gsap.to(b, {
            width: b.dataset.w + "%",
            duration: 1.6,
            ease: "power3.out",
          }),
      });
    });

    document.querySelectorAll(".ct").forEach((c) => {
      const o = { v: 0 };
      const d = +c.dataset.d || 0;
      window.ScrollTrigger.create({
        trigger: c,
        start: "top 92%",
        once: true,
        onEnter: () =>
          window.gsap.to(o, {
            v: +c.dataset.to,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: () => {
              c.textContent = o.v.toFixed(d);
            },
          }),
      });
    });

    const ln = document.getElementById("ln");
    if (ln) {
      window.gsap.to("#ln", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "#ceremonies",
          start: "top 60%",
          end: "bottom 80%",
          scrub: 0.6,
        },
      });
    }

    const m1 = document.getElementById("m1");
    if (m1) {
      window.gsap.to("#m1", {
        rotate: 90,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    const m2 = document.getElementById("m2");
    if (m2) {
      window.gsap.to("#m2", {
        rotate: -120,
        ease: "none",
        scrollTrigger: {
          trigger: "#cta",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    // Magnetic buttons + card tilt (pointer-only)
    if (matchMedia("(hover:hover)").matches) {
      document.querySelectorAll(".mag").forEach((b) => {
        const x = window.gsap.quickTo(b, "x", {
          duration: 0.4,
          ease: "power3",
        });
        const y = window.gsap.quickTo(b, "y", {
          duration: 0.4,
          ease: "power3",
        });
        b.addEventListener("mousemove", (e: MouseEvent) => {
          const r = b.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.25);
          y((e.clientY - r.top - r.height / 2) * 0.35);
        });
        b.addEventListener("mouseleave", () => {
          x(0);
          y(0);
        });
      });

      document.querySelectorAll(".tilt").forEach((c) => {
        const rx = window.gsap.quickTo(c, "rotationX", {
          duration: 0.5,
        });
        const ry = window.gsap.quickTo(c, "rotationY", {
          duration: 0.5,
        });
        (c as HTMLElement).style.transformPerspective = "900px";
        c.addEventListener("mousemove", (e: MouseEvent) => {
          const r = c.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 8);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
        });
        c.addEventListener("mouseleave", () => {
          rx(0);
          ry(0);
        });
      });
    }

    // 3D hero scene
    const host = document.getElementById("stage");
    if (!window.THREE || !host) return;

    const T = window.THREE;
    const sc = new window.THREE.Scene();
    const cam = new window.THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.set(0, 0, 9);

    let rd: any;
    try {
      rd = new window.THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      return;
    }

    rd.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.appendChild(rd.domElement);

    const sc = new window.THREE.Scene();
    sc.add(new window.THREE.AmbientLight(0xffe6c8, 0.7));
    const l1 = new window.THREE.PointLight(0xffc26b, 2.2, 40);
    l1.position.set(4, 4, 6);
    sc.add(l1);
    const l2 = new window.THREE.PointLight(0xff7a9a, 1.3, 40);
    l2.position.set(-5, -2, 4);
    sc.add(l2);

    const gold = new window.THREE.MeshStandardMaterial({
      color: 0xd9a441,
      metalness: 0.75,
      roughness: 0.28,
      emissive: 0x3a2300,
    });
    const g = new window.THREE.Group();
    sc.add(g);

    const r1 = new window.THREE.Mesh(
      new window.THREE.TorusGeometry(1.5, 0.17, 32, 96),
      gold,
    );
    r1.position.x = -0.8;
    r1.rotation.y = 0.9;
    const r2 = new window.THREE.Mesh(
      new window.THREE.TorusGeometry(1.5, 0.17, 32, 96),
      gold,
    );
    r2.position.x = 0.8;
    r2.rotation.x = Math.PI / 2;
    r2.rotation.y = -0.3;
    const gem = new window.THREE.Mesh(
      new window.THREE.OctahedronGeometry(0.28),
      new window.THREE.MeshStandardMaterial({
        color: 0xff9aaf,
        emissive: 0x7a2e42,
        metalness: 0.3,
        roughness: 0.15,
      }),
    );
    gem.position.set(0, 1.6, 0);

    const rg = new window.THREE.Group();
    rg.add(r1, r2, gem);
    rg.scale.setScalar(0.36);
    rg.position.y = 0.15;
    sc.add(rg);

    // lotus below
    const lot = new window.THREE.Group();
    const pm = new window.THREE.MeshStandardMaterial({
      color: 0xc4506b,
      emissive: 0x3f0016,
      roughness: 0.5,
    });
    for (let i = 0; i < 8; i++) {
      const p = new window.THREE.Mesh(
        new window.THREE.SphereGeometry(0.5, 24, 16),
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
    const mar = new window.THREE.MeshStandardMaterial({
      color: 0x7a2e42,
      emissive: 0x2a0810,
      roughness: 0.55,
    });
    const M = new window.THREE.Group();
    g.add(M);

    const pf = new window.THREE.Mesh(
      new window.THREE.BoxGeometry(3.8, 0.22, 3.8),
      mar,
    );
    pf.position.y = -1.95;
    M.add(pf);

    const pf2 = new window.THREE.Mesh(
      new window.THREE.BoxGeometry(3.4, 0.14, 3.4),
      gold,
    );
    pf2.position.y = -1.77;
    M.add(pf2);

    const cs = [
      [1.5, 1.5],
      [-1.5, 1.5],
      [-1.5, -1.5],
      [1.5, -1.5],
    ];
    cs.forEach((c) => {
      const p = new window.THREE.Mesh(
        new window.THREE.CylinderGeometry(0.1, 0.13, 2.8, 20),
        gold,
      );
      p.position.set(c[0], -0.4, c[1]);
      M.add(p);
      const cap = new window.THREE.Mesh(
        new window.THREE.SphereGeometry(0.16, 16, 12),
        gold,
      );
      cap.position.set(c[0], 1.05, c[1]);
      M.add(cap);
    }

    const roof = new window.THREE.Mesh(
      new window.THREE.ConeGeometry(2.55, 1.15, 4),
      mar,
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.6;
    M.add(roof);

    const trim = new window.THREE.Mesh(
      new window.THREE.TorusGeometry(1.8, 0.05, 8, 4),
      gold,
    );
    trim.rotation.set(Math.PI / 2, 0, Math.PI / 4);
    trim.position.y = 1.1;
    trim.scale.setScalar(1.18);
    M.add(trim);

    const kb = new window.THREE.Mesh(
      new window.THREE.SphereGeometry(0.2, 20, 14),
      gold,
    );
    kb.position.y = 2.32;
    const kc = new window.THREE.Mesh(
      new window.THREE.ConeGeometry(0.08, 0.35, 12),
      gold,
    );
    kc.position.y = 2.65;
    M.add(kb, kc);

    const bg1 = new window.THREE.SphereGeometry(0.09, 10, 8);
    const bm1 = new window.THREE.MeshStandardMaterial({
      color: 0xf08a1c,
      emissive: 0x5a2a00,
    });
    const bm2 = new window.THREE.MeshStandardMaterial({
      color: 0xe0457b,
      emissive: 0x4a0f22,
    });
    for (let s = 0; s < 4; s++) {
      const A = cs[s],
        B = cs[(s + 1) % 4];
      for (let k = 1; k < 12; k++) {
        const u = k / 12;
        const b = new window.THREE.Mesh(bg1, k % 2 ? bm1 : bm2);
        b.position.set(
          A[0] + (B[0] - A[0]) * u,
          1.0 - Math.sin(Math.PI * u) * 0.5,
          A[1] + (B[1] - A[1]) * u,
        );
        M.add(b);
      }
    }

    const fl = new window.THREE.Mesh(
      new window.THREE.ConeGeometry(0.13, 0.45, 12),
      new window.THREE.MeshStandardMaterial({
        color: 0xffb03a,
        emissive: 0xff7a00,
        emissiveIntensity: 1.6,
      }),
    );
    fl.position.y = -1.4;
    g.add(fl);

    const fire = new window.THREE.PointLight(0xff9a3a, 1.6, 6);
    fire.position.y = -1.3;
    g.add(fire);

    // marigold petals
    const N = 90;
    const pet = new window.THREE.InstancedMesh(
      new window.THREE.SphereGeometry(0.09, 10, 8),
      new window.THREE.MeshStandardMaterial({
        color: 0xf08a1c,
        emissive: 0x5a2a00,
        roughness: 0.6,
      }),
      N,
    );
    const dm = new window.THREE.Object3D();
    const d = [];
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
      const w = host.clientWidth,
        h = host.clientHeight;
      rd.setSize(w, h, false);
      cam.aspect = w / h;
      cam.position.z = w < 500 ? 11 : 9;
      cam.updateProjectionMatrix();
    }
    size();
    window.addEventListener("resize", size);

    sc.add(pet);
    const mx = 0,
      my = 0,
      sy = 0,
      vis = true;

    const S = { h: 0, rain: 0, fl: 1, burst: 0, lan: 0.45, z: 9, ry: 0, jn: 0 };
    const Tg = { h: 0, rain: 0, fl: 1, burst: 0, lan: 0.45, z: 9, ry: 0 };

    const h1s = document.getElementById("stage");
    const h2s = document.getElementById("stage2");

    function mount(h: HTMLElement) {
      if (!h || host === h) return;
      host = h;
      h.insertBefore(rd.domElement, h.firstChild);
      size();
    }

    const fa = [];
    const fm = new window.THREE.MeshBasicMaterial({ color: 0xffe3a0 });
    const fg = new window.THREE.SphereGeometry(0.05, 8, 6);
    for (let s = 0; s < 4; s++) {
      const A = cs[s],
        B = cs[(s + 1) % 4];
      for (let k = 0; k < 8; k++) {
        const u = k / 8;
        const f = new window.THREE.Mesh(fg, fm);
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
    const dgb = new window.THREE.SphereGeometry(0.13, 14, 8);
    const dfg = new window.THREE.ConeGeometry(0.045, 0.17, 8);
    const dfm = new window.THREE.MeshStandardMaterial({
      color: 0xffc04a,
      emissive: 0xff8a00,
      emissiveIntensity: 1.5,
    });
    for (let i = 0; i < 6; i++) {
      const an = i / 6 * 6.283;
      const db = new window.THREE.Mesh(dgb, gold);
      db.scale.y = 0.45;
      db.position.set(Math.cos(an) * 1.15, -1.64, Math.sin(an) * 1.15);
      const df = new window.THREE.Mesh(dfg, dfm);
      df.position.set(db.position.x, -1.5, db.position.z);
      M.add(db, df);
      dy.push(df);
    }

    const H = new window.THREE.Group();
    const hm = new window.THREE.MeshStandardMaterial({
      color: 0xb9561f,
      emissive: 0x6a2a08,
      roughness: 0.6,
    });
    H.position.y = -2.04;
    g.add(H);

    [2.7, 2.2, 1.7].forEach((r) => {
      const m = new window.THREE.Mesh(
        new window.THREE.TorusGeometry(r, 0.025, 6, 64),
        hm,
      );
      m.rotation.x = Math.PI / 2;
      H.add(m);
    });

    for (let i = 0; i < 24; i++) {
      const dd = new window.THREE.Mesh(fg, hm);
      dd.position.set(
        Math.cos((i / 24) * 6.283) * 2.45,
        0,
        Math.sin((i / 24) * 6.283) * 2.45,
      );
      H.add(dd);
    }

    const LN: any[] = [];
    const lg = new window.THREE.CylinderGeometry(0.14, 0.1, 0.3, 10);
    const lm = new window.THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff8a1c,
      emissiveIntensity: 1.2,
    });
    for (let i = 0; i < 16; i++) {
      const lp = new window.THREE.Mesh(lg, lm);
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
    const bu = new window.THREE.InstancedMesh(
      new window.THREE.SphereGeometry(0.06, 6, 6),
      new window.THREE.MeshBasicMaterial({ color: 0xf2c96b }),
      BN,
    );
    const bd: window.THREE.Vector3[] = [];
    for (let i = 0; i < BN; i++) {
      bd.push(
        new window.THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).normalize()
      );
    }
    sc.add(bu);

    const pv = new window.THREE.Vector3();
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
      for (const k in Tg) S[k] += (Tg[k] - S[k]) * 0.06;
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
      fl.scale.y *= S.fl;
      fire.intensity *= S.fl;
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
      const chips = document.querySelectorAll(".chip");
      chips.forEach((e: HTMLElement, j) => {
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

    window.addEventListener("pointermove", (e: MouseEvent) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
    });

    window.addEventListener("scroll", () => {
      sy = Math.min(scrollY / innerHeight, 1.5);
    }, { passive: true });

    const vs: Record<string, boolean> = {};
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          vs[e.target.id] = e.isIntersecting;
        });
        vis = !!(vs.stage || vs.stage2);
      });
      io.observe(document.getElementById("stage")!);
      io.observe(document.getElementById("stage2")!);
    }

    const clk = { getElapsedTime: () => performance.now() / 1000 };

    function loop() {
      requestAnimationFrame(loop);
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
      fl.scale.y = 1 + Math.sin(t * 9) * 0.15;
      fire.intensity = 1.5 + Math.sin(t * 11) * 0.3;

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

    function loop() {
      requestAnimationFrame(loop);
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
      fl.scale.y = 1 + Math.sin(t * 9) * 0.15;
      fire.intensity = 1.5 + Math.sin(t * 11) * 0.3;

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

    function loop() {
      requestAnimationFrame(loop);
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
      fl.scale.y = 1 + Math.sin(t * 9) * 0.15;
      fire.intensity = 1.5 + Math.sin(t * 11) * 0.3;

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

    loop();

    if (window.ScrollTrigger && window.gsap && document.documentElement.classList.contains("js")) {
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
      ];

      function show(n: number) {
        if (n === cur) return;
        cur = n;
        Object.assign(Tg, ST[n]);
        document.querySelectorAll("#jd i").forEach((d, j) =>
          d.classList.toggle("on", j === n)
        );
        gsap.to(document.getElementById("jc")!, {
          opacity: 0,
          y: -10,
          duration: 0.18,
          onComplete: () => {
            document.getElementById("jk")!.textContent = TX[n][0];
            document.getElementById("jh")!.textContent = TX[n][1];
            document.getElementById("jp")!.textContent = TX[n][2];
            gsap.fromTo(document.getElementById("jc")!, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 });
          },
        });
      }

      window.ScrollTrigger.create({
        trigger: document.getElementById("journey"),
        start: "top 85%",
        end: "bottom 15%",
        onToggle: s => {
          mount(s.isActive ? document.getElementById("stage2")! : document.getElementById("stage")!);
        },
      });

      ScrollTrigger.create({
        trigger: document.getElementById("journey"),
        start: "top top",
        end: "bottom bottom",
        onToggle: s => {
          const isActive = s.isActive;
          (window as any).S.jn = isActive ? 1 : 0;
          if (!isActive) {
            Object.assign((window as any).Tg, {
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
        onUpdate: s => {
          show(Math.min(4, Math.floor(s.progress * 5)));
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased">
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
            <a className="btn g" href="#">Log in</a>
            <a className="btn mag" href="#cta">Get started</a>
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
                <a className="btn mag" href="#preview">
                  Start planning free <span className="ms">arrow_forward</span>
                </a>
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
                    Aanya & Kabir's Wedding Workspace
                  </div>
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
                  Follow vendor milestones and log UPI Shagun with 0% commission, with a ledger you can audit.
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
                  Guests pay directly to your verified UPI ID. We charge 0% commission, and the amount, sender and blessing message are logged in your ledger.
                </p>
              </details>
              <details>
                <summary>
                  How private is our guest and budget data?<span className="ms">expand_more</span>
                </summary>
                <p>
                  We never sell guest lists, phone numbers or budget data to vendors or marketers. Your celebration stays within your invited circle.
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
              <a className="btn mag" href="#">
                Start planning free
              </a>
              <a className="btn g mag" href="#">
                Book a family walkthrough
              </a>
            </div>
            <p style={{ fontSize: 12, margin: "1.4rem 0 0", color: "#ffd9df99" }}>
              No credit card · Set up in 2 minutes
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
          <span>© 2026 MakeMyMarrige Technologies Pvt. Ltd.</span>
        </div>
      </footer>
    </div>
  );
}