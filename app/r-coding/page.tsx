"use client";

import { useState } from "react";
import Link from "next/link";

const GOLD       = "var(--gold)";
const GOLD_LIGHT = "var(--gold-light)";
const BLUE       = "var(--surface)";
const BLUE_DARK  = "var(--bg)";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ErrorType = "silent" | "wrong-arg" | "no-error" | "code-error";

interface RQuestion {
  id: string;
  title: string;
  topic: string;
  errorType: ErrorType;
  body: React.ReactNode;
  answer: React.ReactNode;
}

// ─── CODE BLOCK COMPONENTS ────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  return (
    <pre style={{
      margin: "10px 0",
      padding: "12px 16px",
      borderRadius: 8,
      background: "rgba(var(--text-rgb),0.05)",
      border: "1px solid rgba(var(--text-rgb),0.08)",
      fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
      fontSize: 13,
      lineHeight: 1.6,
      color: "var(--text)",
      overflowX: "auto",
      whiteSpace: "pre",
    }}>
      {children}
    </pre>
  );
}

function ROutput({ children }: { children: string }) {
  return (
    <pre style={{
      margin: "10px 0",
      padding: "12px 16px",
      borderRadius: 8,
      background: "rgba(var(--gold-rgb),0.04)",
      border: "1px solid rgba(var(--gold-rgb),0.15)",
      fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
      fontSize: 12.5,
      lineHeight: 1.7,
      color: "rgba(var(--text-rgb),0.75)",
      overflowX: "auto",
      whiteSpace: "pre",
    }}>
      {children}
    </pre>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13.5, color: "rgba(var(--text-rgb),0.65)", lineHeight: 1.75, margin: "10px 0" }}>
      {children}
    </p>
  );
}

// ─── QUESTION CARD ────────────────────────────────────────────────────────────

const ERROR_LABELS: Record<ErrorType, { label: string; color: string; bg: string }> = {
  "silent":     { label: "Silent error",   color: "var(--feedback-wrong-label)",   bg: "rgba(220,80,80,0.06)" },
  "wrong-arg":  { label: "Wrong argument", color: "var(--feedback-example-label)", bg: "rgba(var(--gold-rgb),0.06)" },
  "no-error":   { label: "No error",       color: "var(--feedback-correct-label)", bg: "rgba(134,197,120,0.06)" },
  "code-error": { label: "Code error",     color: "rgba(200,100,0,0.8)",           bg: "rgba(200,100,0,0.06)" },
};

