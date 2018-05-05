
class FilterChain {

  /**
   * @param Array<String> chain list of filters
   */
  constructor(chain) {
    this.chain = chain;
    if (!chain) throw new Error('MUST pass argument `chain`.');
  }

  /**
   * @param Object data generic object to pass into each filter
   * @param Object filter object with a `process(data)` function
   */
  wrapInChain(data, finalFilter) {
    data = data || {};
    const chain = (finalFilter != null)
      ? this.chain.concat(finalFilter)
      : this.chain;
    let index = 0;
    const callback = () => Promise.resolve(data);
    const processNextFilter = () => {
      if (index === chain.length) return callback();
      const filter = chain[index++];
      const promise = filter.process(data);
      if (!promise) return callback();
      return promise.then(shouldContinue => {
        if (shouldContinue) return processNextFilter();
        else return callback();
      }).catch(error => {
        error.data = data;
        throw error;
      });
    };
    return processNextFilter();
  }

}

module.exports = FilterChain;
