import React, { createContext, useContext, useId } from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldValues,
  type Path
} from 'react-hook-form';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Tipos
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> = {
  name: TName;
};

type FormItemContextValue = {
  id: string;
};

// Contextos
const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);
const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

// Hook para usar campos do formulário
function useFormField() {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

// Componente Form principal
const Form = FormProvider;

// Componente FormField
function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

// Componente FormItem
function FormItem({ 
  children, 
  style,
  ...props 
}: { 
  children: React.ReactNode;
  style?: any;
}) {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View style={[styles.formItem, style]} {...props}>
        {children}
      </View>
    </FormItemContext.Provider>
  );
}

// Componente FormLabel
function FormLabel({ 
  children, 
  style,
  ...props 
}: { 
  children: React.ReactNode;
  style?: any;
}) {
  const { error, formItemId } = useFormField();

  return (
    <Text
      style={[
        styles.label,
        error && styles.labelError,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Componente FormControl
function FormControl({ 
  children,
  ...props 
}: { 
  children: React.ReactNode;
}) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  // Clone o elemento filho e adicione props adicionais
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        // Adicione qualquer prop necessária para acessibilidade
        ...props,
      } as any);
    }
    return child;
  });
}

// Componente FormDescription
function FormDescription({ 
  children, 
  style,
  ...props 
}: { 
  children: React.ReactNode;
  style?: any;
}) {
  const { formDescriptionId } = useFormField();

  return (
    <Text
      style={[styles.description, style]}
      {...props}
    >
      {children}
    </Text>
  );
}

// Componente FormMessage
function FormMessage({ 
  children, 
  style,
  ...props 
}: { 
  children?: React.ReactNode;
  style?: any;
}) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? '') : children;

  if (!body) {
    return null;
  }

  return (
    <Text
      style={[styles.message, style]}
      {...props}
    >
      {body}
    </Text>
  );
}

// Estilos
const styles = StyleSheet.create({
  formItem: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  labelError: {
    color: '#DC2626',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  message: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 2,
  },
});

// Hook personalizado para uso simplificado de formulários
function useAppForm<TFieldValues extends FieldValues = FieldValues>(
  props?: Parameters<typeof useForm<TFieldValues>>[0]
) {
  const form = useForm<TFieldValues>(props);

  return {
    ...form,
    // Métodos adicionais podem ser adicionados aqui
  };
}

// Input de texto
interface FormInputProps {
  label?: string;
  description?: string;
  placeholder?: string;
  style?: any;
  inputStyle?: any;
}

function FormInput({ 
  label, 
  description, 
  placeholder, 
  style,
  inputStyle,
  ...props 
}: FormInputProps & React.ComponentProps<typeof TextInput>) {
  return (
    <FormItem style={style}>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <TextInput
          style={[
            inputStyle.input,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}

// Botão de submit
interface SubmitButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

function SubmitButton({ 
  children, 
  disabled, 
  style,
  textStyle,
  ...props 
}: SubmitButtonProps & React.ComponentProps<typeof TouchableOpacity>) {
  const { formState } = useFormContext();
  const isSubmitting = formState.isSubmitting;

  return (
    <TouchableOpacity
      style={[
        inputStyles.submitButton,
        (disabled || isSubmitting) && inputStyles.submitButtonDisabled,
        style,
      ]}
      disabled={disabled || isSubmitting}
      {...props}
    >
      <Text style={[inputStyles.submitButtonText, textStyle]}>
        {isSubmitting ? 'Enviando...' : children}
      </Text>
    </TouchableOpacity>
  );
}

// Estilos para componentes de input
const inputStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Combinar estilos
Object.assign(styles, inputStyles);

// Exportações
export {
  Form, FormControl,
  FormDescription, FormField, FormInput, FormItem,
  FormLabel, FormMessage, SubmitButton, useAppForm, useFormField
};

