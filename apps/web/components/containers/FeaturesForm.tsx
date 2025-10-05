"use client"

import ChoiceboxList, {Choice} from "@/components/components/ChoiceboxList";
import MobiDrawer from "@/components/components/MobiDrawer";
import ObjectsTable, {OIData} from "@/components/components/ObjectsTable";
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

  const [leftOpen, setLeftOpen] = React.useState(false);
  const [rightOpen, setRightOpen] = React.useState(false);

  type FeatureFieldProps = {
    name: keyof FeaturesInput;
    label: string;
    description?: string;
  };

  const [modelsList, setModelsList] = React.useState<Choice[]>([
    { id: "loading", label: "Loading models...", subtitle: "", description: "Please wait" },
  ]);
  const [modelsLoading, setModelsLoading] = React.useState(true);
  const [modelsError, setModelsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const res = await fetch("/api/models", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load models (status ${res.status})`);
        const data: Array<{ id: string; name: string; accuracy: number | null; family: string; runId: string }>
          = await res.json();
        if (cancelled) return;
        const choices: Choice[] = (data && Array.isArray(data) ? data : []).map((m) => ({
          id: m.id,
          label: m.name || `${m.family.toUpperCase()} ${m.runId}`,
          subtitle: typeof m.accuracy === 'number' ? `Accuracy: ${(m.accuracy * 100).toFixed(2)}%` : "Accuracy: n/a",
          description: `${m.family} • ${m.runId}`,
        }));
        setModelsList(choices.length ? choices : [
          { id: "no-models", label: "No models found", subtitle: "", description: "Run sync to add artifacts" },
        ]);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        if (!cancelled) {
          setModelsError(message);
          setModelsList([
            { id: "error", label: "Failed to load models", subtitle: message, description: "Check server logs" },
          ]);
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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

  const handleObjectSelection = (row: OIData) =>{
    console.log(row);
    for (const [key, value] of Object.entries(row)) {
      // skip few columns
      if (key === "tfopwg_disp") {
        continue;
      }
      // if (form.getValues(key) === undefined) {
      //   continue;
      // }
      form.setValue(key, String(value));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <div className="mb-4 flex items-center justify-between gap-2 md:hidden">
              <Button variant="outline" type="button" onClick={ () => setLeftOpen(true) }>Left options</Button>
              <Button variant="outline" type="button" onClick={ () => setRightOpen(true) }>Right options</Button>
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

        {/* @TODO: move to React Portals */}
        <MobiDrawer open={leftOpen} onOpenChange={setLeftOpen} title="Model settings" variant="left">
          <ChoiceboxList options={modelsList} onValueChange={() => {}} />
        </MobiDrawer>

        <MobiDrawer open={rightOpen} onOpenChange={setRightOpen} title="Objects database" variant="right">
          <ObjectsTable
            onSelect={handleObjectSelection}
            minimal
          />
        </MobiDrawer>
      </form>
    </Form>
  );
}
export default FeaturesForm;
