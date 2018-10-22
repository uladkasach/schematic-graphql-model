/* eslint no-new: "off" */
import { gql } from 'apollo-server-lambda';
import SchematicModel from './index';


describe('SchematicModel', () => {
  const schema = gql`
    type CarOfDummies {
      dummies: [Dummy]
      driver: Dummy!
    }

    type Dummy {
      id: String!
      name: String
      age: Int
      height: Float!
      female: Boolean
    }
  `;

  describe('retreiveParsedSchema', () => {
    it('should be able to retreive parsed schema', () => {
      class Dummy extends SchematicModel {}
      Dummy.schema = schema;
      const parsedSchema = Dummy.retreiveParsedSchema();
      expect(parsedSchema).toMatchObject({
        id: { required: true, type: 'String', list: false },
        name: { required: false, type: 'String', list: false },
        age: { required: false, type: 'Int', list: false },
        height: { required: true, type: 'Float', list: false },
        female: { required: false, type: 'Boolean', list: false },
      });
    });
    it('should append parsed schema to constructor after first time', () => { // this way we dont parse schema every time, we just cache the schema parsing results
      class Dummy extends SchematicModel {}
      Dummy.schema = schema;
      expect(typeof Dummy.parsedSchema).toEqual('undefined');
      Dummy.retreiveParsedSchema();
      expect(Dummy.parsedSchema).toMatchObject({
        id: { required: true, type: 'String', list: false },
        name: { required: false, type: 'String', list: false },
        age: { required: false, type: 'Int', list: false },
        height: { required: true, type: 'Float', list: false },
        female: { required: false, type: 'Boolean', list: false },
      });
    });
    it('should throw error if required schema dependencies are not passed', () => {
      class CarOfDummies extends SchematicModel {}
      CarOfDummies.schema = schema;
      try {
        CarOfDummies.retreiveParsedSchema();
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.constructor.name).toEqual('UnknownTypeError');
      }
    });
    it('should append successfuly if all schema dependencies are defined', () => {
      class Dummy extends SchematicModel {}
      class CarOfDummies extends SchematicModel {}
      CarOfDummies.dependencies = [Dummy];
      CarOfDummies.schema = schema;
      const parsedSchema = CarOfDummies.retreiveParsedSchema();
      expect(parsedSchema).toMatchObject({
        driver: { required: true, type: 'Dummy', custom: true, list: false },
        dummies: { required: false, type: 'Dummy', custom: true, list: true },
      });
    });
  });
  describe('initialization', () => {
    it('should throw an error if a parameter is not valid for schema', () => {
      class Dummy extends SchematicModel {}
      Dummy.schema = schema;
      try {
        new Dummy();
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.constructor.name).toEqual('ValidityError');
      }
    });
    it('should build for a model with valid props passed', () => {
      class Dummy extends SchematicModel {}
      Dummy.schema = schema;
      new Dummy({
        id: '8-21-12',
        name: 'bo-hinkle',
        age: 22,
        height: 62,
      });
    });
    it('should attach all schema props to self', () => {
      class Dummy extends SchematicModel {}
      Dummy.schema = schema;
      const dummy = new Dummy({
        id: '8-21-12',
        name: 'bo-hinkle',
        age: 22,
        height: 62,
        female: false,
      });
      expect(dummy).toMatchObject({
        id: '8-21-12',
        name: 'bo-hinkle',
        age: 22,
        height: 62,
        female: false,
      });
    });
  });
});
