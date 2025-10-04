"use client"

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { useForm, type SubmitHandler, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const fieldIsRequiredError = "This field is required";

const FeaturesSchema = z.object({
  feature1: z.string().min(1, fieldIsRequiredError),
  feature2: z.string().min(1, fieldIsRequiredError),
  feature3: z.string().min(1, fieldIsRequiredError),
  feature4: z.string().min(1, fieldIsRequiredError),
  feature5: z.string().min(1, fieldIsRequiredError),
  feature6: z.string().min(1, fieldIsRequiredError),
});

type FeaturesInput = z.infer<typeof FeaturesSchema>;

const FeaturesForm = () => {
  const form = useForm<FeaturesInput>({
    resolver: zodResolver(FeaturesSchema),
    defaultValues: {
      feature1: "",
      feature2: "",
      feature3: "",
      feature4: "",
      feature5: "",
      feature6: "",
    },
    mode: "onSubmit",
  });

  type FeatureFieldProps = {
    name: keyof FeaturesInput;
    label: string;
    description: string;
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
              <Input placeholder={label} {...field} />
            </FormControl>
            <FormDescription>{description}</FormDescription>
            <FormMessage/>
          </FormItem>
        )}
      />
    );
  };

  const onSubmit: SubmitHandler<FeaturesInput> = async (data) => {
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const result = await res.json().catch(() => (() => {
        console.error('Failed to parse JSON response')
      }));
      console.log(result);
      toast.success(JSON.stringify(result));
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
        <FieldGroup>
          <FeatureField name="feature1" label="Feature 1" description="Feature description." />
          <FeatureField name="feature2" label="Feature 2" description="Feature description." />
          <FeatureField name="feature3" label="Feature 3" description="Feature description." />
          <FeatureField name="feature4" label="Feature 4" description="Feature description." />
          <FeatureField name="feature5" label="Feature 5" description="Feature description." />
          <FeatureField name="feature6" label="Feature 6" description="Feature description." />
        </FieldGroup>
        <Button className="mt-4 float-right" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Check classification"}
        </Button>
      </form>
    </Form>
  );
}
export default FeaturesForm;
