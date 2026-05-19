export type NodeType = 'decision' | 'check' | 'outcome' | 'transform';

export interface FlowNode {
  id: string;
  type: NodeType;
  text: string;
  options?: FlowOption[];
  chapter?: number;
  isAdvanced?: boolean;
  note?: string;
}

export interface FlowOption {
  label: string;
  nextId: string;
}

// ─── ONE VARIABLE ─────────────────────────────────────────────────────────────

export const ONE_VAR_NODES: Record<string, FlowNode> = {
  'one-kind': {
    id: 'one-kind',
    type: 'decision',
    text: 'What kind of variable is your response/data?',
    options: [
      { label: 'Categorical', nextId: 'cat-freq-check' },
      { label: 'Numerical', nextId: 'num-disc-cont' },
    ],
  },
  'cat-freq-check': {
    id: 'cat-freq-check',
    type: 'check',
    text: 'Are you being asked if the data match a frequency distribution?',
    options: [
      { label: 'Yes', nextId: 'cat-how-many' },
    ],
  },
  'cat-how-many': {
    id: 'cat-how-many',
    type: 'decision',
    text: 'How many categories are there?',
    options: [
      { label: 'Exactly 2 categories', nextId: 'cat-2-p0-check' },
      { label: '2 or more categories', nextId: 'outcome-chi2-gof-prop' },
    ],
  },
  'cat-2-p0-check': {
    id: 'cat-2-p0-check',
    type: 'check',
    text: 'Are you being asked if the proportion equals a specific p₀?',
    options: [
      { label: 'Yes', nextId: 'outcome-binomial' },
    ],
  },
  'outcome-binomial': {
    id: 'outcome-binomial',
    type: 'outcome',
    text: 'Binomial Test',
    chapter: 7,
  },
  'outcome-chi2-gof-prop': {
    id: 'outcome-chi2-gof-prop',
    type: 'outcome',
    text: 'χ² Goodness-of-Fit Test (proportional or other distribution)',
    chapter: 8,
  },
  'num-disc-cont': {
    id: 'num-disc-cont',
    type: 'decision',
    text: 'Is the variable discrete or continuous?',
    options: [
      { label: 'Discrete', nextId: 'num-disc-poisson-check' },
      { label: 'Continuous (normal)', nextId: 'num-cont-mean-check' },
    ],
  },
  'num-disc-poisson-check': {
    id: 'num-disc-poisson-check',
    type: 'check',
    text: 'Are events randomly distributed in time or space (Poisson process)?',
    options: [
      { label: 'Yes', nextId: 'outcome-chi2-gof-poisson' },
    ],
  },
  'outcome-chi2-gof-poisson': {
    id: 'outcome-chi2-gof-poisson',
    type: 'outcome',
    text: 'χ² Goodness-of-Fit Test (Poisson distribution)',
    chapter: 8,
  },
  'num-cont-mean-check': {
    id: 'num-cont-mean-check',
    type: 'check',
    text: 'Are you asking if the mean equals a specific hypothesized value?',
    options: [
      { label: 'Yes', nextId: 'outcome-one-sample-t' },
    ],
  },
  'outcome-one-sample-t': {
    id: 'outcome-one-sample-t',
    type: 'outcome',
    text: 'One-Sample t-Test',
    chapter: 11,
  },
};

export const ONE_VAR_START = 'one-kind';

// ─── THREE VARIABLES ──────────────────────────────────────────────────────────

export const THREE_VAR_NODES: Record<string, FlowNode> = {
  'three-numerical-response': {
    id: 'three-numerical-response',
    type: 'check',
    text: 'Is there 1 numerical response variable?',
    options: [
      { label: 'Yes', nextId: 'three-explanatory' },
    ],
  },
  'three-explanatory': {
    id: 'three-explanatory',
    type: 'decision',
    text: 'What kind(s) of explanatory variable(s) are there?',
    options: [
      { label: '2 categorical', nextId: 'outcome-multifactor-anova' },
      { label: '1 categorical + 1 continuous', nextId: 'outcome-ancova' },
    ],
  },
  'outcome-multifactor-anova': {
    id: 'outcome-multifactor-anova',
    type: 'outcome',
    text: 'Multifactor ANOVA',
    chapter: 18,
    note: 'Identify-only in BIOL 300',
  },
  'outcome-ancova': {
    id: 'outcome-ancova',
    type: 'outcome',
    text: 'ANCOVA',
    chapter: 18,
    note: 'Identify-only in BIOL 300',
  },
};

export const THREE_VAR_START = 'three-numerical-response';

