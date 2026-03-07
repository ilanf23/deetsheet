import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  { text: "Share the details of your city.", emoji: "🏙️" },
  { text: "Learn what it's really like to be a doctor.", emoji: "🩺" },
  { text: "Discover the most important details about life.", emoji: "✨" },
  { text: "Your experiences could help someone else.", emoji: "🤝" },
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
    <div className="relative overflow-hidden rounded-2xl bg-primary mx-4 my-6 lg:mx-0">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-secondary blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <div className="relative px-8 py-12 md:py-16 text-center">
        <div className="text-5xl mb-4">{slides[current].emoji}</div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground font-heading mb-4 transition-all duration-500">
          {slides[current].text}
        </h2>
        <p className="text-primary-foreground/70 mb-6 max-w-lg mx-auto">
          DeetSheet is where real people share the details that matter.
        </p>
        <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-8">
          Sign Up Free
        </Button>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-secondary" : "w-2 bg-primary-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => setCurrent((current - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground transition hidden md:block"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setCurrent((current + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground transition hidden md:block"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default HeroBanner;
