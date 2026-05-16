const CHART_COLORS = [
  "rgba(215, 25, 33, 0.8)",
  "rgba(74, 158, 92, 0.8)",
  "rgba(212, 168, 67, 0.8)",
  "rgba(91, 155, 246, 0.8)",
  "rgba(168, 85, 247, 0.8)",
  "rgba(236, 72, 153, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(20, 184, 166, 0.8)",
];

export const getChartColor = (index: number) =>
  CHART_COLORS[index % CHART_COLORS.length];
