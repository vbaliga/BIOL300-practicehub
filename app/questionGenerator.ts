// BIOL 300 Hypothesis Test Question Generator
// Whitlock & Schluter "The Analysis of Biological Data" 3rd ed.
import {
  getTwoTailedPRange,
  getChiSquarePRange,
  getFPRange,
  getFCritical,
  lookupTCritical,
  lookupChiCritical,
  round,
  fmt,
} from "./statisticalTables";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type TestCategory = "calculable" | "identify-only";

export type TestType =
  | "binomial"
  | "chi-square-gof"
  | "chi-square-contingency"
  | "poisson-gof"
  | "one-sample-t"
  | "two-sample-t"
  | "welch-t"
  | "paired-t"
  | "anova"
  | "correlation"
  | "regression"
  | "ci-mean"
  | "ci-slope"
  | "mann-whitney"
  | "wilcoxon"
  | "kruskal-wallis"
  | "spearman"
  | "fishers-exact"
  | "ancova"
  | "multifactor-anova"
  | "sign-test"; // kept in type for compatibility but not used

export interface GeneratedQuestion {
  id: string;
  testType: TestType;
  category: TestCategory;
  chapter: number;
  questionText: string;
  answerBlocks: AnswerBlock[];
}

export type AnswerBlock =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | { kind: "formula"; label: string; formula: string; result: string }
  | { kind: "pvalue"; range: string }
  | { kind: "conclusion"; text: string }
  | { kind: "list"; items: string[] };

// ─── CHAPTER MAPPING ──────────────────────────────────────────────────────────
// Which minimum chapter unlocks each test type

export const TEST_CHAPTER: Record<TestType, number> = {
  "ci-mean":                  4,   // Ch 4: Estimating with uncertainty
  "binomial":                 7,   // Ch 7: Analyzing proportions
  "chi-square-gof":           8,   // Ch 8: Fitting probability models
  "poisson-gof":              8,
  "chi-square-contingency":   9,   // Ch 9: Contingency analysis
  "fishers-exact":            9,
  "one-sample-t":            11,   // Ch 11: One-sample t-test
  "two-sample-t":            12,   // Ch 12: Comparing two means
  "welch-t":                 12,
  "paired-t":                12,
  "mann-whitney":            13,   // Ch 13: Handling violations
  "wilcoxon":                99,   // not covered in BIOL 300
  "ancova":                  18,   // Ch 18: ANCOVA (identify-only)
  "multifactor-anova":       18,   // Ch 18: Multifactor ANOVA (identify-only)
  "sign-test":               99,   // not covered in BIOL 300
  "kruskal-wallis":          15,   // Ch 15 (non-param alt)
  "anova":                   15,   // Ch 15: Comparing means of 3+ groups
  "correlation":             16,   // Ch 16: Correlation
  "spearman":                16,
  "regression":              17,   // Ch 17: Regression
  "ci-slope":                17,
};

export const TEST_LABELS: Record<TestType, string> = {
  "binomial":               "Binomial Test",
  "chi-square-gof":         "Chi-Square Goodness-of-Fit Test",
  "chi-square-contingency": "Chi-Square Contingency Test",
  "poisson-gof":            "Poisson Goodness-of-Fit Test",
  "one-sample-t":           "One-Sample t-Test",
  "two-sample-t":           "Two-Sample t-Test (Pooled Variance)",
  "welch-t":                "Welch's Two-Sample t-Test",
  "paired-t":               "Paired t-Test",
  "anova":                  "One-Way ANOVA",
  "correlation":            "Pearson Correlation Coefficient",
  "regression":             "Linear Regression (Slope t-Test)",
  "ci-mean":                "95% Confidence Interval for Mean",
  "ci-slope":               "95% Confidence Interval for Slope",
  "mann-whitney":           "Mann-Whitney U Test",
  "wilcoxon":               "Wilcoxon Signed-Rank Test",
  "kruskal-wallis":         "Kruskal-Wallis Test",
  "spearman":               "Spearman Rank Correlation",
  "fishers-exact":          "Fisher's Exact Test",
  "ancova":                 "ANCOVA (Analysis of Covariance)",
  "multifactor-anova":     "Multifactor ANOVA",
  "sign-test":             "Sign Test",
};

// ─── SEEDED RNG ───────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randBetween(rng: () => number, lo: number, hi: number) {
  return lo + rng() * (hi - lo);
}
function randInt(rng: () => number, lo: number, hi: number) {
  return Math.floor(randBetween(rng, lo, hi + 1));
}
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── MATH HELPERS ─────────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}
function sampleVar(arr: number[]): number {
  const m = mean(arr);
  return arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
}
function sampleSd(arr: number[]): number {
  return Math.sqrt(sampleVar(arr));
}
// Approximately N(0,1) via sum of 12 uniforms (Irwin-Hall). Better bell shape than a single uniform.
function normalApprox(rng: () => number): number {
  let s = 0;
  for (let i = 0; i < 12; i++) s += rng();
  return s - 6; // mean=0, variance=1
}

// Binomial P-value: exact two-tailed using cumulative binomial
// We use the table-lookup approach: report P-range from chi-square approximation
// for large n, or exact for small n (we'll report via normal approx + Z-table)
// For BIOL 300 purposes we use the chi-square approximation via chi^2 = z^2

// Summation of binomial probabilities (exact)
function binomialPMF(k: number, n: number, p: number): number {
  // log scale for numerical stability
  let logP = 0;
  for (let i = 0; i < k; i++) logP += Math.log(n - i) - Math.log(i + 1);
  logP += k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logP);
}

function binomialExactPValue(k: number, n: number, p: number): number {
  // Two-tailed: sum probabilities ≤ P(X=k)
  const observed = binomialPMF(k, n, p);
  let pval = 0;
  for (let i = 0; i <= n; i++) {
    const prob = binomialPMF(i, n, p);
    if (prob <= observed + 1e-10) pval += prob;
  }
  return Math.min(pval, 1.0);
}

function binomialPRange(pval: number): string {
  if (pval < 0.001) return "P < 0.001";
  if (pval < 0.01)  return "0.001 < P < 0.01";
  if (pval < 0.05)  return "0.01 < P < 0.05";
  if (pval < 0.10)  return "0.05 < P < 0.10";
  if (pval < 0.20)  return "0.10 < P < 0.20";
  return "P > 0.20";
}

// ─── QUESTION GENERATORS ─────────────────────────────────────────────────────

