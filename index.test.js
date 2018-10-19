/* eslint no-new: "off" */
import { gql } from 'apollo-server-lambda';


describe('SchematicModel', () => {
  const schema = gql`
    type Dummy {
      id: String!
      name: String
      age: Int
      height: Float!
      female: Boolean
    }
  `;


  describe('schema parsing', () => {
    it('should throw an error if ObjectTypeDefinition is not found for this class.name in schema', () => {
      class Dummy404 extends SchematicModel {}
      Dummy404.schema = schema;
      try {
        new Dummy404();
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.constructor.name).toEqual('NonExistantTypeDefinitionError');
      }
    });
    it('should throw an error if ObjectTypeDefinition has an unknown type in the schema', () => {
      const changedSchema = JSON.parse(JSON.stringify(schema));
      const relevantDef = changedSchema.definitions.find(def => def.kind === 'ObjectTypeDefinition' && def.name.value === 'Dummy');
      relevantDef.fields[1].type.name.value = 'Bob';
      class Dummy extends SchematicModel {}
      Dummy.schema = changedSchema;
      try {
        new Dummy();
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.constructor.name).toEqual('TypeError');
      }
    });
    it('should be able to interpret a graphql schema', () => {
      /*
      [ { name: 'id',
             type: 'String',
             required: true,
             validation: [Function: validation] },
           { name: 'name',
             type: 'String',
             required: false,
             validation: [Function: validation] },
           { name: 'age',
             type: 'Int',
             required: false,
             validation: [Function: validation] },
           { name: 'height',
             type: 'Float',
             required: true,
             validation: [Function: validation] },
           { name: 'female',
             type: 'Boolean',
             required: false,
             validation: [Function: validation] } ]

      */
      class Dummy extends SchematicModel {}
      Dummy.schema = schema;
      const result = new Dummy();
      expect(result.parsedSchema).toMatchObject({
        id: { required: true, type: 'String', validation: types.String.validation },
      });
    });
  });
});
