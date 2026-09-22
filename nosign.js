// Custom sign script that does nothing to bypass downloading/extracting winCodeSign
exports.default = async function (configuration) {
  console.log('Skipping standard codesigning for:', configuration.path);
  return true;
};
module.exports = exports.default;
