/**
 * Calculates the Body Mass Index (BMI).
 * @param weight - Weight in kilograms.
 * @param height - Height in centimeters.
 * @returns The BMI value rounded to two decimal places.
 */
export function calculateBMI(weight: number, height: number): number {
  if (weight <= 0 || height <= 0) {
    throw new Error("Weight and height must be positive numbers.");
  }
  const heightInMeters = height / 100; // Convert height from cm to meters
  const bmi = weight / (heightInMeters * heightInMeters);
  return parseFloat(bmi.toFixed(2)); // Round to two decimal places
}
