# better-json-schema-errors

> Human-friendly JSON Schema validation for APIs

- Readable and helpful [JSON Schema](https://github.com/) errors
- API-friendly format
- Suggestions for spelling mistakes (using Jaro-Winkler, not the more simplistic Levenshtein) distance algorithm
- Minimal footprint: 1.56 kB (gzip + minified)

![better-json-schema-errors output Example](https://user-images.githubusercontent.com/8850410/118274790-e0529e80-b4c5-11eb-8188-9097c8064c61.png)

## Install

```bash
$ npm i better-json-schema-errors
```

## Usage

After validating some data with a compliant JSON Schema validator, pass the errors to `betterJsonSchemaErrors`

Your JSON Schema Validator should be configured to use the [Detailed](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.12.4.3) or [Verbose](https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.12.4.4) error structure.

```ts
import { betterJsonSchemaErrors } from 'better-json-schema-errors';

const valid = validator.validate(schema, data);

if (!valid) {
  const betterErrors = betterJsonSchemaErrors({ schema, data, errors: validator.errors });
}
```

## API

### betterJsonSchemaErrors

Function that formats JSON Schema validation errors in a human-friendly format.

#### Parameters

- `options: BetterJsonSchemaErrorsOptions`
  - `errors: ErrorObject[] | null | undefined` Your errors, you will find these in the `errors` property of your validator instance (`ErrorObject` is a type defined by JSON Schema).
  - `data: Object` The data you passed to the validator.
  - `schema: JSONSchema` The schema you passed to the validator to validate against.
  - `basePath?: string` An optional base path to prefix paths returned by `betterJsonSchemaErrors`. For example, in APIs, it could be useful to use `'{requestBody}'` or `'{queryParemeters}'` as a basePath. This will make it clear to users where exactly the error occurred.

#### Return Value

- `ValidationError[]` Array of formatted errors (properties of `ValidationError` below)
  - `message: string` Formatted error message
  - `suggestion?: string` Optional suggestion based on provided data and schema
  - `path: string` Object path where the error occurred (example: `.foo.bar.0.quz`)
  - `context: { errorType: DefinedError['keyword']; [additionalContext: string]: unknown }` `errorType` is `error.keyword` proxied from the validator. `errorType` can be used as a key for i18n if needed. There might be additional properties on context, based on the type of error.

## Related

* https://github.com/apideck-libraries/better-ajv-errors

