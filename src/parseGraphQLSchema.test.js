import { gql } from 'apollo-server-lambda';
import parseGraphQLSchema from './parseGraphQLSchema';

describe('SchematicModel', () => {
  const schema = gql`
    type CarOfDummies {
      dummies: [Dummy]
      driver: Dummy!
    }

    interface Person {
      name: String
      age: Int
    }

    type ExtensiveDummy implements Person {
      id: String!
      name: String
      age: Int
      height: Float!
      female: Boolean
      favoriteNumbers: [Int]
      luckyNumbers: [Int]!
    }

    type CarOfPeople {
      driver: Person
    }

    type Dummy {
      id: String!
      name: String
      age: Int
      height: Float!
      female: Boolean
      favoriteNumbers: [Int]
      luckyNumbers: [Int]!
    }
  `;

  describe('schema parsing', () => {
    describe('basic schema types', () => {
      it('should throw an error if ObjectTypeDefinition is not found for this class.name in schema', () => {
        try {
          parseGraphQLSchema({ schema, modelName: 'Dummy404' });
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('NonExistantTypeDefinitionError');
        }
      });
      it('should throw an error if ObjectTypeDefinition has an unknown type in the schema', () => {
        const changedSchema = JSON.parse(JSON.stringify(schema));
        const relevantDef = changedSchema.definitions.find(def => def.kind === 'ObjectTypeDefinition' && def.name.value === 'Dummy');
        relevantDef.fields[1].type.name.value = 'Bob';
        try {
          parseGraphQLSchema({ schema: changedSchema, modelName: 'Dummy' });
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('UnknownTypeError');
        }
      });
      it('should be able to interpret a graphql schema', () => {
        const { fields, self } = parseGraphQLSchema({ schema, modelName: 'Dummy' });
        expect(self.interface).toEqual(false);
        expect(fields).toMatchObject({
          id: { required: true, type: 'String', list: false },
          name: { required: false, type: 'String', list: false },
          age: { required: false, type: 'Int', list: false },
          height: { required: true, type: 'Float', list: false },
          female: { required: false, type: 'Boolean', list: false },
          favoriteNumbers: { required: false, type: 'Int', list: true },
          luckyNumbers: { required: true, type: 'Int', list: true },
        });
      });
    });
    describe('custom types', () => {
      it('should be able to interpret a graphql schema with regular custom types', () => {
        const parsedDummyModelMock = { retreiveParsedSchema: () => ({ self: { interface: false } }) };
        const { fields, self } = parseGraphQLSchema({ schema, modelName: 'CarOfDummies', customTypes: { Dummy: parsedDummyModelMock } });
        expect(self.interface).toEqual(false);
        expect(fields).toMatchObject({
          driver: { required: true, type: 'Dummy', custom: true, list: false },
          dummies: { required: false, type: 'Dummy', custom: true, list: true },
        });
      });
      describe('interface', () => {
        it('should be able to interpret a graphql schema with interface types', () => {
          const { fields, self } = parseGraphQLSchema({ schema, modelName: 'Person' });
          expect(self.interface).toEqual(true);
          expect(fields).toMatchObject({
            name: { required: false, type: 'String', list: false },
            age: { required: false, type: 'Int', list: false },
          });
        });
        it('should be able to interpret a schema that implements an interface type', () => {
          const { fields } = parseGraphQLSchema({ schema, modelName: 'ExtensiveDummy' });
          expect(fields).toMatchObject({
            id: { required: true, type: 'String', list: false },
            name: { required: false, type: 'String', list: false },
            age: { required: false, type: 'Int', list: false },
            height: { required: true, type: 'Float', list: false },
            female: { required: false, type: 'Boolean', list: false },
            favoriteNumbers: { required: false, type: 'Int', list: true },
            luckyNumbers: { required: true, type: 'Int', list: true },
          });
        });
        it('should be able to define when a field is composed of an interface', () => { // used to evaluate which implementation of interface to validate
          const parsedPersonModelMock = { retreiveParsedSchema: () => ({ self: { interface: true } }) };
          const { fields } = parseGraphQLSchema({ schema, modelName: 'CarOfPeople', customTypes: { Person: parsedPersonModelMock } });
          expect(fields).toMatchObject({
            driver: { required: false, type: 'Person', custom: true, interface: true, list: false },
          });
        });
      });
    });
  });
});
