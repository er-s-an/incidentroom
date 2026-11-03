import Atmosphere from "@/components/Atmosphere";
import Cta from "@/components/Cta";
import FeatureBands from "@/components/FeatureBands";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ProofTable from "@/components/ProofTable";
import SandboxRoom from "@/components/SandboxRoom";

export default function Page() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <SandboxRoom />
      <Atmosphere />
      <FeatureBands />
      <ProofTable />
      <Cta />
      <Footer />
    </main>
  );
}