function generateBinomial(rng: () => number): GeneratedQuestion {
  const scenarios = [
    {
      context: "Sea otters (*Enhydra lutris*) show lateral preferences when handling prey. A researcher observed {n} otters and found {k} preferred using their right forepaw.",
      null0: "p = 0.5 (otters show no forepaw preference)",
      altH: "p ≠ 0.5 (otters show a forepaw preference)",
      trait: "right-forepaw preference",
      unit: "otters",
      p0: 0.5,
    },
    {
      context: "Chimpanzees (*Pan troglodytes*) have been reported to show handedness when using tools. A field researcher recorded which hand {n} wild chimpanzees used to retrieve a piece of bait; {k} consistently used their right hand.",
      null0: "p = 0.5 (chimpanzees show no hand preference)",
      altH: "p ≠ 0.5 (chimpanzees show a hand preference)",
      trait: "right-hand use",
      unit: "chimpanzees",
      p0: 0.5,
    },
    {
      context: "African grey parrots (*Psittacus erithacus*) are known to show footedness when manipulating food. A researcher recorded which foot {n} captive parrots used first to hold a food item; {k} used their right foot.",
      null0: "p = 0.5 (parrots show no foot preference)",
      altH: "p ≠ 0.5 (parrots show a foot preference)",
      trait: "right-foot use",
      unit: "parrots",
      p0: 0.5,
    },
    {
      context: "Wood lice (*Armadillidium vulgare*) are reported to prefer moist environments. In a choice-chamber experiment, {n} individuals were given equal access to wet and dry compartments. After 10 minutes, {k} were found in the dry compartment.",
      null0: "p = 0.5 (wood lice show no moisture preference)",
      altH: "p ≠ 0.5 (wood lice prefer one moisture level)",
      trait: "dry-compartment choice",
      unit: "wood lice",
      p0: 0.5,
    },
    {
      context: "Zebrafish (*Danio rerio*) have been reported to show lateralised swimming behaviour. A researcher placed {n} fish individually at a T-junction; {k} turned right.",
      null0: "p = 0.5 (zebrafish show no turning preference)",
      altH: "p ≠ 0.5 (zebrafish show a turning preference)",
      trait: "right-turn preference",
      unit: "fish",
      p0: 0.5,
    },
    {
      context: "A geneticist crosses two heterozygous plants (Aa × Aa). Among {n} offspring, {k} displayed the dominant phenotype. Under simple Mendelian inheritance, 3/4 of offspring should show the dominant phenotype.",
      null0: "p = 0.75 (Mendelian 3:1 ratio holds)",
      altH: "p ≠ 0.75 (ratio deviates from 3:1)",
      trait: "dominant phenotype",
      unit: "offspring",
      p0: 0.75,
    },
    {
      context: "A geneticist crossed heterozygous *Drosophila melanogaster* (Aa × Aa) and classified {n} progeny by phenotype. {k} progeny showed the dominant phenotype. Under Mendelian inheritance, 3/4 should be dominant.",
      null0: "p = 0.75 (Mendelian 3:1 ratio holds in Drosophila)",
      altH: "p ≠ 0.75 (ratio deviates from 3:1)",
      trait: "dominant phenotype",
      unit: "progeny",
      p0: 0.75,
    },
    {
      context: "In a population of common garter snakes (*Thamnophis sirtalis*), females are expected to constitute 55% of individuals. A field survey captured {n} snakes, of which {k} were female.",
      null0: "p = 0.55 (females are 55% of population)",
      altH: "p ≠ 0.55 (sex ratio differs from expectation)",
      trait: "female sex",
      unit: "snakes",
      p0: 0.55,
    },
    {
      context: "In a study population of green frogs (*Lithobates clamitans*), prior surveys indicate a 1:1 sex ratio among adults. A researcher sampled {n} frogs this season, of which {k} were female.",
      null0: "p = 0.5 (adult sex ratio is 1:1)",
      altH: "p ≠ 0.5 (adult sex ratio deviates from 1:1)",
      trait: "female sex",
      unit: "frogs",
      p0: 0.5,
    },
    {
      context: "A clinical trial tests a new antibiotic. Historical data show 40% of untreated patients recover within 7 days. Among {n} treated patients, {k} recovered within 7 days.",
      null0: "p = 0.40 (recovery rate is unchanged by treatment)",
      altH: "p ≠ 0.40 (treatment alters recovery rate)",
      trait: "recovery within 7 days",
      unit: "patients",
      p0: 0.40,
    },
    {
      context: "Before a new vaccine was introduced, 20% of individuals in a community were seropositive for a respiratory pathogen. Following vaccination of {n} participants, {k} were seropositive at the 3-month follow-up.",
      null0: "p = 0.20 (seropositivity rate matches the pre-vaccine baseline)",
      altH: "p ≠ 0.20 (vaccination changes the seropositivity rate)",
      trait: "seropositivity at 3 months",
      unit: "vaccinated participants",
      p0: 0.20,
    },
    {
      context: "A seed bank study tests germination success. The catalogue states that 70% of seeds germinate under optimal conditions. Of {n} seeds tested, {k} germinated.",
      null0: "p = 0.70 (germination rate matches catalogue)",
      altH: "p ≠ 0.70 (germination rate differs from catalogue)",
      trait: "germination",
      unit: "seeds",
      p0: 0.70,
    },
    {
      context: "Loggerhead sea turtle (*Caretta caretta*) nest success at a reference beach averages 65%. A conservation biologist monitored {n} eggs at a beach subject to artificial lighting, of which {k} hatched successfully.",
      null0: "p = 0.65 (hatching success matches the reference beach)",
      altH: "p ≠ 0.65 (hatching success differs from the reference beach)",
      trait: "successful hatching",
      unit: "eggs",
      p0: 0.65,
    },
  ];

  const sc = pick(rng, scenarios);
  const n = randInt(rng, 18, 60);
  // bias k so half the time we get significant, half not
  const bias = rng() > 0.5 ? 1.5 : 1.0;
  const k = Math.round(sc.p0 * n * (rng() > 0.5 ? bias : 2 - bias));
  const kClamped = Math.max(0, Math.min(n, k));

  const pHat = round(kClamped / n, 3);
  const pval = binomialExactPValue(kClamped, n, sc.p0);
  const pRange = binomialPRange(pval);
  const significant = pval < 0.05;

  const qText = sc.context
    .replace("{n}", String(n))
    .replace("{k}", String(kClamped))
    + ` Is there evidence that the proportion of ${sc.trait} differs from the null expectation? Use α = 0.05.`;

  const critNote = `The exact binomial distribution with n = ${n} and p₀ = ${sc.p0} is used. P-value is exact two-tailed.`;

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "Test: Binomial Test" },
    { kind: "text",    text: `$H_0$: ${sc.null0}` },
    { kind: "text",    text: `$H_a$: ${sc.altH}` },
    { kind: "heading", text: "Calculation" },
    { kind: "formula",
      label: "Sample proportion",
      formula: `$\\hat{p} = k/n = ${kClamped}/${n}$`,
      result: `$\\hat{p} = ${pHat}$` },
    { kind: "text",    text: `Exact two-tailed binomial P-value with $n = ${n}$, $k = ${kClamped}$, $p_0 = ${sc.p0}$:` },
    { kind: "pvalue",  range: pRange },
    { kind: "text",    text: `$\\alpha = 0.05$` },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$. There is sufficient evidence (${pRange}, $\\alpha = 0.05$) that the proportion of ${sc.trait} ($\\hat{p} = ${pHat}$) differs significantly from the null expectation of $p_0 = ${sc.p0}$.`
        : `We fail to reject $H_0$. There is insufficient evidence (${pRange}, $\\alpha = 0.05$) that the proportion of ${sc.trait} ($\\hat{p} = ${pHat}$) differs from the null expectation of $p_0 = ${sc.p0}$.` },
  ];

  return {
    id: `binomial-${Date.now()}`,
    testType: "binomial",
    category: "calculable",
    chapter: 7,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generateChiSquareGOF(rng: () => number): GeneratedQuestion {
  const scenarios = [
    {
      title: "Mendelian dihybrid cross",
      context: "A geneticist performs a dihybrid cross (AaBb × AaBb). Among {N} offspring, the observed phenotype counts were:\n\n| Phenotype | Observed |\n|-----------|----------|\n| A_B_ | {o1} |\n| A_bb | {o2} |\n| aaB_ | {o3} |\n| aabb | {o4} |\n\nUnder a 9:3:3:1 Mendelian ratio, do the data fit the expected frequencies? Use α = 0.05.",
      ratios: [9, 3, 3, 1],
      labels: ["A_B_", "A_bb", "aaB_", "aabb"],
      null0: "The data follow a 9:3:3:1 Mendelian ratio",
      altH: "The data do not follow a 9:3:3:1 Mendelian ratio",
    },
    {
      title: "Dihybrid test cross (1:1:1:1)",
      context: "A researcher performs a dihybrid test cross (AaBb × aabb) in garden peas (*Pisum sativum*). Under independent assortment, four phenotypic classes are expected in equal numbers. Among {N} offspring:\n\n| Phenotype | Observed |\n|-----------|----------|\n| A_B_ | {o1} |\n| A_bb | {o2} |\n| aaB_ | {o3} |\n| aabb | {o4} |\n\nDo the data fit a 1:1:1:1 ratio? Use α = 0.05.",
      ratios: [1, 1, 1, 1],
      labels: ["A_B_", "A_bb", "aaB_", "aabb"],
      null0: "Genes assort independently (1:1:1:1 phenotypic ratio in test cross)",
      altH: "Genes do not assort independently",
    },
    {
      title: "Hardy-Weinberg genotype frequencies",
      context: "A population geneticist samples {N} individuals and observes the following genotype counts:\n\n| Genotype | Observed |\n|----------|----------|\n| AA | {o1} |\n| Aa | {o2} |\n| aa | {o3} |\n\nAllele frequency of A is 0.6. Under Hardy-Weinberg equilibrium (expected proportions 0.36 : 0.48 : 0.16), do the genotype frequencies conform to HWE? Use α = 0.05.",
      ratios: [0.36, 0.48, 0.16],
      labels: ["AA", "Aa", "aa"],
      null0: "Genotype frequencies follow Hardy-Weinberg equilibrium",
      altH: "Genotype frequencies deviate from Hardy-Weinberg equilibrium",
    },
    {
      title: "Habitat use (uniform distribution, 4 patches)",
      context: "An ecologist counts the number of {N} deer observed in four habitat patches during a survey, expecting equal use across patches:\n\n| Patch | Observed |\n|-------|----------|\n| Forest | {o1} |\n| Grassland | {o2} |\n| Wetland | {o3} |\n| Scrub | {o4} |\n\nIs there evidence of non-uniform habitat use? Use α = 0.05.",
      ratios: [1, 1, 1, 1],
      labels: ["Forest", "Grassland", "Wetland", "Scrub"],
      null0: "Deer use all four habitats equally (p = 0.25 each)",
      altH: "Deer do not use all habitats equally",
    },
    {
      title: "Microhabitat use in insects",
      context: "An entomologist recorded the positions of {N} grasshoppers (*Chorthippus parallelus*) across four microhabitat types in a meadow, expecting equal use of each:\n\n| Microhabitat | Observed |\n|--------------|----------|\n| Bare soil | {o1} |\n| Short grass | {o2} |\n| Tall grass | {o3} |\n| Shrub margin | {o4} |\n\nIs there evidence of non-uniform microhabitat use? Use α = 0.05.",
      ratios: [1, 1, 1, 1],
      labels: ["Bare soil", "Short grass", "Tall grass", "Shrub margin"],
      null0: "Grasshoppers use all four microhabitat types equally (p = 0.25 each)",
      altH: "Grasshoppers do not use all microhabitat types equally",
    },
    {
      title: "Flower colour (simple Mendelian)",
      context: "A garden pea cross (Pp × Pp) produces {N} plants. The observed numbers of purple- and white-flowered plants are:\n\n| Phenotype | Observed |\n|-----------|----------|\n| Purple | {o1} |\n| White | {o2} |\n\nUnder a 3:1 ratio, test whether the data fit the expected Mendelian frequencies. Use α = 0.05.",
      ratios: [3, 1],
      labels: ["Purple", "White"],
      null0: "Flower colours follow a 3:1 Mendelian ratio",
      altH: "Flower colours do not follow a 3:1 ratio",
    },
    {
      title: "Coat colour in dogs (Mendelian 3:1)",
      context: "A breeder crosses two heterozygous Labrador retrievers (Bb × Bb), expecting a 3:1 ratio of black (B_) to chocolate (bb) coat colour. Among {N} puppies:\n\n| Phenotype | Observed |\n|-----------|----------|\n| Black (B_) | {o1} |\n| Chocolate (bb) | {o2} |\n\nDo the data fit the expected 3:1 Mendelian ratio? Use α = 0.05.",
      ratios: [3, 1],
      labels: ["Black (B_)", "Chocolate (bb)"],
      null0: "Coat colour follows a 3:1 Mendelian ratio",
      altH: "Coat colour deviates from a 3:1 Mendelian ratio",
    },
    {
      title: "Offspring sex ratio",
      context: "At a constant incubation temperature where a 1:1 sex ratio is expected, a herpetologist sexed {N} hatchling leopard geckos (*Eublepharis macularius*):\n\n| Sex | Observed |\n|-----|----------|\n| Female | {o1} |\n| Male | {o2} |\n\nTest whether the sex ratio differs from 1:1. Use α = 0.05.",
      ratios: [1, 1],
      labels: ["Female", "Male"],
      null0: "Sex ratio is 1:1 at this incubation temperature",
      altH: "Sex ratio deviates from 1:1",
    },
    {
      title: "Shell banding in grove snails",
      context: "A malacologist recorded shell banding patterns in {N} grove snails (*Cepaea nemoralis*) from a hedgerow. Based on historical surveys, expected proportions are: Unbanded = 40%, Mid-banded = 35%, Multi-banded = 25%:\n\n| Banding | Observed |\n|---------|----------|\n| Unbanded | {o1} |\n| Mid-banded | {o2} |\n| Multi-banded | {o3} |\n\nDo current banding frequencies match historical proportions? Use α = 0.05.",
      ratios: [0.40, 0.35, 0.25],
      labels: ["Unbanded", "Mid-banded", "Multi-banded"],
      null0: "Shell banding follows historical proportions (40:35:25)",
      altH: "Shell banding deviates from historical proportions",
    },
  ];

  const sc = pick(rng, scenarios);
  const k = sc.ratios.length;
  const totalRatio = sc.ratios.reduce((a, b) => a + b, 0);
  const minRatio = Math.min(...sc.ratios);
  const minN = Math.max(80, Math.ceil(5 * totalRatio / minRatio));
  const N = randInt(rng, minN, Math.max(minN + 120, 220));

  // Generate observed counts with some noise
  const expected = sc.ratios.map(r => N * r / totalRatio);
  let observed = expected.map(e => Math.max(1, Math.round(e + (rng() - 0.5) * e * 0.5)));
  // Force sum = N
  const diff = N - observed.reduce((a, b) => a + b, 0);
  observed[0] += diff;

  const chiSq = observed.reduce((sum, o, i) => sum + (o - expected[i]) ** 2 / expected[i], 0);
  const df = k - 1;
  const pRange = getChiSquarePRange(chiSq, df);
  const chi005 = lookupChiCritical(df, 0.05);
  const significant = chiSq > chi005;

  // Build table rows text
  const tableRows = sc.labels.map((lab, i) =>
    `| ${lab} | ${observed[i]} | ${fmt(expected[i], 2)} | ${fmt((observed[i] - expected[i]) ** 2 / expected[i], 3)} |`
  );

  const qText = sc.context
    .replace("{N}", String(N))
    .replace("{o1}", String(observed[0]))
    .replace("{o2}", String(observed[1]))
    .replace("{o3}", String(observed[2] ?? ""))
    .replace("{o4}", String(observed[3] ?? ""));

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: `Test: Chi-Square Goodness-of-Fit` },
    { kind: "text",    text: `$H_0$: ${sc.null0}` },
    { kind: "text",    text: `$H_a$: ${sc.altH}` },
    { kind: "heading", text: "Calculation" },
    { kind: "text",    text: `| Category | Observed (O) | Expected (E) | (O−E)²/E |\n|----------|--------------|--------------|----------|\n${tableRows.join("\n")}` },
    { kind: "formula",
      label: "Chi-square statistic",
      formula: `$\\chi^2 = \\sum\\frac{(O - E)^2}{E}$`,
      result: `$\\chi^2 = ${fmt(chiSq, 3)}$` },
    { kind: "text",    text: `$df = k - 1 = ${k} - 1 = ${df}$` },
    { kind: "text",    text: `Critical value: $\\chi^2_{0.05,\\,${df}} = ${fmt(chi005, 3)}$` },
    { kind: "text",    text: `$\\alpha = 0.05$` },
    { kind: "pvalue",  range: pRange },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($\\chi^2 = ${fmt(chiSq, 3)}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). The observed frequencies differ significantly from the expected distribution.`
        : `We fail to reject $H_0$ ($\\chi^2 = ${fmt(chiSq, 3)}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). The data are consistent with the expected distribution.` },
  ];

  // For 2-category scenarios, also show the equivalent binomial test
  if (k === 2) {
    const p0 = sc.ratios[0] / totalRatio;
    const binomPVal = binomialExactPValue(observed[0], N, p0);
    const binomPRange = binomialPRange(binomPVal);
    const pHat = round(observed[0] / N, 3);
    const binomSig = binomPVal < 0.05;
    blocks.push(
      { kind: "heading", text: "Alternative Approach: Binomial Test" },
      { kind: "text", text: `Since there are only two categories, a binomial test is equally valid. Treat "${sc.labels[0]}" as a "success" with null proportion $p_0 = ${fmt(p0, 4)}$:` },
      { kind: "formula",
        label: "Sample proportion",
        formula: `$\\hat{p} = k/n = ${observed[0]}/${N}$`,
        result: `$\\hat{p} = ${pHat}$` },
      { kind: "text", text: `Exact two-tailed binomial P-value ($n = ${N}$, $k = ${observed[0]}$, $p_0 = ${fmt(p0, 4)}$):` },
      { kind: "pvalue", range: binomPRange },
      { kind: "conclusion", text: binomSig
          ? `We reject $H_0$ (${binomPRange}, $\\alpha = 0.05$). The binomial test confirms a significant deviation from $p_0 = ${fmt(p0, 4)}$.`
          : `We fail to reject $H_0$ (${binomPRange}, $\\alpha = 0.05$). Both tests agree: no significant deviation from $p_0 = ${fmt(p0, 4)}$.` },
      { kind: "text", text: `**Note:** The $\\chi^2$ GOF and binomial test should reach the same conclusion. The $\\chi^2$ test uses an approximation ($\\chi^2 \\approx z^2$ for two categories), while the binomial test gives an exact P-value — both are acceptable here.` },
    );
  }

  return {
    id: `chi-gof-${Date.now()}`,
    testType: "chi-square-gof",
    category: "calculable",
    chapter: 8,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generatePoissonGOF(rng: () => number): GeneratedQuestion {
  const scenarios = [
    { thing: "mutations", context: "mutations per bacterial colony", per: "colony" },
    { thing: "flower visits", context: "bee visits per 5-minute observation interval", per: "interval" },
    { thing: "parasites", context: "parasite individuals per host fish", per: "fish" },
    { thing: "seeds", context: "seeds per 0.25 m² quadrat", per: "quadrat" },
    { thing: "aphid colonies", context: "aphid colonies per rose stem", per: "stem" },
    { thing: "rare plant individuals", context: "individuals of a rare orchid species per 25 m² plot", per: "plot" },
    { thing: "bacteria", context: "bacteria per microscope field of view in a diluted culture", per: "field of view" },
    { thing: "bird nests", context: "active bird nests per 1 ha woodland plot", per: "plot" },
  ];

  const sc = pick(rng, scenarios);
  const mu = round(randBetween(rng, 1.5, 4.0), 1);
  const nUnits = randInt(rng, 80, 200);

  // Generate Poisson-ish observed counts
  // Categories: 0, 1, 2, 3, 4, ≥5
  function poissonProb(k: number, lam: number): number {
    let logP = -lam + k * Math.log(lam);
    for (let i = 1; i <= k; i++) logP -= Math.log(i);
    return Math.exp(logP);
  }

  const maxK = 5;
  const probs = [];
  for (let k = 0; k < maxK; k++) probs.push(poissonProb(k, mu));
  probs.push(1 - probs.reduce((a, b) => a + b, 0)); // ≥ maxK

  const expected = probs.map(p => p * nUnits);
  // Merge small tail categories until each expected ≥ 1
  // Simple: just use raw

  let observed = expected.map(e => Math.max(0, Math.round(e + (rng() - 0.5) * e * 0.6)));
  const diff = nUnits - observed.reduce((a, b) => a + b, 0);
  observed[0] += diff;

  const labels = ["0", "1", "2", "3", "4", `≥${maxK}`];

  // Estimated mean from data
  const totalCounts = observed.reduce((sum, o, i) => sum + o * (i < maxK ? i : maxK), 0);
  const muHat = round(totalCounts / nUnits, 3);

  // Recalculate expected with muHat
  const pHat = [];
  for (let k = 0; k < maxK; k++) pHat.push(poissonProb(k, muHat));
  pHat.push(1 - pHat.reduce((a, b) => a + b, 0));
  const expectedHat = pHat.map(p => p * nUnits);

  // Merge right-tail categories until all E ≥ 1
  const activeLabels = [...labels];
  const activeObs = [...observed];
  const activeExp = [...expectedHat];
  while (activeExp.length > 2 && activeExp[activeExp.length - 1] < 1) {
    activeObs[activeObs.length - 2] += activeObs.pop()!;
    activeExp[activeExp.length - 2] += activeExp.pop()!;
    activeLabels.pop();
    activeLabels[activeLabels.length - 1] = `≥${activeLabels.length - 1}`;
  }

  const chiSq = activeObs.reduce((sum, o, i) => sum + (o - activeExp[i]) ** 2 / Math.max(activeExp[i], 0.001), 0);
  const df = activeLabels.length - 1 - 1;
  const pRange = getChiSquarePRange(chiSq, df);
  const chi005 = lookupChiCritical(df, 0.05);
  const significant = chiSq > chi005;

  const tableRows = activeLabels.map((lab, i) =>
    `| ${lab} | ${activeObs[i]} | ${fmt(activeExp[i], 2)} | ${fmt((activeObs[i] - activeExp[i]) ** 2 / Math.max(activeExp[i], 0.001), 3)} |`
  );

  const qText = `A researcher counted the number of ${sc.context} across ${nUnits} ${sc.per}s. The distribution of counts is given below. Test whether the count data follow a Poisson distribution. Use α = 0.05.\n\n| Count | Observed |\n|-------|----------|\n${labels.map((lab, i) => `| ${lab} | ${observed[i]} |`).join("\n")}`;

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "Test: Poisson Goodness-of-Fit (Chi-Square)" },
    { kind: "text",    text: "$H_0$: The data follow a Poisson distribution" },
    { kind: "text",    text: "$H_a$: The data do not follow a Poisson distribution" },
    { kind: "heading", text: "Calculation" },
    { kind: "formula",
      label: "Estimated mean (λ̂)",
      formula: `$\\hat{\\lambda} = \\sum(\\text{count} \\times \\text{freq}) / n = ${totalCounts} / ${nUnits}$`,
      result: `$\\hat{\\lambda} = ${muHat}$` },
    { kind: "text",    text: `Expected frequencies calculated using $\\text{Poisson}(\\hat{\\lambda} = ${muHat}) \\times ${nUnits}$:` },
    { kind: "text",    text: `| Count | Observed (O) | Expected (E) | (O−E)²/E |\n|-------|--------------|--------------|----------|\n${tableRows.join("\n")}` },
    { kind: "formula",
      label: "Chi-square statistic",
      formula: "$\\chi^2 = \\sum\\frac{(O - E)^2}{E}$",
      result: `$\\chi^2 = ${fmt(chiSq, 3)}$` },
    { kind: "text",    text: `$df = (\\text{categories} - 1) - (\\text{estimated params}) = ${activeLabels.length} - 1 - 1 = ${df}$` },
    { kind: "text",    text: `Critical value: $\\chi^2_{0.05,\\,${df}} = ${fmt(chi005, 3)}$` },
    { kind: "text",    text: "$\\alpha = 0.05$" },
    { kind: "pvalue",  range: pRange },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($\\chi^2 = ${fmt(chiSq, 3)}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). The count data do not follow a Poisson distribution.`
        : `We fail to reject $H_0$ ($\\chi^2 = ${fmt(chiSq, 3)}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). The data are consistent with a Poisson distribution.` },
  ];

  return {
    id: `poisson-${Date.now()}`,
    testType: "poisson-gof",
    category: "calculable",
    chapter: 8,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generateChiContingency(rng: () => number): GeneratedQuestion {
  const scenarios = [
    {
      context: "A clinical study investigated whether a vaccine reduces disease incidence.",
      rowVar: "Treatment",
      colVar: "Outcome",
      rows: ["Vaccinated", "Unvaccinated"],
      cols: ["Disease", "No disease"],
      null0: "Vaccination status and disease outcome are independent",
      altH: "Vaccination status and disease outcome are not independent",
    },
    {
      context: "An ecologist recorded whether individual birds of two species chose to nest in forest or grassland habitat.",
      rowVar: "Species",
      colVar: "Habitat",
      rows: ["Species A", "Species B"],
      cols: ["Forest", "Grassland"],
      null0: "Nesting habitat is independent of species",
      altH: "Nesting habitat is not independent of species",
    },
    {
      context: "A toxicologist tested whether insecticide exposure affects survival in a population of *Drosophila melanogaster*.",
      rowVar: "Treatment",
      colVar: "Survival",
      rows: ["Exposed", "Control"],
      cols: ["Survived", "Died"],
      null0: "Insecticide exposure and survival are independent",
      altH: "Insecticide exposure and survival are not independent",
    },
    {
      context: "A behavioural ecologist examined whether male and female deer exhibit different activity patterns.",
      rowVar: "Sex",
      colVar: "Activity",
      rows: ["Male", "Female"],
      cols: ["Active", "Resting"],
      null0: "Activity pattern and sex are independent",
      altH: "Activity pattern and sex are not independent",
    },
    {
      context: "A fisheries study examined the association between river system and the presence of a specific parasite in salmon.",
      rowVar: "River",
      colVar: "Parasite",
      rows: ["River A", "River B", "River C"],
      cols: ["Infected", "Uninfected"],
      null0: "Parasite prevalence is independent of river system",
      altH: "Parasite prevalence differs among river systems",
    },
    {
      context: "A conservation biologist investigated whether nest location (forest edge vs. interior) is associated with nest fate in a songbird population.",
      rowVar: "Nest location",
      colVar: "Nest fate",
      rows: ["Forest edge", "Forest interior"],
      cols: ["Survived", "Predated"],
      null0: "Nest location and nest fate are independent",
      altH: "Nest location and nest fate are not independent",
    },
    {
      context: "A herpetologist tested whether nest orientation is associated with offspring sex in painted turtles (*Chrysemys picta*), which have temperature-dependent sex determination.",
      rowVar: "Nest aspect",
      colVar: "Offspring sex",
      rows: ["Sun-exposed", "Shaded"],
      cols: ["Female", "Male"],
      null0: "Nest aspect and offspring sex are independent",
      altH: "Nest aspect and offspring sex are not independent",
    },
    {
      context: "A parasitologist examined the association between host body condition and parasite burden in harbour seals (*Phoca vitulina*).",
      rowVar: "Body condition",
      colVar: "Parasite burden",
      rows: ["Poor condition", "Good condition"],
      cols: ["Heavy burden", "Light burden"],
      null0: "Body condition and parasite burden are independent",
      altH: "Body condition and parasite burden are not independent",
    },
    {
      context: "A plant ecologist investigated whether the presence of a mycorrhizal fungus differs across three soil pH categories in a grassland.",
      rowVar: "Soil pH",
      colVar: "Fungal presence",
      rows: ["Acidic (pH < 6)", "Neutral (pH 6–7)", "Alkaline (pH > 7)"],
      cols: ["Fungus present", "Fungus absent"],
      null0: "Soil pH category and fungal presence are independent",
      altH: "Soil pH category and fungal presence are not independent",
    },
    {
      context: "A marine biologist recorded whether feeding attempts by grey seals (*Halichoerus grypus*) were successful across three prey types.",
      rowVar: "Prey type",
      colVar: "Feeding outcome",
      rows: ["Herring", "Sand eel", "Flatfish"],
      cols: ["Successful", "Unsuccessful"],
      null0: "Prey type and feeding success are independent",
      altH: "Feeding success differs among prey types",
    },
  ];

  const sc = pick(rng, scenarios);
  const r = sc.rows.length;
  const c = sc.cols.length;

  // Generate contingency table
  let total = randInt(rng, 60, 200);
  const table: number[][] = [];
  const rowTotals: number[] = [];

  for (let i = 0; i < r; i++) {
    rowTotals.push(randInt(rng, Math.floor(total / r * 0.5), Math.floor(total / r * 1.5)));
  }
  // Normalise rowTotals to sum to total
  const rowSum = rowTotals.reduce((a, b) => a + b, 0);
  const adjustedRow = rowTotals.map(x => Math.round(x * total / rowSum));
  adjustedRow[0] += total - adjustedRow.reduce((a, b) => a + b, 0);

  for (let i = 0; i < r; i++) {
    const row: number[] = [];
    const rt = adjustedRow[i];
    if (c === 2) {
      const a = randInt(rng, Math.floor(rt * 0.2), Math.floor(rt * 0.8));
      row.push(a, rt - a);
    } else {
      // 3 columns
      let remaining = rt;
      for (let j = 0; j < c - 1; j++) {
        const val = randInt(rng, Math.floor(remaining * 0.1), Math.floor(remaining * 0.6));
        row.push(val);
        remaining -= val;
      }
      row.push(Math.max(1, remaining));
    }
    table.push(row);
  }

  // Compute column totals and grand total
  const colTotals = Array(c).fill(0);
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++)
      colTotals[j] += table[i][j];
  let grandTotal = adjustedRow.reduce((a, b) => a + b, 0);

  // Expected values
  const exp: number[][] = table.map((row, i) =>
    row.map((_, j) => (adjustedRow[i] * colTotals[j]) / grandTotal)
  );

  // Ensure all expected cells ≥ 5 (chi-square assumption)
  const minExpCell = exp.flat().reduce((a, b) => Math.min(a, b), Infinity);
  if (minExpCell < 5) {
    const scaleFactor = Math.ceil(5 / minExpCell);
    for (let i = 0; i < r; i++) {
      adjustedRow[i] *= scaleFactor;
      for (let j = 0; j < c; j++) table[i][j] *= scaleFactor;
    }
    for (let j = 0; j < c; j++) colTotals[j] *= scaleFactor;
    grandTotal *= scaleFactor;
    for (let i = 0; i < r; i++)
      for (let j = 0; j < c; j++)
        exp[i][j] = adjustedRow[i] * colTotals[j] / grandTotal;
  }

  // Chi-square
  let chiSq = 0;
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++)
      chiSq += (table[i][j] - exp[i][j]) ** 2 / exp[i][j];

  const df = (r - 1) * (c - 1);
  const pRange = getChiSquarePRange(chiSq, df);
  const chi005 = lookupChiCritical(df, 0.05);
  const significant = chiSq > chi005;

  // Build table text
  const header = `| | ${sc.cols.join(" | ")} | Total |`;
  const divider = `|---|${sc.cols.map(() => "---").join("|")}|---|`;
  const dataRows = table.map((row, i) =>
    `| ${sc.rows[i]} | ${row.map((v, j) => `${v} (E=${fmt(exp[i][j], 1)})`).join(" | ")} | ${adjustedRow[i]} |`
  );
  const footRow = `| **Total** | ${colTotals.map(v => `**${v}**`).join(" | ")} | **${grandTotal}** |`;
  const tableText = [header, divider, ...dataRows, footRow].join("\n");

  const termRows = table.map((row, i) =>
    row.map((o, j) => `(${o} − ${fmt(exp[i][j], 2)})² / ${fmt(exp[i][j], 2)} = ${fmt((o - exp[i][j]) ** 2 / exp[i][j], 3)}`)
  ).flat().join(" + ");

  const qText = `${sc.context} The data are summarized in the following contingency table. Is there evidence of an association between ${sc.rowVar.toLowerCase()} and ${sc.colVar.toLowerCase()}? Use α = 0.05.\n\n| | ${sc.cols.join(" | ")} | Total |\n|---|${sc.cols.map(() => "---").join("|")}|---|\n${table.map((row, i) => `| ${sc.rows[i]} | ${row.join(" | ")} | ${adjustedRow[i]} |`).join("\n")}\n| Total | ${colTotals.join(" | ")} | ${grandTotal} |`;

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "Test: Chi-Square Contingency Test" },
    { kind: "text",    text: `$H_0$: ${sc.null0}` },
    { kind: "text",    text: `$H_a$: ${sc.altH}` },
    { kind: "heading", text: "Calculation" },
    { kind: "text",    text: "$E = (\\text{row total} \\times \\text{col total}) / \\text{grand total}$\n\n" + tableText },
    { kind: "formula",
      label: "Chi-square statistic",
      formula: "$\\chi^2 = \\sum\\frac{(O - E)^2}{E}$",
      result: `$\\chi^2 = ${fmt(chiSq, 3)}$` },
    { kind: "text",    text: `$df = (r-1)(c-1) = (${r}-1)(${c}-1) = ${df}$` },
    { kind: "text",    text: `Critical value: $\\chi^2_{0.05,\\,${df}} = ${fmt(chi005, 3)}$` },
    { kind: "text",    text: "$\\alpha = 0.05$" },
    { kind: "pvalue",  range: pRange },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($\\chi^2 = ${fmt(chiSq, 3)}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is significant evidence of an association between ${sc.rowVar.toLowerCase()} and ${sc.colVar.toLowerCase()}.`
        : `We fail to reject $H_0$ ($\\chi^2 = ${fmt(chiSq, 3)}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is no significant evidence of an association between ${sc.rowVar.toLowerCase()} and ${sc.colVar.toLowerCase()}.` },
  ];

  return {
    id: `chi-cont-${Date.now()}`,
    testType: "chi-square-contingency",
    category: "calculable",
    chapter: 9,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generateOneSampleT(rng: () => number): GeneratedQuestion {
  const scenarios = [
    { context: "Human body temperature is conventionally assumed to be 37.0°C. A researcher measured body temperature (°C) in a random sample of {n} healthy adults:", mu0: 37.0, unit: "°C", variable: "mean body temperature", direction: "two" },
    { context: "A standard growth medium is expected to produce bacterial cultures with a mean optical density (OD₆₀₀) of 0.80. A researcher measured OD₆₀₀ for {n} independent cultures:", mu0: 0.80, unit: "OD units", variable: "mean optical density", direction: "two" },
    { context: "Fish in a reference lake are known to have a mean total length of 24.0 cm. A researcher sampled {n} fish from a potentially polluted lake to assess whether fish size differs:", mu0: 24.0, unit: "cm", variable: "mean total length", direction: "two" },
    { context: "A soil scientist compares soil pH in a study area to the regional mean of 6.5. They measured soil pH at {n} randomly selected sites:", mu0: 6.5, unit: "pH units", variable: "mean soil pH", direction: "two" },
    { context: "Wing span in a reference population of monarch butterflies (*Danaus plexippus*) averages 95 mm. A researcher measured wing span in {n} butterflies from an isolated population:", mu0: 95.0, unit: "mm", variable: "mean wing span", direction: "two" },
    { context: "The published mean snout-vent length for spotted salamanders (*Ambystoma maculatum*) at a reference site is 12.8 cm. A researcher measured snout-vent length (cm) in {n} individuals from an isolated wetland:", mu0: 12.8, unit: "cm", variable: "mean snout-vent length", direction: "two" },
    { context: "The known mean shell length of periwinkles (*Littorina littorea*) on an undisturbed shore is 18.5 mm. A researcher measured shell length (mm) in {n} periwinkles from a shore affected by recreational disturbance:", mu0: 18.5, unit: "mm", variable: "mean shell length", direction: "two" },
    { context: "Resting metabolic rate in a reference population of deer mice (*Peromyscus maniculatus*) averages 1.40 mL O₂/g/hr. A researcher measured resting metabolic rate in {n} mice from a high-altitude population:", mu0: 1.40, unit: "mL O₂/g/hr", variable: "mean resting metabolic rate", direction: "two" },
    { context: "The mean leaf dry mass for *Plantago lanceolata* plants in unmanaged grassland is 0.45 g. A researcher measured leaf dry mass (g) in {n} plants from a frequently mown roadside verge:", mu0: 0.45, unit: "g", variable: "mean leaf dry mass", direction: "two" },
    { context: "Dissolved oxygen in a pristine reference stream averages 9.2 mg/L. An environmental scientist measured dissolved oxygen (mg/L) at {n} randomly selected sites in a stream receiving agricultural runoff:", mu0: 9.2, unit: "mg/L", variable: "mean dissolved oxygen", direction: "two" },
    { context: "The mean clutch size of great tits (*Parus major*) in a long-term study woodland is 9.3 eggs. A researcher recorded clutch size in {n} nests from an urban park to compare with this reference:", mu0: 9.3, unit: "eggs", variable: "mean clutch size", direction: "two" },
  ];

  const sc = pick(rng, scenarios);
  const n = randInt(rng, 8, 25);
  // Target a test statistic between 0.5 and 4 (mix of significant/not)
  const targetT = (rng() > 0.5 ? 1 : -1) * randBetween(rng, 0.8, 3.8);
  const trueSd = randBetween(rng, sc.mu0 * 0.03, sc.mu0 * 0.12);
  const se = trueSd / Math.sqrt(n);
  const trueMean = sc.mu0 + targetT * se;

  // Generate data that matches mean and sd approximately
  const data: number[] = [];
  for (let i = 0; i < n; i++) data.push(trueMean + normalApprox(rng) * trueSd);
  // Adjust to match exact mean and sd
  const dm = mean(data);
  const ds = sampleSd(data);
  const adjustedData = data.map(x => trueMean + (x - dm) * (trueSd / ds));

  const yBar = round(mean(adjustedData), 3);
  const s = round(sampleSd(adjustedData), 3);
  const seCalc = round(s / Math.sqrt(n), 4);
  const tStat = round((yBar - sc.mu0) / seCalc, 3);
  const df = n - 1;
  const pRange = getTwoTailedPRange(tStat, df);
  const tCrit = round(lookupTCritical(df, 0.05), 3);
  const significant = Math.abs(tStat) > tCrit;

  const dataStr = adjustedData.map(x => round(x, 2)).join(", ");

  const qText = sc.context.replace("{n}", String(n)) + `\n\n${dataStr}\n\nTest whether the ${sc.variable} differs significantly from ${sc.mu0} ${sc.unit}. Use α = 0.05.`;

  const ci95lo = round(yBar - tCrit * seCalc, 3);
  const ci95hi = round(yBar + tCrit * seCalc, 3);

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "Test: One-Sample t-Test" },
    { kind: "text",    text: `$H_0$: $\\mu = ${sc.mu0}$ (${sc.variable} equals the reference value)` },
    { kind: "text",    text: `$H_a$: $\\mu \\neq ${sc.mu0}$ (${sc.variable} differs from the reference value)` },
    { kind: "heading", text: "Calculation" },
    { kind: "formula",
      label: "Sample mean",
      formula: `$\\bar{y} = \\sum y_i / n$`,
      result: `$\\bar{y} = ${yBar}$ ${sc.unit}` },
    { kind: "formula",
      label: "Sample SD",
      formula: `$s = \\sqrt{\\sum(y_i - \\bar{y})^2 / (n-1)}$`,
      result: `$s = ${s}$ ${sc.unit}` },
    { kind: "formula",
      label: "Standard error",
      formula: `$SE = s / \\sqrt{n} = ${s} / \\sqrt{${n}}$`,
      result: `$SE = ${seCalc}$ ${sc.unit}` },
    { kind: "formula",
      label: "t statistic",
      formula: `$t = (\\bar{y} - \\mu_0) / SE = (${yBar} - ${sc.mu0}) / ${seCalc}$`,
      result: `$t = ${tStat}$` },
    { kind: "text",    text: `$df = n - 1 = ${n} - 1 = ${df}$` },
    { kind: "text",    text: `Critical value: $t_{0.05(2),\\,${df}} = \\pm${tCrit}$` },
    { kind: "text",    text: "$\\alpha = 0.05$ (two-tailed)" },
    { kind: "pvalue",  range: pRange },
    { kind: "text",    text: `$95\\%$ CI for $\\mu$: $\\bar{y} \\pm t^* \\times SE = ${yBar} \\pm ${tCrit} \\times ${seCalc} = (${ci95lo},\\,${ci95hi})$ ${sc.unit}` },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is significant evidence that the ${sc.variable} ($\\bar{y} = ${yBar}$ ${sc.unit}) differs from the reference value of ${sc.mu0} ${sc.unit}.`
        : `We fail to reject $H_0$ ($t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is insufficient evidence that the ${sc.variable} ($\\bar{y} = ${yBar}$ ${sc.unit}) differs from the reference value of ${sc.mu0} ${sc.unit}.` },
  ];

  return {
    id: `one-t-${Date.now()}`,
    testType: "one-sample-t",
    category: "calculable",
    chapter: 11,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generateTwoSampleT(rng: () => number): GeneratedQuestion {
  const useWelch = rng() > 0.6;

  const scenarios = [
    { context: "Researchers compared metabolic rates (mL O₂/hr) between two populations of the same salamander species living at different elevations.", group1: "Low elevation", group2: "High elevation", unit: "mL O₂/hr", variable: "mean metabolic rate" },
    { context: "A nutritionist measured fasting blood glucose (mmol/L) in patients assigned to a low-carb diet versus a standard diet.", group1: "Low-carb diet", group2: "Standard diet", unit: "mmol/L", variable: "mean fasting blood glucose" },
    { context: "An ornithologist measured egg mass (g) in two sympatric bird species nesting in the same habitat.", group1: "Species A", group2: "Species B", unit: "g", variable: "mean egg mass" },
    { context: "A pharmacologist compared enzyme activity (nmol/min/mg) in liver tissue from mice treated with a drug versus untreated controls.", group1: "Drug-treated", group2: "Control", unit: "nmol/min/mg", variable: "mean enzyme activity" },
    { context: "A plant ecologist measured leaf area (cm²) in *Plantago* growing in sandy versus clay soils.", group1: "Sandy soil", group2: "Clay soil", unit: "cm²", variable: "mean leaf area" },
    { context: "A marine biologist measured carapace width (mm) in male shore crabs (*Carcinus maenas*) from a sheltered bay and from an exposed rocky shore.", group1: "Sheltered bay", group2: "Exposed shore", unit: "mm", variable: "mean carapace width" },
    { context: "A physiologist measured maximum sprint speed (m/s) in fence lizards (*Sceloporus undulatus*) from warm lowland and cool highland sites.", group1: "Lowland (warm)", group2: "Highland (cool)", unit: "m/s", variable: "mean sprint speed" },
    { context: "A botanist measured root-to-shoot dry mass ratio in beech seedlings (*Fagus sylvatica*) grown under high versus low light conditions.", group1: "High light", group2: "Low light", unit: "(dimensionless)", variable: "mean root-to-shoot ratio" },
    { context: "An ecologist compared seed mass (mg) of *Plantago lanceolata* produced by plants grown in high-nutrient and low-nutrient soils.", group1: "High nutrient", group2: "Low nutrient", unit: "mg", variable: "mean seed mass" },
    { context: "A conservation biologist measured home range size (ha) in two populations of red squirrels (*Sciurus vulgaris*), one in a conifer plantation and one in a mixed woodland.", group1: "Conifer plantation", group2: "Mixed woodland", unit: "ha", variable: "mean home range size" },
    { context: "A physiologist measured gill Na⁺/K⁺-ATPase activity (μmol/mg protein/hr) in juvenile Atlantic salmon (*Salmo salar*) before and after acclimation to seawater versus freshwater.", group1: "Seawater-acclimated", group2: "Freshwater-acclimated", unit: "μmol/mg/hr", variable: "mean gill ATPase activity" },
  ];

  const sc = pick(rng, scenarios);
  const n1 = randInt(rng, 8, 20);
  const n2 = randInt(rng, 8, 20);
  const trueMu1 = randBetween(rng, 10, 100);
  const deltaMu = (rng() > 0.5 ? 1 : -1) * randBetween(rng, 0, trueMu1 * 0.35);
  const trueMu2 = trueMu1 + deltaMu;
  const sdFactor = rng() > 0.5 ? 1.0 : (useWelch ? randBetween(rng, 1.5, 3.0) : 1.0);
  const trueSD1 = randBetween(rng, trueMu1 * 0.10, trueMu1 * 0.25);
  const trueSD2 = trueSD1 * sdFactor;

  // Generate data
  const makeData = (n: number, mu: number, sd: number) => {
    const d = Array.from({ length: n }, () => mu + normalApprox(rng) * sd);
    const dm = mean(d); const ds = sampleSd(d);
    return d.map(x => mu + (x - dm) * (sd / ds));
  };
  const d1 = makeData(n1, trueMu1, trueSD1);
  const d2 = makeData(n2, trueMu2, trueSD2);

  const yBar1 = round(mean(d1), 3);
  const yBar2 = round(mean(d2), 3);
  const s1 = round(sampleSd(d1), 3);
  const s2 = round(sampleSd(d2), 3);

  let tStat: number, df: number, dfFormula: string, spFormula: string, seFormula: string;

  if (!useWelch || Math.abs(s1 / s2 - 1) < 0.3) {
    // Pooled two-sample t
    const sp2 = ((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / (n1 + n2 - 2);
    const sp = round(Math.sqrt(sp2), 3);
    const se = round(Math.sqrt(sp2 * (1 / n1 + 1 / n2)), 4);
    tStat = round((yBar1 - yBar2) / se, 3);
    df = n1 + n2 - 2;
    spFormula = `$s^2_p = [(n_1-1)s_1^2 + (n_2-1)s_2^2] / (n_1+n_2-2) = [(${n1-1})(${s1}^2) + (${n2-1})(${s2}^2)] / ${n1+n2-2} = ${round(sp2, 4)}$, so $s_p = ${sp}$`;
    seFormula = `$SE = s_p\\sqrt{1/n_1 + 1/n_2} = ${sp}\\sqrt{1/${n1} + 1/${n2}} = ${se}$`;
    dfFormula = `$df = n_1 + n_2 - 2 = ${n1} + ${n2} - 2 = ${df}$`;
  } else {
    // Welch's t
    const se = round(Math.sqrt(s1 ** 2 / n1 + s2 ** 2 / n2), 4);
    tStat = round((yBar1 - yBar2) / se, 3);
    const num = (s1 ** 2 / n1 + s2 ** 2 / n2) ** 2;
    const denom = (s1 ** 2 / n1) ** 2 / (n1 - 1) + (s2 ** 2 / n2) ** 2 / (n2 - 1);
    df = Math.floor(num / denom);
    spFormula = `Using Welch's approximation (separate variances) because $s_1/s_2 = ${round(s1 / s2, 2)} > 2$`;
    seFormula = `$SE = \\sqrt{s_1^2/n_1 + s_2^2/n_2} = \\sqrt{${s1}^2/${n1} + ${s2}^2/${n2}} = ${se}$`;
    dfFormula = `$df = (s_1^2/n_1 + s_2^2/n_2)^2 / [(s_1^2/n_1)^2/(n_1-1) + (s_2^2/n_2)^2/(n_2-1)] = ${df}$ (rounded down)`;
  }

  const pRange = getTwoTailedPRange(tStat, df);
  const tCrit = round(lookupTCritical(df, 0.05), 3);
  const significant = Math.abs(tStat) > tCrit;
  const testName = useWelch && Math.abs(s1 / s2 - 1) >= 0.3 ? "Welch's Two-Sample t-Test" : "Two-Sample t-Test (Pooled Variance)";

  const d1str = d1.map(x => round(x, 2)).join(", ");
  const d2str = d2.map(x => round(x, 2)).join(", ");

  const qText = `${sc.context}\n\n**${sc.group1}** (n = ${n1}): ${d1str}\n\n**${sc.group2}** (n = ${n2}): ${d2str}\n\nTest whether the ${sc.variable} differs between the two groups. Use α = 0.05.`;

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: `Test: ${testName}` },
    { kind: "text",    text: `$H_0$: $\\mu_1 = \\mu_2$ (no difference in ${sc.variable} between groups)` },
    { kind: "text",    text: `$H_a$: $\\mu_1 \\neq \\mu_2$ (${sc.variable} differs between groups)` },
    { kind: "heading", text: "Calculation" },
    { kind: "formula",
      label: "Group means and SDs",
      formula: `$\\bar{y}_1 = ${yBar1}$ ${sc.unit}, $s_1 = ${s1}$;  $\\bar{y}_2 = ${yBar2}$ ${sc.unit}, $s_2 = ${s2}$`,
      result: `$\\bar{y}_1 - \\bar{y}_2 = ${round(yBar1 - yBar2, 3)}$ ${sc.unit}` },
    { kind: "text",    text: spFormula },
    { kind: "text",    text: seFormula },
    { kind: "formula",
      label: "t statistic",
      formula: `$t = (\\bar{y}_1 - \\bar{y}_2) / SE = (${yBar1} - ${yBar2}) / SE$`,
      result: `$t = ${tStat}$` },
    { kind: "text",    text: dfFormula },
    { kind: "text",    text: `Critical value: $t_{0.05(2),\\,${df}} = \\pm${tCrit}$` },
    { kind: "text",    text: "$\\alpha = 0.05$ (two-tailed)" },
    { kind: "pvalue",  range: pRange },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is significant evidence that the ${sc.variable} differs between ${sc.group1} ($\\bar{y}_1 = ${yBar1}$) and ${sc.group2} ($\\bar{y}_2 = ${yBar2}$).`
        : `We fail to reject $H_0$ ($t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is insufficient evidence that the ${sc.variable} differs between ${sc.group1} ($\\bar{y}_1 = ${yBar1}$) and ${sc.group2} ($\\bar{y}_2 = ${yBar2}$).` },
  ];

  return {
    id: `two-t-${Date.now()}`,
    testType: useWelch && Math.abs(s1 / s2 - 1) >= 0.3 ? "welch-t" : "two-sample-t",
    category: "calculable",
    chapter: 12,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generatePairedT(rng: () => number): GeneratedQuestion {
  const scenarios = [
    { context: "A physiologist measured resting heart rate (bpm) in {n} subjects before and after an 8-week aerobic training program.", before: "Before training", after: "After training", unit: "bpm", variable: "heart rate" },
    { context: "A pharmacologist measured enzyme activity (nmol/min) in liver tissue from {n} patients before and after drug treatment.", before: "Pre-treatment", after: "Post-treatment", unit: "nmol/min", variable: "enzyme activity" },
    { context: "An ecologist measured leaf chlorophyll content (SPAD units) in {n} individual plants before and after fertilizer application.", before: "Before fertilizer", after: "After fertilizer", unit: "SPAD units", variable: "chlorophyll content" },
    { context: "A neurobiologist recorded reaction time (ms) for {n} subjects under normal conditions and after moderate caffeine intake.", before: "Without caffeine", after: "With caffeine", unit: "ms", variable: "reaction time" },
    { context: "A behavioural ecologist recorded foraging bout duration (min) in {n} great tits (*Parus major*) before and after a mild food-shortage period induced by temporarily removing supplementary feeders.", before: "Feeders present", after: "Feeders removed", unit: "min", variable: "foraging bout duration" },
    { context: "A physiologist measured blood lactate concentration (mmol/L) in {n} trained cyclists immediately before and after a standardised 20-minute sprint effort.", before: "Pre-sprint", after: "Post-sprint", unit: "mmol/L", variable: "blood lactate concentration" },
    { context: "A plant biologist measured stomatal conductance (mmol H₂O/m²/s) in {n} *Vicia faba* leaves before and after 2 h of elevated CO₂ exposure (700 ppm).", before: "Ambient CO₂", after: "Elevated CO₂", unit: "mmol/m²/s", variable: "stomatal conductance" },
    { context: "A herpetologist measured sprint speed (m/s) of {n} individual fence lizards (*Sceloporus undulatus*) before and after a 30-min thermal acclimation period at 35 °C.", before: "Before acclimation", after: "After acclimation", unit: "m/s", variable: "sprint speed" },
    { context: "A stream ecologist measured benthic invertebrate density (individuals/0.1 m²) at {n} sites before and after a riparian buffer restoration project.", before: "Pre-restoration", after: "Post-restoration", unit: "individuals/0.1 m²", variable: "invertebrate density" },
    { context: "A microbiologist measured optical density (OD₆₀₀) of {n} bacterial cultures before and after adding a specific growth inhibitor at sub-lethal concentration.", before: "Before inhibitor", after: "After inhibitor", unit: "OD₆₀₀", variable: "optical density" },
  ];

  const sc = pick(rng, scenarios);
  const n = randInt(rng, 7, 18);
  const trueMuBefore = randBetween(rng, 20, 100);
  const trueDelta = (rng() > 0.5 ? 1 : -1) * randBetween(rng, 0, trueMuBefore * 0.25);
  const trueSDd = randBetween(rng, Math.abs(trueDelta) * 0.5 + 1, trueMuBefore * 0.15);

  // Generate paired data
  const before = Array.from({ length: n }, () => trueMuBefore + normalApprox(rng) * trueSDd);
  const after = before.map(b => b + trueDelta + normalApprox(rng) * trueSDd * 0.5);
  const diffs = before.map((b, i) => after[i] - b);

  const dBar = round(mean(diffs), 3);
  const sd = round(sampleSd(diffs), 3);
  const se = round(sd / Math.sqrt(n), 4);
  const tStat = round(dBar / se, 3);
  const df = n - 1;
  const pRange = getTwoTailedPRange(tStat, df);
  const tCrit = round(lookupTCritical(df, 0.05), 3);
  const significant = Math.abs(tStat) > tCrit;

  const table = before.map((b, i) =>
    `| ${i + 1} | ${round(b, 2)} | ${round(after[i], 2)} | ${round(diffs[i], 2)} |`
  ).join("\n");

  const qText = sc.context.replace("{n}", String(n)) +
    `\n\n| Individual | ${sc.before} | ${sc.after} | Difference (After − Before) |\n|---|---|---|---|\n${table}\n\nTest whether the treatment significantly changes the ${sc.variable}. Use α = 0.05.`;

  const ci95lo = round(dBar - tCrit * se, 3);
  const ci95hi = round(dBar + tCrit * se, 3);

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "Test: Paired t-Test" },
    { kind: "text",    text: `$H_0$: $\\mu_d = 0$ (mean difference in ${sc.variable} = 0)` },
    { kind: "text",    text: `$H_a$: $\\mu_d \\neq 0$ (mean difference in ${sc.variable} ≠ 0)` },
    { kind: "text",    text: "Differences (d = After − Before):" },
    { kind: "text",    text: diffs.map(d => round(d, 2)).join(", ") },
    { kind: "heading", text: "Calculation" },
    { kind: "formula",
      label: "Mean difference",
      formula: `$\\bar{d} = \\sum d_i / n = ${round(diffs.reduce((a, b) => a + b, 0), 3)} / ${n}$`,
      result: `$\\bar{d} = ${dBar}$ ${sc.unit}` },
    { kind: "formula",
      label: "SD of differences",
      formula: `$s_d = \\sqrt{\\sum(d_i - \\bar{d})^2 / (n-1)}$`,
      result: `$s_d = ${sd}$ ${sc.unit}` },
    { kind: "formula",
      label: "SE of mean difference",
      formula: `$SE_d = s_d / \\sqrt{n} = ${sd} / \\sqrt{${n}}$`,
      result: `$SE_d = ${se}$ ${sc.unit}` },
    { kind: "formula",
      label: "t statistic",
      formula: `$t = \\bar{d} / SE_d = ${dBar} / ${se}$`,
      result: `$t = ${tStat}$` },
    { kind: "text",    text: `$df = n - 1 = ${n} - 1 = ${df}$` },
    { kind: "text",    text: `Critical value: $t_{0.05(2),\\,${df}} = \\pm${tCrit}$` },
    { kind: "text",    text: "$\\alpha = 0.05$ (two-tailed)" },
    { kind: "pvalue",  range: pRange },
    { kind: "text",    text: `$95\\%$ CI for $\\mu_d$: $${dBar} \\pm ${tCrit} \\times ${se} = (${ci95lo},\\,${ci95hi})$ ${sc.unit}` },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is significant evidence that the treatment changes ${sc.variable} ($\\bar{d} = ${dBar}$ ${sc.unit}).`
        : `We fail to reject $H_0$ ($t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is insufficient evidence that the treatment significantly changes ${sc.variable} ($\\bar{d} = ${dBar}$ ${sc.unit}).` },
  ];

  return {
    id: `paired-t-${Date.now()}`,
    testType: "paired-t",
    category: "calculable",
    chapter: 12,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generateANOVA(rng: () => number): GeneratedQuestion {
  const scenarios = [
    { context: "A plant physiologist tested the effect of four nitrogen treatments on aboveground biomass (g) in *Arabidopsis thaliana* after 4 weeks.", groups: ["No nitrogen", "Low N", "Medium N", "High N"], unit: "g", variable: "aboveground biomass" },
    { context: "A behavioural ecologist measured daily movement distance (km) of wolves from three distinct pack territories.", groups: ["Pack A", "Pack B", "Pack C"], unit: "km", variable: "daily movement distance" },
    { context: "A marine biologist measured growth rate (mm/day) of coral fragments maintained at three ocean temperature treatments.", groups: ["26°C", "28°C", "30°C"], unit: "mm/day", variable: "coral growth rate" },
    { context: "An ecologist measured plant species richness in plots subjected to four burning frequencies.", groups: ["No burn", "Burn every 3 yr", "Burn every 2 yr", "Burn annually"], unit: "species", variable: "plant species richness" },
    { context: "A food scientist measured texture scores (arbitrary units) of three fermentation products to compare methods.", groups: ["Method A", "Method B", "Method C"], unit: "units", variable: "texture score" },
    { context: "A toxicologist measured body mass (g) of zebrafish (*Danio rerio*) larvae after 96-h exposure to four concentrations of a model pollutant.", groups: ["Control (0 μg/L)", "10 μg/L", "50 μg/L", "200 μg/L"], unit: "g", variable: "larval body mass" },
    { context: "A physiologist measured resting metabolic rate (mL O₂/hr) in three species of sympatric small rodents caught in the same grassland.", groups: ["*Mus musculus*", "*Apodemus sylvaticus*", "*Microtus agrestis*"], unit: "mL O₂/hr", variable: "resting metabolic rate" },
    { context: "A soil ecologist measured microbial biomass carbon (μg C/g soil) in plots under three land-use types.", groups: ["Native grassland", "Arable cropland", "Restored meadow"], unit: "μg C/g soil", variable: "microbial biomass carbon" },
    { context: "A limnologist measured chlorophyll-*a* concentration (μg/L) in lakes across four nutrient categories.", groups: ["Oligotrophic", "Mesotrophic", "Eutrophic", "Hypereutrophic"], unit: "μg/L", variable: "chlorophyll-a concentration" },
    { context: "An ornithologist measured egg hatching mass (g) of blue tits (*Cyanistes caeruleus*) from nests in three habitat types.", groups: ["Deciduous woodland", "Mixed forest", "Urban garden"], unit: "g", variable: "hatching mass" },
  ];

  const sc = pick(rng, scenarios);
  const k = sc.groups.length;
  const nPerGroup = randInt(rng, 5, 10);
  const N = k * nPerGroup;

  const grandMu = randBetween(rng, 20, 80);
  const groupEffect = randBetween(rng, 0.05, 0.25); // effect size
  const withinSD = randBetween(rng, grandMu * 0.08, grandMu * 0.18);

  // Generate true group means with some spread
  const trueGroupMeans = Array.from({ length: k }, (_, i) => {
    const fraction = i / (k - 1);
    return grandMu + (fraction - 0.5) * grandMu * groupEffect * (rng() > 0.5 ? 1 : -1) + (rng() - 0.5) * withinSD * 0.5;
  });

  // Generate data
  const groupData: number[][] = trueGroupMeans.map(mu => {
    const d = Array.from({ length: nPerGroup }, () => mu + normalApprox(rng) * withinSD);
    const dm = mean(d); const ds = sampleSd(d);
    return d.map(x => mu + (x - dm) * (withinSD / ds));
  });

  // Summary stats
  const groupMeans = groupData.map(d => round(mean(d), 3));
  const groupSDs = groupData.map(d => round(sampleSd(d), 3));
  const grandMean = round(mean(groupData.flat()), 4);

  // SS calculations
  const SS_groups = groupData.reduce((sum, d, i) => sum + d.length * (groupMeans[i] - grandMean) ** 2, 0);
  const SS_error = groupData.reduce((sum, d, i) => sum + d.reduce((s, x) => s + (x - groupMeans[i]) ** 2, 0), 0);
  const SS_total = SS_groups + SS_error;

  const df_groups = k - 1;
  const df_error = N - k;
  const MS_groups = round(SS_groups / df_groups, 4);
  const MS_error = round(SS_error / df_error, 4);
  const F = round(MS_groups / MS_error, 3);
  const R2 = round(SS_groups / SS_total, 4);

  const pRange = getFPRange(F, df_groups, df_error);
  const fCrit05 = round(getFCritical(df_groups, df_error, 0.05), 3);
  const fCrit01 = round(getFCritical(df_groups, df_error, 0.01), 3);
  const significant = F > fCrit05;

  // Build data table
  const dataTable = sc.groups.map((g, i) =>
    `| ${g} | ${groupData[i].map(x => round(x, 1)).join(", ")} | ${groupMeans[i]} | ${groupSDs[i]} |`
  ).join("\n");

  const qText = `${sc.context}\n\n| Group | Data | Mean | SD |\n|-------|------|------|----|\n${dataTable}\n\nTest whether ${sc.variable} differs among groups. Use α = 0.05.`;

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "Test: One-Way ANOVA" },
    { kind: "text",    text: `$H_0$: $\\mu_1 = \\mu_2 = \\cdots = \\mu_k$ (all group means are equal)` },
    { kind: "text",    text: `$H_a$: At least one group mean differs` },
    { kind: "heading", text: "Calculation" },
    { kind: "formula",
      label: "Grand mean",
      formula: `$\\bar{y}_{..} = \\sum \\text{all obs} / N$`,
      result: `$\\bar{y}_{..} = ${grandMean}$` },
    { kind: "text",    text: `Group means: ${sc.groups.map((g, i) => `${g}: ${groupMeans[i]}`).join("; ")}` },
    { kind: "formula",
      label: "SS_groups",
      formula: `$SS_{groups} = \\sum n_i(\\bar{y}_i - \\bar{y}_{..})^2$`,
      result: `$SS_{groups} = ${fmt(SS_groups, 3)}$` },
    { kind: "formula",
      label: "SS_error",
      formula: `$SS_{error} = \\sum_i\\sum_j(y_{ij} - \\bar{y}_i)^2$`,
      result: `$SS_{error} = ${fmt(SS_error, 3)}$` },
    { kind: "text",    text: `| Source | SS | df | MS | F |\n|--------|----|----|-----|---|\n| Groups | ${fmt(SS_groups, 3)} | ${df_groups} | ${fmt(MS_groups, 4)} | **${fmt(F, 3)}** |\n| Error | ${fmt(SS_error, 3)} | ${df_error} | ${fmt(MS_error, 4)} | |\n| Total | ${fmt(SS_total, 3)} | ${N - 1} | | |` },
    { kind: "formula",
      label: "F ratio",
      formula: `$F = MS_{groups} / MS_{error} = ${fmt(MS_groups, 4)} / ${fmt(MS_error, 4)}$`,
      result: `$F = ${fmt(F, 3)}$` },
    { kind: "formula",
      label: "R²",
      formula: `$R^2 = SS_{groups} / SS_{total} = ${fmt(SS_groups, 3)} / ${fmt(SS_total, 3)}$`,
      result: `$R^2 = ${fmt(R2, 4)}$ (${fmt(R2 * 100, 1)}% of variance explained)` },
    { kind: "text",    text: `$df_{groups} = k - 1 = ${k} - 1 = ${df_groups}$` },
    { kind: "text",    text: `$df_{error} = N - k = ${N} - ${k} = ${df_error}$` },
    { kind: "text",    text: `Critical value: $F_{0.05,\\,${df_groups},\\,${df_error}} = ${fCrit05}$` },
    { kind: "text",    text: "$\\alpha = 0.05$" },
    { kind: "pvalue",  range: pRange },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($F = ${fmt(F, 3)}$, $df = ${df_groups},\\,${df_error}$, ${pRange}, $\\alpha = 0.05$). There is significant evidence that ${sc.variable} differs among groups ($R^2 = ${fmt(R2, 3)}$). Post-hoc comparisons (e.g., Tukey-Kramer) should be performed to identify which groups differ.`
        : `We fail to reject $H_0$ ($F = ${fmt(F, 3)}$, $df = ${df_groups},\\,${df_error}$, ${pRange}, $\\alpha = 0.05$). There is no significant evidence that ${sc.variable} differs among groups.` },
  ];

  return {
    id: `anova-${Date.now()}`,
    testType: "anova",
    category: "calculable",
    chapter: 15,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generateCorrelation(rng: () => number): GeneratedQuestion {
  const scenarios = [
    { context: "A wildlife biologist recorded body mass (kg) and home range area (km²) for {n} GPS-tracked wolves.", x: "Body mass (kg)", y: "Home range (km²)", xSymbol: "body mass", ySymbol: "home range area" },
    { context: "A physiologist measured incubation temperature (°C) and hatching success rate (%) for {n} sea turtle clutches.", x: "Temperature (°C)", y: "Hatching success (%)", xSymbol: "incubation temperature", ySymbol: "hatching success" },
    { context: "An evolutionary biologist measured tarsus length (mm) and wing length (mm) in {n} house sparrows (*Passer domesticus*).", x: "Tarsus length (mm)", y: "Wing length (mm)", xSymbol: "tarsus length", ySymbol: "wing length" },
    { context: "A microbiologist measured colony age (days) and antibiotic resistance (MIC, μg/mL) in {n} bacterial cultures.", x: "Colony age (days)", y: "MIC (μg/mL)", xSymbol: "colony age", ySymbol: "antibiotic resistance" },
    { context: "A limnologist measured dissolved oxygen (mg/L) and fish biomass (kg/ha) across {n} lakes.", x: "Dissolved O₂ (mg/L)", y: "Fish biomass (kg/ha)", xSymbol: "dissolved oxygen", ySymbol: "fish biomass" },
    { context: "A plant ecologist measured canopy openness (%) and seedling height (cm) at {n} sampling points in a temperate forest understory.", x: "Canopy openness (%)", y: "Seedling height (cm)", xSymbol: "canopy openness", ySymbol: "seedling height" },
    { context: "A herpetologist measured snout-vent length (mm) and clutch size (number of eggs) in {n} individual painted turtles (*Chrysemys picta*).", x: "SVL (mm)", y: "Clutch size", xSymbol: "snout-vent length", ySymbol: "clutch size" },
    { context: "A physiologist measured daily energy expenditure (kJ/day) and lean body mass (kg) in {n} free-ranging arctic ground squirrels.", x: "Lean body mass (kg)", y: "Energy expenditure (kJ/day)", xSymbol: "lean body mass", ySymbol: "daily energy expenditure" },
    { context: "A marine biologist recorded water depth (m) and sea urchin density (individuals/m²) at {n} rocky-reef survey stations.", x: "Depth (m)", y: "Urchin density (ind./m²)", xSymbol: "water depth", ySymbol: "sea urchin density" },
    { context: "An entomologist measured mean temperature (°C) and development time (days from egg to adult) for {n} populations of *Drosophila melanogaster* reared at different laboratory temperatures.", x: "Temperature (°C)", y: "Development time (days)", xSymbol: "rearing temperature", ySymbol: "development time" },
  ];

  const sc = pick(rng, scenarios);
  const n = randInt(rng, 10, 25);
  const trueR = (rng() > 0.5 ? 1 : -1) * randBetween(rng, 0.1, 0.95);

  // Generate bivariate normal data with correlation trueR
  const muX = randBetween(rng, 5, 50);
  const muY = randBetween(rng, 5, 100);
  const sdX = randBetween(rng, muX * 0.1, muX * 0.3);
  const sdY = randBetween(rng, muY * 0.1, muY * 0.3);

  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const z1 = (rng() + rng() + rng() - 1.5) * 1.1547; // approx normal
    const z2 = (rng() + rng() + rng() - 1.5) * 1.1547;
    xs.push(muX + sdX * z1);
    ys.push(muY + sdY * (trueR * z1 + Math.sqrt(1 - trueR ** 2) * z2));
  }

  const xBar = mean(xs);
  const yBar = mean(ys);
  const SPxy = xs.reduce((sum, x, i) => sum + (x - xBar) * (ys[i] - yBar), 0);
  const SSx = xs.reduce((sum, x) => sum + (x - xBar) ** 2, 0);
  const SSy = ys.reduce((sum, y) => sum + (y - yBar) ** 2, 0);
  const r = round(SPxy / Math.sqrt(SSx * SSy), 4);

  const tStat = round(r * Math.sqrt(n - 2) / Math.sqrt(1 - r ** 2), 3);
  const df = n - 2;
  const pRange = getTwoTailedPRange(tStat, df);
  const tCrit = round(lookupTCritical(df, 0.05), 3);
  const significant = Math.abs(tStat) > tCrit;

  const summaryTable = `| Statistic | Value |\n|---|---|\n| n | ${n} |\n| x̄ | ${round(xBar, 2)} |\n| ȳ | ${round(yBar, 2)} |\n| SSx | ${round(SSx, 2)} |\n| SSy | ${round(SSy, 2)} |\n| SPxy | ${round(SPxy, 2)} |`;

  const qText = sc.context.replace("{n}", String(n)) +
    " The following summary statistics are provided:\n\n" +
    summaryTable +
    "\n\nCalculate the Pearson correlation coefficient and test whether there is a significant linear association. Use α = 0.05.";

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "Test: Pearson Correlation Coefficient" },
    { kind: "text",    text: "$H_0$: $\\rho = 0$ (no linear association between variables)" },
    { kind: "text",    text: "$H_a$: $\\rho \\neq 0$ (there is a linear association between variables)" },
    { kind: "heading", text: "Calculation" },
    { kind: "formula",
      label: "Pearson r",
      formula: `$r = SP_{xy} / \\sqrt{SS_x \\cdot SS_y} = \\sum(x_i - \\bar{x})(y_i - \\bar{y}) / \\sqrt{\\sum(x_i-\\bar{x})^2 \\cdot \\sum(y_i-\\bar{y})^2}$`,
      result: `$r = ${r}$` },
    { kind: "formula",
      label: "t statistic for H₀: ρ = 0",
      formula: `$t = r\\sqrt{n-2} / \\sqrt{1-r^2} = ${r}\\sqrt{${n}-2} / \\sqrt{1-${r}^2}$`,
      result: `$t = ${tStat}$` },
    { kind: "text",    text: `$df = n - 2 = ${n} - 2 = ${df}$` },
    { kind: "text",    text: `Critical value: $t_{0.05(2),\\,${df}} = \\pm${tCrit}$` },
    { kind: "text",    text: "$\\alpha = 0.05$ (two-tailed)" },
    { kind: "pvalue",  range: pRange },
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($r = ${r}$, $t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is significant evidence of a ${r > 0 ? "positive" : "negative"} linear association between ${sc.xSymbol} and ${sc.ySymbol}.`
        : `We fail to reject $H_0$ ($r = ${r}$, $t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is no significant evidence of a linear association between ${sc.xSymbol} and ${sc.ySymbol}.` },
  ];

  return {
    id: `corr-${Date.now()}`,
    testType: "correlation",
    category: "calculable",
    chapter: 16,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generateRegression(rng: () => number): GeneratedQuestion {
  const includeCI = rng() > 0.5;

  const scenarios = [
    { context: "A biologist measured body length (cm) (X) and tail length (cm) (Y) in {n} lizards.", x: "Body length (cm)", y: "Tail length (cm)", xSym: "body length", ySym: "tail length" },
    { context: "A limnologist measured water temperature (°C) (X) and algal biomass (mg/L) (Y) in {n} lake samples.", x: "Temperature (°C)", y: "Algal biomass (mg/L)", xSym: "water temperature", ySym: "algal biomass" },
    { context: "An ecologist recorded tree diameter at breast height (cm) (X) and canopy area (m²) (Y) for {n} trees.", x: "DBH (cm)", y: "Canopy area (m²)", xSym: "tree diameter", ySym: "canopy area" },
    { context: "A physiologist recorded age (years) (X) and maximum oxygen uptake (mL/kg/min) (Y) in {n} participants.", x: "Age (years)", y: "VO₂_max (mL/kg/min)", xSym: "age", ySym: "maximum oxygen uptake" },
    { context: "A pharmacologist measured drug concentration (μg/mL) (X) and response (% inhibition) (Y) in {n} experiments.", x: "Concentration (μg/mL)", y: "% Inhibition", xSym: "drug concentration", ySym: "response" },
    { context: "A wildlife biologist measured individual body mass (g) (X) and litter size (number of pups) (Y) in {n} female bank voles (*Myodes glareolus*).", x: "Body mass (g)", y: "Litter size", xSym: "maternal body mass", ySym: "litter size" },
    { context: "A stream ecologist measured watershed area (km²) (X) and mean annual discharge (m³/s) (Y) for {n} gauged catchments.", x: "Watershed area (km²)", y: "Mean annual discharge (m³/s)", xSym: "watershed area", ySym: "mean annual discharge" },
    { context: "A plant physiologist measured soil moisture content (%) (X) and leaf water potential (MPa) (Y) in {n} individual *Quercus robur* saplings during a summer drought.", x: "Soil moisture (%)", y: "Leaf water potential (MPa)", xSym: "soil moisture", ySym: "leaf water potential" },
    { context: "A behavioural ecologist measured ambient temperature (°C) (X) and time spent basking (min/hr) (Y) by {n} individual common lizards (*Zootoca vivipara*) on sunny mornings.", x: "Temperature (°C)", y: "Basking time (min/hr)", xSym: "ambient temperature", ySym: "basking time" },
    { context: "A marine ecologist measured depth (m) (X) and macroalgal cover (%) (Y) at {n} permanently marked subtidal quadrats.", x: "Depth (m)", y: "Macroalgal cover (%)", xSym: "depth", ySym: "macroalgal cover" },
  ];

  const sc = pick(rng, scenarios);
  const n = randInt(rng, 10, 22);
  const trueB = (rng() > 0.5 ? 1 : -1) * randBetween(rng, 0.3, 5.0);
  const trueA = randBetween(rng, 2, 30);
  const xRange = randBetween(rng, 5, 30);
  const errSD = Math.abs(trueB * xRange * 0.15);

  const xs = Array.from({ length: n }, () => randBetween(rng, 2, 2 + xRange));
  const ys = xs.map(x => trueA + trueB * x + normalApprox(rng) * errSD);

  const xBar = mean(xs);
  const yBar = mean(ys);
  const SSx = xs.reduce((s, x) => s + (x - xBar) ** 2, 0);
  const SPxy = xs.reduce((s, x, i) => s + (x - xBar) * (ys[i] - yBar), 0);
  const SSy = ys.reduce((s, y) => s + (y - yBar) ** 2, 0);

  const b = round(SPxy / SSx, 4);
  const a = round(yBar - b * xBar, 4);
  const SSresid = ys.reduce((s, y, i) => s + (y - (a + b * xs[i])) ** 2, 0);
  const SSreg = SSy - SSresid;
  const MSresid = SSresid / (n - 2);
  const SE_b = round(Math.sqrt(MSresid / SSx), 4);
  const tStat = round(b / SE_b, 3);
  const df = n - 2;
  const pRange = getTwoTailedPRange(tStat, df);
  const tCrit = round(lookupTCritical(df, 0.05), 3);
  const significant = Math.abs(tStat) > tCrit;
  const R2 = round(SSreg / SSy, 4);

  const ci95lo = round(b - tCrit * SE_b, 4);
  const ci95hi = round(b + tCrit * SE_b, 4);

  const summaryTable = `| Statistic | Value |\n|---|---|\n| $n$ | ${n} |\n| $\\bar{x}$ | ${round(xBar, 2)} |\n| $\\bar{y}$ | ${round(yBar, 2)} |\n| $SS_x = \\sum(x_i-\\bar{x})^2$ | ${round(SSx, 2)} |\n| $SS_y = \\sum(y_i-\\bar{y})^2$ | ${round(SSy, 2)} |\n| $SP_{xy} = \\sum(x_i-\\bar{x})(y_i-\\bar{y})$ | ${round(SPxy, 2)} |`;

  const qText = sc.context.replace("{n}", String(n)) +
    " The following summary statistics are provided:\n\n" +
    summaryTable +
    `\n\nFit a least-squares regression line and test whether the slope differs significantly from zero. Use α = 0.05.${includeCI ? " Also calculate a 95% confidence interval for the slope." : ""}`;

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "Test: Linear Regression — Slope t-Test" },
    { kind: "text",    text: `$H_0$: $\\beta = 0$ (no linear relationship between ${sc.xSym} and ${sc.ySym})` },
    { kind: "text",    text: `$H_a$: $\\beta \\neq 0$ (a linear relationship exists)` },
    { kind: "heading", text: "Calculation" },
    { kind: "formula",
      label: "Slope (b)",
      formula: `$b = SP_{xy} / SS_x = \\sum(x_i - \\bar{x})(y_i - \\bar{y}) / \\sum(x_i - \\bar{x})^2$`,
      result: `$b = ${b}$` },
    { kind: "formula",
      label: "Intercept (a)",
      formula: `$a = \\bar{y} - b\\bar{x} = ${round(yBar, 3)} - ${b} \\times ${round(xBar, 3)}$`,
      result: `$a = ${a}$` },
    { kind: "text",    text: `Regression equation: $\\hat{Y} = ${a} + ${b}X$` },
    { kind: "formula",
      label: "R²",
      formula: `$R^2 = SS_{reg} / SS_y$`,
      result: `$R^2 = ${R2}$ (${fmt(R2 * 100, 1)}% of variance in ${sc.ySym} explained by ${sc.xSym})` },
    { kind: "formula",
      label: "SE of slope",
      formula: `$SE_b = \\sqrt{MS_{resid} / SS_x} = \\sqrt{${fmt(MSresid, 4)} / ${fmt(SSx, 3)}}$`,
      result: `$SE_b = ${SE_b}$` },
    { kind: "formula",
      label: "t statistic",
      formula: `$t = b / SE_b = ${b} / ${SE_b}$`,
      result: `$t = ${tStat}$` },
    { kind: "text",    text: `$df = n - 2 = ${n} - 2 = ${df}$` },
    { kind: "text",    text: `Critical value: $t_{0.05(2),\\,${df}} = \\pm${tCrit}$` },
    { kind: "text",    text: "$\\alpha = 0.05$ (two-tailed)" },
    { kind: "pvalue",  range: pRange },
    ...(includeCI ? [{
      kind: "text" as const,
      text: `$95\\%$ CI for slope: $b \\pm t^* \\times SE_b = ${b} \\pm ${tCrit} \\times ${SE_b} = (${ci95lo},\\,${ci95hi})$`,
    }] : []),
    { kind: "conclusion", text: significant
        ? `We reject $H_0$ ($t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is significant evidence that ${sc.xSym} predicts ${sc.ySym} ($b = ${b}$${includeCI ? `, $95\\%$ CI: ${ci95lo} to ${ci95hi}` : ""}).`
        : `We fail to reject $H_0$ ($t = ${tStat}$, $df = ${df}$, ${pRange}, $\\alpha = 0.05$). There is insufficient evidence of a linear relationship between ${sc.xSym} and ${sc.ySym} ($b = ${b}$).` },
  ];

  return {
    id: `reg-${Date.now()}`,
    testType: "regression",
    category: "calculable",
    chapter: 17,
    questionText: qText,
    answerBlocks: blocks,
  };
}

