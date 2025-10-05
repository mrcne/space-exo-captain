import InvestigateContainer from "@/components/containers/InvestigateContainer";
import { H1 } from "@/components/ui/typography";
import * as React from "react";

export default function Investigate() {
  return (
    <div className="mx-auto p-6">
      <H1>Investigate</H1>
      <InvestigateContainer />
    </div>
  );
}
