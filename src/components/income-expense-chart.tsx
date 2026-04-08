import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CumulativeFinanceChartPoint } from "@/lib/financial-chart";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

export type { CumulativeFinanceChartPoint } from "@/lib/financial-chart";

type ChartSeriesKey = keyof Pick<
  CumulativeFinanceChartPoint,
  "income" | "expense" | "investment" | "balance"
>;

type ChartSeries = {
  key: ChartSeriesKey;
  label: string;
  color: string;
  strokeWidth: number;
};

const CHART_SERIES: ChartSeries[] = [
  { key: "income", label: "Receita", color: "#16a34a", strokeWidth: 2 },
  { key: "expense", label: "Despesa", color: "#dc2626", strokeWidth: 2 },
  { key: "investment", label: "Investimento", color: "#60a5fa", strokeWidth: 2 },
  { key: "balance", label: "Saldo", color: "#1e293b", strokeWidth: 3 },
];

const formatCurrency = (amount: number) =>
  Number(amount || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatCompactCurrency = (amount: number) =>
  Number(amount || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const buildSmoothPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    const controlY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${controlX} ${controlY}`;
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  path += ` Q ${penultimate.x} ${penultimate.y} ${last.x} ${last.y}`;

  return path;
};

const formatAxisLabel = (dateKey: string) => {
  const [, , day] = dateKey.split("-");
  return day ?? dateKey;
};

const formatTooltipLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-");
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export function CumulativeFinanceLineChart({
  data,
  width,
}: {
  data: CumulativeFinanceChartPoint[];
  width: number;
}) {
  const [activeIndex, setActiveIndex] = useState(Math.max(0, data.length - 1));
  const chartHeight = 320;
  const paddingTop = 28;
  const paddingRight = 26;
  const paddingBottom = 52;
  const paddingLeft = 56;
  const plotWidth = Math.max(width - paddingLeft - paddingRight, 180);
  const plotHeight = Math.max(chartHeight - paddingTop - paddingBottom, 160);
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, data.length - 1));
  const activePoint = data[safeActiveIndex];

  const values = data.flatMap((item) => [item.income, item.expense, item.investment, item.balance]);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const span = maxValue - minValue || 1;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const getX = (index: number) => paddingLeft + stepX * index;
  const getY = (value: number) => paddingTop + ((maxValue - value) / span) * plotHeight;

  const tooltipWidth = 188;
  const tooltipHeight = 104;
  const activeX = getX(safeActiveIndex);
  const tooltipX = Math.min(
    Math.max(activeX - tooltipWidth / 2, paddingLeft),
    paddingLeft + plotWidth - tooltipWidth,
  );
  const tooltipY = paddingTop - 6;
  const interactiveZoneTop = paddingTop;
  const interactiveZoneHeight = plotHeight;
  const interactiveZoneWidth = data.length > 1 ? stepX : plotWidth;

  return (
    <View style={styles.lineChartCard}>
      <View style={[styles.lineChartFrame, { width, height: chartHeight }]}>
        <Svg width={width} height={chartHeight}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + plotHeight * ratio;
            const value = maxValue - span * ratio;
            return (
              <React.Fragment key={`grid-${ratio}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + plotWidth}
                  y2={y}
                  stroke="#dbe5ec"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <SvgText x={paddingLeft - 8} y={y + 4} fontSize="11" fill="#718198" textAnchor="end">
                  {formatCompactCurrency(value)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {data.map((point, index) => (
            <SvgText
              key={`x-label-${point.date}-${index}`}
              x={getX(index)}
              y={chartHeight - 14}
              fontSize="11"
              fill="#718198"
              textAnchor="middle"
            >
              {formatAxisLabel(point.date)}
            </SvgText>
          ))}

          {CHART_SERIES.map((series) => {
            const points = data.map((point, index) => ({
              x: getX(index),
              y: getY(point[series.key]),
            }));

            return (
              <React.Fragment key={series.key}>
                <Path
                  d={buildSmoothPath(points)}
                  fill="none"
                  stroke={series.color}
                  strokeWidth={series.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((point, index) => (
                  <Circle
                    key={`${series.key}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={series.key === "balance" ? "4.5" : "3.5"}
                    fill={series.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                ))}
              </React.Fragment>
            );
          })}

          {activePoint ? (
            <>
              <Line
                x1={activeX}
                y1={paddingTop}
                x2={activeX}
                y2={paddingTop + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <Rect
                x={tooltipX}
                y={tooltipY}
                rx={14}
                ry={14}
                width={tooltipWidth}
                height={tooltipHeight}
                fill="#0f172a"
                fillOpacity="0.94"
              />
              <SvgText x={tooltipX + 14} y={tooltipY + 22} fontSize="12" fill="#f8fafc" fontWeight="700">
                {formatTooltipLabel(activePoint.date)}
              </SvgText>
              <SvgText x={tooltipX + 14} y={tooltipY + 42} fontSize="11" fill="#86efac">
                {`Receita: ${formatCurrency(activePoint.income)}`}
              </SvgText>
              <SvgText x={tooltipX + 14} y={tooltipY + 58} fontSize="11" fill="#fca5a5">
                {`Despesa: ${formatCurrency(activePoint.expense)}`}
              </SvgText>
              <SvgText x={tooltipX + 14} y={tooltipY + 74} fontSize="11" fill="#93c5fd">
                {`Investimento: ${formatCurrency(activePoint.investment)}`}
              </SvgText>
              <SvgText x={tooltipX + 14} y={tooltipY + 90} fontSize="11" fill="#cbd5e1">
                {`Saldo: ${formatCurrency(activePoint.balance)}`}
              </SvgText>
            </>
          ) : null}
        </Svg>

        <View style={styles.lineChartOverlay} pointerEvents="box-none">
          {data.map((point, index) => {
            const left = index === 0 ? paddingLeft : getX(index) - interactiveZoneWidth / 2;

            return (
              <Pressable
                key={`hover-zone-${point.date}-${index}`}
                onHoverIn={() => setActiveIndex(index)}
                onPressIn={() => setActiveIndex(index)}
                style={[
                  styles.lineChartHoverZone,
                  {
                    left,
                    top: interactiveZoneTop,
                    width: interactiveZoneWidth,
                    height: interactiveZoneHeight,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.lineLegend}>
        {CHART_SERIES.map((series) => (
          <View key={series.key} style={styles.lineLegendItem}>
            <View style={[styles.lineLegendDot, { backgroundColor: series.color }]} />
            <Text style={styles.lineLegendText}>{series.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.lineChartHint}>
        Passe o mouse na linha no web ou toque no grafico no mobile para ver os valores do dia.
      </Text>
    </View>
  );
}

export function IncomeExpenseChart({
  data,
  description,
  footer,
}: {
  data?: CumulativeFinanceChartPoint[];
  description?: string;
  footer?: React.ReactNode;
}) {
  const chartData = data ?? [];
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const chartWidth = Math.max(320, Math.min(width - (isLargeScreen ? 180 : 72), 760));
  const latestPoint = chartData[chartData.length - 1] ?? null;

  return (
    <Card style={styles.card} maxWidth={isLargeScreen ? 820 : 0}>
      <CardHeader>
        <CardTitle>Evolucao financeira acumulada</CardTitle>
        <CardDescription>
          {description || "Receita, despesa, investimento e saldo acumulados por dia."}
        </CardDescription>
      </CardHeader>

      <CardContent style={styles.cardContent}>
        {chartData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Sem movimentacoes no periodo selecionado.</Text>
          </View>
        ) : (
          <>
            <CumulativeFinanceLineChart data={chartData} width={chartWidth} />

            {latestPoint ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Receita</Text>
                  <Text style={[styles.summaryValue, { color: "#16a34a" }]}>
                    {formatCurrency(latestPoint.income)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Despesa</Text>
                  <Text style={[styles.summaryValue, { color: "#dc2626" }]}>
                    {formatCurrency(latestPoint.expense)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Investimento</Text>
                  <Text style={[styles.summaryValue, { color: "#60a5fa" }]}>
                    {formatCurrency(latestPoint.investment)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Saldo</Text>
                  <Text style={[styles.summaryValue, { color: "#1e293b" }]}>
                    {formatCurrency(latestPoint.balance)}
                  </Text>
                </View>
              </View>
            ) : null}

            {footer ? <View style={styles.footerSlot}>{footer}</View> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 430,
  },
  cardContent: {
    gap: 14,
  },
  emptyState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748b",
  },
  lineChartCard: {
    gap: 14,
  },
  lineChartFrame: {
    alignSelf: "center",
  },
  lineChartOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  lineChartHoverZone: {
    position: "absolute",
  },
  lineLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
  },
  lineLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lineLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  lineLegendText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  lineChartHint: {
    fontSize: 12,
    color: "#718198",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718198",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "800",
  },
  footerSlot: {
    marginTop: 4,
  },
});
