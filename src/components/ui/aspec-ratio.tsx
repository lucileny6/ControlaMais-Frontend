// components/ui/aspect-ratio.tsx
import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

interface AspectRatioProps extends ViewProps {
    ratio?: number;
    children: React.ReactNode;
}

function AspectRatio({ ratio = 16 / 9, children, style, ...props }: AspectRatioProps) {
    return (
        <View 
        style={[
            styles.container,
            { aspectRatio: ratio },
            style
        ]} 
        {...props}
        >
        {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
});

export { AspectRatio };

