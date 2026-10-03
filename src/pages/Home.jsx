import React from "react";
import Hero from "../components/Hero.jsx";
import HimalayanSeasons from "../components/HimalayanSeasons.jsx";
import ExploreWays from "../components/ExploreWays.jsx";
import Destinations from "../components/Destinations.jsx";
import WhyLamaBhai from "../components/WhyLamaBhai.jsx";
import PlanCTA from "../components/PlanCTA.jsx";

export default function Home() {
  return (
    <main>
      <Hero />
      <HimalayanSeasons />
      <ExploreWays />
      <Destinations />
      <WhyLamaBhai />
      <PlanCTA />
    </main>
  );
}