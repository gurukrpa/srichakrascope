/**
 * Item Response Theory (IRT) Calculation Engine
 *
 * This file contains the core mathematical functions for calculating a student's
 * ability (theta) based on their responses to aptitude questions. It uses a
 * 2-Parameter Logistic (2PL) model.
 */

import { AptitudeQuestion } from '../data/questionBank';

/**
 * Represents a student's answer to a single aptitude question.
 */
interface AptitudeAnswer {
  question: AptitudeQuestion;
  isCorrect: boolean;
}

/**
 * Calculates the probability of a correct response for a single item using the 2PL model.
 * P(θ) = 1 / (1 + e^(-a(θ - b)))
 *
 * @param theta The student's ability level.
 * @param difficulty The item's difficulty (b-parameter).
 * @param discrimination The item's discrimination (a-parameter).
 * @returns The probability of a correct answer (0 to 1).
 */
const twoParamLogistic = (
  theta: number,
  difficulty: number,
  discrimination: number
): number => {
  // The '1.7' is a common scaling factor to align the logistic and normal ogive models.
  const exponent = -discrimination * 1.7 * (theta - difficulty);
  return 1 / (1 + Math.exp(exponent));
};

/** Logistic-to-normal scaling constant used in the 2PL model. */
const D_SCALE = 1.7;

/**
 * Estimates the student's ability (theta) for a single aptitude domain using
 * Maximum Likelihood Estimation (MLE) via Newton–Raphson on the analytic
 * 2PL score function and Fisher information.
 *
 *   score(θ)   = Σ a_i · D · (u_i − P_i(θ))
 *   info(θ)    = Σ (a_i · D)² · P_i(θ) · (1 − P_i(θ))
 *   θ_{n+1}    = θ_n + score / info
 *
 * @param answers The student's answers for a specific domain.
 * @param maxIterations The maximum number of Newton iterations.
 * @param tolerance Convergence tolerance on |Δθ|.
 * @returns The estimated theta value (clamped to [-4, +4]).
 */
export const estimateAbility = (
  answers: AptitudeAnswer[],
  maxIterations = 50,
  tolerance = 1e-4
): number => {
  // Edge case: no answers in this domain → return neutral theta (avoids
  // [].every() === true falsely triggering the all-correct branch below).
  if (answers.length === 0) return 0;

  // Handle edge cases: all correct or all incorrect.
  // (MLE is undefined at the boundary; assign a strong but finite theta.)
  const allCorrect = answers.every(a => a.isCorrect);
  const allIncorrect = answers.every(a => !a.isCorrect);
  if (allCorrect) return 2.5;
  if (allIncorrect) return -2.5;

  let theta = 0.0;

  for (let i = 0; i < maxIterations; i++) {
    let score = 0;
    let info = 0;

    for (const answer of answers) {
      const a = answer.question.discrimination;
      const b = answer.question.difficulty;
      const aD = a * D_SCALE;
      const p = twoParamLogistic(theta, b, a);
      const u = answer.isCorrect ? 1 : 0;

      score += aD * (u - p);
      info += aD * aD * p * (1 - p);
    }

    // Guard against a near-zero information matrix (would blow up the step).
    if (info < 1e-9) break;

    const step = score / info;
    theta += step;

    // Clamp theta to a reasonable range
    if (theta > 4) theta = 4;
    if (theta < -4) theta = -4;

    if (Math.abs(step) < tolerance) break; // Converged
  }

  return theta;
};
