export default {
  String: {
    validation: value => typeof value === 'string',
  },
  Int: {
    validation: value => typeof value === 'number' && Math.Number.isInteger(value),
  },
  Float: {
    validation: value => typeof value === 'number' && Math.Number.isFloat(value),
  },
  Boolean: {
    validation: value => typeof value === 'boolean',
  },
};