// ─── TWO VARIABLES ────────────────────────────────────────────────────────────

export const TWO_VAR_NODES: Record<string, FlowNode> = {
  'two-exp-kind': {
    id: 'two-exp-kind',
    type: 'decision',
    text: 'What kind of explanatory variable do you have?',
    options: [
      { label: 'Categorical', nextId: 'two-cat-exp-resp-kind' },
      { label: 'Numerical', nextId: 'two-num-exp-resp-kind' },
    ],
  },

  // ── Categorical explanatory ───────────────────────────────────────────────
  'two-cat-exp-resp-kind': {
    id: 'two-cat-exp-resp-kind',
    type: 'decision',
    text: 'What kind of response variable do you have?',
    options: [
      { label: 'Categorical', nextId: 'two-cat-cat-sample-size' },
      { label: 'Numerical', nextId: 'two-cat-num-means-or-var' },
    ],
  },
  'two-cat-cat-sample-size': {
    id: 'two-cat-cat-sample-size',
    type: 'check',
    text: 'Are sample size assumptions met? (Expected count > 1 in all cells; no more than 20% of cells with expected count < 5)',
    options: [
      { label: 'Yes', nextId: 'outcome-chi2-contingency' },
      { label: 'No', nextId: 'outcome-fishers-exact' },
    ],
  },
  'outcome-chi2-contingency': {
    id: 'outcome-chi2-contingency',
    type: 'outcome',
    text: 'χ² Contingency Test',
    chapter: 9,
  },
  'outcome-fishers-exact': {
    id: 'outcome-fishers-exact',
    type: 'outcome',
    text: "Fisher's Exact Test",
    chapter: 9,
  },
  'two-cat-num-means-or-var': {
    id: 'two-cat-num-means-or-var',
    type: 'decision',
    text: 'Are you testing differences in means or variances?',
    options: [
      { label: 'Means', nextId: 'two-cat-means-how-many' },
      { label: 'Variances', nextId: 'outcome-levene' },
    ],
  },
  'outcome-levene': {
    id: 'outcome-levene',
    type: 'outcome',
    text: "Levene's Test",
    chapter: 12,
  },
  'two-cat-means-how-many': {
    id: 'two-cat-means-how-many',
    type: 'decision',
    text: 'How many categories does the explanatory variable have?',
    options: [
      { label: '2 categories', nextId: 'two-cat-means-2-paired' },
      { label: '2 or more categories', nextId: 'two-cat-means-many-normal' },
    ],
  },
  'two-cat-means-2-paired': {
    id: 'two-cat-means-2-paired',
    type: 'decision',
    text: 'Are the data paired (matched pairs or repeated measures)?',
    options: [
      { label: 'Yes', nextId: 'outcome-paired-t' },
      { label: 'No', nextId: 'two-cat-means-2-normal' },
    ],
  },
  'outcome-paired-t': {
    id: 'outcome-paired-t',
    type: 'outcome',
    text: 'Paired t-Test',
    chapter: 12,
  },
  'two-cat-means-2-normal': {
    id: 'two-cat-means-2-normal',
    type: 'check',
    text: 'Are the data approximately normally distributed?',
    options: [
      { label: 'Yes', nextId: 'two-cat-means-2-var-equal' },
      { label: 'No — try a transformation', nextId: 'two-cat-means-2-transform' },
    ],
  },
  'two-cat-means-2-var-equal': {
    id: 'two-cat-means-2-var-equal',
    type: 'check',
    text: 'Are the variances approximately equal between groups?',
    options: [
      { label: 'Yes', nextId: 'outcome-two-sample-t' },
      { label: 'No', nextId: 'outcome-welch-t' },
    ],
  },
  'outcome-two-sample-t': {
    id: 'outcome-two-sample-t',
    type: 'outcome',
    text: 'Two-Sample t-Test (pooled)',
    chapter: 12,
  },
  'outcome-welch-t': {
    id: 'outcome-welch-t',
    type: 'outcome',
    text: "Welch's t-Test",
    chapter: 12,
  },
  'two-cat-means-2-transform': {
    id: 'two-cat-means-2-transform',
    type: 'transform',
    text: 'Try a transformation (e.g. log, square root). Did it achieve approximate normality?',
    options: [
      { label: 'Yes — data are now approximately normal', nextId: 'two-cat-means-2-var-equal' },
      { label: "No — transformation doesn't help", nextId: 'outcome-mann-whitney' },
    ],
  },
  'outcome-mann-whitney': {
    id: 'outcome-mann-whitney',
    type: 'outcome',
    text: 'Mann-Whitney U Test',
    chapter: 13,
    note: 'Identify-only in BIOL 300',
  },
  'two-cat-means-many-normal': {
    id: 'two-cat-means-many-normal',
    type: 'check',
    text: 'Are the data approximately normally distributed within groups?',
    options: [
      { label: 'Yes', nextId: 'outcome-anova' },
      { label: 'No — try a transformation', nextId: 'two-cat-means-many-transform' },
    ],
  },
  'outcome-anova': {
    id: 'outcome-anova',
    type: 'outcome',
    text: 'One-Way ANOVA (use Tukey-Kramer for post-hoc pairwise comparisons)',
    chapter: 15,
  },
  'two-cat-means-many-transform': {
    id: 'two-cat-means-many-transform',
    type: 'transform',
    text: 'Try a transformation. Did it achieve approximate normality within groups?',
    options: [
      { label: 'Yes', nextId: 'outcome-anova' },
      { label: "No — transformation doesn't help", nextId: 'outcome-kruskal-wallis' },
    ],
  },
  'outcome-kruskal-wallis': {
    id: 'outcome-kruskal-wallis',
    type: 'outcome',
    text: 'Kruskal-Wallis Test',
    chapter: 13,
    note: 'Identify-only in BIOL 300',
  },

  // ── Numerical explanatory ─────────────────────────────────────────────────
  'two-num-exp-resp-kind': {
    id: 'two-num-exp-resp-kind',
    type: 'decision',
    text: 'What kind of response variable do you have?',
    options: [
      { label: 'Numerical', nextId: 'two-num-num-assoc-or-predict' },
      { label: 'Categorical (binary)', nextId: 'two-num-cat-binary-check' },
    ],
  },
  'two-num-num-assoc-or-predict': {
    id: 'two-num-num-assoc-or-predict',
    type: 'decision',
    text: 'Are you testing association, or seeking to predict Y from X?',
    options: [
      { label: 'Testing association / measuring relationship', nextId: 'two-num-assoc-normal' },
      { label: 'Predicting Y from X', nextId: 'two-num-predict-linear-check' },
    ],
  },
  'two-num-assoc-normal': {
    id: 'two-num-assoc-normal',
    type: 'check',
    text: 'Are assumptions of normality met for both variables?',
    options: [
      { label: 'Yes', nextId: 'outcome-correlation' },
      { label: 'No', nextId: 'outcome-spearman' },
    ],
  },
  'outcome-correlation': {
    id: 'outcome-correlation',
    type: 'outcome',
    text: 'Pearson Correlation Test',
    chapter: 16,
  },
  'outcome-spearman': {
    id: 'outcome-spearman',
    type: 'outcome',
    text: "Spearman's Rank Correlation",
    chapter: 13,
    note: 'Identify-only in BIOL 300',
  },
  'two-num-predict-linear-check': {
    id: 'two-num-predict-linear-check',
    type: 'check',
    text: 'Are the assumptions of linear regression met? (linearity, normal residuals, equal variance)',
    options: [
      { label: 'Yes', nextId: 'outcome-linear-regression' },
      { label: 'No — try transformation(s)', nextId: 'two-num-predict-transform' },
    ],
  },
  'outcome-linear-regression': {
    id: 'outcome-linear-regression',
    type: 'outcome',
    text: 'Linear Regression',
    chapter: 17,
  },
  'two-num-predict-transform': {
    id: 'two-num-predict-transform',
    type: 'transform',
    text: 'Try transformation(s) of X and/or Y. Did they resolve the assumption violations?',
    options: [
      { label: 'Yes', nextId: 'outcome-linear-regression' },
      { label: "No — transformations don't help", nextId: 'outcome-nonlinear' },
    ],
  },
  'outcome-nonlinear': {
    id: 'outcome-nonlinear',
    type: 'outcome',
    text: 'Polynomial regression, local smoothing, etc.',
    isAdvanced: true,
    note: 'Not covered in BIOL 300',
  },
  'two-num-cat-binary-check': {
    id: 'two-num-cat-binary-check',
    type: 'check',
    text: 'Is the categorical response variable binary (exactly 2 categories)?',
    options: [
      { label: 'Yes', nextId: 'outcome-logistic-regression' },
    ],
  },
  'outcome-logistic-regression': {
    id: 'outcome-logistic-regression',
    type: 'outcome',
    text: 'Logistic Regression',
    isAdvanced: true,
    note: 'Not covered in BIOL 300',
  },
};

export const TWO_VAR_START = 'two-exp-kind';
