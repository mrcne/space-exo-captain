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
      </form>
    </Form>
  );
}
export default FeaturesForm;
