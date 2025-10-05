'use client';

import {RadioGroupProps} from "@radix-ui/react-radio-group";
import * as React from "react";

import {
  Choicebox,
  ChoiceboxItem,
  ChoiceboxItemContent,
  ChoiceboxItemDescription,
  ChoiceboxItemHeader,
  ChoiceboxItemIndicator,
  ChoiceboxItemSubtitle,
  ChoiceboxItemTitle,
} from '@/components/ui/shadcn-io/choicebox';

export type Choice = {
  id: string;
  label: string;
  subtitle?: string;
  description?: string;
};

export type Props = RadioGroupProps & {
  options: Choice[];
};

const ChoiceboxList: React.FC<Props> = ({
  options,
  onValueChange,
  defaultValue = options[0].id,
}) => {
  return (
    <Choicebox defaultValue={defaultValue} onValueChange={onValueChange}>
      {options.map((option) => (
        <ChoiceboxItem key={option.id} value={option.id}>
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle>
              {option.label}
              <ChoiceboxItemSubtitle>{option.subtitle}</ChoiceboxItemSubtitle>
            </ChoiceboxItemTitle>
            <ChoiceboxItemDescription>
              {option.description}
            </ChoiceboxItemDescription>
          </ChoiceboxItemHeader>
          <ChoiceboxItemContent>
            <ChoiceboxItemIndicator/>
          </ChoiceboxItemContent>
        </ChoiceboxItem>
      ))}
    </Choicebox>
  );
};

export default ChoiceboxList;
