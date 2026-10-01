const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseDateRangeFromText, normalizeDate, parseSingleDate } = require('../bookmarklet/src/save-exhibition.js');

describe('Date Parser - Single Date Normalization', () => {
  it('should normalize ISO date strings', () => {
    assert.strictEqual(normalizeDate('2026-10-01'), '2026-10-01');
    assert.strictEqual(normalizeDate('2026-10-01T10:00:00Z'), '2026-10-01');
    assert.strictEqual(normalizeDate('2026-10-01T15:30:00+02:00'), '2026-10-01');
    assert.strictEqual(normalizeDate('2026-10-01 18:00:00'), '2026-10-01');
  });

  it('should normalize Month Day, Year formats', () => {
    assert.strictEqual(normalizeDate('October 1, 2026'), '2026-10-01');
    assert.strictEqual(normalizeDate('Oct 1, 2026'), '2026-10-01');
    assert.strictEqual(normalizeDate('Oct. 1, 2026'), '2026-10-01');
    assert.strictEqual(normalizeDate('October 1st, 2026'), '2026-10-01');
    assert.strictEqual(normalizeDate('January 15th, 2027'), '2027-01-15');
    assert.strictEqual(normalizeDate('September 23, 2026'), '2026-09-23');
    assert.strictEqual(normalizeDate('Sept. 23, 2026'), '2026-09-23');
  });

  it('should normalize Day Month Year formats', () => {
    assert.strictEqual(normalizeDate('1 October 2026'), '2026-10-01');
    assert.strictEqual(normalizeDate('1st October 2026'), '2026-10-01');
    assert.strictEqual(normalizeDate('15 January 2027'), '2027-01-15');
    assert.strictEqual(normalizeDate('15th Jan 2027'), '2027-01-15');
    assert.strictEqual(normalizeDate('30 Nov 2026'), '2026-11-30');
  });

  it('should normalize Month Year formats', () => {
    assert.strictEqual(normalizeDate('October 2026'), '2026-10-01');
    assert.strictEqual(normalizeDate('Jan 2027'), '2027-01-01');
  });

  it('should handle numeric formats with dots and slashes', () => {
    assert.strictEqual(normalizeDate('2026/10/01'), '2026-10-01');
    assert.strictEqual(normalizeDate('2026.10.01'), '2026-10-01');
    assert.strictEqual(normalizeDate('10/01/2026'), '2026-10-01');
  });
});

describe('Date Parser - Date Range Extraction from Text', () => {
  it('should extract Month Day, Year – Month Day, Year (cross-year)', () => {
    const res = parseDateRangeFromText('Exhibition on view October 1, 2026 – January 15, 2027 at the gallery');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2027-01-15'
    });
  });

  it('should extract Month Day – Month Day, Year (same year, cross-month)', () => {
    const res = parseDateRangeFromText('October 1 – November 30, 2026');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2026-11-30'
    });
  });

  it('should extract Month Day – Day, Year (same month)', () => {
    const res = parseDateRangeFromText('October 1 – 15, 2026');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2026-10-15'
    });
  });

  it('should extract Day Month Year – Day Month Year (international)', () => {
    const res = parseDateRangeFromText('1 October 2026 – 15 January 2027');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2027-01-15'
    });
  });

  it('should extract Day Month – Day Month Year', () => {
    const res = parseDateRangeFromText('1 October – 30 November 2026');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2026-11-30'
    });
  });

  it('should extract Day – Day Month Year', () => {
    const res = parseDateRangeFromText('1 – 15 October 2026');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2026-10-15'
    });
  });

  it('should handle abbreviated months with periods and ordinals', () => {
    const res = parseDateRangeFromText('Oct. 1st - Nov. 30th, 2026');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2026-11-30'
    });
  });

  it('should handle "to", "through", "until" separators', () => {
    const res1 = parseDateRangeFromText('October 1 to November 30, 2026');
    assert.deepStrictEqual(res1, {
      startDate: '2026-10-01',
      endDate: '2026-11-30'
    });

    const res2 = parseDateRangeFromText('From October 1, 2026 through January 15, 2027');
    assert.deepStrictEqual(res2, {
      startDate: '2026-10-01',
      endDate: '2027-01-15'
    });
  });

  it('should extract "Through [Date]" / "Until [Date]" as endDate', () => {
    const res = parseDateRangeFromText('On view through January 15, 2027');
    assert.deepStrictEqual(res, {
      startDate: '',
      endDate: '2027-01-15'
    });
  });

  it('should extract "Opening [Date]" / "Opens [Date]" as startDate', () => {
    const res = parseDateRangeFromText('Opening October 1, 2026');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: ''
    });
  });

  it('should extract ISO date range', () => {
    const res = parseDateRangeFromText('2026-10-01 to 2027-01-15');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2027-01-15'
    });
  });

  it('should extract ISO temporalCoverage slash format', () => {
    const res = parseDateRangeFromText('2026-10-01/2027-01-15');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2027-01-15'
    });
  });

  it('should handle Month Year – Month Year', () => {
    const res = parseDateRangeFromText('October 2026 – January 2027');
    assert.deepStrictEqual(res, {
      startDate: '2026-10-01',
      endDate: '2027-01-01'
    });
  });
});
