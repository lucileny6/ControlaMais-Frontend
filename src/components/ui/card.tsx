import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewProps, ViewStyle } from "react-native";

interface CardProps extends ViewProps {
    children: React.ReactNode;
    style?: ViewStyle;
    maxWidth?: number;
}

interface TextProps {
    children: React.ReactNode;
    style?: TextStyle;
}

function Card({ children, style, maxWidth = 500, ...props }: CardProps) {
    return (
        <View
            style={[
                styles.card,
                maxWidth ? { maxWidth } : undefined,
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

function CardHeader({ children, style, ...props }: CardProps) {
    return (
        <View
            style={[
                styles.cardHeader,
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

function CardTitle({ children, style, ...props }: TextProps) {
    return (
        <Text
            style={[
                styles.cardTitle,
                style
            ]}
            {...props}
        >
            {children}
        </Text>
    );
}

function CardDescription({ children, style, ...props }: TextProps) {
    return (
        <Text
            style={[
                styles.cardDescription,
                style
            ]}
            {...props}
        >
            {children}
        </Text>
    );
}

function CardContent({ children, style, ...props }: CardProps) {
    return (
        <View
            style={[
                styles.cardContent,
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 1,
        justifyContent: 'center',
    },
    cardHeader: {
        flexDirection: 'column',
        gap: 6,
        marginBottom: 16
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        justifyContent: 'center'
    },
    cardDescription: {
        fontSize: 14,
        color: '#6b7280',
    },
    cardContent: {
        gap: 16
    },
});

export { Card, CardContent, CardDescription, CardHeader, CardTitle };

