import addValidationToSchema, { determineValidationForField } from './addValidationToSchema';

describe('addValidationToSchema', () => {
  describe('determineValidationForField', () => {
    describe('should define accurate validation for all basic types', () => {
      it('should accurately validate a String type', () => {
        const validation = determineValidationForField({
          type: 'String',
        });
        expect(validation('Test')).toEqual(true);
        expect(validation(12)).toEqual(false);
        expect(validation(12.5)).toEqual(false);
        expect(validation(1)).toEqual(false);
        expect(validation(0)).toEqual(false);
        expect(validation(true)).toEqual(false);
        expect(validation(false)).toEqual(false);
      });
      it('should accurately validate a Int type', () => {
        const validation = determineValidationForField({
          type: 'Int',
        });
        expect(validation('Test')).toEqual(false);
        expect(validation(12)).toEqual(true);
        expect(validation(12.5)).toEqual(false);
        expect(validation(1)).toEqual(true);
        expect(validation(0)).toEqual(true);
        expect(validation(true)).toEqual(false);
        expect(validation(false)).toEqual(false);
      });
      it('should accurately validate a Float type', () => {
        const validation = determineValidationForField({
          type: 'Float',
        });
        expect(validation('Test')).toEqual(false);
        expect(validation(12)).toEqual(true);
        expect(validation(12.5)).toEqual(true);
        expect(validation(1)).toEqual(true);
        expect(validation(0)).toEqual(true);
        expect(validation(true)).toEqual(false);
        expect(validation(false)).toEqual(false);
      });
      it('should accurately validate a Boolean type', () => {
        const validation = determineValidationForField({
          type: 'Boolean',
        });
        expect(validation('Test')).toEqual(false);
        expect(validation(12)).toEqual(false);
        expect(validation(12.5)).toEqual(false);
        expect(validation(1)).toEqual(false);
        expect(validation(0)).toEqual(false);
        expect(validation(true)).toEqual(true);
        expect(validation(false)).toEqual(true);
      });
    });
    it('should define accurate validation for list types', () => {
      const validation = determineValidationForField({
        list: true,
        type: 'String',
      });
      expect(validation(['Test'])).toEqual(true);
      expect(validation(['Test', 'This', 'Function', 'To', 'The', 'Best'])).toEqual(true);
      expect(validation('Test')).toEqual(false);
      expect(validation([1])).toEqual(false);
      expect(validation(['Test', 1])).toEqual(false);
      expect(validation(['Test', false])).toEqual(false);
      expect(validation(['Test', true])).toEqual(false);
      expect(validation(['Test', 11.5])).toEqual(false);
    });
    it('should define accurate validation for required type', () => {
      const validation = determineValidationForField({
        required: true,
        type: 'String',
      });
      expect(validation('true')).toEqual(true);
      expect(validation()).toEqual(false);
      expect(validation(null)).toEqual(false);
    });
    it('should define accurate validation for custom type', () => {
      const validation = determineValidationForField({
        custom: true,
        type: 'AwesomeType',
      }, {
        AwesomeType: {
          validate: value => value === 'awesome',
        },
      });
      expect(validation('awesome')).toEqual(true);
      expect(validation('Test')).toEqual(false);
      expect(validation(12)).toEqual(false);
      expect(validation(12.5)).toEqual(false);
      expect(validation(1)).toEqual(false);
      expect(validation(0)).toEqual(false);
      expect(validation(true)).toEqual(false);
      expect(validation(false)).toEqual(false);
    });
    describe('should define accurate validation for an interface type', () => {
      // i.e., the custom type model should have Model.Interfaces and we should choose which interface based on model knowledge
      // e.g., InterfaceModel.findImplementaionFor(...);
      it('should use the validation of the implementation model requested', () => {
        const validation = determineValidationForField({
          custom: true,
          type: 'AwesomeType',
          interface: true,
        }, {
          AwesomeType: {
            validate: value => value === 'awesome',
            findImplementationFor: () => ({
              validate: value => value === 'super awesome',
            }),
          },
        });
        expect(validation('super awesome')).toEqual(true);
        expect(validation('awesome')).toEqual(false);
        expect(validation('Test')).toEqual(false);
        expect(validation(12)).toEqual(false);
        expect(validation(12.5)).toEqual(false);
        expect(validation(1)).toEqual(false);
        expect(validation(0)).toEqual(false);
        expect(validation(true)).toEqual(false);
        expect(validation(false)).toEqual(false);
      });
    });
  });
  describe('default', () => {
    const testSchema = {
      id: {
        name: 'id',
        list: false,
        type: 'String',
        required: true,
        custom: false,
      },
      name: {
        name: 'name',
        list: false,
        type: 'String',
        required: false,
        custom: false,
      },
      age: {
        name: 'age',
        list: false,
        type: 'Int',
        required: false,
        custom: false,
      },
    };
    it('should validate all fields', () => {
      const schemaWithValidation = addValidationToSchema({ schema: testSchema });
      Object.values(schemaWithValidation).forEach((field) => {
        expect(typeof field.validation).toEqual('function');
      });
    });
  });
});
