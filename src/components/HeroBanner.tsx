import { useState, useEffect } from "react";

const slides = [
  "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80",
  "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=80",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
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
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-blue-900/60" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-yellow-400 font-bold text-sm md:text-base tracking-widest uppercase mb-2">
          Share the Deets!
        </p>
        <h1 className="text-white font-extrabold text-2xl md:text-4xl lg:text-5xl max-w-3xl leading-tight mb-4">
          LEARN & SHARE DETAILS ABOUT LIFE, PLACES AND MORE!
        </h1>
        <p className="text-white/90 text-sm md:text-lg max-w-2xl">
          What's it like being a doctor, a parent, or living in Paris? Rate your favorites!
        </p>
      </div>
    </div>
  );
};

export default HeroBanner;
