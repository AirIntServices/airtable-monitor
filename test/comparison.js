const { expect } = require('chai');
const { airtableFieldValuesAreEqual } = require('../cjs/utils');

describe('airtableFieldValuesAreEqual', () => {
  describe('Text fields', () => {
    it('should return false if the values are different', () => {
      expect(airtableFieldValuesAreEqual('oldValue', 'newValue')).to.equal(
        false,
      );
    });

    it('should return true if the values are equal', () => {
      expect(airtableFieldValuesAreEqual('oldValue', 'oldValue')).to.equal(
        true,
      );
    });
  });

  describe('Numeric fields', () => {
    it('should return false if the values are different', () => {
      expect(airtableFieldValuesAreEqual(1, 2)).to.equal(false);
    });

    it('should return true if the values are equal', () => {
      expect(airtableFieldValuesAreEqual(42, 42)).to.equal(true);
    });
  });

  describe('Multiple select fields (array of strings)', () => {
    it('should return false if the arrays have a different length', () => {
      expect(airtableFieldValuesAreEqual(['foo', 'bar'], ['foo'])).to.equal(
        false,
      );
    });

    it('should return false if the arrays contain different values', () => {
      expect(airtableFieldValuesAreEqual(['bar'], ['foo'])).to.equal(false);
    });

    it('should return true if the arrays contain the same values', () => {
      expect(
        airtableFieldValuesAreEqual(['bar', 'foo'], ['foo', 'bar']),
      ).to.equal(true);
    });
  });

  describe('Multiple select fields (array of numbers)', () => {
    it('should return false if the arrays have a different length', () => {
      expect(airtableFieldValuesAreEqual([1, 2], [2])).to.equal(false);
    });

    it('should return false if the arrays contain different values', () => {
      expect(airtableFieldValuesAreEqual([1], [2])).to.equal(false);
    });

    it('should return true if the arrays contain the same values', () => {
      expect(airtableFieldValuesAreEqual([1, 2], [2, 1])).to.equal(true);
    });
  });

  describe('Attachment fields (array of objects)', () => {
    const attachments1 = [
      {
        id: 'attjtn763ltyHt3Xl',
        url: 'https://dl.airtable.com/.attachments/foobar.png',
        filename: 'foobar.png',
        size: 118491,
        type: 'image/png',
        thumbnails: [Object],
      },
    ];
    const attachments2 = [
      {
        id: 'attjtn763ltyHt3Xl',
        url: 'https://dl.airtable.com/.attachments/foobar.png',
        filename: 'foobar.png',
        size: 118491,
        type: 'image/png',
        thumbnails: [Object],
      },
      {
        id: 'attwuvNeHU7BhoWDS',
        url: 'https://dl.airtable.com/.attachments/foobar2.jpeg',
        filename: 'foobar2.jpeg',
        size: 105839,
        type: 'image/jpeg',
        thumbnails: [Object],
      },
    ];

    it('should return false if the arrays contain different values', () => {
      expect(airtableFieldValuesAreEqual(attachments1, attachments2)).to.equal(
        false,
      );
    });

    it('should return true if the arrays contain the same values', () => {
      expect(airtableFieldValuesAreEqual(attachments2, attachments2)).to.equal(
        true,
      );
    });
  });

  describe('Multiple collaborator fields (array of objects)', () => {
    const collaborators1 = [
      {
        id: 'usrFooBar',
        email: 'johndoe@airtable.com',
        name: 'John Doe',
      },
    ];
    const collaborators2 = [
      {
        id: 'usrFooBar',
        email: 'johndoe@airtable.com',
        name: 'John Doe',
      },
      {
        id: 'usrFooBar2',
        email: 'johndoejr@airtable.com',
        name: 'John Doe Jr',
      },
    ];
    it('should return false if the arrays have a different length', () => {
      expect(
        airtableFieldValuesAreEqual(collaborators1, collaborators2),
      ).to.equal(false);
    });

    it('should return false if the arrays contain different values', () => {
      expect(
        airtableFieldValuesAreEqual(collaborators1, collaborators2),
      ).to.equal(false);
    });

    it('should return true if the arrays contain the same values', () => {
      expect(
        airtableFieldValuesAreEqual(collaborators2, collaborators2),
      ).to.equal(true);
    });
  });

  describe('Single collaborator fields / barcode fields (object)', () => {
    const collaborator1 = {
      id: 'usrFooBar',
      email: 'johndoe@airtable.com',
      name: 'John Doe',
    };
    const collaborator2 = {
      id: 'usrFooBar2',
      email: 'johndoejr@airtable.com',
      name: 'John Doe Jr',
    };

    it('should return false if the collaborators are different', () => {
      expect(
        airtableFieldValuesAreEqual(collaborator1, collaborator2),
      ).to.equal(false);
    });

    it('should return true if the collaborators are the same', () => {
      expect(
        airtableFieldValuesAreEqual(collaborator2, collaborator2),
      ).to.equal(true);
    });
  });
});
