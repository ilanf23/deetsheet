import DeetHeader from "@/components/DeetHeader";
import HeroBanner from "@/components/HeroBanner";
import ColumnLayout from "@/components/ColumnLayout";
import DeetFooter from "@/components/DeetFooter";

const Index = () => {
  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-white">
      <DeetHeader />
      <main className="flex-1 lg:min-h-0 flex flex-col">
        <HeroBanner />
        <ColumnLayout />
      </main>
      <DeetFooter />
    </div>
  );
};

export default Index;
