import React, { createContext, useContext } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart
} from 'react-native-chart-kit';

// Tipos
export type ChartConfig = {
  [k in string]: {
    label?: string;
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = createContext<ChartContextProps | null>(null);

function useChart() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

// Container Principal
function ChartContainer({
  children,
  config,
  style,
  title,
  ...props
}: React.ComponentProps<typeof View> & {
  config: ChartConfig;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <View style={[styles.container, style]} {...props}>
        {title && <Text style={styles.title}>{title}</Text>}
        {children}
      </View>
    </ChartContext.Provider>
  );
}

// Componente de Gráfico de Linha
function LineChartComponent({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  style,
  ...props
}: any) {
  const { config } = useChart();

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
    ...props.chartConfig,
  };

  return (
    <LineChart
      data={data}
      width={width}
      height={height}
      chartConfig={chartConfig}
      style={[styles.chart, style]}
      {...props}
    />
  );
}

// Componente de Gráfico de Barras
function BarChartComponent({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  style,
  ...props
}: any) {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    ...props.chartConfig,
  };

  return (
    <BarChart
      data={data}
      width={width}
      height={height}
      chartConfig={chartConfig}
      style={[styles.chart, style]}
      {...props}
    />
  );
}

// Componente de Gráfico de Pizza
function PieChartComponent({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  style,
  ...props
}: any) {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    ...props.chartConfig,
  };

  return (
    <PieChart
      data={data}
      width={width}
      height={height}
      chartConfig={chartConfig}
      accessor="population"
      backgroundColor="transparent"
      paddingLeft="15"
      style={[styles.chart, style]}
      {...props}
    />
  );
}

// Componente de Gráfico de Progresso
function ProgressChartComponent({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  style,
  ...props
}: any) {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    ...props.chartConfig,
  };

  return (
    <ProgressChart
      data={data}
      width={width}
      height={height}
      chartConfig={chartConfig}
      style={[styles.chart, style]}
      {...props}
    />
  );
}

// Componente de Legenda
function ChartLegend({
  data,
  style,
}: {
  data: Array<{ name: string; color: string; legendFontColor?: string; legendFontSize?: number }>;
  style?: any;
}) {
  return (
    <View style={[styles.legendContainer, style]}>
      {data.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View 
            style={[
              styles.legendColor, 
              { backgroundColor: item.color }
            ]} 
          />
          <Text style={[
            styles.legendText,
            { color: item.legendFontColor || '#000', fontSize: item.legendFontSize || 12 }
          ]}>
            {item.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Componente de Tooltip Customizado (simplificado)
function ChartTooltip({
  visible,
  position,
  value,
  label,
  style,
}: {
  visible: boolean;
  position: { x: number; y: number };
  value?: string;
  label?: string;
  style?: any;
}) {
  if (!visible) return null;

  return (
    <View style={[styles.tooltip, { top: position.y, left: position.x }, style]}>
      {label && <Text style={styles.tooltipLabel}>{label}</Text>}
      {value && <Text style={styles.tooltipValue}>{value}</Text>}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#000',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 6,
    zIndex: 1000,
  },
  tooltipLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tooltipValue: {
    color: '#fff',
    fontSize: 12,
  },
});

// Exportações
export {
  BarChartComponent as BarChart, ChartContainer, ChartLegend,
  ChartTooltip, LineChartComponent as LineChart, PieChartComponent as PieChart,
  ProgressChartComponent as ProgressChart, useChart
};
