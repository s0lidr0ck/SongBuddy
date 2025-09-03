export default {
  title: 'pattern',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  additionalProperties: true,
  properties: {
    id: { type: 'string', maxLength: 64 },
    name: { type: ['string', 'null'], maxLength: 100 },
    bpm: { type: 'number', multipleOf: 1, minimum: 1, maximum: 300 }, // Add min/max for BPM
    steps: {
      type: 'object',
      properties: {
        kick: { type: 'array', items: { type: 'number' }, maxItems: 8, minItems: 8 },
        snare:{ type: 'array', items: { type: 'number' }, maxItems: 8, minItems: 8 },
        hat:  { type: 'array', items: { type: 'number' }, maxItems: 8, minItems: 8 },
        ride: { type: 'array', items: { type: 'number' }, maxItems: 8, minItems: 8 }
      },
      required: ['kick','snare','hat','ride']
    },
    updated_at: { type: 'string', maxLength: 30 },
    created_at: { type: 'string', maxLength: 30 }
  },
  required: ['id','bpm','steps','created_at','updated_at'],
  indexes: ['updated_at']
} as const;