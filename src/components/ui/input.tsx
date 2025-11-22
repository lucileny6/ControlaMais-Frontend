import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {}

export function Input({ style, ...props }: InputProps) {
    return (
        <TextInput
            style={[styles.input, style]}
            placeholderTextColor="#9ca3af"
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#999',
        fontSize: 16,
    },
});

