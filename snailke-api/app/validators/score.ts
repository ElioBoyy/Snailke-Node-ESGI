import vine from '@vinejs/vine'

export const scoreValidator = vine.compile(
  vine.object({
    score: vine.number().min(0).max(999999),
    speed: vine.number().min(1).max(10).optional(),
  })
)
