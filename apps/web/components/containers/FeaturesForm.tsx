import {Button} from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import * as React from "react";

const FeaturesForm = () => {
  const FeatureField = ({ name, label, description }: { name: string; label: string; description: string; }) => {
    return (
      <Field>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        <Input id={name} autoComplete="off" />
        <FieldDescription>{description}</FieldDescription>
      </Field>
    )
  }

  return (
    <div>
      <FieldGroup>
        <FeatureField name="feature1" label="Feature 1" description="Feature description." />
        <FeatureField name="feature2" label="Feature 2" description="Feature description." />
        <FeatureField name="feature3" label="Feature 3" description="Feature description." />
        <FeatureField name="feature4" label="Feature 4" description="Feature description." />
        <FeatureField name="feature5" label="Feature 5" description="Feature description." />
        <FeatureField name="feature6" label="Feature 6" description="Feature description." />
      </FieldGroup>
      <Button className="mt-4 float-right">
        Check classification
      </Button>
    </div>
  );
}
export default FeaturesForm;
