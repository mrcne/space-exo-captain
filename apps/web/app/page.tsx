import { H1 } from "@/components/ui/typography";
import Image from "next/image";
import capExoplanet from "../assets/cap-exoplanet.webp";

export default function Home() {
  return (
    <div>
      <main className="text-center">
        <H1>Captain Exoplanet</H1>
        <div className="mt-4 flex justify-center">
          <Image
            src={capExoplanet}
            alt="Captain Exoplanet illustration"
            placeholder="empty"
            priority
            sizes="50vw"
            className="w-[50vw] h-auto"
          />
        </div>
        <p>Welcome traveller! The goal is of this app is to let anyone open a browser, paste or upload feature values, and get a classification back.</p>
      </main>
    </div>
  );
}
