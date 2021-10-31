'use strict';

require( './standard' )

global.expect = require('jasmine-expect').expect;

describe("A suite", function() {
    it("contains spec with an expectation", function() {
      expect(true).toBe(true);
    });
});