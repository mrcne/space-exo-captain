"use client"

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

// @TODO: serve definitions from API
import featureColumns from "../../data/feature_columns.json";

const fieldIsRequiredError = "This field is required";

type FeaturesInput = Record<string, string>;

export type Props = {
  onSuccess: (data: string) => void;
};

const FeaturesForm: React.FC<Props> = ({ onSuccess }) => {
  const FeaturesSchema = z.record(z.string(), z.string().min(1, fieldIsRequiredError));

  const defaultValues = featureColumns.reduce<Record<string, string>>((acc, column) => {
    acc[column] = '1';
    return acc;
  }, {});
  const form = useForm<FeaturesInput>({
    resolver: zodResolver(FeaturesSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const [leftOpen, setLeftOpen] = React.useState(false);
  const [rightOpen, setRightOpen] = React.useState(false);

  type FeatureFieldProps = {
    name: keyof FeaturesInput;
    label: string;
    description?: string;
  };

  const FeatureField = ({ name, label, description }: FeatureFieldProps) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({field}) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            { !!description && <FormDescription>{description}</FormDescription> }
            <FormMessage/>
          </FormItem>
        )}
      />
    );
  };

  const onSubmit: SubmitHandler<FeaturesInput> = async (data) => {
    console.log(data);
    const featuresData = {
      features: data,
    }
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featuresData),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const result = await res.json().catch(() => (() => {
        console.error('Failed to parse JSON response')
      }));
      console.log(result);
      onSuccess(result);
      // toast.success(JSON.stringify(result));
      // reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      console.error(err);
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="md:pl-80 md:pr-80">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:hidden">
              <Dialog.Root open={leftOpen} onOpenChange={setLeftOpen}>
                <Dialog.Trigger asChild>
                  <Button variant="outline" type="button">Left options</Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 md:hidden" />
                  <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-80 translate-x-[-100%] bg-card p-4 shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:translate-x-0 md:hidden">
                    <div className="flex items-center justify-between pb-2">
                      <Dialog.Title className="text-base font-semibold">Model settings</Dialog.Title>
                      <Dialog.Close asChild>
                        <button aria-label="Close" className="rounded-md p-2 hover:bg-accent">
                          <X className="h-5 w-5" />
                        </button>
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

              <Dialog.Root open={rightOpen} onOpenChange={setRightOpen}>
                <Dialog.Trigger asChild>
                  <Button variant="outline" type="button">Right options</Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 md:hidden" />
                  <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-80 translate-x-[100%] bg-card p-4 shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:translate-x-0 md:hidden">
                    <div className="flex items-center justify-between pb-2">
                      <Dialog.Title className="text-base font-semibold">Objects database</Dialog.Title>
                      <Dialog.Close asChild>
                        <button aria-label="Close" className="rounded-md p-2 hover:bg-accent">
                          <X className="h-5 w-5" />
                        </button>
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>

          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              { featureColumns.map((column) => (
                <FeatureField key={column} name={column} label={column}/>
              ))}
            </div>
          </FieldGroup>
          <Button className="mt-4 float-right" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Check classification"}
          </Button>
        </div>

        <div className="hidden md:block">
          <aside className="fixed left-[220px] top-14 bottom-0 z-30 w-80 border-r bg-card p-4 shadow-sm">
            <div className="pb-2">
              <div className="text-base font-semibold">Model Settings</div>
            </div>
          </aside>

          <aside className="fixed right-0 top-14 bottom-0 z-30 w-80 border-l bg-card p-4 shadow-sm">
            <div className="pb-2">
              <div className="text-base font-semibold">Objects database</div>
            </div>
          </aside>
        </div>
      </form>
    </Form>
  );
}
export default FeaturesForm;
