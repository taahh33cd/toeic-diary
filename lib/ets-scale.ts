/**
 * ETS TOEIC Scaled Score Conversion Tables
 * Index = số câu đúng (0-100), Value = điểm quy đổi (5-495)
 * Based on standard published ETS TOEIC score conversion charts.
 */

// Listening: P1(6) + P2(25) + P3(39) + P4(30) = 100 câu
const LS: number[] = [
  5,  5,  5,  5,  5,  10, 10, 10, 15, 15, 20,   // 0-10
  20, 20, 25, 25, 30, 35, 35, 40, 40, 45,        // 11-20
  50, 50, 55, 55, 60, 65, 65, 70, 70, 75,        // 21-30
  80, 80, 85, 85, 90, 95,100,100,105,110,        // 31-40
 115,120,125,130,135,140,145,150,155,160,        // 41-50
 170,175,180,185,190,195,200,205,210,215,        // 51-60
 225,230,235,240,245,250,255,260,265,270,        // 61-70
 280,285,290,295,305,310,320,325,335,340,        // 71-80
 350,355,365,370,380,390,395,405,415,420,        // 81-90
 430,440,445,455,460,470,480,485,490,495,495,    // 91-100 (101 entries)
];

// Reading: P5(30) + P6(16) + P7(54) = 100 câu
const RD: number[] = [
   5,  5,  5,  5,  5,  5, 10, 10, 10, 10, 15,   // 0-10
  15, 15, 20, 20, 25, 25, 30, 30, 35, 35,        // 11-20
  40, 40, 45, 50, 50, 55, 55, 60, 65, 65,        // 21-30
  70, 75, 80, 85, 90, 95,100,105,110,115,        // 31-40
 120,125,130,135,140,150,155,160,165,170,        // 41-50
 175,180,185,190,195,200,205,210,215,220,        // 51-60
 225,230,235,240,250,255,260,265,270,280,        // 61-70
 285,295,300,310,315,325,330,340,345,355,        // 71-80
 365,370,380,390,395,405,415,420,430,440,        // 81-90
 450,455,465,470,480,485,490,490,495,495,495,    // 91-100 (101 entries)
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export interface EtsResult {
  ls: number;   // Listening scaled 5-495
  rd: number;   // Reading scaled 5-495
  total: number; // 10-990
}

/**
 * Tính điểm TOEIC quy đổi từ số câu đúng mỗi part.
 * P1-P4 = Listening, P5-P7 = Reading.
 * Giá trị null/undefined được tính là 0.
 */
export function calcEtsScore(
  p1: number | null | undefined,
  p2: number | null | undefined,
  p3: number | null | undefined,
  p4: number | null | undefined,
  p5: number | null | undefined,
  p6: number | null | undefined,
  p7: number | null | undefined,
): EtsResult {
  const lsRaw = clamp((p1 ?? 0) + (p2 ?? 0) + (p3 ?? 0) + (p4 ?? 0), 0, 100);
  const rdRaw = clamp((p5 ?? 0) + (p6 ?? 0) + (p7 ?? 0), 0, 100);
  const ls = LS[lsRaw] ?? 495;
  const rd = RD[rdRaw] ?? 495;
  return { ls, rd, total: ls + rd };
}