function generateCIMean(rng: () => number): GeneratedQuestion {
  const scenarios = [
    { context: "A biologist measured shell thickness (mm) in {n} randomly sampled limpets (*Patella* sp.) from an intertidal zone.", unit: "mm", variable: "mean shell thickness" },
    { context: "A physiologist recorded resting heart rate (bpm) in {n} healthy adult volunteers.", unit: "bpm", variable: "mean resting heart rate" },
    { context: "An agronomist measured wheat grain yield (g per plant) from {n} individual plants in a field trial.", unit: "g/plant", variable: "mean grain yield" },
    { context: "A wildlife biologist measured tail length (mm) of {n} individually marked red squirrels (*Tamiasciurus hudsonicus*) captured in a live-trapping study.", unit: "mm", variable: "mean tail length" },
    { context: "A stream ecologist measured dissolved organic carbon (DOC, mg/L) in water samples collected from {n} randomly selected riffle sites in a second-order stream.", unit: "mg/L", variable: "mean dissolved organic carbon" },
    { context: "A plant ecologist measured the height (cm) of {n} individually tagged *Plantago major* rosettes at peak growing season.", unit: "cm", variable: "mean rosette height" },
    { context: "A physiologist measured blood plasma cortisol concentration (ng/mL) in {n} rainbow trout (*Oncorhynchus mykiss*) sampled 30 minutes after a standardised handling stressor.", unit: "ng/mL", variable: "mean plasma cortisol" },
    { context: "A marine biologist measured mantle length (mm) of {n} common cuttlefish (*Sepia officinalis*) caught by trawl survey in a coastal embayment.", unit: "mm", variable: "mean mantle length" },
  ];

  const sc = pick(rng, scenarios);
  const n = randInt(rng, 8, 22);
  const trueMu = randBetween(rng, 20, 80);
  const trueSD = randBetween(rng, trueMu * 0.08, trueMu * 0.2);
  const data = Array.from({ length: n }, () => trueMu + normalApprox(rng) * trueSD);
  const dm = mean(data); const ds = sampleSd(data);
  const adj = data.map(x => trueMu + (x - dm) * (trueSD / ds));

  const yBar = round(mean(adj), 3);
  const s = round(sampleSd(adj), 3);
  const se = round(s / Math.sqrt(n), 4);
  const df = n - 1;
  const tCrit = round(lookupTCritical(df, 0.05), 3);
  const lo = round(yBar - tCrit * se, 3);
  const hi = round(yBar + tCrit * se, 3);

  const dataStr = adj.map(x => round(x, 2)).join(", ");
  const qText = sc.context.replace("{n}", String(n)) +
    `\n\n${dataStr}\n\nCalculate the 95% confidence interval for the ${sc.variable}. Use α = 0.05.`;

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: "95% Confidence Interval for the Mean (t-based)" },
    { kind: "formula",
      label: "Sample mean",
      formula: `$\\bar{y} = \\sum y_i / n$`,
      result: `$\\bar{y} = ${yBar}$ ${sc.unit}` },
    { kind: "formula",
      label: "Sample SD",
      formula: `$s = \\sqrt{\\sum(y_i - \\bar{y})^2 / (n-1)}$`,
      result: `$s = ${s}$ ${sc.unit}` },
    { kind: "formula",
      label: "Standard error",
      formula: `$SE = s / \\sqrt{n} = ${s} / \\sqrt{${n}}$`,
      result: `$SE = ${se}$ ${sc.unit}` },
    { kind: "text",    text: `$df = n - 1 = ${df}$;  $t^*_{0.05(2),\\,${df}} = ${tCrit}$` },
    { kind: "formula",
      label: "95% CI",
      formula: `$\\bar{y} \\pm t^* \\times SE = ${yBar} \\pm ${tCrit} \\times ${se}$`,
      result: `$95\\%\\text{ CI} = (${lo},\\,${hi})$ ${sc.unit}` },
    { kind: "conclusion", text: `We are $95\\%$ confident that the true ${sc.variable} lies between $${lo}$ and $${hi}$ ${sc.unit}.` },
  ];

  return {
    id: `ci-mean-${Date.now()}`,
    testType: "ci-mean",
    category: "calculable",
    chapter: 4,
    questionText: qText,
    answerBlocks: blocks,
  };
}

