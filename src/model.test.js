/* eslint no-new: "off" */
import { gql } from 'apollo-server-lambda';
import SchematicModel from './model';


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

    type RoadOfCars {
      cars: [CarOfPeople]
    }
    type CarOfPeople {
      driver: Person
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
      const { fields } = Dummy.retreiveParsedSchema();
      expect(fields).toMatchObject({
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
      expect(Dummy.parsedSchema.fields).toMatchObject({
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
      Dummy.schema = schema;
      class CarOfDummies extends SchematicModel {}
      CarOfDummies.dependencies = [Dummy];
      CarOfDummies.schema = schema;
      const { fields } = CarOfDummies.retreiveParsedSchema();
      expect(fields).toMatchObject({
        driver: { required: true, type: 'Dummy', custom: true, list: false },
        dummies: { required: false, type: 'Dummy', custom: true, list: true },
      });
    });
    describe('parsedSchema.self.interface', () => {
      describe('resolve type required', () => {
        it('should throw an error if the model is an interface type and it does not define resolveType method', () => {
          // note, this is done in retreiveParsedSchema because only after schema retreival do we have the info needed to check
          class Person extends SchematicModel {}
          Person.schema = schema;
          try {
            Person.retreiveParsedSchema();
            throw new Error('should not reach here');
          } catch (error) {
            expect(error.constructor.name).toEqual('MissingMethodError');
          }
        });
        it('should succeed if the model is an interface type and it does define resolveType method', () => {
          class Person extends SchematicModel {
            static resolveType() {
              return 'Person';
            }
          }
          Person.schema = schema;
          Person.retreiveParsedSchema();
        });
      });
      describe('findImplementationFor', () => {
        it('should throw a standard error if the resolve type model name does not exist in dependencies', () => {
          class Person extends SchematicModel {
            static resolveType() {
              return 'Person';
            }
          }
          Person.schema = schema;
          try {
            Person.findImplementationFor();
          } catch (error) {
            expect(error.constructor.name).toEqual('ResolveTypeMissingError');
          }
        });
        it('should return accurate model from findImplementationFor', () => {
          class Person extends SchematicModel {
            static resolveType() {
              return 'Person';
            }
          }
          Person.schema = schema;
          Person.dependencies = [Person];
          const ImplementationModel = Person.findImplementationFor();
          expect(ImplementationModel).toEqual(Person);
        });
      });
    });
  });
  describe('initialization', () => {
    describe('basic type dependencies', () => {
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
    describe('custom type dependencies', () => {
      class Dummy extends SchematicModel {}
      Dummy.schema = schema;
      class CarOfDummies extends SchematicModel {}
      CarOfDummies.dependencies = [Dummy];
      CarOfDummies.schema = schema;
      it('should throw an error if dependencies props are invalid', () => {
        try {
          new CarOfDummies({
            driver: {
              name: 'bob',
            },
            dummies: [],
          });
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('ValidityError');
        }
      });
      it('should throw accurate and helpful errors', () => {
        // currently they are nonsensical. e.g., CarOfDummies with invalid dummy only says that the name is wrong, but not the rest.
        // e.g., it also says it was checking {name} against driverField for driver, but it should have been checking name against nameField for driver
        const driverDeets = {
          name: 'bob',
        };
        let expectedDriverErrors;
        try {
          new Dummy(driverDeets);
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('ValidityError');
          expectedDriverErrors = error.errors;
        }
        try {
          new CarOfDummies({
            driver: driverDeets,
            dummies: [],
          });
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('ValidityError');
          expect(error.errors.driver[0].errors).toEqual(expectedDriverErrors);
        }
      });
      it('initialize if all dependency props are valid', () => {
        new CarOfDummies({
          driver: {
            id: '12',
            name: 'fred',
            height: 10,
          },
          dummies: [],
        });
      });
      it('should find that each custom dependency has been replaced with the actuall SchematicModel', () => {
        const car = new CarOfDummies({
          driver: {
            id: '12',
            name: 'fred',
            height: 10,
          },
          dummies: [],
        });
        expect(car.driver.constructor.name).toEqual('Dummy');
      });
    });
    describe('interface type dependencies', () => {
      class ExtensiveDummy extends SchematicModel {}
      ExtensiveDummy.schema = schema;
      class Person extends SchematicModel {
        static resolveType() {
          return 'ExtensiveDummy';
        }
      }
      Person.schema = schema;
      Person.dependencies = [ExtensiveDummy];
      class CarOfPeople extends SchematicModel {}
      CarOfPeople.dependencies = [Person];
      CarOfPeople.schema = schema;
      it('initialize if all dependency props are valid', () => {
        new CarOfPeople({
          driver: {
            id: '12',
            name: 'fred',
            height: 10,
            luckyNumbers: [21, 7, 3],
          },
        });
      });
      it('should find that each custom dependency has been replaced with the actual SchematicModel', () => {
        const car = new CarOfPeople({
          driver: {
            id: '12',
            name: 'fred',
            height: 10,
            luckyNumbers: [21, 7, 3],
          },
          dummies: [],
        });
        expect(car.driver.constructor.name).toEqual('ExtensiveDummy');
        expect(car.driver.luckyNumbers).toEqual([21, 7, 3]); // also check that implementation specific props had persisted
      });
    });
  });
  describe('getSchema', () => {
    class Person extends SchematicModel {
      static resolveType() {
        return 'Person';
      }
    }
    Person.schema = schema;
    class CarOfPeople extends SchematicModel {}
    CarOfPeople.dependencies = [Person];
    CarOfPeople.schema = schema;
    class RoadOfCars extends SchematicModel {}
    RoadOfCars.dependencies = [CarOfPeople];
    RoadOfCars.schema = schema;
    it('should be able to find one schema for model with no dependencies', () => {
      const schemas = Person.getSchema();
      expect(schemas.length).toEqual(1);
    });
    it('should be able to find two schemas for model with no one dep, which itself has no deps', () => {
      const schemas = CarOfPeople.getSchema();
      expect(schemas.length).toEqual(2);
    });
    it('should be able to find three schemas for model with no one dep, which itself has one dep', () => {
      const schemas = RoadOfCars.getSchema();
      expect(schemas.length).toEqual(3);
    });
  });
  describe('getResolvers', () => {
    class Person extends SchematicModel {
      static resolveType() {
        return 'Person';
      }
    }
    Person.schema = schema;
    class CarOfPeople extends SchematicModel {}
    CarOfPeople.dependencies = [Person];
    CarOfPeople.schema = schema;
    class RoadOfCars extends SchematicModel {}
    RoadOfCars.dependencies = [CarOfPeople];
    RoadOfCars.schema = schema;
    it('should be able to find one schema for model with no dependencies', () => {
      const schemas = Person.getSchema();
      expect(schemas.length).toEqual(1);
    });
    it('should be able to find two schemas for model with no one dep, which itself has no deps', () => {
      const schemas = CarOfPeople.getSchema();
      expect(schemas.length).toEqual(2);
    });
    it('should be able to find three schemas for model with no one dep, which itself has one dep', () => {
      const schemas = RoadOfCars.getSchema();
      expect(schemas.length).toEqual(3);
    });
  });
});
