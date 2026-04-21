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

/**
 * Calculates the log-likelihood of a student's response pattern for a given ability level (theta).
 * The goal of the estimation process is to find the theta that maximizes this value.
 *
 * @param theta The ability level to evaluate.
 * @param answers The student's answers for a specific domain.
 * @returns The log-likelihood value.
 */
const logLikelihood = (theta: number, answers: AptitudeAnswer[]): number => {
  let ll = 0;
  answers.forEach(answer => {
    const { difficulty, discrimination } = answer.question;
    const probability = twoParamLogistic(theta, difficulty, discrimination);

    if (answer.isCorrect) {
      // Use a small floor to prevent log(0)
      ll += Math.log(Math.max(probability, 1e-9));
    } else {
      ll += Math.log(Math.max(1 - probability, 1e-9));
    }
  });
  return ll;
};

/**
 * Estimates the student's ability (theta) for a single aptitude domain using Maximum Likelihood Estimation (MLE).
 * It iteratively searches for the theta value that maximizes the log-likelihood of the observed answers.
 *
 * @param answers The student's answers for a specific domain.
 * @param maxIterations The maximum number of iterations for the search.
 * @param tolerance The convergence tolerance.
 * @returns The estimated theta value (typically between -3 and 3).
 */
export const estimateAbility = (
  answers: AptitudeAnswer[],
  maxIterations = 50,
  tolerance = 1e-4
): number => {
  let theta = 0.0; // Start with an average ability estimate

  // Handle edge cases: all correct or all incorrect
  const allCorrect = answers.every(a => a.isCorrect);
  const allIncorrect = answers.every(a => !a.isCorrect);
  if (allCorrect) return 2.5; // Assign a high theta
  if (allIncorrect) return -2.5; // Assign a low theta

  // Simple gradient ascent to find the maximum likelihood
  for (let i = 0; i < maxIterations; i++) {
    const gradient = logLikelihood(theta + tolerance, answers) - logLikelihood(theta - tolerance, answers);
    const newTheta = theta + 0.1 * gradient; // 0.1 is the learning rate

    if (Math.abs(newTheta - theta) < tolerance) {
      break; // Converged
    }
    theta = newTheta;

    // Clamp theta to a reasonable range
    if (theta > 4) theta = 4;
    if (theta < -4) theta = -4;
  }

  return theta;
};
