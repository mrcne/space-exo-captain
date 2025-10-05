import InvestigateContainer from "@/components/containers/InvestigateContainer";
import { H2 } from "@/components/ui/typography";
import * as React from "react";

export default function Investigate() {
  return (
    <div className="mx-auto p-6 md:pl-80 md:pr-80">
      <H2 className="">Investigate</H2>
      <InvestigateContainer />
    </div>
  );
}
