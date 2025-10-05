"use client"

import FeaturesForm from "@/components/containers/FeaturesForm";
import {
  AlertDialog, AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import * as React from "react";

const InvestigateContainer: React.FC = () => {
 	const [resultOpen, setResultOpen] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [resultData, setResultData] = React.useState<any>({});

  const SuccessAlert = () => {
    return (
		  <AlertDialog open={resultOpen} onOpenChange={setResultOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Model results</AlertDialogTitle>
            <AlertDialogDescription>
              Classification: {resultData?.prediction ?? 'unknown'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Cool</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const handleSuccess = (data: string) => {
    setResultData(data);
    setResultOpen(true);
  }

  return (
    <>
      <FeaturesForm onSuccess={handleSuccess} />
      <SuccessAlert />
    </>
  );
}

export default InvestigateContainer;
