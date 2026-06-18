"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Sparkles, Compass, ShieldCheck, CreditCard, MessageSquare, Home as HomeIcon, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { MatchResult } from "@/types/squad";
import { Property } from "@/types/property";

// Demo roommates shown to signed-out visitors (marketing preview) and as a
// graceful fallback when a signed-in user hasn't started matchmaking yet.
const DEMO_ROOMMATES = [
  { name: "Rahul Sharma", score: 94, status: "Active" },
  { name: "Priya Desai", score: 88, status: "Pending" },
];
const ROOMMATE_GRADIENTS = [
  "linear-gradient(45deg, #f72585, #7209b7)",
  "linear-gradient(45deg, #4cc9f0, #4361ee)",
  "linear-gradient(45deg, #43e97b, #38f9d7)",
];

// Up to two uppercase initials from a display name (e.g. "Keval Parmar" → "KP").
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Home() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [topProperty, setTopProperty] = useState<Property | null>(null);

  // Personalize the hero preview for signed-in users with their real
  // matchmaking data. Guests keep the curated demo so the landing page
  // always looks complete.
  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => {
        setMatches(null);
        setTopProperty(null);
      });
      return;
    }
    apiFetch("/squad-lookups/matches?page=1&per_page=5")
      .then((res) => setMatches((res.data as MatchResult[]) || []))
      .catch(() => setMatches([]));
    apiFetch("/properties")
      .then((res) => setTopProperty(((res.data as Property[]) || [])[0] ?? null))
      .catch(() => setTopProperty(null));
  }, [user]);

  const profileName = user?.name || "Keval Parmar";
  const profileLocation = user?.preferred_localities?.[0]
    ? `Looking in ${user.preferred_localities[0]}`
    : "Looking in Ahmedabad";

  const hasMatches = !!matches && matches.length > 0;
  const topMatchScore = hasMatches ? Math.round(matches![0].compatibility_score * 100) : 98;
  const roommates = hasMatches
    ? matches!.slice(0, 2).map((m) => ({
        name: m.name,
        score: Math.round(m.compatibility_score * 100),
        status: "Active",
      }))
    : DEMO_ROOMMATES;

  const property = topProperty
    ? {
        title: topProperty.title,
        loc: [topProperty.locality, topProperty.city].filter(Boolean).join(" • ") || "Premium location",
        price: topProperty.rent_amount ?? 18000,
        href: `/properties/${topProperty.id}`,
      }
    : {
        title: "Premium 3BHK in SG Highway",
        loc: "Ahmedabad • 2km from workplace",
        price: 18000,
        href: "/properties",
      };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <main className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          ✦ Live now in Ahmedabad & Rajkot
        </div>

        <h1 className={styles.title}>
          Find Your Squad. <br />
          Find Your Space.
        </h1>

        <p className={styles.subtitle}>
          Find compatible roommates and rent premium homes — powered by AI
          matchmaking and precise spatial discovery.
        </p>

        <div className={styles.ctaGroup}>
          <Link href="/onboarding">
            <button className="btn-primary">Find a Roommate</button>
          </Link>
          <Link href="/properties">
            <button className="btn-secondary">Explore Properties</button>
          </Link>
        </div>
      </section>

      {/* Elegant VisionOS/Monterey Dashboard Graphic with Real UI Mockup */}
      <div className={styles.dashboardPreview}>
        <div className={styles.dashboardHeader}>
          <div className={styles.windowControl}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
          <div className={styles.headerTitle}>Matchmaking Dashboard</div>
          <div style={{ width: 44 }}></div> {/* spacer for centering */}
        </div>
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Sidebar */}
          <div className={styles.dashboardSidebar}>
            <div className={styles.sidebarProfile}>
              <div
                className={styles.avatar}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}
              >
                {initialsOf(profileName)}
              </div>
              <div>
                <div className={styles.profileName}>{profileName}</div>
                <div className={styles.profileRole}>{profileLocation}</div>
              </div>
            </div>
            <div className={styles.navMenu}>
              <div className={`${styles.navItem} ${styles.active}`}>
                <Sparkles size={14} style={{ opacity: 0.8 }} /> Matches
              </div>
              <div className={styles.navItem}>
                <HomeIcon size={14} style={{ opacity: 0.6 }} /> Properties
              </div>
              <div className={styles.navItem}>
                <MessageSquare size={14} style={{ opacity: 0.6 }} /> Messages
              </div>
              <div className={styles.navItem}>
                <Settings size={14} style={{ opacity: 0.6 }} /> Settings
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className={styles.dashboardContent}>
            <div className={styles.contentHeader}>
              <div className={styles.contentTitle}>Recommended for You</div>
              <Link href="/dashboard" className="btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Filter</Link>
            </div>

            <div className={styles.contentRow}>
              {/* AI Match Card */}
              <Link href="/dashboard" className={styles.matchCard} style={{ textDecoration: "none", color: "inherit" }}>
                <div className={styles.matchLabel}>Top Personality Match</div>
                <div className={styles.matchScore}>{topMatchScore}%</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "auto" }}>Based on lifestyle &amp; habits</div>
              </Link>

              {/* Property Card */}
              <Link href={property.href} className={styles.propertyCard} style={{ textDecoration: "none", color: "inherit" }}>
                <div className={styles.propertyImage}></div>
                <div className={styles.propertyInfo}>
                  <div className={styles.propTitle}>{property.title}</div>
                  <div className={styles.propLoc}>{property.loc}</div>
                  <div className={styles.propPrice}>₹{property.price.toLocaleString("en-IN")}<span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 400 }}>/mo</span></div>
                </div>
              </Link>
            </div>

            <div className={styles.contentBody}>
              <div className={styles.listHeader}>
                <div>Potential Roommates</div>
                <div>Match</div>
                <div>Status</div>
              </div>
              {roommates.map((r, i) => (
                <div
                  key={`${r.name}-${i}`}
                  className={styles.listItem}
                  style={i === roommates.length - 1 ? { borderBottom: "none" } : undefined}
                >
                  <div className={styles.itemMain}>
                    <div className={styles.itemAvatar} style={{ background: ROOMMATE_GRADIENTS[i % ROOMMATE_GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.7rem", fontWeight: 600 }}>
                      {initialsOf(r.name)}
                    </div>
                    <div>{r.name}</div>
                  </div>
                  <div className="mono" style={{ color: r.score >= 90 ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>{r.score}%</div>
                  <div style={{ color: "var(--text-secondary)" }}>{r.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.glassCard} onMouseMove={handleMouseMove}>
          <div className={styles.cardIcon}>
            <Sparkles size={24} style={{ color: "var(--accent-blue)" }} />
          </div>
          <h3 className={styles.cardTitle}>Intelligent Matchmaking</h3>
          <p className={styles.cardDesc}>
            Our vector-based system analyzes lifestyle traits to pair you with highly compatible roommates, ensuring a seamless and harmonious living experience.
          </p>
        </div>

        <div className={styles.glassCard} onMouseMove={handleMouseMove}>
          <div className={styles.cardIcon}>
            <Compass size={24} style={{ color: "var(--accent-blue)" }} />
          </div>
          <h3 className={styles.cardTitle}>Spatial Discovery</h3>
          <p className={styles.cardDesc}>
            Explore curated properties across Ahmedabad and Rajkot with exact geographical precision, filtering by commute and lifestyle preferences.
          </p>
        </div>

        <div className={styles.glassCard} onMouseMove={handleMouseMove}>
          <div className={styles.cardIcon}>
            <ShieldCheck size={24} style={{ color: "var(--accent-blue)" }} />
          </div>
          <h3 className={styles.cardTitle}>Verified Profiles</h3>
          <p className={styles.cardDesc}>
            Experience complete peace of mind. Every profile undergoes rigorous KYC verification and is secured with bank-grade AES-256 encryption.
          </p>
        </div>

        <div className={styles.glassCard} onMouseMove={handleMouseMove}>
          <div className={styles.cardIcon}>
            <CreditCard size={24} style={{ color: "var(--accent-blue)" }} />
          </div>
          <h3 className={styles.cardTitle}>Seamless Payments</h3>
          <p className={styles.cardDesc}>
            Found your ideal space? Secure it instantly by paying the token amount directly through our integrated, secure gateway.
          </p>
        </div>
      </section>
    </main>
  );
}