function QuestionCard({ q, index }: { q: RQuestion; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const badge = ERROR_LABELS[q.errorType];

  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(var(--text-rgb),0.08)", background: "var(--surface)", overflow: "hidden", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(var(--text-rgb),0.06)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(var(--text-rgb),0.3)" }}>Q{index + 1}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(var(--gold-rgb),0.7)" }}>{q.topic}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.color}`, whiteSpace: "nowrap" }}>
            {revealed ? badge.label : "?"}
          </span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.4 }}>{q.title}</h3>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 22px" }}>
        {q.body}

        <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(var(--text-rgb),0.09)", background: "rgba(var(--text-rgb),0.02)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(var(--text-rgb),0.45)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Task</p>
          <p style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.65)", margin: 0, lineHeight: 1.6 }}>
            Please identify and explain any mistakes in the analysis or conclusions. If there are none, write <strong>"No mistakes"</strong>.
          </p>
        </div>

        {/* Reveal button */}
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "none", background: GOLD, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Show answer
          </button>
        )}
      </div>

      {/* Answer panel */}
      {revealed && (
        <div style={{ borderTop: "1px solid rgba(var(--text-rgb),0.07)", padding: "18px 22px", background: "rgba(var(--text-rgb),0.015)" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(var(--gold-rgb),0.6)", margin: "0 0 12px" }}>Answer</p>
          {q.answer}
        </div>
      )}
    </div>
  );
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────

const QUESTIONS: RQuestion[] = [
  {
    id: "q3-anova-wrong-function",
    title: "One-Way ANOVA: maze-completion time across sound conditions",
    topic: "One-Way ANOVA",
    errorType: "wrong-arg",
    body: (
      <>
        <Prose>
          A biology student is studying whether different types of "productivity music" affect how quickly lab mice complete a simple maze. Mice are randomly assigned to one of three sound conditions: <em>silence</em>, <em>classical</em>, or <em>lofi_beats</em>. The response variable is maze completion time (seconds), stored in a CSV file.
        </Prose>
        <Prose>The student imports and inspects the data:</Prose>
        <Code>{`# a.
mouseData <-
  read.csv("DataForLabs/MouseMazeMusicData.csv",
           stringsAsFactors = TRUE)

# b.
mouseData`}</Code>
        <ROutput>{`   maze_time sound_condition
1         42         silence
2         45         silence
3         44         silence
4         47         silence
5         43         silence
6         39       classical
7         41       classical
8         38       classical
9         40       classical
10        42       classical
11        35      lofi_beats
12        37      lofi_beats
13        36      lofi_beats
14        34      lofi_beats
15        38      lofi_beats`}</ROutput>
        <Prose>
          The student wants to test H₀: μ<sub>silence</sub> = μ<sub>classical</sub> = μ<sub>lofi_beats</sub> vs. H<sub>A</sub>: at least one group mean differs, with α&nbsp;=&nbsp;0.05. They write:
        </Prose>
        <Code>{`# c.
anova(maze_time ~ sound_condition, data = mouseData)`}</Code>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>Parts a and b are correct.</strong> The data are imported and printed without issue.
        </Prose>
        <Prose>
          <strong>Part c contains an error — the code will not run.</strong> The function <code>anova()</code> expects a fitted model object as its argument (i.e., the output of <code>lm()</code>). Passing a formula directly causes R to throw:
        </Prose>
        <ROutput>{`Error in UseMethod("anova") :
  no applicable method for 'anova' applied to an object of class "formula"`}</ROutput>
        <Prose>
          To fit a one-way ANOVA, the student should first fit the model with <code>lm()</code> and then pass the fitted object to <code>anova()</code>:
        </Prose>
        <Code>{`model <- lm(maze_time ~ sound_condition, data = mouseData)
anova(model)`}</Code>
        <ROutput>{`Analysis of Variance Table

Response: maze_time
                Df Sum Sq Mean Sq F value    Pr(>F)
sound_condition  2 168.13   84.07  28.993 2.542e-05 ***
Residuals       12  34.80    2.90
---
Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1`}</ROutput>
        <Prose>
          With the correct function, F = 28.99, df = (2, 12), p &lt; 0.001 — strong evidence against H₀.
        </Prose>
      </>
    ),
  },
  {
    id: "q2-paired-t-nonnormal",
    title: "Paired t-Test: biomarker levels before and after cancer therapy",
    topic: "Paired t-Test",
    errorType: "silent",
    body: (
      <>
        <Prose>
          A biomedical research lab is studying whether a new experimental cancer therapy changes the level of a blood biomarker associated with tumour activity (measured in ng/mL). The same 15 patients are measured before and after receiving the therapy. The researcher wants to test whether the therapy changes biomarker levels, with H₀: μ<sub>difference</sub> = 0 and H<sub>A</sub>: μ<sub>difference</sub> ≠ 0, using α&nbsp;=&nbsp;0.05. Paired differences are defined as <em>difference = before − after</em>.
        </Prose>
        <Code>{`before <- c(10.2, 11.4,  9.8, 12.1, 10.9,
            11.7, 10.5,  9.9, 12.8, 11.1,
            10.7, 12.3, 11.9, 10.8, 13.2)

after  <- c(10.1, 11.2,  9.5, 11.7, 10.4,
            11.1,  9.7,  8.9, 11.6,  9.6,
             8.7,  9.7,  8.5,  6.3,  7.2)

diff <- before - after
diff`}</Code>
        <ROutput>{`[1] 0.1 0.2 0.3 0.4 0.5 0.6 0.8 1.0 1.2 1.5 2.0 2.6 3.4 4.5 6.0`}</ROutput>
        <Prose>The researcher then produces a histogram of the differences:</Prose>
        <Code>{`hist(diff,
     main = "Histogram of Paired Differences",
     xlab = "Difference = Before - After",
     breaks = 0:6)`}</Code>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/histogram-paired-diff.png"
          alt="Histogram of paired differences showing right-skewed distribution"
          style={{ display: "block", maxWidth: "100%", borderRadius: 8, margin: "12px 0", border: "1px solid rgba(var(--text-rgb),0.08)" }}
        />
        <Prose>The researcher then runs:</Prose>
        <Code>{`t.test(before, after, paired = TRUE)`}</Code>
        <ROutput>{`\tPaired t-test

data:  before and after
t = 4.097, df = 14, p-value = 0.0011
alternative hypothesis: true mean difference is not equal to 0
95 percent confidence interval:
 1.006 3.180
sample estimates:
mean difference
          2.093`}</ROutput>
        <Prose>
          The researcher concludes: <em>"Because p = 0.0011 is less than α = 0.05, we reject the null hypothesis. There is statistically significant evidence that the experimental cancer therapy changes biomarker levels."</em>
        </Prose>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The normality assumption of the paired t-test is not met, yet the researcher proceeds without acknowledging this.</strong>
        </Prose>
        <Prose>
          The paired t-test requires that the paired differences are approximately normally distributed. With only n&nbsp;=&nbsp;15 pairs, this assumption is important — the Central Limit Theorem provides little protection at this sample size.
        </Prose>
        <Prose>
          The histogram clearly shows that the differences are <strong>right-skewed</strong>: 8 of the 15 differences fall in the [0, 1] bin, while the distribution has a long right tail extending to 6.0. This shape is inconsistent with normality.
        </Prose>
        <Prose>
          Before proceeding with the t-test, the researcher should have tried a transformation (e.g., log) to see whether it achieves approximate normality in the differences.
        </Prose>
        <Prose>
          Note that the code itself is correct: <code>t.test(before, after, paired = TRUE)</code> is the right function call for a paired test. The error is in the conclusion, which ignores the violated assumption flagged by the researcher's own Q-Q plot.
        </Prose>
      </>
    ),
  },
  {
    id: "q1-poisson-last-bin",
    title: "Poisson Goodness-of-Fit: immune cell counts per microscope field",
    topic: "Poisson GOF",
    errorType: "silent",
    body: (
      <>
        <Prose>
          A biomedical research lab is studying the number of fluorescently labelled immune cells observed per microscope field in tissue sections from an experimental inflammation model. The researchers want to test whether the number of labelled cells per field follows a Poisson distribution (α = 0.05). The true mean is unknown and is estimated from the data.
        </Prose>
        <Prose>The observed frequencies are:</Prose>
        <Code>{`obs <- c(17, 34, 30, 42, 13, 14)
names(obs) <- c("0", "1", "2", "3", "4", "5+")`}</Code>
        <Prose>This gives an estimated mean count of:</Prose>
        <Code>{`lambda <- 2.28`}</Code>
        <Prose>The researcher computes expected frequencies under a Poisson distribution:</Prose>
        <Code>{`exp <- dpois(0:5, lambda) * sum(obs)
exp`}</Code>
        <ROutput>{`       0        1        2        3        4        5
15.34263 34.98120 39.87857 30.30771 17.27540  7.87758 `}</ROutput>
        <Prose>The researcher first extracts the chi-squared test statistic:</Prose>
        <Code>{`chi_sq <- chisq.test(x = obs, p = exp, rescale.p = TRUE)$statistic
chi_sq`}</Code>
        <ROutput>{`X-squared
   12.472 `}</ROutput>
        <Prose>They then compute the p-value, manually specifying df = 4 to account for the estimated λ:</Prose>
        <Code>{`pchisq(q = 12.472, df = 4, lower.tail = FALSE)`}</Code>
        <ROutput>{`[1] 0.01422`}</ROutput>
        <Prose>
          The researcher concludes: <em>"Because p = 0.014 is less than α = 0.05, we reject the null hypothesis. The labelled immune-cell counts do not appear consistent with a Poisson distribution."</em>
        </Prose>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The last expected frequency uses P(X&nbsp;=&nbsp;5) instead of P(X&nbsp;≥&nbsp;5).</strong>
        </Prose>
        <Prose>
          The observed data correctly pool all counts of 5 or more into a single <code>"5+"</code> bin. However, the expected frequencies are computed with <code>dpois(0:5, lambda)</code>, which gives P(X&nbsp;=&nbsp;5) for the final element. Notice that R's output labels that last column <code>5</code>, not <code>5+</code> — a direct signal of the mismatch.
        </Prose>
        <Prose>
          Because a Poisson variable is unbounded, the last expected bin must capture the entire remaining tail: P(X&nbsp;≥&nbsp;5) = <code>1 − ppois(4, lambda)</code>. The correct code is:
        </Prose>
        <Code>{`exp_correct <- c(dpois(0:4, lambda), 1 - ppois(4, lambda)) * sum(obs)
chi_sq <- chisq.test(x = obs, p = exp_correct, rescale.p = TRUE)$statistic
chi_sq`}</Code>
        <Prose>
          This raises the last expected frequency from 7.88 to <strong>12.22</strong>. Re-running the test with the corrected expected values gives:
        </Prose>
        <ROutput>{`X-squared
    8.483 `}</ROutput>
        <Code>{`pchisq(q = 8.483, df = 4, lower.tail = FALSE)`}</Code>
        <ROutput>{`[1] 0.07542`}</ROutput>
        <Prose>
          With p&nbsp;=&nbsp;0.075&nbsp;&gt;&nbsp;0.05, we <strong>fail to reject</strong> H₀ — the opposite conclusion from the researcher's. The researcher's rejection of the Poisson model is an artefact of using the wrong expected probability for the last bin. Using <code>rescale.p = TRUE</code> masked the error by renormalising the incomplete probability vector, which changed the effective null hypothesis without producing any warning.
        </Prose>
      </>
    ),
  },

  // ── Q4 ───────────────────────────────────────────────────────────────────────
  {
    id: "q4-guppy-no-assignment",
    title: "Pearson Correlation: father ornamentation and son attractiveness in guppies",
    topic: "Correlation",
    errorType: "code-error" as ErrorType,
    body: (
      <>
        <Prose>
          A behavioural ecology lab is studying whether male guppies with more colourful ornamentation tend to have sons that score higher on a mate-attractiveness index. Two numerical variables are recorded per father–son pair: <em>fatherOrnamentation</em> and <em>sonAttractiveness</em>, stored in a CSV file. The student wants to test H₀:&nbsp;ρ&nbsp;=&nbsp;0 vs. H<sub>A</sub>:&nbsp;ρ&nbsp;≠&nbsp;0, with α&nbsp;=&nbsp;0.05.
        </Prose>
        <Prose>The student reads in the file:</Prose>
        <Code>{`# a.
read.csv("DataForLabs/GuppyAttractivenessData.csv",
         stringsAsFactors = TRUE)`}</Code>
        <ROutput>{`   fatherOrnamentation sonAttractiveness
1                  4.1               4.4
2                  5.3               5.6
3                  3.8               4.1
4                  6.2               6.5
5                  4.9               5.1
6                  7.0               7.4
7                  5.8               6.0
8                  6.5               6.8
9                  4.4               4.7
10                 7.3               7.6
11                 5.1               5.5
12                 6.8               7.0`}</ROutput>
        <Prose>They then try to calculate the correlation coefficient:</Prose>
        <Code>{`# b.
cor(guppyData$fatherOrnamentation,
    guppyData$sonAttractiveness)`}</Code>
        <Prose>They then try to run the correlation test:</Prose>
        <Code>{`# c.
cor.test(guppyData$fatherOrnamentation,
         guppyData$sonAttractiveness)`}</Code>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>Part a contains an error — the data frame was never saved to the Environment.</strong>
        </Prose>
        <Prose>
          The student wrote <code>read.csv(...)</code> without using the assignment operator <code>&lt;-</code>. This prints the data to the Console but does not create any object. When parts b and c then reference <code>guppyData</code>, R cannot find it.
        </Prose>
        <Prose>The correct code for part a is:</Prose>
        <Code>{`guppyData <-
  read.csv("DataForLabs/GuppyAttractivenessData.csv",
           stringsAsFactors = TRUE)`}</Code>
        <Prose>
          Once the data frame exists in the Environment, parts b and c run without error. The student's conclusion is wrong: the issue is not that correlation is impossible — it is that the data frame was never assigned to a name.
        </Prose>
      </>
    ),
  },

  // ── Q5 ───────────────────────────────────────────────────────────────────────
  {
    id: "q5-na-rm-missing",
    title: "Summary Statistics: blood biomarker concentration after experimental therapy",
    topic: "Missing Data",
    errorType: "silent" as ErrorType,
    body: (
      <>
        <Prose>
          A biomedical research team is measuring the concentration of a blood biomarker (ng/mL) in patients after receiving an experimental therapy. Some samples could not be processed due to equipment problems and are recorded as <code>NA</code>. The researcher wants to calculate the mean biomarker concentration.
        </Prose>
        <Code>{`biomarker <- c(8.4, 9.1, 7.8, NA, 10.2, 9.7,
               8.9, NA, 11.0, 9.4)

mean(biomarker)`}</Code>
        <ROutput>{`[1] NA`}</ROutput>
        <Prose>
          The researcher concludes: <em>"The mean biomarker concentration is missing, so these data cannot be summarized using the mean."</em>
        </Prose>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The code runs without error, but the researcher's conclusion is wrong.</strong>
        </Prose>
        <Prose>
          By default, <code>mean()</code> returns <code>NA</code> whenever any element of the vector is missing. This does not mean the mean cannot be calculated — it means R needs to be told explicitly to ignore the missing values. The correct code is:
        </Prose>
        <Code>{`mean(biomarker, na.rm = TRUE)`}</Code>
        <ROutput>{`[1] 9.3125`}</ROutput>
        <Prose>
          The argument <code>na.rm = TRUE</code> tells R to remove <code>NA</code> values before computing the mean. The same argument works for <code>sd()</code>, <code>median()</code>, and most other summary functions. The mean biomarker concentration is 9.31 ng/mL, calculated from the 8 non-missing observations.
        </Prose>
      </>
    ),
  },

  // ── Q6 ───────────────────────────────────────────────────────────────────────
  {
    id: "q6-filter-not-saved",
    title: "Filtering a Data Frame: mean resting heart rate in athletes",
    topic: "Data Wrangling",
    errorType: "silent" as ErrorType,
    body: (
      <>
        <Prose>
          A physiology lab is studying resting heart rate (beats per minute) in two groups: <em>athlete</em> and <em>non_athlete</em>. The student imports the data and views it:
        </Prose>
        <Code>{`heartData <-
  read.csv("DataForLabs/HeartRateData.csv",
           stringsAsFactors = TRUE)

heartData`}</Code>
        <ROutput>{`  participant       group resting_hr
1           1     athlete         52
2           2     athlete         55
3           3     athlete         49
4           4     athlete         58
5           5 non_athlete         71
6           6 non_athlete         76
7           7 non_athlete         69
8           8 non_athlete         74`}</ROutput>
        <Prose>The student wants to calculate the mean resting heart rate for athletes only. They run:</Prose>
        <Code>{`filter(heartData, group == "athlete")`}</Code>
        <ROutput>{`  participant   group resting_hr
1           1 athlete         52
2           2 athlete         55
3           3 athlete         49
4           4 athlete         58`}</ROutput>
        <Prose>Then they calculate the mean:</Prose>
        <Code>{`mean(heartData$resting_hr)`}</Code>
        <ROutput>{`[1] 63`}</ROutput>
        <Prose>
          The student concludes: <em>"The mean resting heart rate for athletes is 63 beats per minute."</em>
        </Prose>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The filter output was never saved, so the mean was calculated on the full data frame.</strong>
        </Prose>
        <Prose>
          <code>filter(heartData, group == "athlete")</code> printed the filtered rows to the Console but did not modify <code>heartData</code> or create any new object. When the student then ran <code>mean(heartData$resting_hr)</code>, they were averaging all 8 participants — both athletes and non-athletes — giving a mean of 63.
        </Prose>
        <Prose>The filtered data needs to be assigned to a new object:</Prose>
        <Code>{`athleteData <- filter(heartData, group == "athlete")
mean(athleteData$resting_hr)`}</Code>
        <ROutput>{`[1] 53.5`}</ROutput>
        <Prose>
          The correct mean resting heart rate for athletes is <strong>53.5 beats per minute</strong>. The value 63 was the mean across all participants.
        </Prose>
      </>
    ),
  },

  // ── Q7 ───────────────────────────────────────────────────────────────────────
  {
    id: "q7-single-equals-filter",
    title: "Filtering a Data Frame: bacterial colony counts by treatment condition",
    topic: "R Syntax",
    errorType: "code-error" as ErrorType,
    body: (
      <>
        <Prose>
          A microbiology lab is studying bacterial colony counts under two treatment conditions: <em>control</em> and <em>antibiotic</em>. The student imports the data:
        </Prose>
        <Code>{`colonyData <-
  read.csv("DataForLabs/BacterialColonyData.csv",
           stringsAsFactors = TRUE)

colonyData`}</Code>
        <ROutput>{`  plate  treatment colonies
1     1    control       82
2     2    control       88
3     3    control       79
4     4    control       91
5     5 antibiotic       35
6     6 antibiotic       42
7     7 antibiotic       39
8     8 antibiotic       37`}</ROutput>
        <Prose>The student wants to keep only the antibiotic plates. They run:</Prose>
        <Code>{`filter(colonyData, treatment = "antibiotic")`}</Code>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The student used a single <code>=</code> instead of double <code>==</code> inside <code>filter()</code>.</strong>
        </Prose>
        <Prose>
          In R, <code>=</code> is used for argument assignment (e.g., <code>mean(x, na.rm = TRUE)</code>). To <em>test equality</em> in a logical condition, you must use <code>==</code>. Inside <code>filter()</code>, the condition is evaluated as a logical expression, so <code>==</code> is required:
        </Prose>
        <Code>{`filter(colonyData, treatment == "antibiotic")`}</Code>
        <ROutput>{`  plate  treatment colonies
1     5 antibiotic       35
2     6 antibiotic       42
3     7 antibiotic       39
4     8 antibiotic       37`}</ROutput>
        <Prose>
          The student's conclusion is wrong: R can filter character variables without issue. The error was caused entirely by using <code>=</code> instead of <code>==</code>.
        </Prose>
      </>
    ),
  },

  // ── Q8 ───────────────────────────────────────────────────────────────────────
  {
    id: "q8-log-transform-not-saved",
    title: "Linear Regression: brain size and body size in mammals",
    topic: "Linear Regression",
    errorType: "silent" as ErrorType,
    body: (
      <>
        <Prose>
          A biology student is studying whether mammal body size predicts brain size. The lab notes explain that for linear regression, the student should inspect the scatterplot, fit a model with <code>lm()</code>, then use <code>summary()</code> and <code>residuals()</code> to evaluate the regression assumptions.
        </Prose>
        <Prose>The student imports the data and inspects the relationship:</Prose>
        <Code>{`mammalData <- read.csv(
  "DataForLabs/mammals.csv",
  stringsAsFactors = TRUE
)

plot(brainSize ~ bodySize, data = mammalData)`}</Code>
        <Prose>
          The scatterplot looks strongly curved, so the student decides to log-transform both variables:
        </Prose>
        <Code>{`log(mammalData$brainSize)
log(mammalData$bodySize)`}</Code>
        <Prose>They then fit a regression and inspect the results:</Prose>
        <Code>{`mammalRegression <- lm(brainSize ~ bodySize, data = mammalData)
summary(mammalRegression)`}</Code>
        <ROutput>{`Call:
lm(formula = brainSize ~ bodySize, data = mammalData)

Coefficients:
             Estimate Std. Error t value Pr(>|t|)
(Intercept)  91.004     43.599   2.087   0.0413 *
bodySize      0.966      0.090  10.750   <2e-16 ***

Residual standard error: 340.8 on 60 degrees of freedom
Multiple R-squared:  0.658,	Adjusted R-squared:  0.652
F-statistic: 115.6 on 1 and 60 DF,  p-value: < 2.2e-16`}</ROutput>
        <Prose>
          The student concludes: <em>"Even after log-transforming both variables, the relationship still looks non-linear, so linear regression is probably inappropriate."</em>
        </Prose>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The log transformations were never saved, so the regression was fit on the original untransformed data.</strong>
        </Prose>
        <Prose>
          The student wrote:
        </Prose>
        <Code>{`log(mammalData$brainSize)
log(mammalData$bodySize)`}</Code>
        <Prose>
          These lines calculate the log-transformed values and print them to the Console, but they do not update the data frame. <code>mammalData$brainSize</code> and <code>mammalData$bodySize</code> are unchanged. So when the student calls <code>lm(brainSize ~ bodySize, data = mammalData)</code>, it is still fitting the model on the original curved data.
        </Prose>
        <Prose>The correct approach is to save the transformed variables back into the data frame, then use them in the model:</Prose>
        <Code>{`mammalData$logBrainSize <- log(mammalData$brainSize)
mammalData$logBodySize  <- log(mammalData$bodySize)

mammalRegression <- lm(logBrainSize ~ logBodySize, data = mammalData)
summary(mammalRegression)`}</Code>
        <Prose>
          The student's conclusion is wrong because the log transformation was never actually applied to the regression. <code>mammalRegression</code> exists and runs without error — which makes this mistake easy to miss.
        </Prose>
      </>
    ),
  },

  // ── Q10 ──────────────────────────────────────────────────────────────────────
  {
    id: "q10-model-does-not-update",
    title: "Linear Regression: CRP and tumour size in cancer patients",
    topic: "Linear Regression",
    errorType: "silent" as ErrorType,
    body: (
      <>
        <Prose>
          A biomedical researcher is studying whether blood levels of an inflammatory biomarker (CRP, in mg/L) predict tumour size (mm). Because CRP values are strongly right-skewed, the researcher decides to log-transform CRP before fitting the regression.
        </Prose>
        <Prose>They import the data and inspect the first few rows:</Prose>
        <Code>{`cancerData <- read.csv(
  "DataForLabs/CancerInflammationData.csv",
  stringsAsFactors = TRUE
)

head(cancerData)`}</Code>
        <ROutput>{`  patient_id tumour_size_mm CRP_mg_L
1          1           18.4      1.2
2          2           21.7      2.1
3          3           26.5      4.8
4          4           29.9      7.5
5          5           31.2     11.3
6          6           39.4     28.6`}</ROutput>
        <Prose>The researcher then runs the following code:</Prose>
        <Code>{`cancerRegression <- lm(tumour_size_mm ~ CRP_mg_L, data = cancerData)

cancerData$logCRP <- log(cancerData$CRP_mg_L)

summary(cancerRegression)`}</Code>
        <ROutput>{`Call:
lm(formula = tumour_size_mm ~ CRP_mg_L, data = cancerData)

Coefficients:
            Estimate Std. Error t value Pr(>|t|)
(Intercept)  20.8341     1.4823  14.056   <2e-16 ***
CRP_mg_L      0.6214     0.0891   6.974  8.3e-08 ***

Residual standard error: 5.84 on 38 degrees of freedom
Multiple R-squared:  0.5614,	Adjusted R-squared:  0.5499
F-statistic: 48.64 on 1 and 38 DF,  p-value: 8.3e-08`}</ROutput>
        <Prose>
          The researcher concludes: <em>"After log-transforming CRP, there is evidence that CRP predicts tumour size (p &lt; 0.001). The slope tells us the effect of log-transformed CRP on tumour size."</em>
        </Prose>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The log transformation was created after the model was already fitted, so the regression used the original untransformed variable.</strong>
        </Prose>
        <Prose>
          The researcher ran <code>lm()</code> on line 1, then created <code>logCRP</code> on line 2. A fitted model object in R does not maintain a live connection to the data frame — it captures the data at the time it was called. Adding <code>logCRP</code> to <code>cancerData</code> afterwards has no effect on <code>cancerRegression</code>.
        </Prose>
        <Prose>
          The formula in the output confirms this: <code>lm(formula = tumour_size_mm ~ CRP_mg_L, ...)</code> — not <code>logCRP</code>. The slope of 0.621 is the effect of one mg/L increase in <em>untransformed</em> CRP, not log-transformed CRP.
        </Prose>
        <Prose>The correct code is to transform first, then fit:</Prose>
        <Code>{`cancerData$logCRP <- log(cancerData$CRP_mg_L)

cancerRegression <- lm(tumour_size_mm ~ logCRP, data = cancerData)

summary(cancerRegression)`}</Code>
        <Prose>
          The conclusion is wrong because it interprets the slope as if <code>logCRP</code> was used, when in fact the model used <code>CRP_mg_L</code>. Any valid conclusion must be based on the model that was actually fitted.
        </Prose>
      </>
    ),
  },

  // ── Q9 ───────────────────────────────────────────────────────────────────────
  {
    id: "q9-cor-not-cor-test",
    title: "Pearson Correlation: soil pH and plant species richness in meadows",
    topic: "Correlation",
    errorType: "silent" as ErrorType,
    body: (
      <>
        <Prose>
          An ecologist is studying whether soil pH predicts plant species richness across 12 meadow plots. Each plot has a recorded soil pH and a species count. The student wants to test whether there is a linear correlation between the two variables, with H₀:&nbsp;ρ&nbsp;=&nbsp;0 vs. H<sub>A</sub>:&nbsp;ρ&nbsp;≠&nbsp;0, using α&nbsp;=&nbsp;0.05.
        </Prose>
        <Prose>The student imports and views the data:</Prose>
        <Code>{`meadowData <-
  read.csv("DataForLabs/MeadowData.csv",
           stringsAsFactors = TRUE)

meadowData`}</Code>
        <ROutput>{`   plotID soilpH richness
1       1    5.8        8
2       2    6.2       12
3       3    5.4        7
4       4    7.1       18
5       5    6.8       15
6       6    5.9        9
7       7    7.3       20
8       8    6.0       11
9       9    7.0       17
10     10    5.6        6
11     11    6.5       14
12     12    6.9       16`}</ROutput>
        <Prose>They then produce a scatterplot and calculate the correlation:</Prose>
        <Code>{`plot(richness ~ soilpH, data = meadowData)

cor(meadowData$soilpH, meadowData$richness)`}</Code>
        <ROutput>{`[1] 0.5214`}</ROutput>
        <Prose>
          The student concludes: <em>"r&nbsp;=&nbsp;0.521, which indicates a moderate positive correlation. Since r&nbsp;&gt;&nbsp;0.5, the relationship between soil pH and species richness is statistically significant at α&nbsp;=&nbsp;0.05."</em>
        </Prose>
      </>
    ),
    answer: (
      <>
        <Prose>
          <strong>The student used <code>cor()</code>, which returns only the correlation coefficient — not a p-value. Significance cannot be determined from r alone.</strong>
        </Prose>
        <Prose>
          The rule "r &gt; 0.5 implies significance" is incorrect. Whether r is statistically significant depends on both its magnitude <em>and</em> the sample size. With a small sample, even a moderate r may not be significant; with a very large sample, even a tiny r can be.
        </Prose>
        <Prose>
          The correct function is <code>cor.test()</code>, which performs the hypothesis test and returns a p-value:
        </Prose>
        <Code>{`cor.test(meadowData$soilpH, meadowData$richness)`}</Code>
        <ROutput>{`\tPearson's product-moment correlation

data:  meadowData$soilpH and meadowData$richness
t = 1.930, df = 10, p-value = 0.0829
alternative hypothesis: true correlation is not equal to 0
95 percent confidence interval:
 -0.07594  0.83884
sample estimates:
      cor
   0.5214`}</ROutput>
        <Prose>
          With p&nbsp;=&nbsp;0.083&nbsp;&gt;&nbsp;α&nbsp;=&nbsp;0.05, we <strong>fail to reject H₀</strong>. The correlation is not statistically significant — the opposite conclusion from what the student reported. The 95% confidence interval for ρ includes zero, which is consistent with this result.
        </Prose>
      </>
    ),
  },
];

// ─── PHILOSOPHY ───────────────────────────────────────────────────────────────

const PHILOSOPHY = [
  { icon: "⚠", title: "Silent errors",    desc: "Code that runs without crashing but produces the wrong statistical result — the hardest class of mistake to catch." },
  { icon: "⚙", title: "Wrong arguments",  desc: "Functions called with incorrect options for the situation, e.g. paired = TRUE on a two-sample test." },
  { icon: "✓", title: "Correct code",     desc: "Some questions have no errors at all — a reminder to think critically rather than assume something must be wrong." },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RCodingPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const q = QUESTIONS[currentIdx];

  return (
    <div style={{ minHeight: "100vh", background: BLUE_DARK }}>

      {/* Nav */}
      <header style={{ background: BLUE, borderBottom: "1px solid rgba(var(--gold-rgb),0.18)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
            <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: "none" }}>BIOL 300 Practice Hub</Link>
            <span style={{ color: "rgba(var(--text-rgb),0.2)", fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.55)" }}>R Coding</span>
          </div>
          <Link href="/start" style={{ fontSize: 12, fontWeight: 600, color: GOLD_LIGHT, textDecoration: "none", opacity: 0.7 }}>Practise →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "44px 24px 80px" }}>

        {/* Heading */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(var(--gold-rgb),0.55)", margin: "0 0 10px" }}>Practice</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", margin: "0 0 14px" }}>R Coding Questions</h1>
          <p style={{ fontSize: 15, color: "rgba(var(--text-rgb),0.5)", lineHeight: 1.7, margin: 0 }}>
            Each question presents a biological scenario and R code. Identify any mistakes in the code or analysis — or write <strong style={{ color: "rgba(var(--text-rgb),0.7)" }}>"No mistakes"</strong> if there are none.
          </p>
        </div>

        {/* Questions */}
        <section>
          {/* Navigator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            {/* Numbered dots */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {QUESTIONS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: i === currentIdx ? `2px solid ${GOLD}` : "1px solid rgba(var(--text-rgb),0.15)",
                    background: i === currentIdx ? "rgba(var(--gold-rgb),0.12)" : "transparent",
                    color: i === currentIdx ? GOLD : "rgba(var(--text-rgb),0.35)",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Prev / Next */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => setCurrentIdx(i => i - 1)}
                disabled={currentIdx === 0}
                style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                  border: "1px solid rgba(var(--text-rgb),0.15)",
                  background: "transparent",
                  color: currentIdx === 0 ? "rgba(var(--text-rgb),0.2)" : "rgba(var(--text-rgb),0.6)",
                  cursor: currentIdx === 0 ? "default" : "pointer",
                }}
              >← Prev</button>
              <button
                onClick={() => setCurrentIdx(i => i + 1)}
                disabled={currentIdx === QUESTIONS.length - 1}
                style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                  border: "1px solid rgba(var(--text-rgb),0.15)",
                  background: "transparent",
                  color: currentIdx === QUESTIONS.length - 1 ? "rgba(var(--text-rgb),0.2)" : "rgba(var(--text-rgb),0.6)",
                  cursor: currentIdx === QUESTIONS.length - 1 ? "default" : "pointer",
                }}
              >Next →</button>
            </div>
          </div>

          {/* Single question — key resets revealed state on navigation */}
          <QuestionCard key={q.id} q={q} index={currentIdx} />
        </section>

        <footer style={{ marginTop: 48, textAlign: "center", fontSize: 11, color: "rgba(var(--text-rgb),0.2)", paddingBottom: 8 }}>
          BIOL 300 Practice Hub · University of British Columbia
        </footer>
      </main>
    </div>
  );
}
