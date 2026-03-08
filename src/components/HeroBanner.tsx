import { useState, useEffect } from "react";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80",
    tagline: "Explore the Eternal City",
    headline: "WHAT'S IT LIKE LIVING IN ROME?",
    subtitle: "Discover the deets on history, food, and daily life in one of the world's oldest cities.",
  },
  {
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=80",
    tagline: "Life Behind the Scenes",
    headline: "LEARN THE DEETS ABOUT ANY JOB",
    subtitle: "From waiters to doctors, find out what it's really like before you start.",
  },
  {
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80",
    tagline: "Share the Deets!",
    headline: "WHAT'S IT LIKE LIVING IN PARIS?",
    subtitle: "The cafés, the commute, the culture. Get the real details from people who know.",
  },
  {
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
    tagline: "Real Talk, Real People",
    headline: "LEARN & SHARE DETAILS ABOUT LIFE, PLACES AND MORE!",
    subtitle: "Rate, discuss, and discover what matters most. Straight from those who've lived it.",
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[340px] md:h-[400px] overflow-hidden">
      {slides.map((slide, i) => (
        <img
          key={slide.image}
          src={slide.image}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-blue-900/60" />
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <p className="text-yellow-400 font-bold text-sm md:text-base tracking-widest uppercase mb-2">
            {slide.tagline}
          </p>
          <h1 className="text-white font-extrabold text-2xl md:text-4xl lg:text-5xl max-w-3xl leading-tight mb-4">
            {slide.headline}
          </h1>
          <p className="text-white/90 text-sm md:text-lg max-w-2xl">
            {slide.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
};

export default HeroBanner;
