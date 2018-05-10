
const FilterChain = require('../../src/FilterChain');
const { expect, sinon } = require('../support/TestUtils');

describe('FilterChain unit tests', () => {

  it('process all filters in chain', () => {
    let filterChain = new FilterChain([
      sinon.spy(() => Promise.resolve(true)),
      sinon.spy(() => Promise.resolve(true))
    ]);
    return expect(filterChain.wrapInChain({ statusCode: 200 }))
      .to.eventually.eql({ statusCode: 200 })
      .then(() => {
        expect(filterChain.chain[0]).to.be.calledOnce;
        expect(filterChain.chain[1]).to.be.calledOnce;
      });
  });

  it('process all filters in chain + additional filter', () => {
    let filterChain = new FilterChain([
      sinon.spy(() => Promise.resolve(true)),
      sinon.spy(() => Promise.resolve(true))
    ]);
    const finalFilter = sinon.spy(data => { data.statusCode = 500 });
    return expect(filterChain.wrapInChain({ statusCode: 200 }, finalFilter))
      .to.eventually.eql({ statusCode: 500 })
      .then(() => {
        expect(finalFilter).to.be.calledOnce;
        expect(filterChain.chain[0]).to.be.calledOnce;
        expect(filterChain.chain[1]).to.be.calledOnce;
      });
  });

  it('process each filter until one resolves `false`', () => {
    let filterChain = new FilterChain([
      sinon.spy(() => Promise.resolve(true)),
      sinon.spy(() => Promise.resolve(false)),
      // will not be called because previous filter in chain resolves `false`
      sinon.spy(() => Promise.resolve(true))
    ]);
    return expect(filterChain.wrapInChain({ statusCode: 200 }))
      .to.eventually.eql({ statusCode: 200 }).then(() => {
        expect(filterChain.chain[0]).to.be.calledOnce;
        expect(filterChain.chain[1]).to.be.calledOnce;
        expect(filterChain.chain[2]).to.not.be.called;
      });
  });

  it('process each filter until one does not return promise', () => {
    let filterChain = new FilterChain([
      sinon.spy(() => Promise.resolve(true)),
      sinon.spy(() => {}),
      // will not be called because previous filter in chain returns no promise
      sinon.spy(() => Promise.resolve(true))
    ]);
    return expect(filterChain.wrapInChain({ statusCode: 200 }))
      .to.eventually.eql({ statusCode: 200 }).then(() => {
        expect(filterChain.chain[0]).to.be.calledOnce;
        expect(filterChain.chain[1]).to.be.calledOnce;
        expect(filterChain.chain[2]).to.not.be.called;
      });
  });

  it('data passed to each filter', () => {
    const dataPropertyValidator = data => {
      expect(data.testPropertyLabel).to.equal('testPropertyValue');
      return Promise.resolve(true);
    }
    let filterChain = new FilterChain([
      dataPropertyValidator,
      dataPropertyValidator
    ]);
    return filterChain.wrapInChain({ testPropertyLabel: 'testPropertyValue' });
  });

  it('data shared by reference to all filters in chain', () => {
    let filterChain = new FilterChain([
      data => {
        expect(data.callCount).to.be.undefined;
        data.callCount = 1;
        return Promise.resolve(true);
      },
      data => {
        expect(data.callCount).to.equal(1);
        data.callCount++;
        return Promise.resolve(true);
      },
      data => {
        expect(data.callCount).to.equal(2);
        data.callCount++;
        return Promise.resolve(true);
      }
    ]);
    return expect(filterChain.wrapInChain())
      .to.eventually.eql({ callCount: 3 });
  });

  it('filter chain throws error', () => {
    let filterChain = new FilterChain([
      data => {
        data.filter1Label = 'filter1Value';
        return Promise.resolve(true);
      },
      data => {
        data.filter2Label = 'filter2Value';
        throw new Error('oops, something bad happened');
      }
    ]);
    return filterChain.wrapInChain({}).then(() => {
      throw new Error('should not have been fulfilled');
    }).catch(error => {
      expect(error.data).to.eql({
        filter1Label: 'filter1Value',
        filter2Label: 'filter2Value'
      });
      expect(error.message).to.eql('oops, something bad happened');
      expect(error.stack).to.not.be.undefined;
    });
  });

  it('`this` context used by filter', () => {
    class Filter {
      constructor() {
        this.propertyLabel = 'propertyValue';
        this.process = this.process.bind(this);
      }
      process(data) {
        data.property = this.propertyLabel;
      }
    }
    let filter = new Filter();
    let filterChain = new FilterChain([
      sinon.spy(() => Promise.resolve(true)),
      sinon.spy(() => Promise.resolve(true))
    ]);
    const data = {};
    return expect(filterChain.wrapInChain({}, filter.process))
      .to.eventually.eql({ property: 'propertyValue' })
      .then(() => {
        expect(filterChain.chain[0]).to.be.calledOnce;
        expect(filterChain.chain[1]).to.be.calledOnce;
      });
  });

  it('data returned in final promise', () => {
    const data = { someProperty: true };
    let filter = new FilterChain([
      data => Promise.resolve(true),
      data => Promise.resolve(true),
      data => Promise.resolve(true)
    ]);
    return Promise.all([
      filter.wrapInChain(data),
      filter.wrapInChain(data, data => Promise.resolve(true))
    ]).then(responses => {
      expect(responses[0]).to.eql(data);
      expect(responses[1]).to.eql(data);
    });
  });

});
