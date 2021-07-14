import { ValidationError } from '@hyperjump/json-schema';

export const ERROR_KEYWORD_WEIGHT_MAP: Partial<Record<ValidationError['keywordLocation'], number>> = {
  enum: 1,
  type: 0,
};

export const QUOTES_REGEX = /"/g;
export const NOT_REGEX = /NOT/g;
export const SLASH_REGEX = /\//g;
