import dtree from '../../src/dtree';

describe('dtree', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(dtree, 'greet');
      dtree.greet();
    });

    it('should have been run once', () => {
      expect(dtree.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(dtree.greet).to.have.always.returned('hello');
    });
  });
});
