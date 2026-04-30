import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CumulativeFinanceChartPoint } from "@/lib/financial-chart";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
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
  const isCompactScreen = width < 340;
  const isSmallScreen = width < 420;
  const chartHeight = isCompactScreen ? 248 : isSmallScreen ? 276 : 320;
  const paddingTop = isCompactScreen ? 18 : 28;
  const paddingRight = isCompactScreen ? 14 : 26;
  const paddingBottom = isCompactScreen ? 42 : 52;
  const paddingLeft = isCompactScreen ? 44 : 56;
  const plotWidth = Math.max(width - paddingLeft - paddingRight, 140);
  const plotHeight = Math.max(chartHeight - paddingTop - paddingBottom, isCompactScreen ? 130 : 160);
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, data.length - 1));
  const activePoint = data[safeActiveIndex];

  const values = data.flatMap((item) => [item.income, item.expense, item.investment, item.balance]);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const span = maxValue - minValue || 1;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const getX = (index: number) => paddingLeft + stepX * index;
  const getY = (value: number) => paddingTop + ((maxValue - value) / span) * plotHeight;

  const tooltipWidth = Math.min(isCompactScreen ? 148 : 188, plotWidth);
  const tooltipHeight = isCompactScreen ? 92 : 104;
  const activeX = getX(safeActiveIndex);
  const tooltipX = Math.min(
    Math.max(activeX - tooltipWidth / 2, paddingLeft),
    paddingLeft + plotWidth - tooltipWidth,
  );
  const tooltipY = paddingTop - 6;
  const interactiveZoneTop = paddingTop;
  const interactiveZoneHeight = plotHeight;
  const interactiveZoneWidth = data.length > 1 ? stepX : plotWidth;
  const xAxisLabelStep = isCompactScreen
    ? Math.max(1, Math.ceil(data.length / 4))
    : isSmallScreen
      ? Math.max(1, Math.ceil(data.length / 6))
      : 1;

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
                <SvgText
                  x={paddingLeft - 8}
                  y={y + 4}
                  fontSize={isCompactScreen ? "9" : "11"}
                  fill="#718198"
                  textAnchor="end"
                >
                  {formatCompactCurrency(value)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {data.map((point, index) => {
            const shouldRenderLabel =
              index === 0 ||
              index === data.length - 1 ||
              index % xAxisLabelStep === 0;

            if (!shouldRenderLabel) return null;

            return (
              <SvgText
                key={`x-label-${point.date}-${index}`}
                x={getX(index)}
                y={chartHeight - 14}
                fontSize={isCompactScreen ? "9" : "11"}
                fill="#718198"
                textAnchor="middle"
              >
                {formatAxisLabel(point.date)}
              </SvgText>
            );
          })}

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
                    r={series.key === "balance" ? (isCompactScreen ? "3.5" : "4.5") : isCompactScreen ? "2.8" : "3.5"}
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
                rx={12}
                ry={12}
                width={tooltipWidth}
                height={tooltipHeight}
                fill="#0f172a"
                fillOpacity="0.94"
              />
              <SvgText
                x={tooltipX + 10}
                y={tooltipY + (isCompactScreen ? 18 : 22)}
                fontSize={isCompactScreen ? "10" : "12"}
                fill="#f8fafc"
                fontWeight="700"
              >
                {formatTooltipLabel(activePoint.date)}
              </SvgText>
              <SvgText x={tooltipX + 10} y={tooltipY + (isCompactScreen ? 36 : 42)} fontSize={isCompactScreen ? "9" : "11"} fill="#86efac">
                {`Receita: ${formatCurrency(activePoint.income)}`}
              </SvgText>
              <SvgText x={tooltipX + 10} y={tooltipY + (isCompactScreen ? 50 : 58)} fontSize={isCompactScreen ? "9" : "11"} fill="#fca5a5">
                {`Despesa: ${formatCurrency(activePoint.expense)}`}
              </SvgText>
              <SvgText x={tooltipX + 10} y={tooltipY + (isCompactScreen ? 64 : 74)} fontSize={isCompactScreen ? "9" : "11"} fill="#93c5fd">
                {`Investimento: ${formatCurrency(activePoint.investment)}`}
              </SvgText>
              <SvgText x={tooltipX + 10} y={tooltipY + (isCompactScreen ? 78 : 90)} fontSize={isCompactScreen ? "9" : "11"} fill="#cbd5e1">
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

export function MobileCumulativeFinanceLineChart({
  data,
  viewportWidth,
}: {
  data: CumulativeFinanceChartPoint[];
  viewportWidth: number;
}) {
  const [activeIndex, setActiveIndex] = useState(Math.max(0, data.length - 1));
  const chartHeight = 220;
  const paddingTop = 18;
  const paddingRight = 18;
  const paddingBottom = 38;
  const paddingLeft = 44;
  const columnWidth = data.length > 7 ? 34 : 42;
  const svgWidth = Math.max(
    viewportWidth - 24,
    paddingLeft + paddingRight + Math.max(1, data.length - 1) * columnWidth,
  );
  const plotWidth = Math.max(svgWidth - paddingLeft - paddingRight, 180);
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, data.length - 1));
  const activePoint = data[safeActiveIndex];

  const values = data.flatMap((item) => [item.income, item.expense, item.investment, item.balance]);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const span = maxValue - minValue || 1;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const getX = (index: number) => paddingLeft + stepX * index;
  const getY = (value: number) => paddingTop + ((maxValue - value) / span) * plotHeight;
  const interactiveZoneWidth = data.length > 1 ? Math.max(stepX, 28) : plotWidth;
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <View style={styles.mobileChartSection}>
      <View style={styles.mobileChartViewport}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mobileChartScrollContent}
        >
          <View style={[styles.mobileChartFrame, { width: svgWidth, height: chartHeight }]}>
            <Svg width={svgWidth} height={chartHeight}>
              {[0, 0.33, 0.66, 1].map((ratio) => {
                const y = paddingTop + plotHeight * ratio;
                const value = maxValue - span * ratio;

                return (
                  <React.Fragment key={`mobile-grid-${ratio}`}>
                    <Line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + plotWidth}
                      y2={y}
                      stroke="#dbe5ec"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <SvgText x={paddingLeft - 8} y={y + 4} fontSize="9" fill="#718198" textAnchor="end">
                      {formatCompactCurrency(value)}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {data.map((point, index) => {
                const shouldRenderLabel =
                  index === 0 || index === data.length - 1 || index % labelStep === 0;

                if (!shouldRenderLabel) return null;

                return (
                  <SvgText
                    key={`mobile-x-${point.date}-${index}`}
                    x={getX(index)}
                    y={chartHeight - 12}
                    fontSize="9"
                    fill="#718198"
                    textAnchor="middle"
                  >
                    {formatAxisLabel(point.date)}
                  </SvgText>
                );
              })}

              {CHART_SERIES.map((series) => {
                const points = data.map((point, index) => ({
                  x: getX(index),
                  y: getY(point[series.key]),
                }));

                return (
                  <React.Fragment key={`mobile-${series.key}`}>
                    <Path
                      d={buildSmoothPath(points)}
                      fill="none"
                      stroke={series.color}
                      strokeWidth={series.key === "balance" ? 2.5 : 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((point, index) => (
                      <Circle
                        key={`mobile-point-${series.key}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={series.key === "balance" ? "3.5" : "3"}
                        fill={series.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    ))}
                  </React.Fragment>
                );
              })}

              {activePoint ? (
                <Line
                  x1={getX(safeActiveIndex)}
                  y1={paddingTop}
                  x2={getX(safeActiveIndex)}
                  y2={paddingTop + plotHeight}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ) : null}
            </Svg>

            <View style={styles.lineChartOverlay} pointerEvents="box-none">
              {data.map((point, index) => {
                const left = index === 0 ? paddingLeft : getX(index) - interactiveZoneWidth / 2;

                return (
                  <Pressable
                    key={`mobile-hover-zone-${point.date}-${index}`}
                    onPressIn={() => setActiveIndex(index)}
                    style={[
                      styles.lineChartHoverZone,
                      {
                        left,
                        top: paddingTop,
                        width: interactiveZoneWidth,
                        height: plotHeight,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.mobileLegend}>
        {CHART_SERIES.map((series) => (
          <View key={`mobile-legend-${series.key}`} style={styles.mobileLegendItem}>
            <View style={[styles.lineLegendDot, { backgroundColor: series.color }]} />
            <Text style={styles.mobileLegendText}>{series.label}</Text>
          </View>
        ))}
      </View>

      {activePoint ? (
        <View style={styles.mobileDetailsCard}>
          <Text style={styles.mobileDetailsDate}>{formatTooltipLabel(activePoint.date)}</Text>
          <Text style={[styles.mobileDetailsValue, { color: "#16a34a" }]}>
            Receita: {formatCurrency(activePoint.income)}
          </Text>
          <Text style={[styles.mobileDetailsValue, { color: "#dc2626" }]}>
            Despesa: {formatCurrency(activePoint.expense)}
          </Text>
          <Text style={[styles.mobileDetailsValue, { color: "#60a5fa" }]}>
            Investimento: {formatCurrency(activePoint.investment)}
          </Text>
          <Text style={[styles.mobileDetailsValue, { color: "#1e293b" }]}>
            Saldo: {formatCurrency(activePoint.balance)}
          </Text>
        </View>
      ) : null}
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
  const isCompactScreen = width < 430;
  const chartWidth = Math.max(220, Math.min(width - (isLargeScreen ? 180 : isCompactScreen ? 52 : 72), 760));
  const latestPoint = chartData[chartData.length - 1] ?? null;

  return (
    <Card
      style={[
        styles.card,
        isLargeScreen ? styles.cardDesktop : styles.cardMobile,
        isCompactScreen && styles.cardCompact,
      ]}
      maxWidth={isLargeScreen ? 820 : 0}
    >
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
            {isLargeScreen ? (
              <CumulativeFinanceLineChart data={chartData} width={chartWidth} />
            ) : (
              <MobileCumulativeFinanceLineChart data={chartData} viewportWidth={chartWidth} />
            )}

            {latestPoint ? (
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, isCompactScreen && styles.summaryCardCompact]}>
                  <Text style={styles.summaryLabel}>Receita</Text>
                  <Text style={[styles.summaryValue, isCompactScreen && styles.summaryValueCompact, { color: "#16a34a" }]}>
                    {formatCurrency(latestPoint.income)}
                  </Text>
                </View>
                <View style={[styles.summaryCard, isCompactScreen && styles.summaryCardCompact]}>
                  <Text style={styles.summaryLabel}>Despesa</Text>
                  <Text style={[styles.summaryValue, isCompactScreen && styles.summaryValueCompact, { color: "#dc2626" }]}>
                    {formatCurrency(latestPoint.expense)}
                  </Text>
                </View>
                <View style={[styles.summaryCard, isCompactScreen && styles.summaryCardCompact]}>
                  <Text style={styles.summaryLabel}>Investimento</Text>
                  <Text style={[styles.summaryValue, isCompactScreen && styles.summaryValueCompact, { color: "#60a5fa" }]}>
                    {formatCurrency(latestPoint.investment)}
                  </Text>
                </View>
                <View style={[styles.summaryCard, isCompactScreen && styles.summaryCardCompact]}>
                  <Text style={styles.summaryLabel}>Saldo</Text>
                  <Text style={[styles.summaryValue, isCompactScreen && styles.summaryValueCompact, { color: "#1e293b" }]}>
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
    minHeight: 0,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  cardDesktop: {
    flex: 1,
    minHeight: 430,
  },
  cardMobile: {
    width: "100%",
    alignSelf: "stretch",
    flexGrow: 0,
    flexShrink: 1,
  },
  cardCompact: {
    minHeight: 0,
    paddingHorizontal: 16,
    paddingVertical: 18,
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
    overflow: "hidden",
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
  mobileChartSection: {
    gap: 12,
  },
  mobileChartViewport: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    backgroundColor: "#fbfdff",
    overflow: "hidden",
  },
  mobileChartScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  mobileChartFrame: {
    position: "relative",
  },
  mobileLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  mobileLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mobileLegendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  mobileDetailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  mobileDetailsDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10233f",
    marginBottom: 4,
  },
  mobileDetailsValue: {
    fontSize: 12,
    fontWeight: "700",
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
  summaryCardCompact: {
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  summaryValueCompact: {
    fontSize: 16,
  },
  footerSlot: {
    marginTop: 4,
  },
});
