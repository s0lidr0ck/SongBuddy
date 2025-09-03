export default {
  title: 'song',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  additionalProperties: true,
  properties: {
    id: { type: 'string', maxLength: 64 },
    title: { type: 'string', maxLength: 200 },
    key_root: { type: 'string', maxLength: 10, nullable: true },
    key_mode: { type: 'string', maxLength: 10, nullable: true, enum: ['major','minor', null] },
    bpm: { type: 'number', nullable: true },
    created_at: { type: 'string', maxLength: 30 }, // Add maxLength for date string
    updated_at: { type: 'string', maxLength: 30 } // Add maxLength for date string used in index
  },
  required: ['id','title','created_at','updated_at'],
  indexes: ['updated_at']
} as const;