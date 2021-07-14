import { inspect } from 'util';
import { Schema, default as jsonSchema } from '@hyperjump/json-schema';
import { betterJsonSchemaErrors } from './index';

describe('betterJsonSchemaErrors', () => {
  let schema: Schema;
  let schemaObj:any;
  let data: Record<string, unknown>;

  async function storeSchema() {
    await jsonSchema.add(schema);
    // @ts-ignore we are always dealing with Object schemas not Boolean ones
    schemaObj = await jsonSchema.get(schema.$id);
    return schemaObj;
  }

  beforeEach(async () => {
    schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/schemas/test',
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
      additionalProperties: false,
    };
    await storeSchema();
  });

  describe('additionalProperties', () => {
    it('should handle additionalProperties=false', async () => {
      data = {
        str: 'str',
        foo: 'bar',
      };
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      console.log(inspect(result));
      expect(result.errors.length).toEqual(1);
      /*const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
      expect(errors).toEqual([
        {
          context: {
            errorType: 'additionalProperties',
          },
          message: "'foo' property is not expected to be here",
          path: '{base}',
        },
      ]);*/
    });

    it('should handle additionalProperties=true', async () => {
      data = {
        str: 'str',
        foo: 'bar',
      };
      // @ts-ignore we should be able to assign a boolean value to Schema
      schema.additionalProperties = true;
      await storeSchema();
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
      expect(errors).toEqual([]);
    });

    it('should give suggestions when relevant', async () => {
      data = {
        str: 'str',
        bonds: 'bar',
      };
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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
    it('should handle required properties', async () => {
      data = {
        nested: {},
      };
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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

    it('should handle multiple required properties', async () => {
      schema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
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
      await storeSchema();
      data = {};
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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
    it('should handle type errors', async () => {
      data = {
        str: 123,
      };
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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
    it('should handle minimum/maximum errors', async () => {
      data = {
        str: 'str',
        bounds: 123,
      };
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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
    it('should handle enum errors', async () => {
      data = {
        str: 'str',
        enum: 'zzzz',
      };
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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

    it('should provide suggestions when relevant', async () => {
      data = {
        str: 'str',
        enum: 'pne',
      };
      //validate(data);
      const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
      const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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

  it('should handle array paths', async () => {
    data = {
      custom: [{ foo: 'bar' }, { aaa: 'zzz' }],
    };
    schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
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
    await storeSchema();
    //validate(data);
    const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
    const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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

  it('should handle file $refs', async () => {
    data = {
      child: [{ foo: 'bar' }, { aaa: 'zzz' }],
    };
    schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
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
    await storeSchema();
    await jsonSchema.add({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'http://example.com/schemas/Child.json',
      additionalProperties: false,
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
    });
    //validate(data);
    const result = await jsonSchema.validate(schemaObj, data, jsonSchema.DETAILED);
    const errors = betterJsonSchemaErrors({ data, schema, errors: result.errors });
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
