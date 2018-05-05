
const chai = require('chai');
const sinonLib = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(sinonChai);
chai.use(chaiAsPromised);

module.exports = {
  expect: chai.expect,
  sinon: sinonLib
};
