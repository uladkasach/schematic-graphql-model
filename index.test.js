/* eslint no-new: "off" */
import { gql } from 'apollo-server-lambda';
import SchematicModel from './index';


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
    it.skip('should throw error if required schema dependencies are not passed', () => { });
  });
  describe('initialization', () => {
    it('should throw an error if a parameter is not valid for schema', () => {
      class Dummy extends SchematicModel {}
      Dummy.schema = schema;
      try {
        new Dummy();
        throw new Error('should not reach here');
      } catch (error) {
        console.log(error);
      }
    });
    it.skip('should build for a model with valid props passed', () => {});
  });
});
