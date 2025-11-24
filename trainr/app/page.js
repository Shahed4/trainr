"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

const EXERCISES = [
  {
    id: "none",
    label: "Baseline Scan",
    focus: "Full-body posture",
    description: "Use this pass to calibrate the camera and warm up joints.",
  },
  {
    id: "external_rotation",
    label: "External Rotation",
    focus: "Rotator cuff",
    description: "Opens the front of the shoulder and reinforces scapular control.",
  },
  {
    id: "pushup",
    label: "Tempo Push-up",
    focus: "Anterior chain",
    description: "Controlled tempo for safer load and stronger lockouts.",
  },
];

const FEATURE_CARDS = [
  {
    badge: "01",
    title: "Real-time overlays",
    body: "Ultra-clean pose lines show joint angles and depth so athletes can course-correct instantly.",
  },
  {
    badge: "02",
    title: "Therapist-approved cues",
    body: "Surface the exact cues your PT wants you to feel with contextual motion notes beside the stream.",
  },
  {
    badge: "03",
    title: "Progress pulse",
    body: "Each rep feeds into your timeline so you can see consistency and range trends without spreadsheets.",
  },
];

const TIPS = [
  "Place your tripod 6-8 feet away and keep the entire body in frame.",
  "Use the Baseline Scan before loading any movement to sync the feed.",
  "Focus on slow, controlled breathing; the timer below matches a 4-second cadence.",
  "Need a different exercise? Your coach can push templates remotely at any time.",
];

const STATS = [
  { value: "42", label: "Movement templates" },
  { value: "0.3°", label: "Tracking precision" },
  { value: "12k", label: "Sessions guided" },
];

export default function Home() {
  const [error, setError] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState("none");
  const [videoSrc, setVideoSrc] = useState("http://localhost:5001/video-feed?exercise=none");
  const [isLoading, setIsLoading] = useState(true);
  const studioRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    const newVideoSrc = `http://localhost:5001/video-feed?exercise=${selectedExercise}&t=${Date.now()}`;
    setVideoSrc(newVideoSrc);
  }, [selectedExercise]);

  useEffect(() => {
    const img = videoRef.current;
    if (!img) {
      return;
    }

    const handleLoad = () => {
      setError(null);
      setIsLoading(false);
    };

    const handleError = () => {
      setError("OpenPose stream unavailable. Start the local server on port 5001 and refresh.");
      setIsLoading(false);
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [videoSrc]);

  const status = useMemo(() => {
    if (error) {
      return {
        label: "Offline",
        tone: "offline",
        copy: error,
      };
    }

    if (isLoading) {
      return {
        label: "Connecting",
        tone: "connecting",
        copy: "Looking for an active OpenPose feed…",
      };
    }

    return {
      label: "Live feed",
      tone: "online",
      copy: "Crystal-clear motion capture is active.",
    };
  }, [error, isLoading]);

  const activeExercise = useMemo(
    () => EXERCISES.find((exercise) => exercise.id === selectedExercise) ?? EXERCISES[0],
    [selectedExercise],
  );

  const handleScrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <div className={styles.glowTop} aria-hidden="true" />
      <div className={styles.glowBottom} aria-hidden="true" />

      <header className={styles.hero}>
        <p className={styles.eyebrow}>Intelligent rehab studio</p>
        <h1 className={styles.heroTitle}>Rebuild strength with confidence and beautiful feedback.</h1>
        <p className={styles.heroSubtitle}>
          Trainr pairs live computer vision with your therapist&apos;s programming. Launch the studio, choose a focus,
          and follow cinematic cues that keep every rep fluid and intentional.
        </p>

        <div className={styles.heroActions}>
          <button className={styles.primaryButton} type="button" onClick={handleScrollToStudio}>
            Launch studio
          </button>
          <a className={styles.secondaryButton} href="#playbooks">
            View playbooks
          </a>
        </div>

        <div className={styles.statsRow}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      <section className={styles.dashboard} ref={studioRef}>
        <div className={styles.videoCard}>
          <div className={styles.statusRow}>
            <span className={`${styles.statusPill} ${styles[status.tone]}`}>{status.label}</span>
            <p className={styles.statusCopy}>{status.copy}</p>
          </div>
          <div className={styles.videoShell}>
            <img
              ref={videoRef}
              id="openpose-video"
              key={`video-${selectedExercise}`}
              src={videoSrc}
              alt="Live OpenPose feed"
              className={styles.videoFeed}
            />
            {(isLoading || error) && (
              <div className={styles.videoOverlay}>
                <span>{error ? "Awaiting stream" : "Hydrating feed"}</span>
              </div>
            )}
          </div>
          <div className={styles.exerciseMeta}>
            <div>
              <p className={styles.metaLabel}>Current focus</p>
              <p className={styles.metaValue}>{activeExercise.label}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Primary region</p>
              <p className={styles.metaValue}>{activeExercise.focus}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Cadence</p>
              <p className={styles.metaValue}>4s eccentric / 1s hold</p>
            </div>
          </div>
        </div>

        <div className={styles.controlCard}>
          <p className={styles.cardEyebrow}>Choose a track</p>
          <h2 className={styles.cardTitle}>Your PT loaded three guided flows for today.</h2>
          <p className={styles.cardBody}>
            Each movement comes with cues, timers, and rep targets. Switching presets refreshes the overlay instantly.
          </p>

          <div className={styles.exerciseList}>
            {EXERCISES.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                className={styles.exerciseButton}
                data-active={exercise.id === selectedExercise}
                onClick={() => setSelectedExercise(exercise.id)}
              >
                <div>
                  <p className={styles.exerciseLabel}>{exercise.label}</p>
                  <p className={styles.exerciseFocus}>{exercise.focus}</p>
                </div>
                <p className={styles.exerciseDescription}>{exercise.description}</p>
              </button>
            ))}
          </div>

          <div className={styles.tips}>
            <p className={styles.cardEyebrow}>Studio checklist</p>
            <ul className={styles.tipList}>
              {TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.features} id="playbooks">
        <div className={styles.featuresIntro}>
          <p className={styles.eyebrow}>Therapist playbooks</p>
          <h2 className={styles.sectionTitle}>Every detail your athlete needs, none of the clutter.</h2>
          <p className={styles.heroSubtitle}>
            Trainr keeps the important context—tempo, cues, and readiness—front and center so athletes stay locked in.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {FEATURE_CARDS.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <span className={styles.featureBadge}>{feature.badge}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureBody}>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
