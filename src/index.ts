import { ValidationError,Schema } from '@exodus/schemasafe';
import { filterSingleErrorPerProperty } from './lib/filter';
import { getSuggestion } from './lib/suggestions';
import { cleanJsonSchemaMessage, getLastSegment, pointerToDotNotation, safeJsonPointer } from './lib/utils';

export interface BetterJsonSchemaErrorsOptions {
  errors: ValidationError[] | null | undefined;
  data: any;
  schema: Schema;
  basePath?: string;
}

export const betterJsonSchemaErrors = ({
  errors,
  data,
  schema,
  basePath = '{base}',
}: BetterJsonSchemaErrorsOptions): ValidationError[] => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return [];
  }

  const definedErrors = filterSingleErrorPerProperty(errors as ValidationError[]);

  return definedErrors.map((error) => {
    const path = pointerToDotNotation(basePath + error.instanceLocation);
    const prop = getLastSegment(error.instanceLocation);
    const defaultContext = {
      errorType: error.keyword,
    };
    const defaultMessage = `${prop ? `property '${prop}'` : path} ${cleanJsonSchemaMessage(error.message as string)}`;

    let validationError: any; //ValidationError;

    switch (error.keyword) {
      case 'additionalProperties': {
        const additionalProp = error.params.additionalProperty;
        const suggestionPointer = error.schemaPath.replace('#', '').replace('/additionalProperties', '');
        const { properties } = safeJsonPointer({
          object: schema,
          pnter: suggestionPointer,
          fallback: { properties: {} },
        });
        validationError = {
          message: `'${additionalProp}' property is not expected to be here`,
          suggestion: getSuggestion({
            value: additionalProp,
            suggestions: Object.keys(properties),
            format: (suggestion) => `Did you mean property '${suggestion}'?`,
          }),
          path,
          context: defaultContext,
        };
        break;
      }
      case 'enum': {
        const suggestions = error.params.allowedValues;
        const prop = getLastSegment(error.instanceLocation);
        const value = safeJsonPointer({ object: data, pnter: error.instanceLocation, fallback: '' });
        validationError = {
          message: `'${prop}' property must be equal to one of the allowed values`,
          suggestion: getSuggestion({
            value,
            suggestions,
          }),
          path,
          context: {
            ...defaultContext,
            allowedValues: error.params.allowedValues,
          },
        };
        break;
      }
      case 'type': {
        const prop = getLastSegment(error.instanceLocation);
        const type = error.params.type;
        validationError = {
          message: `'${prop}' property type must be ${type}`,
          path,
          context: defaultContext,
        };
        break;
      }
      case 'required': {
        validationError = {
          message: `${path} must have required property '${error.params.missingProperty}'`,
          path,
          context: defaultContext,
        };
        break;
      }

      default:
        return { message: defaultMessage, path, context: defaultContext };
    }

    // Remove empty properties
    const errorEntries = Object.entries(validationError);
    for (const [key, value] of errorEntries as [keyof ValidationError, unknown][]) {
      if (value === null || value === undefined || value === '') {
        delete validationError[key];
      }
    }

    return validationError;
  });
};

export { ValidationError } from '@exodus/schemasafe';
