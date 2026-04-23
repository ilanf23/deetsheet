import DeetHeader from "@/components/DeetHeader";
import HeroBanner from "@/components/HeroBanner";
import HomeFeed from "@/components/HomeFeed";
import ColumnLayout from "@/components/ColumnLayout";
import DeetFooter from "@/components/DeetFooter";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DeetHeader />
      <main className="flex-1">
        <HeroBanner />
        {/* Personalized cascading feed (city → state → national) */}
        <section className="mx-auto mt-6 px-6 lg:px-10 max-w-5xl">
          <HomeFeed />
        </section>
        <ColumnLayout />
      </main>
      <DeetFooter />
    </div>
  );
};

export default Index;
