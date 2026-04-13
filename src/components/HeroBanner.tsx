import { useState, useEffect } from "react";

const slides = [
  {
    image: "/hero-city.jpg",
    tagline: "Real Talk, Real People",
    headline: "LEARN & SHARE DETAILS ABOUT YOUR CITY, TOWN, OR STATE",
    quote: "Before I visit any city, I check DeetSheet to find out what are the best ways to enjoy the area.",
    attribution: "Bob, 56, Boston, MA",
  },
  {
    image: "/hero-restaurant.jpg",
    tagline: "Real Talk, Real People",
    headline: "SHARE DETAILS ABOUT YOUR FAVORITE RESTAURANT OR BAR",
    quote: "I love posting hidden restaurant gems in my area on DeetSheet to show visitors where's the best place to eat.",
    attribution: "Tracy, 43, Portland, OR",
  },
  {
    image: "/hero-paris.jpg",
    tagline: "Real Talk, Real People",
    headline: "SHARE INNER MOST DETAILS ABOUT LOVE, LIFE & RELATIONSHIPS",
    quote: "I never knew others felt the same way about first dates until I read stories from others on DeetSheet.",
    attribution: "Christine, 26, Nashville, TN",
  },
  {
    image: "/hero-passions.jpg",
    tagline: "Real Talk, Real People",
    headline: "SHARE DETAILS ABOUT YOUR PASSIONS, INTERESTS AND HOBBIES",
    quote: "I've been playing pickle for three years and DeetSheet showed me tips on how to play better.",
    attribution: "Rob, 62, Palm Beach, FL",
  },
  {
    image: "/hero-school.jpg",
    tagline: "Real Talk, Real People",
    headline: "LEARN & SHARE DETAILS ABOUT YOUR SCHOOL OR UNIVERSITY",
    quote: "I love sharing what makes University of Wisconsin special. I feel like it's one of the best schools to attend.",
    attribution: "Mike, 32, Racine, WI",
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
    <div className="relative w-full h-[170px] md:h-[200px] overflow-hidden">
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
      <div className="absolute inset-0 bg-black/40" />
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <h1 className="text-white font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight mb-4 whitespace-nowrap">
            {slide.headline}
          </h1>
          <div className="text-green-300 text-xs sm:text-sm md:text-base whitespace-nowrap">
            <p className="italic">&ldquo;{slide.quote}&rdquo;</p>
            <p className="mt-1 font-semibold">— {slide.attribution}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeroBanner;
