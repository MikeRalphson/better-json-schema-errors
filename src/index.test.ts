import { validator, Schema } from '@exodus/schemasafe';
import { betterJsonSchemaErrors } from './index';

describe('betterJsonSchemaErrors', () => {
  let schema: Schema;
  let validate: any;
  let data: Record<string, unknown>;

  beforeEach(() => {
    schema = {
      type: 'object',
      required: ['str'],
      properties: {
        str: {
          type: 'string',
        },
        enum: {
          type: 'string',
          enum: ['one', 'two'],
        },
        bounds: {
          type: 'number',
          minimum: 2,
          maximum: 4,
        },
        nested: {
          type: 'object',
          required: ['deepReq'],
          properties: {
            deepReq: {
              type: 'boolean',
            },
            deep: {
              type: 'string',
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: <Schema>false,
    };
    validate = validator(schema);
  });

  describe('additionalProperties', () => {
    it('should handle additionalProperties=false', () => {
      data = {
        str: 'str',
        foo: 'bar',
      };
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'additionalProperties',
          },
          message: "'foo' property is not expected to be here",
          path: '{base}',
        },
      ]);
    });

    it('should handle additionalProperties=true', () => {
      data = {
        str: 'str',
        foo: 'bar',
      };
      // @ts-ignore we should be able to assign a boolean value to Schema
      schema.additionalProperties = true;
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([]);
    });

    it('should give suggestions when relevant', () => {
      data = {
        str: 'str',
        bonds: 'bar',
      };
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'additionalProperties',
          },
          message: "'bonds' property is not expected to be here",
          path: '{base}',
          suggestion: "Did you mean property 'bounds'?",
        },
      ]);
    });
  });

  describe('required', () => {
    it('should handle required properties', () => {
      data = {
        nested: {},
      };
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'required',
          },
          message: "{base} must have required property 'str'",
          path: '{base}',
        },
        {
          context: {
            errorType: 'required',
          },
          message: "{base}.nested must have required property 'deepReq'",
          path: '{base}.nested',
        },
      ]);
    });

    it('should handle multiple required properties', () => {
      schema = {
        type: 'object',
        required: ['req1', 'req2'],
        properties: {
          req1: {
            type: 'string',
          },
          req2: {
            type: 'string',
          },
        },
      };
      data = {};
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'required',
          },
          message: "{base} must have required property 'req1'",
          path: '{base}',
        },
        {
          context: {
            errorType: 'required',
          },
          message: "{base} must have required property 'req2'",
          path: '{base}',
        },
      ]);
    });
  });

  describe('type', () => {
    it('should handle type errors', () => {
      data = {
        str: 123,
      };
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'type',
          },
          message: "'str' property type must be string",
          path: '{base}.str',
        },
      ]);
    });
  });

  describe('minimum/maximum', () => {
    it('should handle minimum/maximum errors', () => {
      data = {
        str: 'str',
        bounds: 123,
      };
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'maximum',
          },
          message: "property 'bounds' must be <= 4",
          path: '{base}.bounds',
        },
      ]);
    });
  });

  describe('enum', () => {
    it('should handle enum errors', () => {
      data = {
        str: 'str',
        enum: 'zzzz',
      };
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'enum',
            allowedValues: ['one', 'two'],
          },
          message: "'enum' property must be equal to one of the allowed values",
          path: '{base}.enum',
        },
      ]);
    });

    it('should provide suggestions when relevant', () => {
      data = {
        str: 'str',
        enum: 'pne',
      };
      validate(data);
      const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'enum',
            allowedValues: ['one', 'two'],
          },
          message: "'enum' property must be equal to one of the allowed values",
          path: '{base}.enum',
          suggestion: "Did you mean 'one'?",
        },
      ]);
    });
  });

  it('should handle array paths', () => {
    data = {
      custom: [{ foo: 'bar' }, { aaa: 'zzz' }],
    };
    schema = {
      type: 'object',
      properties: {
        custom: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: {
                type: 'string',
              },
              title: {
                type: 'string',
              },
            },
          },
        },
      },
    };
    validate(data);
    const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
    expect(errors).toEqual([
      {
        context: {
          errorType: 'additionalProperties',
        },
        message: "'foo' property is not expected to be here",
        path: '{base}.custom.0',
      },
      {
        context: {
          errorType: 'additionalProperties',
        },
        message: "'aaa' property is not expected to be here",
        path: '{base}.custom.1',
      },
    ]);
  });

  it('should handle file $refs', () => {
    data = {
      child: [{ foo: 'bar' }, { aaa: 'zzz' }],
    };
    schema = {
      $id: 'http://example.com/schemas/Main.json',
      type: 'object',
      properties: {
        child: {
          type: 'array',
          items: {
            $ref: './Child.json',
          },
        },
      },
    };
    validate.addSchema({
      $id: 'http://example.com/schemas/Child.json',
      additionalProperties: false,
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
    });
    validate(data);
    const errors = betterJsonSchemaErrors({ data, schema, errors: validate.errors });
    expect(errors).toEqual([
      {
        context: {
          errorType: 'additionalProperties',
        },
        message: "'foo' property is not expected to be here",
        path: '{base}.child.0',
      },
      {
        context: {
          errorType: 'additionalProperties',
        },
        message: "'aaa' property is not expected to be here",
        path: '{base}.child.1',
      },
    ]);
  });
});
