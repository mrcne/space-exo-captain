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
	const [resultData, setResultData] = React.useState('unknown');

  const SuccessAlert = () => {
    return (
		  <AlertDialog open={resultOpen} onOpenChange={setResultOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Model results</AlertDialogTitle>
            <AlertDialogDescription>
              {JSON.stringify(resultData)}
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
