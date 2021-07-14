import { ValidationError } from '@hyperjump/json-schema';
import { ERROR_KEYWORD_WEIGHT_MAP } from '../constants';

export const filterSingleErrorPerProperty = (errors: ValidationError[]): ValidationError[] => {
  const errorsPerProperty = errors.reduce<Record<string, ValidationError>>((acc, error) => {
    const prop =
      error.instanceLocation; //+ ((error.params as any)?.additionalProperty ?? (error.params as any)?.missingProperty ?? '');
    const existingError = acc[prop];
    if (!existingError) {
      acc[prop] = error;
      return acc;
    }
    const weight = ERROR_KEYWORD_WEIGHT_MAP[error.keywordLocation] ?? 0;
    const existingWeight = ERROR_KEYWORD_WEIGHT_MAP[existingError.keywordLocation] ?? 0;

    if (weight > existingWeight) {
      acc[prop] = error;
    }
    return acc;
  }, {});

  return Object.values(errorsPerProperty);
};
