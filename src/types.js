export default {
  String: {
    validation: (value, verbose) => {
      const errors = [];

      if ((typeof value !== 'string')) errors.push('not a string');

      if (verbose) return errors;
      return errors.length === 0;
    },
  },
  Int: {
    validation: (value, verbose) => {
      const errors = [];

      if ((typeof value !== 'number')) errors.push('not a number');
      if (!Number.isInteger(value)) errors.push('not a number');

      if (verbose) return errors;
      return errors.length === 0;
    },
  },
  Float: {
    validation: (value, verbose) => {
      const errors = [];

      if ((typeof value !== 'number')) errors.push('not a number');

      if (verbose) return errors;
      return errors.length === 0;
    },
  },
  Boolean: {
    validation: (value, verbose) => {
      const errors = [];

      if ((typeof value !== 'boolean')) errors.push('not a boolean');

      if (verbose) return errors;
      return errors.length === 0;
    },
  },
};
