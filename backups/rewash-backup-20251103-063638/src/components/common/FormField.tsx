import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputProps,
  Textarea,
  TextareaProps,
  Select,
  SelectProps,
  FormHelperText,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionFormControl = motion(FormControl);

interface BaseFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
}

interface InputFieldProps extends BaseFieldProps, Omit<InputProps, 'isRequired'> {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

interface TextareaFieldProps extends BaseFieldProps, Omit<TextareaProps, 'isRequired'> {
  type: 'textarea';
}

interface SelectFieldProps extends BaseFieldProps, Omit<SelectProps, 'isRequired'> {
  type: 'select';
  options: Array<{ value: string; label: string }>;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  isRequired,
  type,
  ...props
}) => {
  const isInvalid = !!error;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return <Textarea {...(props as TextareaProps)} />;
      case 'select':
        const { options, ...selectProps } = props as SelectFieldProps;
        return (
          <Select {...selectProps}>
            {options.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        );
      default:
        return <Input {...(props as InputProps)} />;
    }
  };

  return (
    <MotionFormControl
      isInvalid={isInvalid}
      isRequired={isRequired}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <FormLabel>{label}</FormLabel>
      {renderInput()}
      {helperText && !isInvalid && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
      <FormErrorMessage>{error}</FormErrorMessage>
    </MotionFormControl>
  );
}; 