// ─── IDENTIFY-ONLY GENERATORS ─────────────────────────────────────────────────

export function generateIdentifyOnly(testType: TestType, rng: () => number): GeneratedQuestion {
  const info: Record<string, { chapter: number; question: string; testName: string; whenToUse: string; assumptions: string[]; variables: string[]; calculable?: true }> = {
    "ci-mean": {
      chapter: 4, calculable: true,
      testName: "95% Confidence Interval for Mean",
      question: "A biologist measured resting heart rate (bpm) in 18 wild-caught marmots. She wants to estimate the true population mean and express the uncertainty of that estimate. What technique should she use?",
      whenToUse: "When you want to estimate the true value of a population mean from a sample. Gives a range of plausible values for μ at the chosen confidence level (usually 95%).",
      assumptions: ["Random sample", "Sample mean approximately normally distributed (by CLT or normal population)"],
      variables: ["$\\bar{y}$ (sample mean)", "$s$ (sample SD)", "$n$ (sample size)", "$t^*$ (critical value, $df = n-1$)"],
    },
    "binomial": {
      chapter: 7, calculable: true,
      testName: "Binomial Test",
      question: "A geneticist crosses two heterozygous parents and observes 47 offspring with the dominant phenotype out of 60 total. She wants to test whether the true proportion matches the Mendelian expectation of 0.75. Which test is most appropriate?",
      whenToUse: "When testing whether a sample proportion matches a hypothesised proportion p₀. Data must be binary (success/failure) with independent observations and a fixed n.",
      assumptions: ["Binary outcomes (success / failure)", "Independent observations", "Fixed sample size n"],
      variables: ["$X$ (number of successes)", "$n$ (number of trials)", "$p_0$ (hypothesised proportion)"],
    },
    "chi-square-gof": {
      chapter: 8, calculable: true,
      testName: "Chi-Square Goodness-of-Fit Test",
      question: "A researcher recorded the number of birds visiting four feeder types (seed, suet, fruit, nectar) across 200 visits and wants to test whether birds visit each type equally often. Which test should she use?",
      whenToUse: "When comparing observed counts in two or more categories to expected counts from a null hypothesis. Tests whether data fit a specified frequency distribution.",
      assumptions: ["Count data", "Independent observations", "Expected count ≥ 1 in each category; no more than 20% of categories have expected count < 5"],
      variables: ["$O_i$ (observed count)", "$E_i$ (expected count)", "$k$ (number of categories)", "$df = k-1$"],
    },
    "poisson-gof": {
      chapter: 8, calculable: true,
      testName: "Poisson Goodness-of-Fit Test",
      question: "An ecologist counted rare plant species per 1 km² quadrat across 50 quadrats and wants to test whether the counts follow a Poisson distribution. Which test should she use?",
      whenToUse: "When testing whether count data follow a Poisson distribution. A special case of chi-square GOF where expected frequencies come from a fitted Poisson model.",
      assumptions: ["Count data (non-negative integers)", "Independent observations", "Expected frequency ≥ 1 in each category after grouping tails"],
      variables: ["$O_i$ (observed frequency)", "$E_i$ (expected Poisson, rate $\\hat{\\lambda}$)", "$df = \\text{categories}-2$ (one df lost estimating $\\lambda$)"],
    },
    "chi-square-contingency": {
      chapter: 9, calculable: true,
      testName: "Chi-Square Contingency Test",
      question: "A researcher recorded whether 200 patients recovered (yes/no) after receiving one of two treatments (A/B), forming a 2×2 table. All expected cell counts are ≥ 5. She wants to test whether treatment and recovery are associated. Which test is most appropriate?",
      whenToUse: "When testing the association between two categorical variables. Data form a contingency table of counts. Use when no more than 20% of expected cell counts are below 5, and no expected count is below 1.",
      assumptions: ["Two categorical variables", "Independent observations", "No more than 20% of expected counts < 5, and no expected count < 1 (otherwise use Fisher's Exact)"],
      variables: ["$O_{ij}$ (observed count)", "$E_{ij} = (\\text{row} \\times \\text{col})/\\text{grand total}$", "$df = (r-1)(c-1)$"],
    },
    "one-sample-t": {
      chapter: 11, calculable: true,
      testName: "One-Sample t-Test",
      question: "A physiologist measured blood oxygen saturation (%) in 12 patients and wants to test whether their mean differs from the known healthy population value of 98%. Which test is appropriate?",
      whenToUse: "When testing whether a sample mean equals a specific hypothesised value μ₀. Used for a single group of continuous, approximately normally distributed data.",
      assumptions: ["Random sample", "Continuous measurement", "Population approximately normal or n large enough for CLT"],
      variables: ["$\\bar{y}$ (sample mean)", "$\\mu_0$ (hypothesised mean)", "$s$ (sample SD)", "$n$", "$df = n-1$"],
    },
    "two-sample-t": {
      chapter: 12, calculable: true,
      testName: "Two-Sample t-Test (Pooled Variance)",
      question: "A nutritionist assigned 15 subjects to a high-protein diet and 15 to a standard diet, then measured weight loss (kg) after 8 weeks. She wants to compare mean weight loss between the two independent groups. Variances appear equal. Which test is appropriate?",
      whenToUse: "When comparing means of two independent groups of continuous, approximately normal data with similar variances.",
      assumptions: ["Two independent groups", "Continuous data, approximately normal", "Variances approximately equal"],
      variables: ["$\\bar{y}_1,\\,\\bar{y}_2$ (group means)", "$s^2_p$ (pooled variance)", "$n_1,\\,n_2$", "$df = n_1+n_2-2$"],
    },
    "paired-t": {
      chapter: 12, calculable: true,
      testName: "Paired t-Test",
      question: "A researcher measured blood pressure before and after a 6-week exercise programme in the same 20 participants. She wants to test whether the programme changed mean blood pressure. Which test is appropriate?",
      whenToUse: "When the same subjects are measured twice, or subjects are matched into pairs. Reduces variability by analysing within-pair differences.",
      assumptions: ["Paired/matched observations", "Differences are approximately normally distributed", "Pairs are independent of each other"],
      variables: ["$\\bar{d}$ (mean of differences)", "$s_d$ (SD of differences)", "$n$ (number of pairs)", "$df = n-1$"],
    },
    "anova": {
      chapter: 15, calculable: true,
      testName: "One-Way ANOVA",
      question: "A plant biologist measured stem height (cm) in seedlings grown under four light conditions (red, blue, white, dark). She wants to test whether mean stem height differs among the four groups. Which test is most appropriate?",
      whenToUse: "When comparing means of three or more independent groups on a continuous variable. Tests whether at least one group mean differs.",
      assumptions: ["Three or more independent groups", "Continuous data, residuals approximately normal", "Homogeneity of variance across groups"],
      variables: ["$MS_{groups}$", "$MS_{error}$", "$F = MS_{groups} / MS_{error}$", "$df_{groups} = k-1,\\;df_{error} = N-k$"],
    },
    "correlation": {
      chapter: 16, calculable: true,
      testName: "Pearson Correlation Coefficient",
      question: "An ecologist measured body mass (g) and wing span (mm) in 35 migratory birds. She wants to quantify the strength and direction of the linear association between these two continuous, normally distributed variables. Which statistic/test should she use?",
      whenToUse: "When quantifying the linear association between two continuous, approximately normally distributed variables with no major outliers.",
      assumptions: ["Two continuous variables", "Linear relationship", "Both variables approximately normal", "No influential outliers"],
      variables: ["$r$ (Pearson correlation, $-1$ to $+1$)", "$SP_{xy}$", "$SS_x,\\;SS_y$", "$df = n-2$"],
    },
    "regression": {
      chapter: 17, calculable: true,
      testName: "Linear Regression (Slope t-Test)",
      question: "A physiologist measured sprint speed (m/s) as the response and muscle fibre diameter (μm) as the explanatory variable in 28 lizards. She wants to predict sprint speed from fibre diameter and test whether the slope differs significantly from zero. Which technique should she use?",
      whenToUse: "When predicting a continuous response from a continuous explanatory variable and/or testing whether the slope differs significantly from zero.",
      assumptions: ["Linear relationship between Y and X", "Residuals normally distributed with constant variance", "Independent observations"],
      variables: ["$b = SP_{xy}/SS_x$ (slope)", "$a$ (y-intercept)", "$SE_b$ (SE of slope)", "$t = b/SE_b,\\;df = n-2$"],
    },
    "mann-whitney": {
      chapter: 13,
      testName: "Mann-Whitney U Test",
      question: "A researcher compared wound-healing scores (an ordinal scale from 1–10) between patients treated with two different bandage types. The data are not normally distributed. Which statistical test is most appropriate, and what are its key features?",
      whenToUse: "When comparing the central tendency of two independent groups and the data are ordinal, or clearly non-normal with no easy transformation, and sample sizes are small (n ≤ 20 per group).",
      assumptions: ["Two independent groups", "Data are at least ordinal", "Observations within each group are independent"],
      variables: ["$U$ statistic", "$n_1,\\,n_2$ (sample sizes)"],
    },
    "wilcoxon": {
      chapter: 13,
      testName: "Wilcoxon Signed-Rank Test",
      question: "An ecologist measured plant height before and after treatment. The differences were clearly skewed. The researcher wants to test whether the treatment had an effect. Which test should be used?",
      whenToUse: "Non-parametric alternative to the paired t-test. Use when paired differences are non-normal and cannot be transformed.",
      assumptions: ["Paired data", "Differences are symmetric around the median (less strict than normality)", "Observations are independent between pairs"],
      variables: ["$W$ statistic (sum of signed ranks)", "$n$ (non-zero differences)"],
    },
    "kruskal-wallis": {
      chapter: 15,
      testName: "Kruskal-Wallis Test",
      question: "A biologist compared pain scores (1–10 ordinal scale) among three experimental animal groups. The scores are severely non-normal. Which test should be used?",
      whenToUse: "Non-parametric alternative to one-way ANOVA. Use when comparing three or more groups and data are ordinal or strongly non-normal.",
      assumptions: ["Three or more independent groups", "Data are at least ordinal", "Observations within groups are independent"],
      variables: ["$H$ statistic ($\\approx \\chi^2$, $df = k-1$)", "$k$ (number of groups)", "$N$ (total sample size)"],
    },
    "spearman": {
      chapter: 16,
      testName: "Spearman Rank Correlation (r_s)",
      question: "A researcher measured two variables that are clearly monotonically but not linearly related. One variable contains outliers. Should Pearson or Spearman correlation be used? Describe the appropriate test.",
      whenToUse: "When the relationship is monotonic (not necessarily linear), data are ordinal, or there are influential outliers that make Pearson's r unreliable.",
      assumptions: ["Monotonic relationship", "Data are at least ordinal", "Observations are independent"],
      variables: ["$r_s$ (rank correlation, $-1$ to $+1$)", "$d_i$ (rank difference per pair)", "$n$ (number of pairs)"],
    },
    "fishers-exact": {
      chapter: 9,
      testName: "Fisher's Exact Test",
      question: "A researcher obtained a 2×2 contingency table where more than 20% of expected cell counts are below 5, and one cell has an expected count below 1. Should a chi-square test or Fisher's exact test be used? Describe the appropriate test.",
      whenToUse: "When analysing a 2×2 contingency table where expected cell frequencies are too small for the chi-square approximation (more than 20% of cells have expected count < 5, or any expected count < 1). Gives exact P-values using the hypergeometric distribution.",
      assumptions: ["2×2 contingency table", "Row and/or column totals are fixed", "Observations are independent"],
      variables: ["No test statistic — uses hypergeometric distribution directly", "$a, b, c, d$ (cell counts)", "Row and column totals"],
    },
    "multifactor-anova": {
      chapter: 18,
      testName: "Multifactor ANOVA",
      question: "A plant ecologist measured seedling growth rate (cm/week) under two light regimes (low, high) and two soil nitrogen levels (low, high) — four treatment combinations with 8 plants each. She wants to test whether light, nitrogen, or their interaction significantly affects growth rate. Which statistical test is most appropriate?",
      whenToUse: "When comparing means of a continuous response variable across combinations of two or more categorical explanatory variables (factors). Can simultaneously test each factor's main effect and whether the factors interact.",
      assumptions: ["Independent observations", "Continuous response variable, residuals approximately normal", "Homogeneity of variance across all treatment combinations", "Balanced or near-balanced design preferred"],
      variables: ["$MS_{factor}$ (per main effect/interaction)", "$MS_{error}$", "$F = MS_{factor} / MS_{error}$ (per effect)", "$df_{factor} = \\text{levels}-1,\\;df_{int} = df_A \\times df_B,\\;df_{error} = N-\\text{groups}$"],
    },
    "ancova": {
      chapter: 18,
      testName: "ANCOVA (Analysis of Covariance)",
      question: "A researcher compared mean body mass (g) of lizards from two habitat types (rocky vs. sandy), but body length (cm) strongly predicts mass. She wants to compare mass between habitats while statistically controlling for differences in body length. Which test is appropriate, and what are its key features?",
      whenToUse: "When comparing means of a continuous response variable across categorical groups while statistically controlling for the effect of a continuous covariate. Combines ANOVA and regression to increase power and remove covariate-related variation.",
      assumptions: ["Independence of observations", "Linear relationship between the response and the covariate within groups", "Homogeneity of regression slopes (the covariate–response relationship is the same in all groups)", "Residuals approximately normally distributed with equal variance"],
      variables: ["Group (categorical factor)", "Covariate (continuous)", "Adjusted group means", "$F$ for group effect (covariate-controlled)", "$df_{groups} = k-1,\\;df_{error} = N-k-1$"],
    },
    "sign-test": {
      chapter: 13,
      testName: "Sign Test",
      question: "A researcher has paired observations and wants to test whether one condition tends to give higher values than the other, but the differences are non-normal with outliers. Describe the simplest appropriate non-parametric test.",
      whenToUse: "The simplest non-parametric test for paired data. Used when paired differences cannot be assumed normal and the researcher only needs to test the direction of differences (not magnitude).",
      assumptions: ["Paired data", "Differences are independent", "No other distributional assumptions needed"],
      variables: ["$S$ (pairs where difference matches predicted direction)", "$n$ (non-zero differences)"],
    },
  };

  const entry = info[testType];
  if (!entry) {
    return {
      id: `identify-${testType}-${Date.now()}`,
      testType,
      category: "identify-only",
      chapter: 13,
      questionText: `Describe the ${TEST_LABELS[testType]}.`,
      answerBlocks: [{ kind: "text", text: "No detailed entry for this test type." }],
    };
  }

  const blocks: AnswerBlock[] = [
    { kind: "heading", text: `Test: ${entry.testName}` },
    { kind: "heading", text: "When to use" },
    { kind: "text",    text: entry.whenToUse },
    { kind: "heading", text: "Assumptions" },
    { kind: "list",    items: entry.assumptions },
    { kind: "heading", text: "Key variables / test statistic" },
    { kind: "list",    items: entry.variables },
    { kind: "conclusion", text: entry.calculable
        ? "You are required to both identify AND calculate this test in BIOL 300."
        : "BIOL 300 students need to know WHEN to use this test and its assumptions, but are NOT required to perform the calculation." },
  ];

  return {
    id: `identify-${testType}-${Date.now()}`,
    testType,
    category: "identify-only",
    chapter: entry.chapter,
    questionText: entry.question,
    answerBlocks: blocks,
  };
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────

// Calculable test types by chapter
const CALCULABLE_BY_CHAPTER: Array<{ type: TestType; chapter: number }> = [
  { type: "ci-mean",                chapter: 4  },
  { type: "binomial",               chapter: 7  },
  { type: "chi-square-gof",         chapter: 8  },
  { type: "poisson-gof",            chapter: 8  },
  { type: "chi-square-contingency", chapter: 9  },
  { type: "one-sample-t",           chapter: 11 },
  { type: "two-sample-t",           chapter: 12 },
  { type: "paired-t",               chapter: 12 },
  { type: "anova",                  chapter: 15 },
  { type: "correlation",            chapter: 16 },
  { type: "regression",             chapter: 17 },
];

const IDENTIFY_ONLY: TestType[] = [
  "mann-whitney", "kruskal-wallis",
  "spearman", "fishers-exact",
  "ancova", "multifactor-anova",
];

export type QuestionFilter = {
  maxChapter: number;
  testType: TestType | "random" | "calculable" | "identify-only";
};

export function generateQuestion(filter: QuestionFilter, seed?: number): GeneratedQuestion {
  const rng = mulberry32(seed ?? Date.now());

  const { maxChapter, testType } = filter;

  // Build pool of available test types
  let pool: TestType[] = [];

  if (testType === "random" || testType === "calculable") {
    pool = [...pool, ...CALCULABLE_BY_CHAPTER
      .filter(e => e.chapter <= maxChapter)
      .map(e => e.type)];
  }
  if (testType === "random" || testType === "identify-only") {
    pool = [...pool, ...IDENTIFY_ONLY.filter(t => TEST_CHAPTER[t] <= maxChapter)];
  }

  // If a specific test type is requested
  if (testType !== "random" && testType !== "calculable" && testType !== "identify-only") {
    pool = [testType];
  }

  if (pool.length === 0) {
    return {
      id: "none",
      testType: "binomial",
      category: "calculable",
      chapter: 7,
      questionText: "No question types available for the selected chapter range. Try increasing the chapter limit.",
      answerBlocks: [],
    };
  }

  // Pick a test type from pool
  const chosen = pick(rng, pool) as TestType;

  // Dispatch to the right generator
  switch (chosen) {
    case "binomial":               return generateBinomial(rng);
    case "chi-square-gof":         return generateChiSquareGOF(rng);
    case "poisson-gof":            return generatePoissonGOF(rng);
    case "chi-square-contingency": return generateChiContingency(rng);
    case "one-sample-t":           return generateOneSampleT(rng);
    case "two-sample-t":
    case "welch-t":                return generateTwoSampleT(rng);
    case "paired-t":               return generatePairedT(rng);
    case "anova":                  return generateANOVA(rng);
    case "correlation":            return generateCorrelation(rng);
    case "regression":             return generateRegression(rng);
    case "ci-mean":                return generateCIMean(rng);
    default:                       return generateIdentifyOnly(chosen, rng);
  }
}
