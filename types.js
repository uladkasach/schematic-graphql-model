export default {
  String: {
    validation: value => typeof value === 'string',
  },
  Int: {
    validation: value => typeof value === 'number' && Number.isInteger(value),
  },
  Float: {
    validation: value => typeof value === 'number',
  },
  Boolean: {
    validation: value => typeof value === 'boolean',
  },
};
