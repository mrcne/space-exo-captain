import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import * as React from "react";

const FeaturesForm = () => {
  return (
    <div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Feature1</FieldLabel>
          <Input id="feature1" autoComplete="off" placeholder="Feature1"/>
          <FieldDescription>Feature description.</FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  );
}
export default FeaturesForm;
